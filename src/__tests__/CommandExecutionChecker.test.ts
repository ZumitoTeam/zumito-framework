import { describe, it, expect, beforeEach } from 'vitest';
import { CommandExecutionChecker } from '../services/CommandExecutionChecker.js';
import { CommandExecutionContext } from '../definitions/CommandExecutionRule.js';

function makeContext(overrides: Partial<CommandExecutionContext> = {}): CommandExecutionContext {
    return {
        command: { name: 'test', execute: async () => {} } as any,
        type: 'prefix',
        framework: {} as any,
        client: {} as any,
        ...overrides,
    };
}

function makeCommand(rules?: any[]) {
    return { name: 'test', execute: async () => {}, rules } as any;
}

describe('CommandExecutionChecker', () => {
    let checker: CommandExecutionChecker;

    beforeEach(() => {
        checker = new CommandExecutionChecker();
    });

    describe('check (no rules)', () => {
        it('should pass when no global or command rules exist', async () => {
            const result = await checker.check(makeContext());
            expect(result.passed).toBe(true);
        });
    });

    describe('addRule / getRule / removeRule', () => {
        it('should register and retrieve a global rule', () => {
            const rule = { canRun: () => true };
            checker.addRule('test-rule', rule);
            expect(checker.getRule('test-rule')).toBe(rule);
        });

        it('should return undefined for unknown rules', () => {
            expect(checker.getRule('nonexistent')).toBeUndefined();
        });

        it('should remove a rule', () => {
            checker.addRule('test-rule', { canRun: () => true });
            expect(checker.removeRule('test-rule')).toBe(true);
            expect(checker.getRule('test-rule')).toBeUndefined();
        });

        it('should return false when removing nonexistent rule', () => {
            expect(checker.removeRule('nope')).toBe(false);
        });

        it('should return all rules', () => {
            checker.addRule('a', { canRun: () => true });
            checker.addRule('b', { canRun: () => true });
            expect(checker.getAllRules().size).toBe(2);
        });
    });

    describe('global rules', () => {
        it('should pass when all global rules pass', async () => {
            checker.addRule('allow-all', { canRun: () => true });
            checker.addRule('also-allow', { canRun: () => true });
            const result = await checker.check(makeContext());
            expect(result.passed).toBe(true);
        });

        it('should fail on first global rule that returns false', async () => {
            checker.addRule('allow', { canRun: () => true });
            checker.addRule('block', {
                canRun: () => false,
                errorMessage: 'Blocked by global rule',
            });
            checker.addRule('never-reached', { canRun: () => false });

            const result = await checker.check(makeContext());
            expect(result.passed).toBe(false);
            expect(result.ruleName).toBe('global:block');
            expect(result.message).toBe('Blocked by global rule');
        });

        it('should support async canRun', async () => {
            checker.addRule('async-check', {
                canRun: async () => false,
                errorMessage: 'Async blocked',
            });

            const result = await checker.check(makeContext());
            expect(result.passed).toBe(false);
            expect(result.ruleName).toBe('global:async-check');
        });

        it('should support dynamic errorMessage from context', async () => {
            checker.addRule('dynamic-msg', {
                canRun: () => false,
                errorMessage: (ctx) => `Cannot run ${ctx.command.name}`,
            });

            const result = await checker.check(makeContext());
            expect(result.message).toBe('Cannot run test');
        });

        it('should catch rule errors and return them', async () => {
            checker.addRule('broken', {
                canRun: () => { throw new Error('Rule exploded'); },
            });

            const result = await checker.check(makeContext());
            expect(result.passed).toBe(false);
            expect(result.ruleName).toBe('global:broken');
            expect(result.message).toContain('Rule exploded');
        });
    });

    describe('per-command rules', () => {
        it('should pass when command has no rules', async () => {
            const ctx = makeContext({ command: makeCommand() });
            const result = await checker.check(ctx);
            expect(result.passed).toBe(true);
        });

        it('should fail when a command rule blocks', async () => {
            const ctx = makeContext({
                command: makeCommand([
                    { canRun: () => false, errorMessage: 'Premium only' },
                ]),
            });
            const result = await checker.check(ctx);
            expect(result.passed).toBe(false);
            expect(result.ruleName).toBe('command:test:0');
            expect(result.message).toBe('Premium only');
        });

        it('should pass when all command rules pass', async () => {
            const ctx = makeContext({
                command: makeCommand([
                    { canRun: () => true },
                    { canRun: () => true },
                ]),
            });
            const result = await checker.check(ctx);
            expect(result.passed).toBe(true);
        });

        it('should fail on first command rule failure', async () => {
            const ctx = makeContext({
                command: makeCommand([
                    { canRun: () => true },
                    { canRun: () => false, errorMessage: 'Second rule blocked' },
                    { canRun: () => false, errorMessage: 'Never reached' },
                ]),
            });
            const result = await checker.check(ctx);
            expect(result.passed).toBe(false);
            expect(result.ruleName).toBe('command:test:1');
            expect(result.message).toBe('Second rule blocked');
        });

        it('should support dynamic errorMessage in command rules', async () => {
            const ctx = makeContext({
                command: makeCommand([
                    {
                        canRun: () => false,
                        errorMessage: (c) => `${c.command.name} requires premium`,
                    },
                ]),
            });
            const result = await checker.check(ctx);
            expect(result.message).toBe('test requires premium');
        });
    });

    describe('global + per-command combined', () => {
        it('should check global rules first, then command rules', async () => {
            checker.addRule('global-block', { canRun: () => false, errorMessage: 'Global' });
            const ctx = makeContext({
                command: makeCommand([
                    { canRun: () => false, errorMessage: 'Command' },
                ]),
            });
            const result = await checker.check(ctx);
            expect(result.passed).toBe(false);
            expect(result.ruleName).toBe('global:global-block');
            expect(result.message).toBe('Global');
        });

        it('should pass command rules when global rules pass', async () => {
            checker.addRule('global-allow', { canRun: () => true });
            const ctx = makeContext({
                command: makeCommand([
                    { canRun: () => false, errorMessage: 'Command blocks' },
                ]),
            });
            const result = await checker.check(ctx);
            expect(result.passed).toBe(false);
            expect(result.ruleName).toBe('command:test:0');
            expect(result.message).toBe('Command blocks');
        });

        it('should pass when both global and command rules pass', async () => {
            checker.addRule('global-ok', { canRun: () => true });
            const ctx = makeContext({
                command: makeCommand([
                    { canRun: () => true },
                ]),
            });
            const result = await checker.check(ctx);
            expect(result.passed).toBe(true);
        });
    });
});
