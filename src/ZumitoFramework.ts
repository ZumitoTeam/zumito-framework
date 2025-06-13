import * as fs from 'fs';
import * as url from 'url';

import {
    Client,
    GuildMember,
    TextChannel,
} from 'discord.js';

import { ApiResponse } from './definitions/api/ApiResponse.js';
import { Command } from './definitions/commands/Command.js';
import { DatabaseModel } from './definitions/DatabaseModel.js';
import { EventEmitter } from "tseep";
import { FrameworkEvent } from './definitions/FrameworkEvent.js';
import { FrameworkSettings } from './definitions/settings/FrameworkSettings.js';
import { Module } from './definitions/Module.js';
import { StatusManager } from './services/managers/StatusManager.js';
import { TranslationManager } from './services/managers/TranslationManager.js';
import { betterLogging } from 'better-logging';
import zumitoDb from 'zumito-db';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import http from 'http';
import path from 'path';
import { EventManager } from './services/managers/EventManager.js';
import { CommandManager } from './services/managers/CommandManager.js';
import { ModuleManager } from './services/managers/ModuleManager.js';
import { ServiceContainer } from './services/ServiceContainer.js';
import { GuildDataGetter } from './services/utilities/GuildDataGetter.js';
import { RecursiveObjectMerger } from './services/utilities/RecursiveObjectMerger.js';
import { MemberPermissionChecker } from './services/utilities/MemberPermissionChecker.js';
import { CommandParser } from './services/CommandParser.js';
import { SlashCommandRefresher } from './services/SlashCommandRefresher.js';
import { Route } from './definitions/Route.js';
import { ModuleParameters } from './definitions/parameters/ModuleParameters.js';
import { ErrorHandler } from './services/handlers/ErrorHandler.js';
import { ErrorType } from './definitions/ErrorType.js';

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
    routes: Route[] = [];
    
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
    eventEmitter = new EventEmitter();

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
        
        // Register this class instance to service container
        ServiceContainer.addService(ZumitoFramework, [], true, this);
        
        this.modules = new ModuleManager(this)
        this.commands = new CommandManager(this);
        this.events = new Map();
        this.translations = new TranslationManager();
        this.models = [];
        this.eventManager = new EventManager();

        ServiceContainer.addService(TranslationManager, [], true, this.translations);
        ServiceContainer.addService(CommandManager, [], true, this.commands);
        ServiceContainer.addService(EventManager, [], true, this.eventManager);

        if (settings.logLevel) {
            console.logLevel = settings.logLevel;
        }

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

        this.eventManager.addEventEmitter('discord', this.client);
        this.eventManager.addEventEmitter('framework', this.eventEmitter);
        
        await this.registerModules();
        await this.refreshSlashCommands();
        this.startApiServer();
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

        const port = this.settings.webServer?.port || process.env.PORT || '80';
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

        this.routes.forEach(route => {
            this.app[route.method](route.path, async (req, res, next) => {
                try {
                    await Promise.resolve(route.execute(req, res));
                } catch (err) {
                    next(err);
                }
            });
        })

        // throw 404 if URL not found
        this.app.all('*', (req, res) => {
            return ApiResponse.notFoundResponse(res, 'Page not found');
        });

        this.app.use((err, req, res, next) => {
            if (err.name === 'UnauthorizedError') {
                return ApiResponse.unauthorizedResponse(res, 'Invalid token');
            }
            next(err);
        });

        //Error handler
        this.app.use((err, req, res, next) => {
            const errorHandler = ServiceContainer.getService(ErrorHandler);
            errorHandler.handleError(err, {
                type: ErrorType.Api,
                endpoint: req.originalUrl,
                method: req.method,
            });

            if (!res.headersSent) {
                return res.status(500).json({
                    error: 'Internal Server Error',
                    message: 'An unexpected error occurred. Please try again later.',
                });
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
        }

        const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
        if (this.settings.bundles && this.settings.bundles.length > 0) {
            for (const bundle of this.settings.bundles) {
                await this.registerBundle(bundle.path, bundle.options);
            }
        }
        await this.registerModule(path.join(__dirname, 'modules', 'core'), 'baseModule');
        if (fs.existsSync(`${process.cwd()}/node_modules/.zumitoBundles`)) {
            const files = fs.readdirSync(`${process.cwd()}/node_modules/.zumitoBundles`);
            for (const file of files) {
                await this.registerModule(`${process.cwd()}/node_modules/.zumitoBundles`, file);
            }
        }
        if (modulesFolder) {
            const files = fs.readdirSync(modulesFolder);
            for (const file of files) {
                await this.registerModule(modulesFolder, file);
            }
        } else if (this.settings.srcMode == 'monoBundle') {
            await this.registerModule(process.cwd(), 'src')
        }

        // Define models
        const schemas: any = {};
        this.models.forEach((model: DatabaseModel) => {
            if (!schemas[model.name]) {
                schemas[model.name] = model.getModel(this.database);
            } else {
                schemas[model.name] = RecursiveObjectMerger.merge(
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
        await this.modules.instanceModule(module, path.join(modulesFolder, moduleName), moduleName);
    }

    private async registerBundle(bundlePath, bundleOptions: ModuleParameters) {
        console.log(bundlePath);
        const bundle = await this.modules.loadModuleFile(bundlePath);
        const bundleName = path.basename(bundlePath);
        await this.modules.instanceModule(bundle, bundlePath, bundleName, bundleOptions);
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
     * Use CommandParser service instead
     * 
     * @deprecated 
     */
    public static splitCommandLine(commandLine) {
        return CommandParser.splitCommandLine(commandLine);
    }

    /**
     * Use MemberPermissionChecker service
     * 
     * @deprecated
     */
    public async memberHasPermission(
        member: GuildMember,
        channel: TextChannel,
        permission: bigint
    ) {
        const memberPermissionChecker = ServiceContainer.getService(MemberPermissionChecker) as MemberPermissionChecker;
        return await memberPermissionChecker.hasPermissionOnChannel(member, channel, permission);
    }

    /**
     * Use GuildDataGetter service
     * 
     * @deprecated 
     */
    public async getGuildSettings(guildId: string) {
        const guildDataGetter = ServiceContainer.getService(GuildDataGetter) as GuildDataGetter;
        return await guildDataGetter.getGuildSettings(guildId);
    }

    /**
     * @deprecated
     */
    async refreshSlashCommands() {
        const slashCommandRefresher = ServiceContainer.getService(SlashCommandRefresher) as SlashCommandRefresher;
        slashCommandRefresher.refreshSlashCommands();
    }

    async registerRoute(route: Route) {
        this.routes.push(route)
    }
}