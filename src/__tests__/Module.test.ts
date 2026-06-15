import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Module } from '../definitions/Module.js';
import { createTestFramework } from '../testing/createTestFramework.js';

vi.mock('fs', () => ({
    existsSync: vi.fn().mockReturnValue(false),
    readdirSync: vi.fn().mockReturnValue([]),
    lstatSync: vi.fn().mockReturnValue({ isDirectory: vi.fn().mockReturnValue(false) }),
}));

vi.mock('path', async () => {
    const actual = await vi.importActual<typeof import('path')>('path');
    return {
        ...actual,
        join: vi.fn((...args: string[]) => args.join('/')),
    };
});

let onReadyCalled = false;
let initCalled = false;

class TestModule extends Module {
    async initialize() {
        initCalled = true;
        await super.initialize();
    }

    async onAllReady() {
        onReadyCalled = true;
    }
}

beforeEach(() => {
    onReadyCalled = false;
    initCalled = false;
});

describe('Module lifecycle', () => {
    describe('initialize', () => {
        it('should call initialize when module is created', async () => {
            createTestFramework();
            const mod = new TestModule('/test/path');
            await mod.initialize();
            expect(initCalled).toBe(true);
        });
    });

    describe('onAllReady', () => {
        it('should be defined as a no-op by default', () => {
            createTestFramework();
            const mod = new TestModule('/test/path');
            expect(mod.onAllReady).toBeDefined();
            expect(mod.onAllReady()).resolves.toBeUndefined();
        });

        it('should be callable and tracked', async () => {
            createTestFramework();
            const mod = new TestModule('/test/path');
            await mod.onAllReady();
            expect(onReadyCalled).toBe(true);
        });

        it('should be called after initialize', async () => {
            createTestFramework();
            const mod = new TestModule('/test/path');

            initCalled = false;
            onReadyCalled = false;

            await mod.initialize();
            expect(initCalled).toBe(true);
            expect(onReadyCalled).toBe(false);

            await mod.onAllReady();
            expect(onReadyCalled).toBe(true);
        });
    });

    describe('constructor', () => {
        it('should store path and framework reference', () => {
            const { framework } = createTestFramework();
            const mod = new TestModule('/my/module/path');

            expect((mod as any).path).toBe('/my/module/path');
            expect((mod as any).framework).toBe(framework);
        });
    });
});
