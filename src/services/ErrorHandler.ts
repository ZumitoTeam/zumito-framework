import ErrorStackParser from "error-stack-parser";
import { ErrorType } from "../definitions/ErrorType";
import { Command } from "../definitions/commands/Command";
import chalk from "chalk";
import { ZumitoFramework } from "../ZumitoFramework";

type BaseErrorOptions = {
    exit?: boolean,
    type: ErrorType,
}

type CommandErrorOptions = BaseErrorOptions & {
    type: ErrorType.CommandInstance | ErrorType.CommandLoad | ErrorType.CommandRun,
    command: Command,
}

export class ErrorHandler {

    framework: ZumitoFramework;

    constructor(framework: ZumitoFramework) {
        this.framework = framework;
    }

    handleError(error: Error, options: BaseErrorOptions | CommandErrorOptions) {
        if (options?.type == ErrorType.CommandInstance || options?.type == ErrorType.CommandLoad || options?.type == ErrorType.CommandRun) {
            this.handleCommandError(error, options as CommandErrorOptions);
        } else {
            console.error(error.toString());
        }
        this.printErrorStack(error);
        if (options.exit) process.exit(1);
    }

    handleCommandError(error: Error, options: CommandErrorOptions) {
        switch (options.type) {
            case ErrorType.CommandInstance:
                console.group(`[❌] Error instanciating command ${options.command.name}`)
                break;
            case ErrorType.CommandLoad:
                console.group(`[❌] Error loading command ${options.command.name}`)
                break;
            case ErrorType.CommandRun:
                console.group(`[❌] Error running command ${options.command.name}`)
                break;
        }
        console.line(error.toString());
        console.groupEnd();
    }

    printErrorStack(error: Error) {
        const stackParsedError = ErrorStackParser.parse(error);
        let functionColor = 'blue';
        for (let stack of stackParsedError) {
            const filePath = stack.getFileName();
            let functionName = stack.getFunctionName();
            if (functionName == 'CommandManager.loadCommandFile') {
                functionColor = 'yellow';
            }
            console.line(`    at ${chalk.gray(filePath)}:${stack.getLineNumber()}:${stack.getColumnNumber()} ${chalk[functionColor](functionName)}`)
            if (functionName == 'CommandManager.loadCommandFile' && !this.framework.settings.debug) break;
            
        }
    }
}