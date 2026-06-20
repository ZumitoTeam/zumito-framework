import * as url from 'url';

import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    EmbedBuilder,
    PermissionsBitField,
    TextChannel,
} from 'discord.js';

import { Command } from '../../../../../definitions/commands/Command.js';
import ErrorStackParser from 'error-stack-parser';
import { EventParameters } from '../../../../../definitions/parameters/EventParameters.js';
import { FrameworkEvent } from '../../../../../definitions/FrameworkEvent.js';
import leven from 'leven';
import path from 'path';
import { ServiceContainer } from '../../../../../services/ServiceContainer.js';
import { CommandParser } from '../../../../../services/CommandParser.js';
import { MemberPermissionChecker } from '../../../../../services/utilities/MemberPermissionChecker.js';
import { ZumitoFramework } from '../../../../../ZumitoFramework.js';
import { GuildDataGetter } from '../../../../../services/utilities/GuildDataGetter.js';
import { ErrorHandler } from '../../../../../services/handlers/ErrorHandler.js';
import { ErrorType } from '../../../../../definitions/ErrorType.js';
import { CommandExecutionChecker } from '../../../../../services/CommandExecutionChecker.js';

export class MessageCreate extends FrameworkEvent {
    
    once = false;
    source = 'discord';

    memberPermissionChecker: MemberPermissionChecker;
    framework: ZumitoFramework;
    guildDataGetter: GuildDataGetter;

    constructor() {
        super();
        this.memberPermissionChecker = ServiceContainer.getService(MemberPermissionChecker);
        this.framework = ServiceContainer.getService(ZumitoFramework);
        this.guildDataGetter = ServiceContainer.getService(GuildDataGetter);
    }

    async execute({ message }: EventParameters) {
        const channel = message.channel;
        const prefix = this.framework.settings.defaultPrefix;
        const args = CommandParser.splitCommandLine(
            message.content.slice(prefix.length)
        );
        const command = args.shift().toLowerCase();

        let commandInstance: Command;
        if (message.content.startsWith(prefix)) {
            if (!this.framework.commands.getAll().has(command)) {
                const commandNames = Array.from(this.framework.commands.getAll().keys());
                const correctedCommand = this.autocorrect(
                    command,
                    commandNames
                );
                if (this.framework.commands.getAll().has(correctedCommand)) {
                    commandInstance = this.framework.commands.get(correctedCommand);
                } else {
                    return; // Command not found
                }
            } else {
                const tmpCmd = this.framework.commands.get(command);
                if (tmpCmd && !tmpCmd.parent) {
                    commandInstance = tmpCmd;
                }
            }

            commandInstance = Array.from(this.framework.commands.getAll().values()).find((c: Command) => c.name == args.at(0) && c.parent && c.parent == command) || commandInstance;

            if (!commandInstance) return;

            try {
                const guildSettings: any = await this.guildDataGetter.getGuildSettings(message.guildId);
                const parsedArgsResponse = await CommandParser.parseFromSplitedString(args, commandInstance.args, message.guild)
                if (parsedArgsResponse.errors.length > 0) {
                    return message.reply({
                        content: parsedArgsResponse.errors.at(0),
                        allowedMentions: {
                            repliedUser: false,
                        },
                    }); 
                }
                const parsedArgs = parsedArgsResponse.parsedArgs;

                const executionChecker = ServiceContainer.getService(CommandExecutionChecker);
                const check = await executionChecker.check({
                    command: commandInstance,
                    type: 'prefix',
                    framework: this.framework,
                    client: this.framework.client,
                    guild: message.guild,
                    member: message.member,
                    guildSettings,
                    message,
                    args: parsedArgs,
                });
                if (!check.passed) {
                    return message.reply({
                        content: check.message || 'You cannot run this command.',
                        allowedMentions: { repliedUser: false },
                    });
                }

                const startTime = Date.now();
                await commandInstance.execute({
                    message,
                    args: parsedArgs,
                    client: this.framework.client,
                    framework: this.framework,
                    guildSettings: guildSettings,
                    trans: (key: string, params?: any) => {
                        if (key.startsWith('$')) {
                            return this.framework.translations.get(
                                key.replace('$', ''),
                                guildSettings.lang,
                                params
                            );
                        } else {
                            return this.framework.translations.get(
                                'command.' + commandInstance.name + '.' + key,
                                guildSettings.lang,
                                params
                            );
                        }
                    },
                }).then(() => {
                    this.framework.eventEmitter.emit('commandExecuted', {
                        guildId: message.guildId,
                        commandName: commandInstance.name,
                        type: 'prefix',
                        executionTimeMs: Date.now() - startTime,
                        success: true,
                    });
                }).catch((error) => {
                    this.framework.eventEmitter.emit('commandExecuted', {
                        guildId: message.guildId,
                        commandName: commandInstance.name,
                        type: 'prefix',
                        executionTimeMs: Date.now() - startTime,
                        success: false,
                    });
                    const errorHandler = ServiceContainer.getService(ErrorHandler);
                    errorHandler.handleError(error, {
                        command: commandInstance,
                        type: ErrorType.CommandRun,
                        message,
                    })
                    message.reply({
                        content: "An error ocurred while running this command.",
                    })
                });
                if (!message.channel.isDMBased && !message.deletable) {
                    return; // TODO: test if this works
                    // false = settings.deleteCommands
                    try {
                        message.delete().catch(function () {
                            console.error("can't delete user command");
                        });
                    } catch (err) {
                        console.error(err.name, err.message);
                    }
                }
            } catch (error) {
                const errorHandler = ServiceContainer.getService(ErrorHandler);
                errorHandler.handleError(error, {
                    command: commandInstance,
                    type: ErrorType.CommandRun,
                    message,
                })
                message.reply({
                    content: "An error ocurred while running this command.",
                })
            }
        }
    }

    autocorrect(str: string, words: string[]) {
        let distance, bestWord, i, word, min;
        const dictionary = words || [];
        const len = dictionary.length;

        for (i = 0; i < len; i++) {
            word = dictionary[i];
            distance = leven(str, word);

            if (distance === 0) {
                return word;
            } else if (min === undefined || distance < min) {
                min = distance;
                bestWord = word;
            }
        }

        return bestWord;
    }
}
