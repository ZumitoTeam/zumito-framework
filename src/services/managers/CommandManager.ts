import { ZumitoFramework } from "../../ZumitoFramework";
import chalk from "chalk";
import path from "path";
import fs from 'fs';
import { Command } from "../../definitions/commands/Command.js";
import { CommandLoadOptions } from "../../definitions/CommandLoadOptions";
import { ErrorHandler } from "../handlers/ErrorHandler";
import { ServiceContainer } from "../ServiceContainer";
import { ErrorType } from "../../definitions/ErrorType";
import { FileWatcher } from "../utilities/FileWatcher.js";
import 'reflect-metadata';

export class CommandManager {

    protected commands: Map<string, Command>;
    protected framework: ZumitoFramework;
    protected errorHandler: ErrorHandler;
    private importCounters: Map<string, number> = new Map();

    constructor(framework) {
        this.commands = new Map<string, Command>;
        this.errorHandler = ServiceContainer.getService(ErrorHandler);
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
    async loadCommandFile(filePath: string, silent = false): Promise<any> {
        if (!filePath.endsWith('.js') && !filePath.endsWith('.ts')) {
            return;
        }

        const counter = (this.importCounters.get(filePath) || 0) + 1;
        this.importCounters.set(filePath, counter);

        const baseName = path.basename(filePath).split('.').slice(0, -1).join('.');
        let command = await import('file://' + filePath + '?v=' + counter).catch(e => {
            console.error('[🆕🔴 ] Error loading command ' + chalk.blue(baseName));
            console.log(e + '\n' + e.name + '\n' + e.stack);
        });
        if (!command) return;
        command = Object.values(command)[0];
        try {
            command = new command();
            const commandName = command.constructor.name.toLowerCase();
            this.commands.set(commandName, command);
            if (!silent) {
                console.debug('[🆕🟢 ] Command ' + chalk.blue(baseName) + ' loaded');
            }
            return command;
        } catch (error: any) {
            this.errorHandler.handleError(error, {
                type: ErrorType.CommandInstance,
                command: command,
            });
        }
    }

    /**
     * Load all command files from a folder
     * @async
     * @public
     * @param folderPath - Absolute path to commands folder
     * @returns {Promise<Map<string, Command>>}
     */
    async loadCommandsFolder(folderPath: string, options?: CommandLoadOptions): Promise<Map<string, any>> {
        const files = fs.readdirSync(folderPath);
        for (const file of files) {
            if (file.endsWith('.d.ts')) continue;
            if (file.endsWith('.ts') && files.includes(file.replace(/\.ts$/, '.js'))) continue;
            if (file.endsWith('.js') || file.endsWith('.ts')) {
                const command = await this.loadCommandFile(path.join(folderPath, file), true);
                if (command) {
                    const commandName = command.constructor.name.toLowerCase();
                    if (options?.blacklist && options.blacklist.includes(commandName)) continue;
                    if (options?.whitelist && !options.whitelist.includes(commandName)) continue;
                    this.commands.set(
                        options?.renames?.[commandName] || commandName,
                        command
                    );
                }
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
        new FileWatcher().watch(folderPath, {
            onAdd: (filePath: string) => {
                this.loadCommandFile(filePath);
            },
            onChange: (filePath: string) => {
                this.loadCommandFile(filePath);
            },
            onUnlink: (filePath: string) => {
                const fileName = path.basename(filePath).split('.').slice(0, -1).join('.');
                const commandName = fileName.toLowerCase();
                this.commands.delete(commandName);
                this.importCounters.delete(filePath);
                console.debug('[🔄🟡] Command ' + chalk.blue(fileName) + ' removed');
            },
        }, 'command');
    }
}