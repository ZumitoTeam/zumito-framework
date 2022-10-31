import { CommandType } from "./CommandType.js";
export class Command {
    name = this.constructor.name.toLowerCase();
    categories = [];
    aliases = [];
    examples = [];
    permissions = [];
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
    executePrefixCommand({ message, interaction, args, client, framework }) {
        this.execute({ message, interaction, args, client, framework });
    }
    executeSlashCommand({ message, interaction, args, client, framework }) {
        this.execute({ message, interaction, args, client, framework });
    }
    selectMenu({ path, interaction, client, framework }) { }
}
