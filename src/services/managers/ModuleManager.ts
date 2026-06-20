import { ZumitoFramework } from "../../ZumitoFramework.js";
import { Module, ModuleDeclaration } from "../../definitions/Module.js";
import fs from 'fs';
import path from 'path';
import { ErrorHandler } from "../handlers/ErrorHandler.js";
import { ModuleParameters } from "../../definitions/parameters/ModuleParameters.js";
import { ServiceContainer } from "../ServiceContainer.js";
import { ErrorType } from "../../definitions/ErrorType.js";

export class ModuleManager {

    protected modules: Map<string, Module>;
    protected pendingInstancePool: Array<{module: any, rootPath: string, name?: string, options?: ModuleParameters}> = [];

    constructor(
        protected framework: ZumitoFramework = ServiceContainer.getService(ZumitoFramework),
        protected errorHandler: ErrorHandler = ServiceContainer.getService(ErrorHandler)
    ) { 
        this.modules = new Map();
    }

    set(name: string, module: Module) {
        this.modules.set(name, module);
    }

    get(name: string): Module {
        return this.modules.get(name);
    }

    getAll(): Map<string, Module> {
        return this.modules;
    }

    /**
     * @deprecated
     */
    get size(): number {
        return this.modules.size;
    }

    resolveModuleName(moduleClass: typeof Module, fallbackName: string): string {
        return moduleClass.moduleName || fallbackName;
    }

    resolveModuleDeps(moduleClass: typeof Module): { required: string[]; optional: string[] } {
        const required = new Set<string>();
        const optional = new Set<string>();

        if (moduleClass.dependencies) {
            for (const d of moduleClass.dependencies) required.add(d);
        }
        if (moduleClass.optionalDependencies) {
            for (const d of moduleClass.optionalDependencies) optional.add(d);
        }
        if (moduleClass.requeriments?.modules) {
            for (const m of moduleClass.requeriments.modules) required.add(m);
        }

        return { required: [...required], optional: [...optional] };
    }

    buildDependencyGraph(declarations: ModuleDeclaration[]): Map<string, string[]> {
        const nameSet = new Set(declarations.map((d) => d.name));
        const graph = new Map<string, string[]>();

        for (const decl of declarations) {
            const deps: string[] = [...decl.requiredDeps];
            for (const opt of decl.optionalDeps) {
                if (nameSet.has(opt)) deps.push(opt);
            }

            for (const dep of deps) {
                if (!nameSet.has(dep)) {
                    throw new Error(
                        `Module "${decl.name}" depends on "${dep}" which was not found`,
                    );
                }
            }

            graph.set(decl.name, deps);
        }

        return graph;
    }

    topologicalSort(declarations: ModuleDeclaration[]): ModuleDeclaration[] {
        const graph = this.buildDependencyGraph(declarations);

        const inDegree = new Map<string, number>();
        const adjacency = new Map<string, string[]>();

        for (const decl of declarations) {
            const name = decl.name;
            if (!inDegree.has(name)) inDegree.set(name, 0);
            if (!adjacency.has(name)) adjacency.set(name, []);
        }

        for (const [name, deps] of graph) {
            for (const dep of deps) {
                if (!adjacency.has(dep)) adjacency.set(dep, []);
                adjacency.get(dep)!.push(name);
                inDegree.set(name, (inDegree.get(name) || 0) + 1);
            }
        }

        const queue: string[] = [];
        for (const [name, degree] of inDegree) {
            if (degree === 0) queue.push(name);
        }

        const sorted: string[] = [];
        while (queue.length > 0) {
            const current = queue.shift()!;
            sorted.push(current);
            for (const neighbor of adjacency.get(current) || []) {
                const newDegree = inDegree.get(neighbor)! - 1;
                inDegree.set(neighbor, newDegree);
                if (newDegree === 0) queue.push(neighbor);
            }
        }

        if (sorted.length < declarations.length) {
            const unresolved = declarations
                .filter((d) => !sorted.includes(d.name))
                .map((d) => d.name);
            throw new Error(
                `Circular dependency detected involving: ${unresolved.join(', ')}`,
            );
        }

        const nameMap = new Map(declarations.map((d) => [d.name, d]));
        return sorted.map((name) => nameMap.get(name)!);
    }

    async resolveAndInstantiateAll(
        modulePaths: Array<{ rootPath: string; options?: ModuleParameters; name?: string }>,
    ): Promise<void> {
        const declarations: ModuleDeclaration[] = [];

        for (const entry of modulePaths) {
            const moduleClass = await this.loadModuleFile(entry.rootPath);
            if (!moduleClass || moduleClass === Module) continue;

            const { required, optional } = this.resolveModuleDeps(moduleClass);
            const name = this.resolveModuleName(
                moduleClass,
                entry.name || path.basename(entry.rootPath),
            );

            declarations.push({
                moduleClass,
                name,
                rootPath: entry.rootPath,
                options: entry.options,
                requiredDeps: required,
                optionalDeps: optional,
            });
        }

        if (declarations.length === 0) return;

        let sorted: ModuleDeclaration[];
        try {
            sorted = this.topologicalSort(declarations);
        } catch (err) {
            console.error(`[📦❌] ${(err as Error).message}`);
            return;
        }

        for (const decl of sorted) {
            const result = await this.instanceModule(
                decl.moduleClass,
                decl.rootPath,
                decl.name,
                decl.options,
            );
            if (result instanceof Module) {
                console.log(`[📦✅] Module "${decl.name}" loaded successfully`);
            }
        }

        await this.initializePendingModules();
    }

