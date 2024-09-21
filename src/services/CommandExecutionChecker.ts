import { Command } from "../definitions/commands/Command"

type CommandExecutionContext = {
    command: Command,
}

type CommandExecutionRule = {
    canRun: (context: CommandExecutionContext) => boolean,
    errorMessage?: string,
}

type CommandExecutionCheck = {
    canRun: boolean,
    message?: string,
}


export class CommandExecutionChecker {

    private rules: {[key: string]: CommandExecutionRule} = {
        
    };

    public addRule(rule: CommandExecutionRule, name: string) {
        this.rules[name] = rule;
    }

    public getRule(name: string) {
        return this.rules[name];
    }

    public removeRule(name: string) {
        delete this.rules[name];
    }

    public canExecuteCommand(context: CommandExecutionContext): CommandExecutionCheck {
        const rules = Object.values(this.rules);
        const unpassedRule = rules.find(rule => rule.canRun(context));
        if (unpassedRule) return {
            canRun: false,
            message: unpassedRule.errorMessage,
        }
        return {
            canRun: true,
        }
    }

} 