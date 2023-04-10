import { Client, GuildMember, TextChannel } from 'discord.js';
import { Command } from './types/Command.js';
import { DatabaseModel } from './types/DatabaseModel.js';
import { EventEmitter } from 'events';
import { FrameworkEvent } from './types/FrameworkEvent.js';
import { FrameworkSettings } from './types/FrameworkSettings.js';
import { Module } from './types/Module.js';
import { StatusManager } from './managers/StatusManager.js';
import { TranslationManager } from './TranslationManager.js';
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
export declare class ZumitoFramework {
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
     * The modules loaded in the framework.
     * @type {Map<string, Module>}
     * @private
     */
    modules: Map<string, Module>;
    /**
     * The commands loaded in the framework.
     * @type {Map<string, Command>}
     * @private
     * @see {@link Command}
     */
    commands: Map<string, Command>;
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
     * The canario database schema instance.
     * @type {canario.Schema}
     * @private
     * @see {@link https://www.npmjs.com/package/canario}
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
    eventEmitter: EventEmitter;
    /**
     * @constructor
     * @param {FrameworkSettings} settings - The settings to use for the framework.
     * @param {(framework: ZumitoFramework) => void} [callback] - A callback to be called when the framework has finished initializing.
     */
    constructor(settings: FrameworkSettings, callback?: (framework: any) => void);
    /**
     * Initializes the framework.
     * Connects to the MongoDB database, starts the Discord client, and runs API server.
     * It also loads the modules from the project's modules folder.
     * @async
     * @private
     * @returns {Promise<void>}
     */
    private initialize;
    private initializeDatabase;
    /**
     * Initializes and starts the API server using ExpressJS.
     * Sets up middleware, routes, and error handling for the server.
     */
    startApiServer(): void;
    /**
     * Register all modules in the 'modules' folder.
     * Scans the specified folder for module files and calls the `registerModule` method for each file.
     *  Also, it loads the baseModule in the framework.
     * @private
     * @returns {Promise<void>}
     */
    private registerModules;
    private registerModule;
    /**
     * Initializes the Discord client using the Discord.js library.
     * Logs in to the Discord API using the provided token and logs a message when the client is ready.
     * @private
     */
    private initializeDiscordClient;
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
    static splitCommandLine(commandLine: any): any;
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
    memberHasPermission(member: GuildMember, channel: TextChannel, permission: bigint): Promise<boolean>;
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
    getGuildSettings(guildId: string): Promise<unknown>;
    refreshSlashCommands(): Promise<void>;
}
