import * as url from 'url';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField, } from 'discord.js';
import ErrorStackParser from 'error-stack-parser';
import { FrameworkEvent } from '../../../types/FrameworkEvent.js';
import { ZumitoFramework } from '../../../ZumitoFramework.js';
import leven from 'leven';
import path from 'path';
export class MessageCreate extends FrameworkEvent {
    once = false;
    async execute({ message, client, framework }) {
        const channel = message.channel;
        const prefix = framework.settings.defaultPrefix;
        const args = ZumitoFramework.splitCommandLine(message.content.slice(prefix.length));
        const command = args.shift().toLowerCase();
        let commandInstance;
        if (message.content.startsWith(prefix)) {
            if (!framework.commands.has(command)) {
                const commandNames = Array.from(framework.commands.keys());
                const correctedCommand = this.autocorrect(command, commandNames);
                if (framework.commands.has(correctedCommand)) {
                    commandInstance = framework.commands.get(correctedCommand);
                }
                else {
                    return; // Command not found
                }
            }
            else {
                commandInstance = framework.commands.get(command);
            }
            if (message.guild == null && commandInstance.dm == false)
                return;
            if (commandInstance.adminOnly ||
                commandInstance.userPermissions.length > 0) {
                let denied = false;
                if (framework.memberHasPermission(message.member, message.channel, PermissionsBitField.Flags.Administrator) ||
                    message.member.id != message.guild.ownerId) {
                    if (commandInstance.userPermissions.length > 0) {
                        commandInstance.userPermissions.forEach((permission) => {
                            if (!framework.memberHasPermission(message.member, message.channel, permission)) {
                                denied = true;
                            }
                        });
                    }
                }
                if (denied) {
                    return message.reply({
                        content: 'You do not have permission to use this command.',
                        allowedMentions: {
                            repliedUser: false,
                        },
                    });
                }
            }
            if (message.channel.isTextBased) {
                const channel = message.channel;
                // Check command is nsfw and if channel is allowed
                if (commandInstance.nsfw &&
                    !channel.nsfw &&
                    !channel
                        .permissionsFor(message.member)
                        .has(PermissionsBitField.Flags.Administrator) &&
                    message.member.id != message.guild.ownerId) {
                    return message.reply({
                        content: 'This command is nsfw and this channel is not nsfw.',
                        allowedMentions: {
                            repliedUser: false,
                        },
                    });
                }
            }
            try {
                const guildSettings = await framework.getGuildSettings(message.guildId);
                const parsedArgs = new Map();
                const userMentionCount = 0;
                for (let i = 0; i < args.length; i++) {
                    const arg = args[i];
                    const type = commandInstance.args[i]?.type;
                    if (type) {
                        if (type == 'member' || type == 'user') {
                            const member = await message.guild.members.cache.get(arg.replace(/[<@!>]/g, ''));
                            if (member) {
                                if (type == 'user') {
                                    parsedArgs.set(commandInstance.args[i].name, member.user);
                                }
                                else {
                                    parsedArgs.set(commandInstance.args[i].name, member);
                                }
                            }
                            else {
                                return message.reply({
                                    content: 'Invalid user.',
                                    allowedMentions: {
                                        repliedUser: false,
                                    },
                                });
                            }
                        }
                        else if (type == 'string') {
                            parsedArgs.set(commandInstance.args?.[i]?.name || i.toString(), arg);
                        }
                    }
                }
                await commandInstance.execute({
                    message,
                    args: parsedArgs,
                    client: framework.client,
                    framework: framework,
                    guildSettings: guildSettings,
                    trans: (key, params) => {
                        if (key.startsWith('$')) {
                            return framework.translations.get(key.replace('$', ''), guildSettings.lang, params);
                        }
                        else {
                            return framework.translations.get('command.' + commandInstance.name + '.' + key, guildSettings.lang, params);
                        }
                    },
                });
                if (!message.channel.isDMBased && !message.deletable) {
                    return; // TODO: test if this works
                    // false = settings.deleteCommands
                    try {
                        message.delete().catch(function () {
                            console.error("can't delete user command");
                        });
                        const metadata = await fetch('https://tulipo.ga/api/last_command/' + command).then((res) => res.json());
                    }
                    catch (err) {
                        console.error(err.name, err.message);
                    }
                }
            }
            catch (error) {
                const content = await this.getErrorEmbed({
                    name: error.name,
                    message: error.message,
                    command: commandInstance,
                    args: args,
                    stack: error.stack,
                }, true);
                try {
                    message.reply(content);
                }
                catch (e) {
                    channel.send(content);
                }
            }
        }
    }
    autocorrect(str, words) {
        let distance, bestWord, i, word, min;
        const dictionary = words || [];
        const len = dictionary.length;
        for (i = 0; i < len; i++) {
            word = dictionary[i];
            distance = leven(str, word);
            if (distance === 0) {
                return word;
            }
            else if (min === undefined || distance < min) {
                min = distance;
                bestWord = word;
            }
        }
        return bestWord;
    }
    getErrorEmbed(error, parse) {
        let parsedError;
        if (parse) {
            parsedError = this.parseError(error);
        }
        else {
            parsedError = error;
        }
        const embed = new EmbedBuilder()
            .setTitle('Error')
            .setDescription('An error has occured while executing this command.')
            .setTimestamp()
            .addFields([
            {
                name: 'Command:',
                value: error.command.name || 'Not defined',
            },
        ])
            .addFields([
            {
                name: 'Arguments:',
                value: error.args.toString() || 'None',
            },
        ])
            .addFields([
            {
                name: 'Error name:',
                value: error.name || 'Not defined',
            },
        ])
            .addFields([
            {
                name: 'Error message:',
                value: error.message || 'Not defined',
            },
        ]);
        if (error.possibleSolutions !== undefined) {
            error.possibleSolutions.forEach((solution) => {
                embed.addFields([
                    {
                        name: 'Posible solution:',
                        value: solution,
                    },
                ]);
            });
        }
        const stackFrames = ErrorStackParser.parse(error).filter((e) => !e.fileName.includes('node_modules') &&
            !e.fileName.includes('node:internal'));
        let stack = '';
        const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
        const path1 = path.resolve('./');
        const path2 = path1.replaceAll('\\', '/');
        stackFrames.forEach((frame) => {
            stack += `[${frame.fileName
                .replace(path1, '')
                .replace(path2, '')
                .replace('file://', '')}:${frame.lineNumber}](https://zumito.ga/redirect?url=vscode://file/${frame.fileName.replace('file://', '')}:${frame.lineNumber}) ${frame.functionName}()\n`;
        });
        if (error.stack !== undefined) {
            embed.addFields([
                {
                    name: 'Call stack:',
                    value: stack || error.stack || error.stack.toString(),
                },
            ]);
        }
        if (error.details !== undefined) {
            error.details.forEach((detail) => {
                embed.addFields([
                    {
                        name: 'Detail:',
                        value: detail,
                    },
                ]);
            });
        }
        const body = `\n\n\n---\nComand:\`\`\`${error.command.name || 'not defined'}\`\`\`\nArguments:\`\`\`${error.args.toString() || 'none'}\`\`\`\nError:\`\`\`${error.name || 'not defined'}\`\`\`\nError message:\`\`\`${error.message || 'not defined'}\`\`\`\n`;
        const requestUrl = `https://github.com/ZumitoTeam/Zumito/issues/new?body=${encodeURIComponent(body)}`;
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel('Report error')
            .setEmoji('975645505302437978')
            .setURL(requestUrl));
        return {
            embeds: [embed],
            components: [row],
            allowedMentions: {
                repliedUser: false,
            },
        };
    }
    parseError(error) {
        error.possibleSolutions = [];
        if (/(?:^|(?<= ))(EmbedBuilder|Discord|ActionRowBuilder|ButtonBuilder|MessageSelectMenu)(?:(?= )|$) is not defined/gm.test(error.message)) {
            error.possibleSolutions.push('const { ' +
                error.message.split(' ')[0] +
                " } = require('discord.js');");
        }
        else if (error.message.includes('A custom id and url cannot both be specified')) {
            error.possibleSolutions.push('Remove .setCustomId(...) or .setURL(...)');
        }
        return error;
    }
}
