import { vi } from 'vitest';
import { EventEmitter } from 'tseep';
import { ServiceContainer } from '../services/ServiceContainer.js';
import { createMockClient } from './mocks/discord.js';

export function createTestFramework(overrides: Record<string, any> = {}) {
    (ServiceContainer as any).services.clear();

    const mockClient = createMockClient(overrides.client);
    const eventEmitter = new EventEmitter();

    const mockDb = {
        getDriver: vi.fn().mockReturnValue({
            find: vi.fn().mockResolvedValue([]),
            findOne: vi.fn().mockResolvedValue(null),
            insert: vi.fn().mockResolvedValue({}),
            update: vi.fn().mockResolvedValue(0),
            delete: vi.fn().mockResolvedValue(0),
            count: vi.fn().mockResolvedValue(0),
            ensureSchema: vi.fn().mockResolvedValue(undefined),
            dropCollection: vi.fn().mockResolvedValue(undefined),
            raw: {},
            disconnect: vi.fn().mockResolvedValue(undefined),
        }),
        getRepository: vi.fn().mockReturnValue({
            find: vi.fn().mockResolvedValue([]),
            findOne: vi.fn().mockResolvedValue(null),
            insert: vi.fn().mockResolvedValue({}),
            update: vi.fn().mockResolvedValue(0),
            delete: vi.fn().mockResolvedValue(0),
            count: vi.fn().mockResolvedValue(0),
            query: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnThis(),
                andWhere: vi.fn().mockReturnThis(),
                orWhere: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                sort: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                offset: vi.fn().mockReturnThis(),
                exec: vi.fn().mockResolvedValue([]),
                first: vi.fn().mockResolvedValue(null),
                count: vi.fn().mockResolvedValue(0),
            }),
            collection: 'test',
        }),
        registerModel: vi.fn(),
        ensureSchemas: vi.fn().mockResolvedValue(undefined),
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        migrator: {
            latest: vi.fn().mockResolvedValue([]),
            rollback: vi.fn().mockResolvedValue([]),
            status: vi.fn().mockResolvedValue([]),
        },
        ...overrides.db,
    };

    const mockFramework = {
        client: mockClient,
        commands: {
            size: 0,
            set: vi.fn(),
            get: vi.fn(),
            getAll: vi.fn().mockReturnValue(new Map()),
        },
        events: new Map(),
        translations: {
            get: vi.fn(),
            getAll: vi.fn().mockReturnValue(new Map()),
            registerTranslationsFromFolder: vi.fn(),
        },
        settings: {
            defaultPrefix: '!',
            ...overrides.settings,
        },
        eventEmitter,
        eventManager: {
            addEventEmitter: vi.fn(),
            addEventListener: vi.fn(),
            getEventEmitter: vi.fn(),
            eventEmitters: new Map(),
        },
        routes: [] as any[],
        registerRoute: vi.fn(),
        modules: {
            set: vi.fn(),
            get: vi.fn(),
            getAll: vi.fn().mockReturnValue(new Map()),
            size: 0,
        },
        db: mockDb,
        ...overrides.framework,
    };

    ServiceContainer.addService(
        class ZumitoFramework {},
        [],
        true,
        mockFramework,
    );

    ServiceContainer.addService(
        class DatabaseManager {},
        [],
        true,
        mockDb,
    );

    class MockErrorHandler {
        handleError = vi.fn();
    }

    ServiceContainer.addService(
        class ErrorHandler {},
        [],
        true,
        new MockErrorHandler(),
    );

    return {
        framework: mockFramework,
        client: mockClient,
        eventEmitter,
        db: mockDb,
    };
}
