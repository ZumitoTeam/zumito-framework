import ErrorStackParser from "error-stack-parser";
import { ErrorType } from "../../definitions/ErrorType";
import { Command } from "../../definitions/commands/Command";
import chalk from "chalk";
import { ZumitoFramework } from "../../ZumitoFramework";
import sf from 'source-fragment';

type BaseErrorOptions = {
    exit?: boolean,
    type: ErrorType,
}

type CommandErrorOptions = BaseErrorOptions & {
    type: ErrorType.CommandInstance | ErrorType.CommandLoad | ErrorType.CommandRun,
    command: Command,
}

type ApiErrorOptions = BaseErrorOptions & {
    type: ErrorType.Api,
    endpoint: string,
    method: string,
}

type OtherErrorOptions = BaseErrorOptions & {
    type: ErrorType.Other,
}

type ModuleLoadErrorOptions = BaseErrorOptions & {
    type: ErrorType.ModuleLoad,
    moduleName: string,
}

type RouteLoadErrorOptions = BaseErrorOptions & {
    type: ErrorType.RouteLoad,
    path?: string,
    method?: string,
    moduleName?: string,
}

type ErrorOptions = CommandErrorOptions | ApiErrorOptions | OtherErrorOptions | ModuleLoadErrorOptions | RouteLoadErrorOptions;

export class ErrorHandler {

    framework: ZumitoFramework;

    constructor(framework: ZumitoFramework) {
        this.framework = framework;
    }

    handleError(error: any, options: ErrorOptions) {
        if (options?.type == ErrorType.CommandInstance || options?.type == ErrorType.CommandLoad || options?.type == ErrorType.CommandRun) {
            this.handleCommandError(error, options as CommandErrorOptions);
        } else if (error?.constructor?.name == 'CombinedError') {
            this.handleShapeShiftErrors(error);
        } else if (error?.constructor?.name == "ExpectedValidationError") {
            console.error(`Validation error: Expected ${error.expected}, but received ${error.given}.`);
            console.line('');
        } else if (error?.constructor?.name == "ValidationError") {
            console.error(`Validation error: ${error.validator} received invalid input: ${error.given}`);
            console.line('');
        } else if (options?.type == ErrorType.Api) {
            console.group(`[❌] Error in API endpoint ${options.endpoint} (${options.method})`);
            console.line(chalk.red('Error:'));
            console.line(error?.toString?.() || 'Unknown error');
            console.line('');
            console.groupEnd();
        } else if (options?.type == ErrorType.ModuleLoad) {
            console.group(`[❌] Error loading module ${options.moduleName}`);
            console.line(chalk.red('Error:'));
            console.line(error?.toString?.() || 'Unknown error');
            console.line('');
            console.groupEnd();
        } else if (options?.type == ErrorType.RouteLoad) {
            console.group(`[❌] Error loading route ${options.path}`);
            
            console.line(chalk.red('Error:'));
            console.line(error?.toString?.() || 'Unknown error');
            console.line('');

            console.groupEnd();

            if (options?.moduleName) {
                console.line(chalk.blue('Module: ') + options.moduleName);
            }
            if (options?.method) {
                console.line(chalk.blue('Method: ') + options.method);
            }
            if (options?.path) {
                console.line(chalk.blue('Path: ') + options.path);
            }
        } else {
            console.error(error?.toString?.() || 'Unknown error');
            console.line('');
        }

        // Emit framework error event so external modules can listen and report
        this.framework.eventEmitter.emit('error', error, options);

        this.printErrorStack(error);

        if (options.exit) process.exit(1);
    }

    handleCommandError(error: Error, options: CommandErrorOptions) {
        switch (options.type) {
            case ErrorType.CommandInstance:
                console.group(`[❌] Error instanciating command ${options?.command?.name}`)
                break;
            case ErrorType.CommandLoad:
                console.group(`[❌] Error loading command ${options.command.name}`)
                break;
            case ErrorType.CommandRun:
                console.group(`[❌] Error running command ${options.command.name}`)
                break;
        }
        if (error?.constructor?.name == 'CombinedError') {
            console.groupEnd();
            this.handleShapeShiftErrors(error);
        } else {
            console.line(chalk.red('Error:'));
            console.line(error?.toString?.() || 'Unknown error');
            console.line('');
            console.groupEnd();
        }
    }

    handleShapeShiftErrors(error: any) {
        if (error?.constructor?.name == 'CombinedError') {
            error.errors.forEach(err => {
                this.handleError(err, {
                    type: ErrorType.Other
                });
            });

        }
    }

    printErrorStack(error: any) {
        if (!error || !(error.stack || error.stacktrace)) return;

        let stackParsedError;
        try {
            stackParsedError = ErrorStackParser.parse(error);
        } catch {
            return;
        }
        let functionColor = 'blue';
        const lines: any[] = [];
        let codeFragment: any;
        let lastStack;
        for (const stack of stackParsedError) {
            if (!stack || !stack.getFileName() || !stack.getFunctionName || !stack.getFileName() || !stack.getFunctionName()) continue;
            const filePath = stack.getFileName().replace(process.cwd(), '.').replace('file://', '');
            const functionName = stack.getFunctionName();
            if (functionName == 'CommandManager.loadCommandFile') {
                functionColor = 'yellow';
            }
            lines.push(`    at ${chalk.gray(filePath)}:${stack.getLineNumber()}:${stack.getColumnNumber()} ${chalk[functionColor](functionName)}`)
            if (functionName == 'CommandManager.loadCommandFile' && !this.framework.settings.debug) break;
            
            if (!codeFragment && functionName?.includes('.execute')) {
                let columnEnd = -1;
                if (lastStack) {
                    const lastFunctionName = lastStack.getFunctionName();
                    if (lastFunctionName.includes('.')) {
                        columnEnd = lastFunctionName.split('.').at(-1).length;
                    } else {
                        columnEnd = lastFunctionName.length;
                    }
                }
                codeFragment = {
                    path: `${filePath}:${stack.getLineNumber()}:${stack.getColumnNumber()}`,
                    code: sf(`${filePath}:${stack.getLineNumber()}:${stack.getColumnNumber()}:${stack.getLineNumber()}:${stack.getColumnNumber() + columnEnd}`, { 
                        format: 'tty',
                        linesBefore: 2,
                        linesAfter: 2,
                    })
                };
            }
            lastStack = stack;
        }

        // Log code fragment
        if (codeFragment) {
            console.line(chalk.blue('File: ') + `${codeFragment.path}`);
            console.line(codeFragment.code);
            console.line('');
        }
        
        // Log stack
        console.line(chalk.blue('StackTrace:'));
        lines.forEach(line => console.line(line));
    }
}