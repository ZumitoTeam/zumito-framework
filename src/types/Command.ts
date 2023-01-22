import { PermissionFlagsBits, SystemChannelFlagsBitField } from 'discord.js';

import { CommandArgDefinition } from './CommandArgDefinition.js';
import { CommandParameters } from './CommandParameters.js';
import { CommandType } from './CommandType.js';
import { SelectMenuParameters } from './SelectMenuParameters.js';

export abstract class Command {
    name: string = this.constructor.name.toLowerCase();
    categories: string[] = [];
    aliases: string[] = [];
    examples: string[] = [];
    userPermissions: bigint[] = [];
    botPermissions: string[] = [];
    hidden = false;
    adminOnly = false;
    nsfw = false;
    cooldown = 0;
    slashCommand = false;
    dm = false;
    args: CommandArgDefinition[] = [];
    type: string = CommandType.prefix;

    constructor() {}

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
