import { ZumitoFramework } from "../ZumitoFramework";
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { Command } from "../definitions/commands/Command";
import { CommandType } from "../definitions/commands/CommandType";
import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";
import { CommandArgDefinition } from "../definitions/commands/CommandArgDefinition";
import { CommandChoiceDefinition } from "../definitions/commands/CommandChoiceDefinition";

export class SlashCommandRefresher {

    protected framework: ZumitoFramework;

    constructor(framework: ZumitoFramework) {
        this.framework = framework;
    }
    
    /*
    * Update slash commands on discord
    */
    public async refreshSlashCommands() {
        const rest = new REST({ version: '10' }).setToken(
            this.framework.settings.discordClientOptions.token
        );
        const commands = Array.from(this.framework.commands.getAll().values())
            .filter(
                (command: Command) =>
                    (command.type == CommandType.slash ||
                    command.type == CommandType.separated ||
                    command.type == CommandType.any)
                    && !command.parent
            )
            .map(command => this.mapCommand(command));
        const data: any = await rest.put(
            Routes.applicationCommands(
                this.framework.settings.discordClientOptions.clientId
            ),
            { body: commands }
        );
        console.debug(
            `Successfully reloaded ${data.length} of ${commands.length} application (/) commands.`
        );
    }

    mapCommand(command: Command, commandBuilder?: SlashCommandSubcommandBuilder) {
        const slashCommand = commandBuilder || new SlashCommandBuilder();
        slashCommand
            .setName(command.name)
            .setDescription(
                this.framework.translations.get(
                    'command.' + command.name + '.description',
                    'en'
                )
            );
        if (command.args) {
            command.args.forEach((arg: CommandArgDefinition) => {
                let method;
                switch (arg.type) {
                    case 'string':
                        method = 'addStringOption';
                        break;
                    case 'number':
                        method = 'addNumberOption';
                        break;
                    case 'user':
                    case 'member':
                        method = 'addUserOption';
                        break;
                    case 'channel':
                        method = 'addChannelOption';
                        break;
                    case 'role':
                        method = 'addRoleOption';
                        break;
                    default:
                        throw new Error(
                            `Invalid argument type ${arg.type} in command ${command.name} for argument ${arg.name}`
                        );
                }
                slashCommand[method]((option) => {
                    option.setName(arg.name);
                    option.setDescription(
                        this.framework.translations.get(
                            'command.' +
                                command.name +
                                '.args.' +
                                arg.name +
                                '.description',
                            'en'
                        )
                    );
                    option.setRequired(!arg.optional);
                    if (arg.choices) {
                        // if arg.choices is function, call it
                        if (typeof arg.choices == 'function') {
                            arg.choices =
                                arg.choices() as CommandChoiceDefinition[];
                        }
                        arg.choices.forEach((choice) => {
                            option.addChoices({
                                name: choice.name,
                                value: choice.value,
                            });
                        });
                    }
                    return option;
                });
            });
        }

        Array.from(this.framework.commands.getAll().values())
            .filter(
                (subcommand: Command) =>
                    (subcommand.type == CommandType.slash ||
                        subcommand.type == CommandType.separated ||
                        subcommand.type == CommandType.any)
                    && subcommand.parent
                    && subcommand.parent == command.name
            )
            .forEach(subcommand => {
                if (!commandBuilder) {
                    (slashCommand as SlashCommandBuilder).addSubcommand((subcommandSlashBuilder: SlashCommandSubcommandBuilder) => {
                        this.mapCommand(subcommand, subcommandSlashBuilder);
                        return subcommandSlashBuilder;
                    })
                }
            });

        return slashCommand.toJSON();
    }
}