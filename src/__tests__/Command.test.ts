import { describe, it, expect } from 'vitest';
import { Command } from '../definitions/commands/Command.js';
import { CommandType } from '../definitions/commands/CommandType.js';

class TestCommand extends Command {
    async execute(): Promise<void> {}
}

describe('Command', () => {
    it('should set name from class name by default', () => {
        const cmd = new TestCommand();
        expect(cmd.name).toBe('testcommand');
    });

    it('should allow overriding name', () => {
        const cmd = new TestCommand();
        cmd.name = 'my-command';
        expect(cmd.name).toBe('my-command');
    });

    it('should default categories to empty array', () => {
        const cmd = new TestCommand();
        expect(cmd.categories).toEqual([]);
    });

    it('should default aliases to empty array', () => {
        const cmd = new TestCommand();
        expect(cmd.aliases).toEqual([]);
    });

    it('should default hidden to false', () => {
        const cmd = new TestCommand();
        expect(cmd.hidden).toBe(false);
    });

    it('should default adminOnly to false', () => {
        const cmd = new TestCommand();
        expect(cmd.adminOnly).toBe(false);
    });

    it('should default nsfw to false', () => {
        const cmd = new TestCommand();
        expect(cmd.nsfw).toBe(false);
    });

    it('should default dm to false', () => {
        const cmd = new TestCommand();
        expect(cmd.dm).toBe(false);
    });

    it('should default cooldown to 0', () => {
        const cmd = new TestCommand();
        expect(cmd.cooldown).toBe(0);
    });

    it('should default type to CommandType.any', () => {
        const cmd = new TestCommand();
        expect(cmd.type).toBe(CommandType.any);
    });

    it('should default args to empty array', () => {
        const cmd = new TestCommand();
        expect(cmd.args).toEqual([]);
    });

    it('should default userPermissions to empty array', () => {
        const cmd = new TestCommand();
        expect(cmd.userPermissions).toEqual([]);
    });

    it('should default botPermissions to empty array', () => {
        const cmd = new TestCommand();
        expect(cmd.botPermissions).toEqual([]);
    });

    describe('isSubCommand', () => {
        it('should return false when parent is undefined', () => {
            const cmd = new TestCommand();
            expect(cmd.isSubCommand()).toBe(false);
        });

        it('should return true when parent is set', () => {
            const cmd = new TestCommand();
            cmd.parent = 'mainCmd';
            expect(cmd.isSubCommand()).toBe(true);
        });
    });
});
