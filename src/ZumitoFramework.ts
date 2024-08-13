import * as fs from 'fs';
import * as url from 'url';

import {
    Client,
    GuildMember,
    PermissionsBitField,
    SlashCommandBuilder,
    TextChannel,
} from 'discord.js';

import { ApiResponse } from './definitions/api/ApiResponse.js';
import { Command } from './definitions/commands/Command.js';
import { CommandArgDefinition } from './definitions/commands/CommandArgDefinition.js';
import { CommandChoiceDefinition } from './definitions/commands/CommandChoiceDefinition.js';
import { CommandType } from './definitions/commands/CommandType.js';
import { DatabaseModel } from './definitions/DatabaseModel.js';
import { EventEmitter } from 'events';
import { FrameworkEvent } from './definitions/FrameworkEvent.js';
import { FrameworkSettings } from './definitions/FrameworkSettings.js';
import { Module } from './definitions/Module.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { StatusManager } from './services/StatusManager.js';
import { TranslationManager } from './services/TranslationManager.js';
import { betterLogging } from 'better-logging';
import zumitoDb from 'zumito-db';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import http from 'http';
import path from 'path';
import { EventManager } from './services/EventManager.js';
import { CommandManager } from './services/CommandManager.js';
import { ModuleManager } from './services/ModuleManager.js';
import { ServiceContainer } from './services/ServiceContainer.js';

// import better-logging

betterLogging(console);

/**
 * @class ZumitoFramework
 * @description The main class of the framework.
 * @example
 *  new ZumitoFramework({
 *     discordClientOptions: {
 *          intents: 3276799,
 *          token: 'XXXXXXXXXXXXXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
 *          clientId: 755XXXXXXXXXX98,
 *      },
 *      defaultPrefix: process.env.BOTPREFIX || "z-",
 *      mongoQueryString: mongodb://XXXXXX,
 *      logLevel: parseInt(process.env.LOGLEVEL || "3"),
 * });
 */
export class ZumitoFramework {
    
    /**
     * The discord client instance.
     * @type {Client}
     * @private
     * @see {@link https://discord.js.org/#/docs/main/stable/class/Client}
     */
    client: Client;
    
    /**
     * The settings for the framework.
     * @type {FrameworkSettings}
     * @private
     */
    settings: FrameworkSettings;
    
    /**
     * Module manager instance
     * @type {ModuleManager}
     * @private
     */
    modules: ModuleManager;
    
    /**
     * The commands loaded in the framework.
     * @type {CommandManager}
     * @private
     * @see {@link Command}
     */
    commands: CommandManager;
    
    /**
     * The events loaded in the framework.
     * @type {Map<string, FrameworkEvent>}
     * @private
     * @see {@link FrameworkEvent}
     */
    events: Map<string, FrameworkEvent>;
    
    /**
     * The Translation Manager for the framework.
     * @type {TranslationManager}
     * @private
     * @see {@link TranslationManager}
     */
    translations: TranslationManager;
    routes: any;
    
    /**
     * The database models loaded in the framework.
     * @type {Array<DatabaseModel>}
     * @private
     */
    models: Array<DatabaseModel>;
    
    /**
     * The zumito-db database schema instance.
     * @type {zumitoDb.Schema}
     * @private
     * @see {@link https://www.npmjs.com/package/zumito-db}
     */
    database: any;
    
    /**
     * The ExpressJS app instance.
     * @type {express.Application}
     * @private
     * @see {@link https://expressjs.com/en/4x/api.html#app}
     */
    app: any;
    
    /**
     * The Status Manager instance.
     * @type {StatusManager}
     * @private
     * @see {@link StatusManager}
     */
    statusManager: StatusManager;

    /**	
     * Event emitter for the framework.
     * All events related to the framework are emitted from here.
     * @type {EventEmitter}
     * @private
     * @see {@link https://nodejs.org/api/events.html#events_class_eventemitter}
     */
    eventEmitter: EventEmitter = new EventEmitter();

