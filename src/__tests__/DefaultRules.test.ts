import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandExecutionChecker } from '../services/CommandExecutionChecker.js';
import { ServiceContainer } from '../services/ServiceContainer.js';
import { registerDefaultExecutionRules } from '../modules/core/baseModule/defaultRules.js';
import { CommandExecutionContext } from '../definitions/CommandExecutionRule.js';

function makeCtx(overrides: Partial<CommandExecutionContext> = {}): CommandExecutionContext {
    return {
        command: {
            name: 'test',
            adminOnly: false,
            userPermissions: [],
            nsfw: false,
            dm: true,
            execute: async () => {},
        } as any,
        type: 'prefix',
        framework: {} as any,
        client: {} as any,
        guild: { id: 'guild-1', ownerId: 'owner-1' } as any,
        member: {
            id: 'member-1',
            user: { bot: false },
            permissions: { has: vi.fn() },
            guild: { id: 'guild-1', ownerId: 'owner-1' },
        } as any,
        ...overrides,
    };
}

function mockPermission(hasAdmin: boolean, hasCustom: boolean = true) {
    ServiceContainer.addService(
        class MemberPermissionChecker {},
        [],
        true,
        {
            hasPermissionOnChannel: vi
                .fn()
                .mockImplementation((_member: any, _channel: any, perm: bigint) => {
                    if (perm === 8n) return hasAdmin;
                    return hasCustom;
                }),
        },
    );
}

function getChecker(): CommandExecutionChecker {
    return ServiceContainer.getService(CommandExecutionChecker);
}

