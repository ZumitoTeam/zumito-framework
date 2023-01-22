import { GuildMember, TextChannel, Client } from 'discord.js';
import { Command } from './types/Command.js';
import { FrameworkSettings } from './types/FrameworkSettings.js';
import { Module } from './types/Module.js';
import { FrameworkEvent } from './types/FrameworkEvent.js';
import { TranslationManager } from './TranslationManager.js';
/**
 * @class ZumitoFramework
 * @classdesc The main class of the framework.
 *
 * @property {FrameworkSettings} settings - The settings for the framework.
 * @property {Client} client - The discord client instance.
 * @property {Map<string, Module>} modules - The modules loaded in the framework.
 * @property {Map<string, Command>} commands - The commands loaded in the framework.
 * @property {Map<string, FrameworkEvent>} events - The events loaded in the framework.
 * @property {TranslationManager} translations - The Translation Manager for the framework.
 * @property {Map<string, any>} models - The database models loaded in the framework.
 * @property {mongoose.Connection} database - The connection to the MongoDB database.
 * @property {express.Application} app - The ExpressJS application for the API server.
 */
export declare class ZumitoFramework {
    client: Client;
    settings: FrameworkSettings;
    modules: Map<string, Module>;
    commands: Map<string, Command>;
    events: Map<string, FrameworkEvent>;
    translations: TranslationManager;
    routes: any;
    models: any;
    database: any;
    app: any;
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
    getGuildSettings(guildId: string): Promise<any>;
    refreshSlashCommands(): Promise<void>;
}
