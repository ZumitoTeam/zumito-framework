import {
    CommandExecutionContext,
    CommandExecutionRule,
    CommandExecutionCheck,
} from "../definitions/CommandExecutionRule.js";

export class CommandExecutionChecker {

    private rules: Map<string, CommandExecutionRule> = new Map();

    addRule(name: string, rule: CommandExecutionRule): void {
        this.rules.set(name, rule);
    }

    getRule(name: string): CommandExecutionRule | undefined {
        return this.rules.get(name);
    }

    removeRule(name: string): boolean {
        return this.rules.delete(name);
    }

    getAllRules(): Map<string, CommandExecutionRule> {
        return this.rules;
    }

    async check(context: CommandExecutionContext): Promise<CommandExecutionCheck> {
        const globalCheck = await this.evaluateRules('global', this.rules, context);
        if (!globalCheck.passed) return globalCheck;

        const commandRules = context.command.rules;
        if (commandRules && commandRules.length > 0) {
            const commandRulesMap = new Map(
                commandRules.map((rule, i) => [`${context.command.name}:${i}`, rule])
            );
            const commandCheck = await this.evaluateRules('command', commandRulesMap, context);
            if (!commandCheck.passed) return commandCheck;
        }

        return { passed: true };
    }

    private async evaluateRules(
        scope: string,
        rules: Map<string, CommandExecutionRule>,
        context: CommandExecutionContext,
    ): Promise<CommandExecutionCheck> {
        for (const [name, rule] of rules) {
            try {
                const allowed = await rule.canRun(context);
                if (!allowed) {
                    const message = typeof rule.errorMessage === 'function'
                        ? (rule.errorMessage as (ctx: CommandExecutionContext) => string)(context)
                        : rule.errorMessage;
                    return {
                        passed: false,
                        ruleName: `${scope}:${name}`,
                        message,
                    };
                }
            } catch (err) {
                return {
                    passed: false,
                    ruleName: `${scope}:${name}`,
                    message: `Rule "${name}" threw an error: ${err instanceof Error ? err.message : String(err)}`,
                };
            }
        }
        return { passed: true };
    }
}
