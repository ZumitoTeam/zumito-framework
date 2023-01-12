import { CommandType } from "./CommandType.js";
export class Command {
    name = this.constructor.name.toLowerCase();
    categories = [];
    aliases = [];
    examples = [];
    userPermissions = [];
    botPermissions = [];
    hidden = false;
    adminOnly = false;
    nsfw = false;
    cooldown = 0;
    slashCommand = false;
    dm = false;
    args = [];
    type = CommandType.prefix;
    subcommands = new Map();
    parentCommand = null;
    constructor() {
    }
    executePrefixCommand({ message, interaction, args, client, framework, trans }) {
        this.execute({ message, interaction, args, client, framework, trans });
    }
    executeSlashCommand({ message, interaction, args, client, framework, trans }) {
        this.execute({ message, interaction, args, client, framework, trans });
    }
    getParentCommand() {
        if (this.parentCommand === null)
            return null;
        if (typeof this.parentCommand === "string")
            return null;
        return this.parentCommand;
    }
    setParentCommand(command) {
        this.parentCommand = command;
    }
    updateParentCommand(commands) {
        if (typeof this.parentCommand !== "string")
            return;
        if (commands.has(this.parentCommand)) {
            this.parentCommand = commands.get(this.parentCommand);
        }
    }
}
