import { PermissionFlagsBits, SystemChannelFlagsBitField } from "discord.js";
import { CommandArgDefinition } from "./CommandArgDefinition.js";
import { CommandParameters } from "./CommandParameters.js";
import { CommandType } from "./CommandType.js";
import { SelectMenuParameters } from "./SelectMenuParameters.js";

export abstract class Command {

    name: string = this.constructor.name.toLowerCase();
    categories: string[] = [];
    aliases: string[] = [];
    examples: string[] = [];
    userPermissions: bigint[] = [];
    botPermissions: string[] = [];
    hidden: boolean = false;
    adminOnly: boolean = false;
    nsfw: boolean = false;
    cooldown: number = 0;
    slashCommand: boolean = false;
    dm: boolean = false;
    args: CommandArgDefinition[] = [];
    type: string = CommandType.prefix;
    
    constructor() {

    }

    abstract execute({ message, interaction, args, client, framework}: CommandParameters): void;

    executePrefixCommand({ message, interaction, args, client, framework}: CommandParameters) {
        this.execute({ message, interaction, args, client, framework });
    }

    executeSlashCommand({ message, interaction, args, client, framework}: CommandParameters) {
        this.execute({ message, interaction, args, client, framework });
    }

    abstract selectMenu({path, interaction, client, framework}: SelectMenuParameters): void;

}