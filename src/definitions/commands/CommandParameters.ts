import { Client, CommandInteraction, Message } from 'discord.js';

import { ZumitoFramework } from '../../ZumitoFramework.js';

/**
 * @class CommandParameters
 * @classdesc Parameters passed to a command execution.
 * @property {Client} client - The client client instance.
 * @property {Message} message - The message that triggered the command.
 * @property {interaction} interaction - The interaction that triggered the command.
 * @property {args} args - The arguments passed to the command.
 */


export interface BaseCommandParameters {
    args: Map<string, any>;
    /**
     * Discord client instance
     * The client should be obtained from `ServiceContainer.get(Client);`
     * 
     * @deprecated 
     */
    client: Client;
    /**
     * ZumitoFramework instance
     * The frameworkInstance should be obtained from `ServiceContainer.get(ZumitoFramework);`
     * 
     * @deprecated 
     */
    framework: ZumitoFramework;
    guildSettings?: any;
    trans: (key: string, params?: any) => string;
}


export type SlashCommandParameters = BaseCommandParameters & {
    interaction: CommandInteraction;
    message?: null;
}

export type PrefixCommandParameters = BaseCommandParameters & {
    message: Message;
    interaction?: null;
}

export type CommandParameters = PrefixCommandParameters | SlashCommandParameters;