describe('Default execution rules', () => {
    beforeEach(() => {
        (ServiceContainer as any).services.clear();
        const checker = new CommandExecutionChecker();
        ServiceContainer.addService(CommandExecutionChecker, [], true, checker);
        registerDefaultExecutionRules();
    });

    describe('no-bots', () => {
        it('should allow human members', async () => {
            const result = await getChecker().check(makeCtx());
            expect(result.passed).toBe(true);
        });

        it('should block bot members', async () => {
            const result = await getChecker().check(makeCtx({
                member: { id: 'bot-1', user: { bot: true } } as any,
            }));
            expect(result.passed).toBe(false);
            expect(result.ruleName).toBe('global:no-bots');
        });
    });

    describe('dm-disabled', () => {
        it('should allow when dm is enabled on command', async () => {
            const result = await getChecker().check(makeCtx({
                guild: undefined as any,
                member: undefined as any,
                command: { ...makeCtx().command, dm: true },
            }));
            expect(result.passed).toBe(true);
        });

        it('should block when dm is disabled and no guild', async () => {
            const result = await getChecker().check(makeCtx({
                guild: undefined as any,
                member: undefined as any,
                command: { ...makeCtx().command, dm: false },
            }));
            expect(result.passed).toBe(false);
            expect(result.ruleName).toBe('global:dm-disabled');
        });

        it('should allow dm-disabled command when guild is present', async () => {
            const result = await getChecker().check(makeCtx({
                command: { ...makeCtx().command, dm: false },
            }));
            expect(result.passed).toBe(true);
        });
    });

    describe('admin-only', () => {
        it('should allow when command is not adminOnly', async () => {
            mockPermission(false);
            const result = await getChecker().check(makeCtx({
                command: { ...makeCtx().command, adminOnly: false },
            }));
            expect(result.passed).toBe(true);
        });

        it('should block non-admin for adminOnly command', async () => {
            mockPermission(false);
            const result = await getChecker().check(makeCtx({
                command: { ...makeCtx().command, adminOnly: true },
            }));
            expect(result.passed).toBe(false);
            expect(result.ruleName).toBe('global:admin-only');
        });

        it('should allow admin for adminOnly command', async () => {
            mockPermission(true);
            const result = await getChecker().check(makeCtx({
                command: { ...makeCtx().command, adminOnly: true },
            }));
            expect(result.passed).toBe(true);
        });

        it('should allow guild owner for adminOnly command', async () => {
            mockPermission(false);
            const result = await getChecker().check(makeCtx({
                command: { ...makeCtx().command, adminOnly: true },
                member: { id: 'owner-1', user: { bot: false } } as any,
            }));
            expect(result.passed).toBe(true);
        });

        it('should skip admin-only check for button interactions', async () => {
            mockPermission(false);
            const result = await getChecker().check(makeCtx({
                command: { ...makeCtx().command, adminOnly: true },
                type: 'button',
            }));
            expect(result.passed).toBe(true);
        });
    });

    describe('user-permissions', () => {
        it('should allow when no userPermissions defined', async () => {
            mockPermission(false);
            const result = await getChecker().check(makeCtx({
                command: { ...makeCtx().command, userPermissions: [] },
            }));
            expect(result.passed).toBe(true);
        });

        it('should block when member lacks required permission', async () => {
            mockPermission(false, false);
            const result = await getChecker().check(makeCtx({
                command: { ...makeCtx().command, userPermissions: [16n] },
            }));
            expect(result.passed).toBe(false);
            expect(result.ruleName).toBe('global:user-permissions');
        });

        it('should allow when member has required permission', async () => {
            mockPermission(false, true);
            const result = await getChecker().check(makeCtx({
                command: { ...makeCtx().command, userPermissions: [16n] },
            }));
            expect(result.passed).toBe(true);
        });

        it('should skip user-permissions for admin members', async () => {
            mockPermission(true, false);
            const result = await getChecker().check(makeCtx({
                command: { ...makeCtx().command, userPermissions: [16n] },
            }));
            expect(result.passed).toBe(true);
        });

        it('should skip user-permissions for guild owner', async () => {
            mockPermission(false, false);
            const result = await getChecker().check(makeCtx({
                command: { ...makeCtx().command, userPermissions: [16n] },
                member: { id: 'owner-1', user: { bot: false } } as any,
            }));
            expect(result.passed).toBe(true);
        });
    });

    describe('nsfw-only', () => {
        it('should allow when command is not nsfw', async () => {
            mockPermission(false);
            const result = await getChecker().check(makeCtx({
                command: { ...makeCtx().command, nsfw: false },
            }));
            expect(result.passed).toBe(true);
        });

        it('should allow nsfw command in nsfw channel', async () => {
            mockPermission(false);
            const result = await getChecker().check(makeCtx({
                command: { ...makeCtx().command, nsfw: true },
                message: { channel: { nsfw: true } } as any,
            }));
            expect(result.passed).toBe(true);
        });

        it('should block nsfw command in non-nsfw channel for regular user', async () => {
            mockPermission(false);
            const result = await getChecker().check(makeCtx({
                command: { ...makeCtx().command, nsfw: true },
                message: { channel: { nsfw: false } } as any,
            }));
            expect(result.passed).toBe(false);
            expect(result.ruleName).toBe('global:nsfw-only');
        });

        it('should allow nsfw command anywhere for admin', async () => {
            mockPermission(true);
            const result = await getChecker().check(makeCtx({
                command: { ...makeCtx().command, nsfw: true },
                message: { channel: { nsfw: false } } as any,
            }));
            expect(result.passed).toBe(true);
        });

        it('should skip nsfw check for button interactions', async () => {
            mockPermission(false);
            const result = await getChecker().check(makeCtx({
                command: { ...makeCtx().command, nsfw: true },
                type: 'selectMenu',
            }));
            expect(result.passed).toBe(true);
        });
    });

    describe('combined rules', () => {
        it('should block on first failing rule (no-bots before admin-only)', async () => {
            mockPermission(false);
            const result = await getChecker().check(makeCtx({
                command: { ...makeCtx().command, adminOnly: true },
                member: { id: 'bot-1', user: { bot: true } } as any,
            }));
            expect(result.passed).toBe(false);
            expect(result.ruleName).toBe('global:no-bots');
        });

        it('should run global rules before per-command rules', async () => {
            mockPermission(false);
            const result = await getChecker().check(makeCtx({
                command: {
                    name: 'premium-cmd',
                    adminOnly: false,
                    userPermissions: [],
                    nsfw: false,
                    dm: true,
                    execute: async () => {},
                    rules: [{ canRun: () => true, errorMessage: 'Premium only' }],
                } as any,
                member: { id: 'bot-1', user: { bot: true } } as any,
            }));
            expect(result.passed).toBe(false);
            expect(result.ruleName).toBe('global:no-bots');
        });

        it('should run per-command rules after global rules pass', async () => {
            mockPermission(false);
            const result = await getChecker().check(makeCtx({
                command: {
                    name: 'premium-cmd',
                    adminOnly: false,
                    userPermissions: [],
                    nsfw: false,
                    dm: true,
                    execute: async () => {},
                    rules: [{ canRun: () => false, errorMessage: 'Premium only' }],
                } as any,
            }));
            expect(result.passed).toBe(false);
            expect(result.ruleName).toBe('command:premium-cmd:0');
            expect(result.message).toBe('Premium only');
        });

        it('should pass when all global and command rules pass', async () => {
            mockPermission(false);
            const result = await getChecker().check(makeCtx({
                command: {
                    name: 'my-cmd',
                    adminOnly: false,
                    userPermissions: [],
                    nsfw: false,
                    dm: true,
                    execute: async () => {},
                    rules: [{ canRun: () => true }],
                } as any,
            }));
            expect(result.passed).toBe(true);
        });
    });
});
