import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModuleManager } from '../services/managers/ModuleManager.js';
import { Module } from '../definitions/Module.js';
import { ServiceContainer } from '../services/ServiceContainer.js';
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

class TestSimpleModule extends Module {
    async initialize() {}
}

class TestModuleWithRequeriments extends Module {
    static requeriments = {
        modules: ['OtherModule'],
        services: ['SomeService'],
        custom: [],
    };

    async initialize() {}
}

let customRequirementResult = true;

class TestModuleWithCustomRequeriments extends Module {
    static requeriments = {
        modules: [] as string[],
        services: [] as string[],
        custom: [async () => customRequirementResult],
    };

    async initialize() {}
}

class TestModuleWithFailingCustom extends Module {
    static requeriments = {
        modules: [] as string[],
        services: [] as string[],
        custom: [async () => false],
    };

    async initialize() {}
}

let moduleManager: ModuleManager;

beforeEach(() => {
    (ServiceContainer as any).services.clear();
    const { framework } = createTestFramework();
    moduleManager = new ModuleManager(framework as any);
});

describe('ModuleManager', () => {
    describe('set / get / getAll', () => {
        it('should store and retrieve modules by name', async () => {
            const mod = new TestSimpleModule('/test');
            moduleManager.set('TestModule', mod);
            expect(moduleManager.get('TestModule')).toBe(mod);
        });

        it('should return undefined for unknown modules', () => {
            expect(moduleManager.get('NonExistent')).toBeUndefined();
        });

        it('should return all modules as a Map', () => {
            const mod1 = new TestSimpleModule('/mod1');
            const mod2 = new TestSimpleModule('/mod2');
            moduleManager.set('Mod1', mod1);
            moduleManager.set('Mod2', mod2);

            const all = moduleManager.getAll();
            expect(all.size).toBe(2);
            expect(all.get('Mod1')).toBe(mod1);
            expect(all.get('Mod2')).toBe(mod2);
        });
    });

    describe('checkModuleRequeriments', () => {
        it('should pass when no requeriments defined', async () => {
            const result = await moduleManager.checkModuleRequeriments(
                TestSimpleModule as typeof Module,
            );
            expect(result.modules).toEqual([]);
            expect(result.services).toEqual([]);
            expect(result.custom).toBe(true);
        });

        it('should fail unmet module requeriments', async () => {
            const result = await moduleManager.checkModuleRequeriments(
                TestModuleWithRequeriments as typeof Module,
            );
            expect(result.modules).toContain('OtherModule');
            expect(result.services).toContain('SomeService');
        });

        it('should pass when required modules are registered', async () => {
            const dep = new TestSimpleModule('/dep');
            moduleManager.set('OtherModule', dep);

            ServiceContainer.addService(class SomeService {}, []);
            const result = await moduleManager.checkModuleRequeriments(
                TestModuleWithRequeriments as typeof Module,
            );
            expect(result.modules).toEqual([]);
            expect(result.services).toEqual([]);
        });

        it('should run custom requeriments when other checks pass', async () => {
            const result = await moduleManager.checkModuleRequeriments(
                TestModuleWithCustomRequeriments as typeof Module,
            );
            expect(result.custom).toBe(true);
        });

        it('should fail when custom requirement returns false', async () => {
            const result = await moduleManager.checkModuleRequeriments(
                TestModuleWithFailingCustom as typeof Module,
            );
            expect(result.custom).toBe(false);
        });

        it('should skip custom checks if module requirements fail', async () => {
            const result = await moduleManager.checkModuleRequeriments(
                TestModuleWithRequeriments as typeof Module,
            );
            expect(result.modules.length).toBeGreaterThan(0);
            expect(result.custom).toBe(true);
        });
    });

    describe('instanceModule', () => {
        it('should instantiate a module with no requirements', async () => {
            const instance = await moduleManager.instanceModule(
                TestSimpleModule,
                '/test/path',
                'TestSimpleModule',
            );

            expect(instance).toBeInstanceOf(TestSimpleModule);
            expect(moduleManager.get('TestSimpleModule')).toBe(instance);
        });

        it('should queue modules with unmet requirements into pending pool', async () => {
            const result = await moduleManager.instanceModule(
                TestModuleWithRequeriments,
                '/test/path',
                'RequiredModule',
            );

            expect(result).not.toBeInstanceOf(Module);
            expect(result).toHaveProperty('modules');
            expect(result).toHaveProperty('services');
        });
    });

    describe('initializePendingModules', () => {
        it('should resolve pending modules when their requirements become available', async () => {
            await moduleManager.instanceModule(
                TestModuleWithRequeriments,
                '/test/path',
                'RequiredModule',
            );

            const dep = new TestSimpleModule('/dep');
            moduleManager.set('OtherModule', dep);
            ServiceContainer.addService(class SomeService {}, []);

            await moduleManager.initializePendingModules();

            const resolved = moduleManager.get('RequiredModule');
            expect(resolved).toBeDefined();
            expect(resolved).toBeInstanceOf(TestModuleWithRequeriments);
        });

        it('should handle empty pending pool gracefully', async () => {
            await expect(
                moduleManager.initializePendingModules(),
            ).resolves.toBeUndefined();
        });
    });

    describe('size', () => {
        it('should return the number of loaded modules', () => {
            const mod = new TestSimpleModule('/test');
            moduleManager.set('Test', mod);
            expect(moduleManager.size).toBe(1);
        });
    });
});
