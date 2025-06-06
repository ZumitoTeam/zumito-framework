import { ZumitoFramework } from "../../ZumitoFramework.js";
import { DatabaseModel } from "../../definitions/DatabaseModel.js";
import { Module } from "../../definitions/Module.js";
import fs from 'fs';
import path from 'path';
import { ErrorHandler } from "../handlers/ErrorHandler.js";
import { ModuleParameters } from "../../definitions/parameters/ModuleParameters.js";
import { ServiceContainer } from "../ServiceContainer.js";

export class ModuleManager {

    protected modules: Map<string, Module>;
    protected pendingInstancePool: Array<{module: any, rootPath: string, name?: string, options?: ModuleParameters}> = [];
    protected framework: ZumitoFramework;

    constructor(framework: ZumitoFramework) {
        this.modules = new Map();
        this.framework = framework;
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
        return Object.values(module)[0];
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

        // Register models
        module.getModels().forEach((model: DatabaseModel) => {
            this.framework.models.push(model);
        });

        /*

        // Register module routes
        this.routes = new Map([...this.routes, ...moduleInstance.getRoutes()]);

        */
    }

    async instanceModule(module: any, rootPath: string, name?: string, options?: ModuleParameters) {
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
                console.error(
                    `[📦🔴] Error loading module ${name || moduleInstance?.constructor?.name}: ${err.message}`
                );
                console.error(err.stack);
            }
        } else {
            //moduleInstance = new Module();
        }
        
        this.registerModule(moduleInstance);
        return moduleInstance;
    }

    /**
     * Carga la clase del módulo y la añade a la pool de pendientes para inicialización posterior.
     */
    async queueModuleForInitialization(rootPath: string, name?: string, options?: ModuleParameters) {
        const moduleClass = await this.loadModuleFile(rootPath);
        this.pendingInstancePool.push({ module: moduleClass, rootPath, name, options });
    }

    /**
     * Inicializa todos los módulos pendientes resolviendo dependencias/requerimientos en iteraciones.
     */
    async initializeAllModules() {
        let initializedInLastIteration: number;
        do {
            initializedInLastIteration = 0;
            const poolCopy = [...this.pendingInstancePool];
            this.pendingInstancePool = [];
            for (const pending of poolCopy) {
                const requeriments = pending.module.requeriments;
                let failed = false;
                if (requeriments) {
                    if (requeriments.modules && requeriments.modules.length > 0) {
                        for (const mod of requeriments.modules) {
                            if (!this.modules.get(mod)) failed = true;
                        }
                    }
                    if (!failed && requeriments.services && requeriments.services.length > 0) {
                        for (const service of requeriments.services) {
                            if (!ServiceContainer.hasService(service)) failed = true;
                        }
                    }
                    if (!failed && requeriments.custom && requeriments.custom.length > 0) {
                        for (const custom of requeriments.custom) {
                            if (!(await custom())) failed = true;
                        }
                    }
                }
                if (!failed) {
                    await this.instanceModule(pending.module, pending.rootPath, pending.name, pending.options);
                    initializedInLastIteration++;
                } else {
                    this.pendingInstancePool.push(pending);
                }
            }
        } while (this.pendingInstancePool.length > 0 && initializedInLastIteration > 0);
        if (this.pendingInstancePool.length > 0) {
            console.warn(`[📦⚠️] No se pudieron inicializar los siguientes módulos por requerimientos incumplidos:`);
            for (const pending of this.pendingInstancePool) {
                console.warn(`- ${pending.name || pending.module.name}`);
            }
        }
    }
}