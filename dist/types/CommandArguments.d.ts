import { CommandInteraction } from 'discord.js';
export declare class CommandArguments {
    args: any;
    constructor(args?: {});
    get(key: any): any;
    add(key: any, value: any): void;
    static parseFromInteraction(interaction: CommandInteraction): CommandArguments;
}