    async loadModuleFile(folderPath: string): Promise<typeof Module | undefined> {
        let file: string;
        if (
            fs.existsSync(path.join(folderPath, 'index.js'))
        ) {
            file = path.join(folderPath, 'index.js');
        } else if (
            fs.existsSync(path.join(folderPath, 'index.ts'))
        ) {
            file = path.join(folderPath, 'index.ts');
        } else {
            return Module;
        }
        const module = await import('file://' + file);
        const exports = Object.values(module);

        const moduleClass = exports.find((candidate: any) => {
            return Object.getPrototypeOf(candidate).name === 'Module';
        });

        return (moduleClass || exports[0]) as typeof Module | undefined;
    }

    registerModule(module: InstanceType<typeof Module>) {
        // Register module events
        this.framework.events = new Map([...this.framework.events, ...module.getEvents()]);
    }

    async instanceModule(module: any, rootPath: string, name?: string, options?: ModuleParameters) {
        
        // Comprobar requerimientos del módulo
        const unmeetRequeriments = await this.checkModuleRequeriments(module);
        // If there are failed requeriments, put the class into a pool for later retry
        if (unmeetRequeriments.modules.length > 0 || unmeetRequeriments.services.length > 0 || unmeetRequeriments.custom === false) {
            this.pendingInstancePool.push({
                module, rootPath, name, options
            });
            return unmeetRequeriments;
        }
        
        let moduleInstance: Module;
        if (module.constructor) {
            try {
                moduleInstance = new module(
                    rootPath,
                    options
                );
                await moduleInstance.initialize();
                this.modules.set(
                    name || moduleInstance.constructor.name,
                    moduleInstance
                );
            } catch (err) {
                this.errorHandler.handleError(err, {
                    type: ErrorType.ModuleLoad,
                    moduleName: name || moduleInstance?.constructor?.name
                });
            }
        } else {
            //moduleInstance = new Module();
        }
        
        this.registerModule(moduleInstance);
        return moduleInstance;
    }

    /**
     * Comprueba si los requisitos de un módulo están satisfechos antes de instanciarlo.
     * Retorna un array con los requisitos incumplidos.
     * @param moduleClass Clase del módulo (no instancia)
     */
    async checkModuleRequeriments(moduleClass: typeof Module): Promise<{
            modules: string[];
            services: string[];
            custom: boolean;
        }> {
        const requeriments = moduleClass.requeriments;
        const failed: {
            modules: string[];
            services: string[];
            custom: boolean;
        } = {
            modules: [],
            services: [],
            custom: true
        };
        if (!requeriments) {
            // Si no hay requerimientos definidos, se considera válido
            return failed;
        }
        // Comprobar módulos requeridos
        if (requeriments.modules && requeriments.modules.length > 0) {
            for (const mod of requeriments.modules) {
                if (!this.modules.get(mod)) failed.modules.push(mod);
            }
        }
        // Comprobar servicios requeridos
        if (requeriments.services && requeriments.services.length > 0) {
            for (const service of requeriments.services) {
                if (!ServiceContainer.hasService(service)) failed.services.push(service);
            }
        }
        // Solo probar custom si los anteriores se cumplieron
        if (failed.services.length === 0 && failed.modules.length == 0 && requeriments.custom && requeriments.custom.length > 0) {
            for (const custom of requeriments.custom) {
                if (!(await custom())) failed.custom = false;
            }
        }
        return failed;
    }

    /**
     * Intenta inicializar todos los módulos pendientes en la pool, iterando hasta que no queden o no se pueda avanzar más.
     * Evita bucles infinitos si ningún módulo puede ser inicializado en una iteración.
     */
    async initializePendingModules() {
        let initializedInLastIteration: number;
        do {
            initializedInLastIteration = 0;
            // Copia actual de la pool para iterar
            const poolCopy = [...this.pendingInstancePool];
            this.pendingInstancePool = [];
            for (const pending of poolCopy) {
                const result = await this.instanceModule(pending.module, pending.rootPath, pending.name, pending.options);
                // Si no se pudo inicializar, vuelve a ponerlo en la pool
                if (typeof result !== 'object' || result instanceof Module) {
                    initializedInLastIteration++;
                } else {
                    this.pendingInstancePool.push(pending);
                }
            }
        } while (this.pendingInstancePool.length > 0 && initializedInLastIteration > 0);
        // Si quedan módulos en la pool, no se pudieron inicializar por dependencias incumplidas
        if (this.pendingInstancePool.length > 0) {
            console.warn(`[📦⚠️] No se pudieron inicializar los siguientes módulos por requerimientos incumplidos:`);
            for (const pending of this.pendingInstancePool) {
                console.warn(`- ${pending.name || pending.module.name}`);
            }
        }
    }
}