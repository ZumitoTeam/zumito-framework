import { CommandArgDefinition } from './CommandArgDefinition.js';
import { CommandParameters } from './CommandParameters.js';
import { SelectMenuParameters } from './SelectMenuParameters.js';
export declare abstract class Command {
    name: string;
    categories: string[];
    aliases: string[];
    examples: string[];
    userPermissions: bigint[];
    botPermissions: string[];
    hidden: boolean;
    adminOnly: boolean;
    nsfw: boolean;
    cooldown: number;
    slashCommand: boolean;
    dm: boolean;
    args: CommandArgDefinition[];
    type: string;
    constructor();
    abstract execute({ message, interaction, args, client, framework, }: CommandParameters): void;
    executePrefixCommand({ message, interaction, args, client, framework, trans, }: CommandParameters): void;
    executeSlashCommand({ message, interaction, args, client, framework, trans, }: CommandParameters): void;
    abstract selectMenu({ path, interaction, client, framework, trans, }: SelectMenuParameters): void;
}
