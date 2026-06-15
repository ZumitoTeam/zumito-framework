import { vi } from 'vitest';

export function createMockClient(overrides: Record<string, any> = {}) {
    const listeners: Record<string, Array<(...args: any[]) => void>> = {};

    return {
        on: vi.fn((event: string, cb: (...args: any[]) => void) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(cb);
        }),
        once: vi.fn((event: string, cb: (...args: any[]) => void) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(cb);
        }),
        emit: vi.fn((event: string, ...args: any[]) => {
            if (listeners[event]) {
                listeners[event].forEach((cb) => cb(...args));
            }
        }),
        login: vi.fn().mockResolvedValue('token'),
        destroy: vi.fn(),
        guilds: {
            cache: new Map(),
            fetch: vi.fn(),
        },
        channels: {
            cache: new Map(),
            fetch: vi.fn(),
        },
        user: { id: '123456789', tag: 'TestBot#0000', username: 'TestBot' },
        users: {
            fetch: vi.fn(),
        },
        options: {},
        ...overrides,
        _listeners: listeners,
    };
}

export function createMockGuild(overrides: Record<string, any> = {}) {
    return {
        id: 'guild-123',
        name: 'Test Guild',
        ownerId: 'owner-123',
        channels: {
            cache: new Map(),
            fetch: vi.fn(),
        },
        members: {
            cache: new Map(),
            fetch: vi.fn(),
        },
        roles: {
            cache: new Map(),
        },
        ...overrides,
    };
}

export function createMockTextChannel(overrides: Record<string, any> = {}) {
    return {
        id: 'channel-123',
        type: 0,
        name: 'general',
        guild: createMockGuild(),
        isTextBased: vi.fn().mockReturnValue(true),
        isDMBased: vi.fn().mockReturnValue(false),
        nsfw: false,
        send: vi.fn().mockResolvedValue({}),
        permissionsFor: vi.fn().mockReturnValue({
            has: vi.fn().mockReturnValue(true),
        }),
        ...overrides,
    };
}

export function createMockGuildMember(overrides: Record<string, any> = {}) {
    return {
        id: 'member-123',
        user: { id: 'user-123', username: 'TestUser' },
        guild: createMockGuild(),
        permissions: {
            has: vi.fn().mockReturnValue(true),
        },
        roles: {
            cache: new Map(),
        },
        ...overrides,
    };
}

export function createMockMessage(overrides: Record<string, any> = {}) {
    return {
        id: 'message-123',
        content: '!ping',
        author: createMockGuildMember(),
        channel: createMockTextChannel(),
        guild: createMockGuild(),
        guildId: 'guild-123',
        member: createMockGuildMember(),
        reply: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        react: vi.fn().mockResolvedValue({}),
        editable: true,
        deletable: true,
        ...overrides,
    };
}

export function createMockCommandInteraction(overrides: Record<string, any> = {}) {
    return {
        id: 'interaction-123',
        commandName: 'test',
        guild: createMockGuild(),
        guildId: 'guild-123',
        channel: createMockTextChannel(),
        member: createMockGuildMember(),
        user: { id: 'user-123', username: 'TestUser' },
        reply: vi.fn().mockResolvedValue({}),
        deferReply: vi.fn().mockResolvedValue({}),
        editReply: vi.fn().mockResolvedValue({}),
        followUp: vi.fn().mockResolvedValue({}),
        options: {
            get: vi.fn(),
            getString: vi.fn(),
            getInteger: vi.fn(),
            getBoolean: vi.fn(),
            getUser: vi.fn(),
            getChannel: vi.fn(),
            getRole: vi.fn(),
            getSubcommand: vi.fn(),
        },
        ...overrides,
    };
}

export function createMockButtonInteraction(overrides: Record<string, any> = {}) {
    return {
        id: 'button-123',
        customId: 'test-button',
        guild: createMockGuild(),
        guildId: 'guild-123',
        channel: createMockTextChannel(),
        member: createMockGuildMember(),
        user: { id: 'user-123', username: 'TestUser' },
        reply: vi.fn().mockResolvedValue({}),
        deferReply: vi.fn().mockResolvedValue({}),
        deferUpdate: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        ...overrides,
    };
}

export function createMockStringSelectMenuInteraction(overrides: Record<string, any> = {}) {
    return {
        id: 'select-123',
        customId: 'test-select',
        values: ['option-1'],
        guild: createMockGuild(),
        guildId: 'guild-123',
        channel: createMockTextChannel(),
        member: createMockGuildMember(),
        user: { id: 'user-123', username: 'TestUser' },
        reply: vi.fn().mockResolvedValue({}),
        deferReply: vi.fn().mockResolvedValue({}),
        deferUpdate: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        ...overrides,
    };
}

export function createMockModalSubmitInteraction(overrides: Record<string, any> = {}) {
    return {
        id: 'modal-123',
        customId: 'test-modal',
        fields: {
            getTextInputValue: vi.fn().mockReturnValue(''),
            getField: vi.fn(),
            fields: [],
        },
        guild: createMockGuild(),
        guildId: 'guild-123',
        channel: createMockTextChannel(),
        member: createMockGuildMember(),
        user: { id: 'user-123', username: 'TestUser' },
        reply: vi.fn().mockResolvedValue({}),
        deferReply: vi.fn().mockResolvedValue({}),
        deferUpdate: vi.fn().mockResolvedValue({}),
        ...overrides,
    };
}
