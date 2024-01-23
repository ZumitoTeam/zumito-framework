import { ZumitoFramework } from "../ZumitoFramework";
import chalk from "chalk";
import * as chokidar from 'chokidar';
import path from "path";
import boxen from "boxen";
import fs from 'fs';
import { Command } from "../definitions/commands/Command.js";
import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { CommandType } from "../definitions/commands/CommandType.js";
import { CommandArgDefinition } from "../definitions/commands/CommandArgDefinition.js";
import { CommandChoiceDefinition } from "../definitions/commands/CommandChoiceDefinition.js";

export class CommandManager {

    protected commands: Map<string, Command>;
    protected framework: ZumitoFramework;

    constructor(framework) {
        this.commands = new Map<string, Command>;
        this.framework = framework;
    }

    set(name: string, command: Command): void {
        this.commands.set(name, command);
    }

    get(name: string): Command {
        return this.commands.get(name);
    }
    
    getAll(): Map<string, Command> {
        return this.commands;
    }

    /**
     * @deprecated
     */
    get size(): number {
        return this.commands.size;
    }

    /**
     * Load command from file
     * @async
     * @public
     * @param filePath - Absolute path to command file
     * @returns {Promise<Command>}
     */
    async loadCommandFile(filePath: string): Promise<any> {
        // Validate file has .ts or .js extension
        if (!filePath.endsWith('.js') && !filePath.endsWith('.ts')) {
            throw new Error("File must be a .ts or .js");
        }

        // import file
        let command = await import('file://' + filePath + '?update=' + Date.now().toString()).catch(e => {
            console.error('[🆕🔴 ] Error loading command ' + chalk.blue(filePath.toString().replace(/^.*[\\\/]/, '').split('.').slice(0, -1).join('.')));
            console.log(e + '\n' + e.name + '\n' + e.stack);
        });
        command = Object.values(command)[0];
        command = new command();
        this.framework.commands.set(command.constructor.name.toLowerCase(), command);
        console.debug('[🆕🟢 ] Command ' + chalk.blue(filePath.toString().replace(/^.*[\\\/]/, '').split('.').slice(0, -1).join('.')) + ' loaded');
        return command;
    }

    /**
     * Load all command files from a folder
     * @async
     * @public
     * @param folderPath - Absolute path to commands folder
     * @returns {Promise<Map<string, Command>>}
     */
    async loadCommandsFolder(folderPath: string): Promise<Map<string, any>> {
        const files = fs.readdirSync(folderPath);
        for (const file of files) {
            if (file.endsWith('.js') || file.endsWith('.ts')) {
                const command = await this.loadCommandFile(path.join(folderPath, file));
                this.commands.set(
                    command.constructor.name.toLowerCase(),
                    command
                );
            }
        }
        return this.commands;
    }

    /**
     * Watch command files on a folder.
     * It loads command when new file is created, update command when file is modified and deletes command when file is deleted.
     * @async
     * @public
     * @param folderPath - Absolute path to commands folder
     * @returns {Promise<Map<string, Command>>}
     */
    watchCommandsFolder(folderPath: string): void {
        chokidar
            .watch(path.resolve(folderPath), {
                ignored: /^\./,
                persistent: true,
                ignoreInitial: true,
            })
            .on('add', (filePath: string) => {
                this.loadCommandFile(filePath)
            })
            .on('change', (filePath: string) => {
                this.loadCommandFile(filePath)
            })
            .on('error', (error: Error) => {
                console.error('[🔄🔴 ] Error reloading command');
                console.log(boxen(error + '\n' + error.stack, { padding: 1 }));
            })
            // TODO: Handle file removal
            //.on('unlink', function(path) {console.log('File', path, 'has been removed');})
    }

    async refreshSlashCommands() {
        const rest = new REST({ version: '10' }).setToken(
            this.framework.settings.discordClientOptions.token
        );
        const commands = Array.from(this.commands.values())
            .filter(
                (command: Command) =>
                    command.type == CommandType.slash ||
                    command.type == CommandType.separated ||
                    command.type == CommandType.any
            )
            .map((command: Command) => {
                const slashCommand = new SlashCommandBuilder()
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
                                    'Invalid argument type ' + arg.type
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
                return slashCommand.toJSON();
            });
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
}