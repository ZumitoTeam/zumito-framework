import { ChatInputCommandInteraction, Interaction } from 'discord.js';

export class CommandArguments {
    args: any = {};

    constructor(args = {}) {
        this.args = args;
    }

    public get(key) {
        return this.args[key];
    }

    public add(key, value) {
        this.args[key] = value;
    }

    public static parseFromInteraction(interaction: Interaction) {
        if ('options' in interaction) {
            return new CommandArguments((interaction as ChatInputCommandInteraction).options);
        }
        return new CommandArguments();
    }
}
