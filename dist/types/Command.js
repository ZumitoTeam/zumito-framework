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
    constructor() {
    }
    executePrefixCommand({ message, interaction, args, client, framework, trans }) {
        this.execute({ message, interaction, args, client, framework, trans });
    }
    executeSlashCommand({ message, interaction, args, client, framework, trans }) {
        this.execute({ message, interaction, args, client, framework, trans });
    }
}
