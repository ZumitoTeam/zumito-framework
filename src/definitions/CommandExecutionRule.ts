import { Command } from "./commands/Command.js";
import { ZumitoFramework } from "../ZumitoFramework.js";
import { Client, Guild, GuildMember, Message, CommandInteraction, ButtonInteraction, StringSelectMenuInteraction, ModalSubmitInteraction } from "discord.js";

export type CommandExecutionType = 'prefix' | 'slash' | 'button' | 'selectMenu' | 'modal';

export interface CommandExecutionContext {
    command: Command;
    type: CommandExecutionType;
    framework: ZumitoFramework;
    client: Client;
    guild?: Guild;
    member?: GuildMember;
    guildSettings?: any;
    message?: Message;
    interaction?: CommandInteraction | ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction;
    args?: Map<string, any>;
}

export interface CommandExecutionRule {
    canRun: (context: CommandExecutionContext) => boolean | Promise<boolean>;
    errorMessage?: string | ((context: CommandExecutionContext) => string);
}

export interface CommandExecutionCheck {
    passed: boolean;
    ruleName?: string;
    message?: string;
}
