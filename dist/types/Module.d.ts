import { ZumitoFramework } from "../ZumitoFramework.js";
import { Command } from "./Command.js";
import { FrameworkEvent } from "./FrameworkEvent.js";
export declare abstract class Module {
    protected path: string;
    protected framework: ZumitoFramework;
    protected commands: Map<string, Command>;
    protected events: Map<string, FrameworkEvent>;
    protected models: Map<string, any>;
    constructor(path: any, framework: any);
    initialize(): Promise<void>;
    registerCommands(): Promise<void>;
    onCommandCreated(filePath: string): Promise<void>;
    onCommandChanged(filePath: string): Promise<void>;
    onErrorLoadingCommand(error: Error): void;
    getCommands(): Map<string, Command>;
    registerEvents(): Promise<void>;
    registerDiscordEvent(frameworkEvent: FrameworkEvent): void;
    parseEventArgs(args: any[]): any;
    getEvents(): Map<string, FrameworkEvent>;
    registerTranslations(subpath?: string): Promise<void>;
    loadTranslationFile(subpath: string, file: string): Promise<any>;
    parseTranslation(path: string, lang: string, json: any): any;
    registerModels(): Promise<void>;
    getModels(): Map<string, any>;
}
