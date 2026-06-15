import { vi } from 'vitest';
import { EventEmitter } from 'tseep';
import { ServiceContainer } from '../services/ServiceContainer.js';
import { createMockClient } from './mocks/discord.js';

export function createTestFramework(overrides: Record<string, any> = {}) {
    (ServiceContainer as any).services.clear();

    const mockClient = createMockClient(overrides.client);
    const eventEmitter = new EventEmitter();

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
        ...overrides.framework,
    };

    ServiceContainer.addService(
        class ZumitoFramework {},
        [],
        true,
        mockFramework,
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
    };
}
