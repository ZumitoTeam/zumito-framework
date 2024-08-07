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
export interface CommandParameters {
    message?: Message;
    interaction?: CommandInteraction;
    args: Map<string, any>;
    /**
     * @deprecated The client should be obtained from `ServiceContainer.get(Client);`
     */
    client: Client;
    /**
     * @deprecated The frameworkInstance should be obtained from `ServiceContainer.get(ZumitoFramework);`
     */
    framework: ZumitoFramework;
    guildSettings?: any;
    trans: (key: string, params?: any) => string;
}
