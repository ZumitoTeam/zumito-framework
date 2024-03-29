import { CommandArgDefinition } from './CommandArgDefinition.js';
import { CommandParameters } from './CommandParameters.js';
import { CommandType } from './CommandType.js';
import { SelectMenuParameters } from '../parameters/SelectMenuParameters.js';

/**
 * @name Command
 * @description Base class for all commands
 * @see {@link https://docs.zumito.ga/docs/custom/create-command}
 */
export abstract class Command {
    /**
     * @name name
     * @description The name of the command. This is the name that will be used to execute the command. The framework will automatically set this to the name of the class in lowercase.
     * @type {string}
     * @default this.constructor.name.toLowerCase()
     * @example
     * ```ts
     * export class PingCommand extends Command {
     *  name = 'ping';
     * }
     * ```
     */
    name: string = this.constructor.name.toLowerCase();
    /**
     * @name categories
     * @description Array of strings of each category the command belongs to. This is used to group commands together in the help command.
     * The framework will load the translations for each category from key `global.category.${category}`, so its recommended to use camelCase since this is the category key and not the category name.
     * @type {string[]}
     * @default []
     * @example
     * ```ts
     * export class PingCommand extends Command {
     *  categories = ['utility', 'info'];
     * }
     * ```
     */
    categories: string[] = [];
    /**
     * @name aliases
     * @description Array of strings of each alias the command has. This is used to execute the command with an alias.
     * @type {string[]}
     * @default []
     * @example
     * ```ts
     * export class PingCommand extends Command {
     *  aliases = ['pong'];
     * }
     * ```
     */
    aliases: string[] = [];
    /**
     * @name examples
     * @description Array of strings of each example of how to use the command. This is used to show examples of how to use the command in the help command.
     * Do not include the prefix in the example.
     * @type {string[]}
     * @default []
     * @example
     * ```ts
     * export class PingCommand extends Command {
     *  examples = ['ping', 'ping 100'];
     * }
     * ```
     */
    examples: string[] = [];
    /**
     * @name userPermissions
     * @description Array of {@link https://discord.js.org/#/docs/main/stable/class/Permissions} of each permission the user needs to execute the command.
     * @type {bigint[]}
     * @default []
     * @example
     * ```ts
     * export class ClearCommand extends Command {
     *  userPermissions = [Permissions.FLAGS.MANAGE_MESSAGES];
     * }
     * ```
     * @see {@link https://discord.js.org/#/docs/main/stable/class/Permissions}
     */
    userPermissions: bigint[] = [];
    /**
     * @name botPermissions
     * @description Array of {@link https://discord.js.org/#/docs/main/stable/class/Permissions} of each permission the bot needs to execute the command.
     * @type {bigint[]}
     * @default []
     * @example
     * ```ts
     * export class BanCommand extends Command {
     *  botPermissions = [Permissions.FLAGS.BAN_MEMBERS];
     * }
     * ```
     * @see {@link https://discord.js.org/#/docs/main/stable/class/Permissions}
     */
    botPermissions: string[] = [];
    /**
     * @name hidden
     * @description Whether the command should be hidden from the help command.
     * @type {boolean}
     * @default false
     * @example
     * ```ts
     * export class PingCommand extends Command {
     *  hidden = true;
     * }
     * ```
     */
    hidden = false;
    /**
     * @name adminOnly
     * @description Whether the command should only be available to the guild admins.
     * @type {boolean}
     * @default false
     * @example
     * ```ts
     * export class PingCommand extends Command {
     *  adminOnly = true;
     * }
     * ```
     */
    adminOnly = false;
    /**
     * @name nsfw
     * @description Whether the command should only be available in nsfw channels.
     * @type {boolean}
     * @default false
     * @example
     * ```ts
     * export class PingCommand extends Command {
     *   nsfw = true;
     * }
     * ```
     */
    nsfw = false;
    /**
     * @name cooldown
     * @description The cooldown in seconds for the command. This is used to prevent spamming the command or for command with high processing time.
     * @type {number}
     * @default 0
     * @example
     * ```ts
     * export class PingCommand extends Command {
     *  cooldown = 5;
     * }
     * ```
     */
    cooldown = 0;
    slashCommand = false;
    /**
     * @name dm
     * @description Whether the command should be available in dms.
     * @type {boolean}
     * @default false
     * @example
     * ```ts
     * export class PingCommand extends Command {
     *  dm = true;
     * }
     * ```
     */
    dm = false;
    /**
     * @name args
     * @description Array of {@link CommandArgDefinition} of each argument the command has.
     * @type {CommandArgDefinition[]}
     * @default []
     * @example
     * ```ts
     * export class PingCommand extends Command {
     *  args = [
     *      {
     *        name: 'number',
     *        type: 'number',
     *        required: true,
     *     },
     *  ];
     * }
     * ```
     * @see {@link CommandArgDefinition}
     */
    args: CommandArgDefinition[] = [];
    /**
     * @name type
     * @description The type of the command. This is used to determine how the command should be executed.
     * @type {CommandType}
     * @default CommandType.prefix
     * @example
     * ```ts
     * export class PingCommand extends Command {
     *  type = CommandType.slash;
     * }
     * ```
     * @example
     * ```ts
     * export class PingCommand extends Command {
     *  type = CommandType.any;
     * }
     * ```
     * @example
     * ```ts
     * export class PingCommand extends Command {
     *  type = CommandType.separated;
     * }
     * ```
     * @see {@link CommandType}
     */
    type: string = CommandType.prefix;

    /**
     * @name execute
     * @description The function that is executed when the command is called.
     * @param {CommandParameters} parameters The parameters of the command.
     * @param {Message} parameters.message The message that triggered the command.
     * @param {CommandInteraction} parameters.interaction The interaction that triggered the command.
     * @param {string[]} parameters.args The arguments of the command.
     * @param {Client} parameters.client The client.
     * @param {Framework} parameters.framework The framework.
     * @param {trans} (key: string, options?: any) => string Translation shorthand function.
     */
    abstract execute({
        message,
        interaction,
        args,
        client,
        framework,
    }: CommandParameters): void;

    executePrefixCommand({
        message,
        interaction,
        args,
        client,
        framework,
        trans,
    }: CommandParameters) {
        this.execute({ message, interaction, args, client, framework, trans });
    }

    executeSlashCommand({
        message,
        interaction,
        args,
        client,
        framework,
        trans,
    }: CommandParameters) {
        this.execute({ message, interaction, args, client, framework, trans });
    }

    abstract selectMenu({
        path,
        interaction,
        client,
        framework,
        trans,
    }: SelectMenuParameters): void;
}
