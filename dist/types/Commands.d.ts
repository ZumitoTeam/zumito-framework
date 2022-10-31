import { CommandParameters } from "./CommandParameters";
import { SelectMenuParameters } from "./SelectMenuParameters";
export declare abstract class Command {
    name: string;
    categories: string[];
    aliases?: string[];
    examples?: string[];
    permissions?: bigint[];
    botPermissions?: string[];
    hidden?: boolean;
    adminOnly?: boolean;
    nsfw?: boolean;
    cooldown?: number;
    slashCommand?: boolean;
    dm: boolean;
    args: CommandArgDefinition[];
    type: string;
    constructor();
    abstract execute({ message, interaction, args, client, framework }: CommandParameters): void;
    executePrefixCommand({ message, interaction, args, client, framework }: CommandParameters): void;
    executeSlashCommand({ message, interaction, args, client, framework }: CommandParameters): void;
    selectMenu({ path, interaction, client, framework }: SelectMenuParameters): void;
}
