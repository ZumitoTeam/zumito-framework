import { ButtonInteraction, Client, CommandInteraction, Interaction } from "discord.js";

import { Command } from "../../../types/Command.js";
import { CommandType } from "../../../types/CommandType.js";
import { EventParameters } from "../../../types/EventParameters.js";
import { FrameworkEvent } from "../../../types/FrameworkEvent.js";

export class InteractionCreate extends FrameworkEvent {

    once: boolean = false;
    
    async execute({interaction, client, framework}: EventParameters): Promise<void> {

        let guildSettings;
        if (interaction.guildId) {
            guildSettings = await framework.getGuildSettings(interaction.guildId);
        }

        if(interaction.isCommand()) {
            if(!framework.commands.has(interaction.commandName)) return;
            const commandInstance: Command = framework.commands.get(interaction.commandName);
            let args = new Map<String, any>();
            commandInstance.args.forEach(arg => {
                let option = (interaction as CommandInteraction).options.get(arg.name);
                if (option) {
                    switch (arg.type) {
                        case "user":
                            args.set(arg.name, option.user);
                            break;
                        case "member":
                            args.set(arg.name, option.member);
                            break;
                        default:
                            args.set(arg.name, option.value || option.user || option.role || option.channel || option.options || option.message || option.member || option.focused || option.autocomplete || option.attachment);
                            break;
                    }
                }
            });
            if (![CommandType.any, CommandType.separated, CommandType.slash].includes(commandInstance.type)) return;
            const trans = this.getTransMethod(commandInstance, guildSettings, framework);
            if (commandInstance.type === CommandType.separated || commandInstance.type === CommandType.slash) {
                await commandInstance.executeSlashCommand({client, interaction, args, framework, guildSettings, trans});
            } else {
                await commandInstance.execute({client, interaction, args, framework, guildSettings, trans});
            }
        } else if(interaction.isButton()) {
            interaction = interaction as ButtonInteraction;
            let path = interaction.customId.split('.');
            const commandInstance: any = framework.commands.get(path[0]);
            if (!commandInstance) throw new Error(`Command ${path[0]} not found or button id bad formatted`);
            // If the command has impements ButtonPress class then execute the method
            if(commandInstance.constructor.prototype.hasOwnProperty('buttonPressed')) {
                commandInstance.buttonPressed({path, interaction, client, framework, guildSettings});
            }
        } else if(interaction.isSelectMenu()) {
            let path = interaction.customId.split('.');
            const commandInstance = framework.commands.get(path[0]);
            if (!commandInstance) throw new Error(`Command ${path[0]} not found or select menu id bad formatted`);
            const trans = (key: string, params?: any) => {
                if (key.startsWith('$')) {
                    return framework.translations.get(key.replace('$', ''), guildSettings.lang, params);
                } else {
                    return framework.translations.get('command.' + commandInstance.name + '.' + key, guildSettings.lang, params);
                }
            }
            if(commandInstance.selectMenu) {
                commandInstance.selectMenu({path, interaction, client, framework, guildSettings, trans});
            }
        }
    }

    getTransMethod(commandInstance: Command, framework: any, guildSettings: any) {
        return (key: string, params?: any) => {
            if (key.startsWith('$')) {
                return framework.translations.get(key.replace('$', ''), guildSettings.lang, params);
            } else {
                return framework.translations.get('command.' + commandInstance.name + '.' + key, guildSettings.lang, params);
            }
        }
    }

}