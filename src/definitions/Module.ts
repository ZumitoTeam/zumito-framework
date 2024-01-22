import { ZumitoFramework } from '../ZumitoFramework.js';
import { Command } from './commands/Command.js';
import { EventParameters } from './parameters/EventParameters.js';
import { FrameworkEvent } from './FrameworkEvent.js';
import * as chokidar from 'chokidar';
import chalk from 'chalk';
import boxen from 'boxen';
import * as fs from 'fs';
import path from 'path';
import {
    ButtonInteraction,
    CommandInteraction,
    ModalSubmitInteraction,
    StringSelectMenuInteraction,
} from 'discord.js';
import { DatabaseModel } from './DatabaseModel.js';

export abstract class Module {
    protected path: string;
    protected framework: ZumitoFramework;
    protected commands: Map<string, Command> = new Map();
    protected events: Map<string, FrameworkEvent> = new Map();
    protected models: Array<DatabaseModel> = [];

    constructor(path, framework) {
        this.path = path;
        this.framework = framework;
    }

    async initialize() {
        await this.registerCommands();
        await this.registerEvents();
        await this.registerTranslations();
        await this.registerModels();
    }

    async registerCommands() {
        if (fs.existsSync(path.join(this.path, 'commands'))) {
            const files = fs.readdirSync(path.join(this.path, 'commands'));
            for (const file of files) {
                if (file.endsWith('.js') || file.endsWith('.ts')) {
                    let command = await import(
                        'file://' + path.join(this.path, 'commands', file)
                    ).catch((e) => {
                        console.error(
                            `[🔄🔴 ] Error loading ${file.slice(
                                0,
                                -3
                            )} command on module ${this.constructor.name}`
                        );
                        console.error(e + '\n' + e.name + '\n' + e.stack);
                    });
                    command = Object.values(command)[0];
                    command = new command();
                    this.commands.set(
                        command.constructor.name.toLowerCase(),
                        command
                    );
                }
            }

            // register watcher
            if (process.env.DEBUG) {
                /*
                    Debug only cause in prod environment commands should't be changed.
                    Appart from that, esm module cache invalidation is not working properly
                    and can cause memory leaks and crashes.
                */
                chokidar
                    .watch(path.resolve(path.join(this.path, 'commands')), {
                        ignored: /^\./,
                        persistent: true,
                        ignoreInitial: true,
                    })
                    .on('add', this.onCommandCreated.bind(this))
                    .on('change', this.onCommandChanged.bind(this))
                    //.on('unlink', function(path) {console.log('File', path, 'has been removed');})
                    .on('error', this.onErrorLoadingCommand.bind(this));
            }
        }
    }

    async onCommandCreated(filePath: string) {
        if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
            let command = await import('file://' + filePath).catch(e => {
                console.error('[🆕🔴 ] Error loading command ' + chalk.blue(filePath.replace(/^.*[\\\/]/, '').split('.').slice(0, -1).join('.')));
                console.log(e + '\n' + e.name + '\n' + e.stack);
            });
            command = Object.values(command)[0];
            command = new command();
            this.framework.commands.set(command.constructor.name.toLowerCase(), command);
            console.debug('[🆕🟢 ] Command ' + chalk.blue(filePath.replace(/^.*[\\\/]/, '').split('.').slice(0, -1).join('.')) + ' loaded');
        }
    }

    async onCommandChanged(filePath: string) {
        if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
            let command = await import('file://' + filePath + '?update=' + Date.now().toString()).catch(e => {
                console.error('[🔄🔴 ] Error reloading command ' + chalk.blue(filePath.replace(/^.*[\\\/]/, '').split('.').slice(0, -1).join('.')));
                console.log(boxen(e + '\n' + e.name + '\n' + e.stack, { padding: 1 }));
            });
            command = Object.values(command)[0];
            command = new command();
            this.framework.commands.set(command.constructor.name.toLowerCase(), command);
            console.debug('[🔄🟢 ] Command ' + chalk.blue(filePath.replace(/^.*[\\\/]/, '').split('.').slice(0, -1).join('.')) + ' reloaded');
        }
    }

    onErrorLoadingCommand(error: Error) {
        console.error('[🔄🔴 ] Error reloading command');
        console.log(boxen(error + '\n' + error.stack, { padding: 1 }));
    }

    getCommands(): Map<string, Command> {
        return this.commands;
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
        if (!fs.existsSync(path.join(this.path, 'translations', subpath)))
            return;
        const files = fs.readdirSync(
            path.join(this.path, 'translations', subpath)
        );
        for (const file of files) {
            if (file.endsWith('.json')) {
                const json = await this.loadTranslationFile(subpath, file);
                const lang = file.slice(0, -5);
                const baseKey = subpath
                    ? subpath.replaceAll('/', '.').replaceAll('\\', '.') + '.'
                    : '';
                this.parseTranslation(baseKey, lang, json);
            } else if (
                fs
                    .lstatSync(
                        path.join(this.path, 'translations', subpath, file)
                    )
                    .isDirectory()
            ) {
                await this.registerTranslations(path.join(subpath, file));
            }
        }
    }

    async loadTranslationFile(subpath: string, file: string) {
        if (subpath) subpath = subpath + '/';
        const json = await import(
            'file://' + `${this.path}/translations/${subpath}${file}`,
            {
                assert: {
                    type: 'json',
                },
            }
        ).catch((e) => {
            console.error(
                `[🔄🔴 ] Error loading ${file.slice(
                    0,
                    -5
                )} translations on module ${this.constructor.name}`
            );
            console.error(e + '\n' + e.name + '\n' + e.stack);
        });
        return json.default;
    }

    parseTranslation(path: string, lang: string, json: any): any {
        if (typeof json === 'object') {
            for (const key in json) {
                this.parseTranslation(path + key + '.', lang, json[key]);
            }
        } else {
            this.framework.translations.set(path.slice(0, -1), lang, json);
        }
    }

    async registerModels() {
        if (!fs.existsSync(path.join(this.path, 'models'))) return;
        const files = fs.readdirSync(path.join(this.path, 'models'));
        for (const file of files) {
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
}