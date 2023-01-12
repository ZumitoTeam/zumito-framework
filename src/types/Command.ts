import { PermissionFlagsBits, SystemChannelFlagsBitField } from "discord.js";
import { ZumitoFramework } from "../ZumitoFramework.js";

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
    subcommands: Map<string, Command> = new Map();
    parentCommand: Command | string | null = null;
    
    constructor() {

    }

    abstract execute({ message, interaction, args, client, framework}: CommandParameters): void;

    executePrefixCommand({ message, interaction, args, client, framework, trans }: CommandParameters) {
        this.execute({ message, interaction, args, client, framework, trans });
    }

    executeSlashCommand({ message, interaction, args, client, framework, trans }: CommandParameters) {
        this.execute({ message, interaction, args, client, framework, trans });
    }

    abstract selectMenu({path, interaction, client, framework, trans}: SelectMenuParameters): void;

    getParentCommand(): Command | null {
        if (this.parentCommand === null) return null;
        if (typeof this.parentCommand === "string") return null;
        return this.parentCommand;
    }

    setParentCommand(command: Command) {
        this.parentCommand = command;
    }

    updateParentCommand(commands: Map<string, Command>) {
        if (typeof this.parentCommand !== "string") return;
        if (commands.has(this.parentCommand)) {
            this.parentCommand = commands.get(this.parentCommand);
        }
    }

    

}