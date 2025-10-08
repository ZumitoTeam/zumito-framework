import { ZumitoFramework } from "../../ZumitoFramework.js";
import { Module } from "../../definitions/Module.js";
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

    async loadModuleFile(folderPath: string) {
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

        return moduleClass || exports[0];
    }

    registerModule(module: InstanceType<typeof Module>) {
        // Register module commands
        if (module.getCommands()) {
            module.getCommands().forEach((command) => {
                this.framework.commands.set(command.name, command);
            });
        }

        // Register module events
        this.framework.events = new Map([...this.framework.events, ...module.getEvents()]);

        // Register models (eliminado, migración a MongoDB)

        /*

        // Register module routes
        this.routes = new Map([...this.routes, ...moduleInstance.getRoutes()]);

        */
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