import * as chokidar from 'chokidar';
import chalk from 'chalk';
import boxen from 'boxen';
import * as fs from 'fs';
import path from 'path';
import { ButtonInteraction, CommandInteraction, SelectMenuInteraction, } from 'discord.js';
export class Module {
    path;
    framework;
    commands = new Map();
    events = new Map();
    models = [];
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
                    let command = await import('file://' + path.join(this.path, 'commands', file)).catch((e) => {
                        console.error(`[🔄🔴 ] Error loading ${file.slice(0, -3)} command on module ${this.constructor.name}`);
                        console.error(e + '\n' + e.name + '\n' + e.stack);
                    });
                    command = Object.values(command)[0];
                    command = new command();
                    this.commands.set(command.constructor.name.toLowerCase(), command);
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
    async onCommandCreated(filePath) {
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
    async onCommandChanged(filePath) {
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
    onErrorLoadingCommand(error) {
        console.error('[🔄🔴 ] Error reloading command');
        console.log(boxen(error + '\n' + error.stack, { padding: 1 }));
    }
    getCommands() {
        return this.commands;
    }
    async registerEvents() {
        if (!fs.existsSync(path.join(this.path, 'events')))
            return;
        const files = fs.readdirSync(path.join(this.path, 'events'));
        for (const file of files) {
            if (file == 'discord') {
                const moduleFileNames = fs.readdirSync(path.join(this.path, 'events', 'discord'));
                for (const moduleFileName of moduleFileNames) {
                    if (moduleFileName.endsWith('.js') ||
                        moduleFileName.endsWith('.ts')) {
                        let event = await import('file://' +
                            path.join(this.path, 'events', 'discord', moduleFileName)).catch((e) => {
                            console.error(`[🔄🔴 ] Error loading ${moduleFileName.slice(0, -3)} event on module ${this.constructor.name}`);
                            console.log(boxen(e + '\n' + e.name + '\n' + e.stack, {
                                padding: 1,
                            }));
                        });
                        event = Object.values(event)[0];
                        event = new event();
                        this.events.set(event.constructor.name.toLowerCase(), event);
                        this.registerDiscordEvent(event);
                    }
                }
            }
        }
    }
    registerDiscordEvent(frameworkEvent) {
        if (frameworkEvent.disabled)
            return;
        const eventName = frameworkEvent.constructor.name.charAt(0).toLowerCase() +
            frameworkEvent.constructor.name.slice(1);
        const emitter = this.framework.client;
        const once = frameworkEvent.once; // A simple variable which returns if the event should run once
        // Try catch block to throw an error if the code in try{} doesn't work
        try {
            emitter[once ? 'once' : 'on'](eventName, (...args) => frameworkEvent.execute(this.parseEventArgs(args))); // Run the event using the above defined emitter (client)
        }
        catch (error) {
            console.log(error, error.message, error, name);
            console.error(error.stack); // If there is an error, console log the error stack message
        }
    }
    parseEventArgs(args) {
        const finalArgs = {
            framework: this.framework,
            client: this.framework.client,
        };
        args.forEach((arg) => {
            finalArgs[arg.constructor.name.toLowerCase()] = arg;
        });
        const interaction = args.find((arg) => arg instanceof SelectMenuInteraction ||
            arg instanceof CommandInteraction ||
            arg instanceof ButtonInteraction);
        if (interaction) {
            finalArgs['interaction'] = interaction;
        }
        return finalArgs;
    }
    getEvents() {
        return this.events;
    }
    async registerTranslations(subpath = '') {
        if (!fs.existsSync(path.join(this.path, 'translations', subpath)))
            return;
        const files = fs.readdirSync(path.join(this.path, 'translations', subpath));
        for (const file of files) {
            if (file.endsWith('.json')) {
                const json = await this.loadTranslationFile(subpath, file);
                const lang = file.slice(0, -5);
                const baseKey = subpath
                    ? subpath.replaceAll('/', '.').replaceAll('\\', '.') + '.'
                    : '';
                this.parseTranslation(baseKey, lang, json);
            }
            else if (fs
                .lstatSync(path.join(this.path, 'translations', subpath, file))
                .isDirectory()) {
                await this.registerTranslations(path.join(subpath, file));
            }
        }
    }
    async loadTranslationFile(subpath, file) {
        if (subpath)
            subpath = subpath + '/';
        const json = await import('file://' + `${this.path}/translations/${subpath}${file}`, {
            assert: {
                type: 'json',
            },
        }).catch((e) => {
            console.error(`[🔄🔴 ] Error loading ${file.slice(0, -5)} translations on module ${this.constructor.name}`);
            console.error(e + '\n' + e.name + '\n' + e.stack);
        });
        return json.default;
    }
    parseTranslation(path, lang, json) {
        if (typeof json === 'object') {
            for (const key in json) {
                this.parseTranslation(path + key + '.', lang, json[key]);
            }
        }
        else {
            this.framework.translations.set(path.slice(0, -1), lang, json);
        }
    }
    async registerModels() {
        if (!fs.existsSync(path.join(this.path, 'models')))
            return;
        const files = fs.readdirSync(path.join(this.path, 'models'));
        for (const file of files) {
            if (file.endsWith('.ts') || file.endsWith('.js')) {
                let model = await import('file://' + `${this.path}/models/${file}`).catch((e) => {
                    console.error(`[🔄🔴 ] Error loading ${file.slice(0, -3)} model on module ${this.constructor.name}`);
                    console.error(e + '\n' + e.name + '\n' + e.stack);
                });
                model = Object.values(model)[0];
                model = new model();
                this.models.push(model);
            }
        }
    }
    getModels() {
        return this.models;
    }
}
