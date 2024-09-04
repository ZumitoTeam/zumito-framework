import { ZumitoFramework } from '../ZumitoFramework.js';
import { Command } from './commands/Command.js';
import { EventParameters } from './parameters/EventParameters.js';
import { FrameworkEvent } from './FrameworkEvent.js';
import * as fs from 'fs';
import path from 'path';
import {
    ButtonInteraction,
    CommandInteraction,
    ModalSubmitInteraction,
    StringSelectMenuInteraction,
} from 'discord.js';
import { DatabaseModel } from './DatabaseModel.js';
import { CommandManager } from '../services/CommandManager.js';

export abstract class Module {
    protected path: string;
    protected framework: ZumitoFramework;
    protected commands: CommandManager;
    protected events: Map<string, FrameworkEvent> = new Map();
    protected models: Array<DatabaseModel> = [];
    
    protected commandManager: CommandManager; 

    constructor(path, framework) {
        this.path = path;
        this.framework = framework;
        this.commands = new CommandManager(framework);
        
    }

    async initialize() {
        await this.registerCommands();
        await this.registerEvents();
        await this.registerTranslations();
        await this.registerModels();
        await this.registerRoutes();
        await this.registerRouteMiddlewares();
    }

    async registerCommands() {
        const commandsFolder = path.join(this.path, 'commands');
        if (fs.existsSync(commandsFolder)) {
            await this.commands.loadCommandsFolder(commandsFolder);

            // register watcher
            if (process.env.DEBUG) {
                /*
                    Debug only cause in prod environment commands should't be changed.
                    Appart from that, esm module cache invalidation is not working properly
                    and can cause memory leaks and crashes.
                */
                this.commands.watchCommandsFolder(commandsFolder)
            }
        }
    }

    getCommands(): Map<string, Command> {
        return this.commands.getAll();
    }

    async registerEvents() {
        if (!fs.existsSync(path.join(this.path, 'events'))) return;
        const files = fs.readdirSync(path.join(this.path, 'events'));
        for (const file of files) {
            // if file is folder
            if (fs.lstatSync(path.join(this.path, 'events', file)).isDirectory()) {
                console.log('registering events folder ' + file);
                this.registerEventsFolder(file);
            }
        }
    }

    async registerEventsFolder(folder: string) {
        const folderPath = path.join(this.path, 'events', folder);
        if (!fs.existsSync(folderPath)) throw new Error(`Folder ${folder} doesn't exist`);
        const files = fs.readdirSync(folderPath);
        for (const file of files) {
            if (file.endsWith('d.ts')) continue;
            if (file.endsWith('.js') || file.endsWith('.ts')) {
                let event = await import(
                    'file://' + path.join(folderPath, file)
                ).catch((e) => {
                    console.error(
                        `[🔄🔴 ] Error loading ${file.slice(0, -3)} event on module ${this.constructor.name}`
                    );
                });
                event = Object.values(event)[0];
                event = new event();
                this.events.set(event.constructor.name.toLowerCase(), event);
                this.registerEvent(event, folder);
            }
        }
    }

    registerEvent(frameworkEvent: FrameworkEvent, emitterName: string) {
        if (frameworkEvent.disabled) return;
        const once = frameworkEvent.once;
        const eventName =
            frameworkEvent.constructor.name.charAt(0).toLowerCase() +
            frameworkEvent.constructor.name.slice(1);

        this.framework.eventManager.addEventListener(emitterName, eventName, (...args: any[]) => {
            const finalArgs = this.parseEventArgs(args);
            frameworkEvent.execute(finalArgs);
        }, { once });
    }

    parseEventArgs(args: any[]): any {
        const finalArgs: EventParameters = {
            framework: this.framework,
            client: this.framework.client,
        };
        args.forEach((arg) => {
            finalArgs[arg.constructor.name.toLowerCase()] = arg;
        });
        const interaction = args.find(
            (arg: any) =>
                arg instanceof StringSelectMenuInteraction ||
                arg instanceof CommandInteraction ||
                arg instanceof ButtonInteraction ||
                arg instanceof ModalSubmitInteraction
        );
        if (interaction) {
            finalArgs['interaction'] = interaction;
        }
        return finalArgs;
    }

    getEvents(): Map<string, FrameworkEvent> {
        return this.events;
    }

    async registerTranslations(subpath = '') {
        if (!fs.existsSync(path.join(this.path, 'translations', subpath))) return;
        this.framework.translations.registerTranslationsFromFolder(
            path.join(this.path, 'translations', subpath),
            '',
            process.env.DEBUG ? true : false
        )
    }

    async registerModels() {
        if (!fs.existsSync(path.join(this.path, 'models'))) return;
        const files = fs.readdirSync(path.join(this.path, 'models'));
        for (const file of files) {
            if (file.endsWith('d.ts')) continue;
            if (file.endsWith('.ts') || file.endsWith('.js')) {
                let model = await import(
                    'file://' + `${this.path}/models/${file}`
                ).catch((e) => {
                    console.error(
                        `[🔄🔴 ] Error loading ${file.slice(
                            0,
                            -3
                        )} model on module ${this.constructor.name}`
                    );
                    console.error(e + '\n' + e.name + '\n' + e.stack);
                });
                model = Object.values(model)[0];
                model = new model();
                this.models.push(model);
            }
        }
    }

    getModels(): Array<DatabaseModel> {
        return this.models;
    }

    async registerRoutes() {

        const folderPath = path.join(this.path, 'routes');
        if (fs.existsSync(folderPath)) {
            await this.registerRoutesFolder('');
        } 
    }

    async registerRouteMiddlewares() {
        const folderPath = path.join(this.path, 'routeMiddlewares');
        if (fs.existsSync(folderPath)) {
            await this.registerRouteMiddlewaresFolder('');
        } 
    }

    async registerRoutesFolder(folder: string) {
        const folderPath = path.join(this.path, 'routes', folder);
        if (!fs.existsSync(folderPath)) throw new Error(`Folder ${folder} doesn't exist`);
        const files = fs.readdirSync(folderPath);
        for (const file of files) {
            if (file.endsWith('d.ts')) continue;
            if (file.endsWith('.js') || file.endsWith('.ts')) {
                let route = await import(
                    'file://' + path.join(folderPath, file)
                ).catch((e) => {
                    console.error(
                        `[🔄🔴 ] Error loading ${file.slice(0, -3)} route on module ${this.constructor.name}`
                    );
                });
                route = Object.values(route)[0];
                route = new route();
                this.framework.registerRoute(route);
            }
        }
    }

    async registerRouteMiddlewaresFolder(folder: string) {
        const folderPath = path.join(this.path, 'routeMiddlewares', folder);
        if (!fs.existsSync(folderPath)) throw new Error(`Folder ${folder} doesn't exist`);
        const files = fs.readdirSync(folderPath);
        for (const file of files) {
            if (file.endsWith('d.ts')) continue;
            if (file.endsWith('.js') || file.endsWith('.ts')) {
                let route = await import(
                    'file://' + path.join(folderPath, file)
                ).catch((e) => {
                    console.error(
                        `[🔄🔴 ] Error loading ${file.slice(0, -3)} routeMiddleware on module ${this.constructor.name}`
                    );
                });
                route = Object.values(route)[0];
                route = new route();
                this.framework.registerRouteMiddleware(route);
            }
        }
    }


    public getPath() {
        return this.path;
    }
}
