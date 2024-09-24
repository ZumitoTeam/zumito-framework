import { ButtonInteraction, Client, CommandInteraction, Interaction, ModalSubmitInteraction, StringSelectMenuInteraction } from "discord.js";
import { CommandManager } from "./CommandManager";
import { GuildDataGetter } from "./GuildDataGetter";
import { ServiceContainer } from "./ServiceContainer";
import { Command } from "@definitions/commands/Command";
import { CommandType } from "../definitions/commands/CommandType";
import { ZumitoFramework } from "../ZumitoFramework";
import { TranslationManager } from "./TranslationManager";
import { EventManager } from "./EventManager";
import { InteractionHandlerSettings } from "@definitions/settings/InteractionHandlerSettings";
import { ErrorHandler } from "./ErrorHandler";
import { ErrorType } from "../definitions/ErrorType";

export class InteractionHandler {

    protected commandManager: CommandManager;
    protected guildDataGetter: GuildDataGetter;
    protected client: Client;
    protected translationManager: TranslationManager;
    protected eventManager: EventManager;
    protected errorHandler: ErrorHandler;

    constructor() {
        this.commandManager = ServiceContainer.getService(CommandManager);
        this.guildDataGetter = ServiceContainer.getService(GuildDataGetter);
        this.client = ServiceContainer.getService(Client);
        this.translationManager = ServiceContainer.getService(TranslationManager);
        this.eventManager = ServiceContainer.getService(EventManager);
        this.errorHandler = ServiceContainer.getService(ErrorHandler);
    }

    async handleInteraction(interaction: Interaction, params?: InteractionHandlerSettings) {
        if (interaction.isCommand()) {
            if (params?.disabledHandlers?.includes("command")) return;
            await this.handleCommandInteraction(interaction)
        } else if (interaction.isButton()) {
            if (params?.disabledHandlers?.includes("button")) return;
            await this.handleButtonInteraction(interaction);
        } else if (interaction.isStringSelectMenu()) {
            if (params?.disabledHandlers?.includes("selectMenu")) return;
            await this.handleSelectMenu(interaction);
        } else if (interaction.isModalSubmit()) {
            if (params?.disabledHandlers?.includes("modal")) return;
            await this.handleModalInteraction(interaction);
        }
    }
    
    async handleCommandInteraction(interaction: CommandInteraction, guildSettings?: any) {
        const subcommandName = (interaction.options as any).getSubcommand(false);
        const commandName = interaction.commandName;
        let commandInstance: Command;
        if (subcommandName) {
            commandInstance = Array.from(this.commandManager.getAll().values()).find(c => c.name == subcommandName && c.parent == commandName);
        } else {
            commandInstance = this.commandManager.get(
                commandName
            );
        }
        if (!commandInstance) return;
        const framework = ServiceContainer.getService(ZumitoFramework);
        const args = new Map<string, any>();
        commandInstance.args.forEach((arg) => {
            const option = (interaction).options.get(
                arg.name
            );
            if (option) {
                switch (arg.type) {
                    case 'user':
                        args.set(arg.name, option.user);
                        break;
                    case 'member':
                        args.set(arg.name, option.member);
                        break;
                    default:
                        args.set(
                            arg.name,
                            option.value || 
                                option.user ||
                                option.role ||
                                option.channel ||
                                option.options ||
                                option.message ||
                                option.member ||
                                option.focused ||
                                option.autocomplete ||
                                option.attachment
                        );
                        break;
                }
            }
        });
        if (![CommandType.any, CommandType.separated, CommandType.slash,].includes(commandInstance.type) ) return;
        if (!guildSettings && interaction.guildId) {
            guildSettings = await ServiceContainer.getService(GuildDataGetter).getGuildSettings(interaction.guildId);
        }
        const trans = this.translationManager.getShortHandMethod(
            'command.' + commandInstance.name,
            guildSettings?.lang
        );
        if (
            commandInstance.type === CommandType.separated ||
            commandInstance.type === CommandType.slash
        ) {
            await commandInstance.executeSlashCommand({
                client: this.client, 
                interaction, args, framework, guildSettings, trans,
            });
        } else {
            try {
                await commandInstance.execute({
                    client: this.client, 
                    interaction, args, framework, guildSettings, trans,
                }).catch((error: Error) => {
                    this.errorHandler.handleError(error, {
                        command: commandInstance,
                        type: ErrorType.CommandRun,
                    })
                    interaction.reply({
                        content: "An error ocurred while running this command.",
                        ephemeral: true
                    })
                });
            } catch (error: any) {
                this.errorHandler.handleError(error, {
                    command: commandInstance,
                    type: ErrorType.CommandRun,
                });
                interaction.reply({
                    content: "An error ocurred while running this command.",
                    ephemeral: true,
                })
            }
        }
    }