    /**
     * Event manager for the framework.
     * All events related to the framework and discord.js are handled here.
     * @type {EventManager}
     * @private
     */
    eventManager: EventManager;

    /**
     * @constructor
     * @param {FrameworkSettings} settings - The settings to use for the framework.
     * @param {(framework: ZumitoFramework) => void} [callback] - A callback to be called when the framework has finished initializing.
     */
    constructor(settings: FrameworkSettings, callback?: (framework) => void) {
        this.settings = settings;
        this.modules = new ModuleManager(this)
        this.commands = new CommandManager(this);
        this.events = new Map();
        this.translations = new TranslationManager();
        this.models = [];
        this.eventManager = new EventManager();

        if (settings.logLevel) {
            console.logLevel = settings.logLevel;
        }

        // Register this class instance to service container
        ServiceContainer.addService(ZumitoFramework, [], true, this);
        ServiceContainer.addService(TranslationManager, [], true, this.translations)

        this.initialize()
            .then(() => {
                if (callback) callback(this);
            })
            .catch((err) => {
                console.error(err, err.message, err.stack, err.name);
            });
    }

    /**
     * Initializes the framework.
     * Connects to the MongoDB database, starts the Discord client, and runs API server.
     * It also loads the modules from the project's modules folder.
     * @async
     * @private
     * @returns {Promise<void>}
     */
    private async initialize() {
        await this.initializeDatabase();
        await this.initializeDiscordClient();
        this.startApiServer();

        this.eventManager.addEventEmitter('discord', this.client);
        this.eventManager.addEventEmitter('framework', this.eventEmitter);
        
        await this.registerModules();
        await this.refreshSlashCommands();
        if (this.settings.statusOptions) {
            this.statusManager = new StatusManager(this, this.settings.statusOptions);
        }
    }

