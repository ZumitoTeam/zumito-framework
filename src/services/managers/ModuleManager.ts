import { ZumitoFramework } from "../../ZumitoFramework.js";
import { DatabaseModel } from "../../definitions/DatabaseModel.js";
import { Module } from "../../definitions/Module.js";
import fs from 'fs';
import path from 'path';
import { ErrorHandler } from "../handlers/ErrorHandler.js";
import { ModuleParameters } from "../../definitions/parameters/ModuleParameters.js";

export class ModuleManager {

    protected modules: Map<string, Module>;
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
        return moduleInstance;
    }
}