    async handleButtonInteraction(interaction: ButtonInteraction, guildSettings?: any) {
        const framework = ServiceContainer.getService(ZumitoFramework);
        const path = interaction.customId.split('.');
        const commandInstance: any = this.commandManager.get(path[0]);
        if (!commandInstance)
            throw new Error(
                `Command ${path[0]} not found or button id bad formatted`
            );
        if (!guildSettings && interaction.guildId) {
            guildSettings = await ServiceContainer.getService(GuildDataGetter).getGuildSettings(interaction.guildId);
        }
        // If the command has impements ButtonPress class then execute the method
        if (
            commandInstance.constructor.prototype.hasOwnProperty('buttonPressed')
        ) {
            commandInstance.buttonPressed({
                client: this.client,
                path,
                interaction,
                framework,
                guildSettings,
            });
        }
    }

    async handleSelectMenu(interaction: StringSelectMenuInteraction, guildSettings?: any) {
        const path = interaction.customId.split('.');
        const commandInstance = this.commandManager.get(path[0]);
        if (!commandInstance) throw new Error(
            `Command ${path[0]} not found or select menu id bad formatted`
        );
        if (!guildSettings && interaction.guildId) {
            guildSettings = await ServiceContainer.getService(GuildDataGetter).getGuildSettings(interaction.guildId);
        }
        const trans = this.translationManager.getShortHandMethod(
            'command.' + commandInstance.name,
            guildSettings?.lang
        );

        const framework = ServiceContainer.getService(ZumitoFramework);
        if (commandInstance.binds?.selectMenu) {
            commandInstance.binds?.selectMenu({
                path,
                interaction,
                client: this.client,
                framework,
                guildSettings,
                trans,
            });
        } else if ( // Deprecated
            commandInstance.constructor.prototype.hasOwnProperty('selectMenu')
        ) {
            (commandInstance as any).selectMenu({
                path,
                interaction,
                client: this.client,
                framework,
                guildSettings,
                trans,
            });
        }
    }

    async handleModalInteraction(interaction: ModalSubmitInteraction, guildSettings?: any) {
        const path = interaction.customId.split('.');
        const commandInstance: any = this.commandManager.get(path[0]);
        if (!commandInstance) {
            throw new Error(
                `Command ${path[0]} not found or modal id bad formatted`
            );
        }
        const framework = ServiceContainer.getService(ZumitoFramework);
        if ((commandInstance as Command).binds?.modalSubmit) {
            const trans = this.translationManager.getShortHandMethod(
                'command.' + commandInstance.name,
                guildSettings?.lang
            );
            (commandInstance as Command).binds.modalSubmit({
                interaction,
                path,
                trans,
            })
        } else if (commandInstance.modalSubmit) {
            if (!guildSettings && interaction.guildId) {
                guildSettings = await ServiceContainer.getService(GuildDataGetter).getGuildSettings(interaction.guildId);
            }
            commandInstance.modalSubmit({
                client: this.client,
                path,
                interaction,
                framework,
                guildSettings,
            });
        }
        this.eventManager.emitEvent('modalSubmit', 'framework', {
            client: this.client,
            path, interaction, framework, guildSettings,
        })
    }
}