    private async initializeDatabase() {
        const folders = ['db', 'db/tingodb'];
        for (const folder of folders) {
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder);
            }
        }
        this.database = new zumitoDb.Schema(
            this.settings?.database?.type || 'tingodb',
            this.settings?.database || {}
        );
        await new Promise((resolve, reject) => {
            this.database.on('connected', resolve);
            this.database.on('error', reject);
        })
            .then(() => {
                console.log('[🗄️🟢] Database connection successful!');
            })
            .catch((err) => {
                console.error('[🗄️🔴] Database connection error:', err.message);
                process.exit(1);
            });
    }

    /**
     * Initializes and starts the API server using ExpressJS.
     * Sets up middleware, routes, and error handling for the server.
     */
    startApiServer() {
        this.app = express();

        const port = process.env.PORT || '80';
        this.app.set('port', port);

        const server = http.createServer(this.app);
        server.listen(port);
        server.on('error', (err) => {
            console.log('[🌐🔴] Error starting API web server: ' + err);
        });
        server.on('listening', () => {
            console.log('[🌐🟢] API web server listening on port ' + port);
        });

        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(cookieParser());
        //this.app.use(express.static(path.join(__dirname, "public")));

        //To allow cross-origin requests
        this.app.use(cors());

        //Route Prefixes
        //this.app.use("/", indexRouter);
        //this.app.use("/api/", apiRouter);

        // throw 404 if URL not found
        this.app.all('*', function (req, res) {
            return ApiResponse.notFoundResponse(res, 'Page not found');
        });

        this.app.use(function (err, req, res) {
            if (err.name === 'UnauthorizedError') {
                return ApiResponse.unauthorizedResponse(res, 'Invalid token');
            }
        });
    }

    /**
     * Register all modules in the 'modules' folder.
     * Scans the specified folder for module files and calls the `registerModule` method for each file.
     *  Also, it loads the baseModule in the framework.
     * @private
     * @returns {Promise<void>}
     */
    private async registerModules() {
        let modulesFolder;
        if (fs.existsSync(`${process.cwd()}/modules`)) {
            modulesFolder = `${process.cwd()}/modules`;
        } else if (fs.existsSync(`${process.cwd()}/src/modules`)) {
            modulesFolder = `${process.cwd()}/src/modules`;
        } else return;

        const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
        await this.registerModule(path.join(__dirname, 'modules', 'core'), 'baseModule');
        const files = fs.readdirSync(modulesFolder);
        for (const file of files) {
            await this.registerModule(modulesFolder, file);
        }

        // Define models
        const schemas: any = {};
        this.models.forEach((model: DatabaseModel) => {
            if (!schemas[model.name]) {
                schemas[model.name] = model.getModel(this.database);
            } else {
                schemas[model.name] = MergeRecursive(
                    schemas[model.name],
                    model.getModel(this.database)
                );
            }
        });
        Object.keys(schemas).forEach((schemaName: string) => {
            this.database.define(schemaName, schemas[schemaName]);
        });
        this.models.forEach((model: DatabaseModel) => {
            model.define(
                this.database.models[model.name],
                this.database.models
            );
        });
    }

    private async registerModule(modulesFolder, moduleName, module?: any) {
        if (!module) {
            module = await this.modules.loadModuleFile(path.join(modulesFolder, moduleName));
        }
        // Create module instance
        const moduleInstance: Module = await this.modules.instanceModule(module, path.join(modulesFolder, moduleName), moduleName);
        // Register module in the framework
        this.modules.registerModule(moduleInstance);
    }

    /**
     * Initializes the Discord client using the Discord.js library.
     * Logs in to the Discord API using the provided token and logs a message when the client is ready.
     * @private
     */
    private async initializeDiscordClient() {
        this.client = new Client({
            intents: this.settings.discordClientOptions.intents,
        });
        this.client.login(this.settings.discordClientOptions.token);
        ServiceContainer.addService(Client, [], true, this.client);

        await new Promise<void>((resolve) => {
            this.client.on('ready', () => {
                // Bot emoji
                console.log('[🤖🟢] Discord client ready');
                resolve();
            });
        });
    }

    /**
     * From a command-line string, returns an array of parameters.
     * @param commandLine
     * @returns {string[]}
     * @private
     * @static
     * @example
     * // returns ['a', 'b', 'c']
     * splitCommandLine('a b c');
     * @example
     * // returns ['a', 'b c']
     * splitCommandLine('a "b c"');
     */
    public static splitCommandLine(commandLine) {
        //log( 'commandLine', commandLine ) ;

        //  Find a unique marker for the space character.
        //  Start with '<SP>' and repeatedly append '@' if necessary to make it unique.
        let spaceMarker = '<SP>';
        while (commandLine.indexOf(spaceMarker) > -1) spaceMarker += '@';

        //  Protect double-quoted strings.
        //   o  Find strings of non-double-quotes, wrapped in double-quotes.
        //   o  The final double-quote is optional to allow for an unterminated string.
        //   o  Replace each double-quoted-string with what's inside the qouble-quotes,
        //      after each space character has been replaced with the space-marker above.
        //   o  The outer double-quotes will not be present.
        const noSpacesInQuotes = commandLine.replace(
            /"([^"]*)"?/g,
            (fullMatch, capture) => {
                return capture.replace(/ /g, spaceMarker);
            }
        );

        //  Now that it is safe to do so, split the command-line at one-or-more spaces.
        const mangledParamArray = noSpacesInQuotes.split(/ +/);

        //  Create a new array by restoring spaces from any space-markers.
        const paramArray = mangledParamArray.map((mangledParam) => {
            return mangledParam.replace(RegExp(spaceMarker, 'g'), ' ');
        });

        return paramArray;
    }

    /**
     * Checks if a member has a permission in a channel.
     * @param member
     * @param channel
     * @param permission
     * @returns {Promise<boolean>}
     * @public
     * @example
     * // returns true if the member has the permission
     * memberHasPermission(member, channel, Permissions.FLAGS.MANAGE_MESSAGES);
     * @example
     * // returns true if the member has the permission
     * memberHasPermission(member, channel, Permissions.FLAGS.MANAGE_MESSAGES | Permissions.FLAGS.MANAGE_CHANNELS);
     * @example
     */
    public async memberHasPermission(
        member: GuildMember,
        channel: TextChannel,
        permission: bigint
    ) {
        const memberPermission: PermissionsBitField =
            await channel.permissionsFor(member);
        return memberPermission.has(permission);
    }

    /**
     * Gets the guild settings from the database.
     * If the guild is not in the database, it is added.
     * @param guildId
     * @returns {Promise<any>}
     * @public
     * @async
     * @example
     * // returns the guild settings
     * getGuildSettings('123456789012345678');
     * @example
     * // returns the guild settings
     * getGuildSettings(guild.id);
     * @example
     * // returns the guild settings
     * getGuildSettings(message.guild.id);
     * @example
     * // returns the guild settings
     * getGuildSettings(interaction.guild.id);
     * @example
     * // returns the guild settings
     * getGuildSettings(interaction.guildId);
     */
    public async getGuildSettings(guildId: string) {
        const Guild = this.database.models.Guild;
        return await new Promise((resolve, reject) => {
            Guild.findOne({ where: { guild_id: guildId } }, (err, guild) => {
                if (err) reject(err);
                if (guild == null) {
                    guild = new Guild({
                        guild_id: guildId,
                    });
                    guild.save((err) => {
                        if (err) reject(err);
                        resolve(guild);
                    });
                } else {
                    resolve(guild);
                }
            });
        });
    }

    async refreshSlashCommands() {
        const rest = new REST({ version: '10' }).setToken(
            this.settings.discordClientOptions.token
        );
        const commands = Array.from(this.commands.getAll().values())
            .filter(
                (command: Command) =>
                    command.type == CommandType.slash ||
                    command.type == CommandType.separated ||
                    command.type == CommandType.any
            )
            .map((command: Command) => {
                const slashCommand = new SlashCommandBuilder()
                    .setName(command.name)
                    .setDescription(
                        this.translations.get(
                            'command.' + command.name + '.description',
                            'en'
                        )
                    );
                if (command.args) {
                    command.args.forEach((arg: CommandArgDefinition) => {
                        let method;
                        switch (arg.type) {
                            case 'string':
                                method = 'addStringOption';
                                break;
                            case 'user':
                            case 'member':
                                method = 'addUserOption';
                                break;
                            case 'channel':
                                method = 'addChannelOption';
                                break;
                            case 'role':
                                method = 'addRoleOption';
                                break;
                            default:
                                throw new Error(
                                    'Invalid argument type ' + arg.type
                                );
                        }
                        slashCommand[method]((option) => {
                            option.setName(arg.name);
                            option.setDescription(
                                this.translations.get(
                                    'command.' +
                                        command.name +
                                        '.args.' +
                                        arg.name +
                                        '.description',
                                    'en'
                                )
                            );
                            option.setRequired(!arg.optional);
                            if (arg.choices) {
                                // if arg.choices is function, call it
                                if (typeof arg.choices == 'function') {
                                    arg.choices =
                                        arg.choices() as CommandChoiceDefinition[];
                                }
                                arg.choices.forEach((choice) => {
                                    option.addChoices({
                                        name: choice.name,
                                        value: choice.value,
                                    });
                                });
                            }
                            return option;
                        });
                    });
                }
                return slashCommand.toJSON();
            });
        const data: any = await rest.put(
            Routes.applicationCommands(
                this.settings.discordClientOptions.clientId
            ),
            { body: commands }
        );
        console.debug(
            `Successfully reloaded ${data.length} of ${commands.length} application (/) commands.`
        );
    }
}

function MergeRecursive(obj1, obj2) {
    for (const p in obj2) {
        try {
            // Property in destination object set; update its value.
            if (obj2[p].constructor == Object) {
                obj1[p] = MergeRecursive(obj1[p], obj2[p]);
            } else {
                obj1[p] = obj2[p];
            }
        } catch (e) {
            // Property in destination object not set; create it and set its value.
            obj1[p] = obj2[p];
        }
    }

    return obj1;
}
