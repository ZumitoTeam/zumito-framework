import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModuleManager } from '../services/managers/ModuleManager.js';
import { Module, ModuleDeclaration } from '../definitions/Module.js';
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

class ModuleA extends Module {
    static moduleName = 'ModuleA';
    async initialize() {}
}

class ModuleB extends Module {
    static moduleName = 'ModuleB';
    static dependencies = ['ModuleA'] as const;
    async initialize() {}
}

class ModuleC extends Module {
    static moduleName = 'ModuleC';
    static dependencies = ['ModuleB'] as const;
    async initialize() {}
}

class ModuleWithOptionalNonExistent extends Module {
    static moduleName = 'OptMod';
    static optionalDependencies = ['NonExistent'] as const;
    async initialize() {}
}

class ModuleWithOptionalExisting extends Module {
    static moduleName = 'OptMod2';
    static optionalDependencies = ['ModuleA'] as const;
    async initialize() {}
}

class CircularModuleA extends Module {
    static moduleName = 'CircularA';
    static dependencies = ['CircularB'] as const;
    async initialize() {}
}

class CircularModuleB extends Module {
    static moduleName = 'CircularB';
    static dependencies = ['CircularA'] as const;
    async initialize() {}
}

class SelfDependentModule extends Module {
    static moduleName = 'SelfDep';
    static dependencies = ['SelfDep'] as const;
    async initialize() {}
}

class LegacyRequerimentsModule extends Module {
    static moduleName = 'LegacyMod';
    static requeriments = {
        modules: ['ModuleA'],
        services: [] as string[],
        custom: [] as Array<() => Promise<boolean>>,
    };
    async initialize() {}
}

class MixedApiModule extends Module {
    static moduleName = 'MixedMod';
    static dependencies = ['ModuleA'] as const;
    static requeriments = {
        modules: ['ModuleB'],
        services: [] as string[],
        custom: [] as Array<() => Promise<boolean>>,
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

    describe('resolveModuleName', () => {
        it('should use static moduleName when declared', () => {
            const name = moduleManager.resolveModuleName(ModuleA, 'fallback');
            expect(name).toBe('ModuleA');
        });

        it('should fall back to provided name when moduleName is not declared', () => {
            const name = moduleManager.resolveModuleName(TestSimpleModule, 'fallbackName');
            expect(name).toBe('fallbackName');
        });
    });

    describe('resolveModuleDeps', () => {
        it('should return empty deps for modules with no dependencies', () => {
            const deps = moduleManager.resolveModuleDeps(TestSimpleModule);
            expect(deps.required).toEqual([]);
            expect(deps.optional).toEqual([]);
        });

        it('should extract required deps from static dependencies', () => {
            const deps = moduleManager.resolveModuleDeps(ModuleB);
            expect(deps.required).toEqual(['ModuleA']);
            expect(deps.optional).toEqual([]);
        });

        it('should extract optional deps from static optionalDependencies', () => {
            const deps = moduleManager.resolveModuleDeps(ModuleWithOptionalNonExistent);
            expect(deps.required).toEqual([]);
            expect(deps.optional).toEqual(['NonExistent']);
        });

        it('should merge dependencies and requeriments.modules', () => {
            const deps = moduleManager.resolveModuleDeps(MixedApiModule);
            expect(deps.required).toContain('ModuleA');
            expect(deps.required).toContain('ModuleB');
            expect(deps.optional).toEqual([]);
        });

        it('should extract deps from legacy requeriments.modules only', () => {
            const deps = moduleManager.resolveModuleDeps(LegacyRequerimentsModule);
            expect(deps.required).toEqual(['ModuleA']);
            expect(deps.optional).toEqual([]);
        });
    });

    describe('buildDependencyGraph', () => {
        it('should build graph with no edges for independent modules', () => {
            const decls: ModuleDeclaration[] = [
                { moduleClass: ModuleA, name: 'ModuleA', rootPath: '/a', requiredDeps: [], optionalDeps: [] },
                { moduleClass: ModuleB, name: 'ModuleB', rootPath: '/b', requiredDeps: ['ModuleA'], optionalDeps: [] },
            ];
            const graph = moduleManager.buildDependencyGraph(decls);
            expect(graph.get('ModuleA')).toEqual([]);
            expect(graph.get('ModuleB')).toEqual(['ModuleA']);
        });

        it('should include optional deps only when target exists', () => {
            const decls: ModuleDeclaration[] = [
                { moduleClass: ModuleA, name: 'ModuleA', rootPath: '/a', requiredDeps: [], optionalDeps: [] },
                {
                    moduleClass: ModuleWithOptionalExisting,
                    name: 'OptMod2',
                    rootPath: '/opt',
                    requiredDeps: [],
                    optionalDeps: ['ModuleA'],
                },
                {
                    moduleClass: ModuleWithOptionalNonExistent,
                    name: 'OptMod',
                    rootPath: '/opt2',
                    requiredDeps: [],
                    optionalDeps: ['NonExistent'],
                },
            ];
            const graph = moduleManager.buildDependencyGraph(decls);
            expect(graph.get('OptMod2')).toContain('ModuleA');
            expect(graph.get('OptMod')).toEqual([]);
        });

        it('should throw when a required dependency is not found', () => {
            const decls: ModuleDeclaration[] = [
                { moduleClass: ModuleB, name: 'ModuleB', rootPath: '/b', requiredDeps: ['ModuleA'], optionalDeps: [] },
            ];
            expect(() => moduleManager.buildDependencyGraph(decls)).toThrow(
                'Module "ModuleB" depends on "ModuleA" which was not found',
            );
        });
    });

    describe('topologicalSort', () => {
        it('should return independent modules in any order', () => {
            const decls: ModuleDeclaration[] = [
                { moduleClass: ModuleA, name: 'ModuleA', rootPath: '/a', requiredDeps: [], optionalDeps: [] },
            ];
            const sorted = moduleManager.topologicalSort(decls);
            expect(sorted).toHaveLength(1);
            expect(sorted[0].name).toBe('ModuleA');
        });

        it('should order modules so dependencies come first', () => {
            const decls: ModuleDeclaration[] = [
                { moduleClass: ModuleB, name: 'ModuleB', rootPath: '/b', requiredDeps: ['ModuleA'], optionalDeps: [] },
                { moduleClass: ModuleA, name: 'ModuleA', rootPath: '/a', requiredDeps: [], optionalDeps: [] },
            ];
            const sorted = moduleManager.topologicalSort(decls);
            expect(sorted.map((d) => d.name)).toEqual(['ModuleA', 'ModuleB']);
        });

        it('should resolve linear chains A <- B <- C', () => {
            const decls: ModuleDeclaration[] = [
                { moduleClass: ModuleB, name: 'ModuleB', rootPath: '/b', requiredDeps: ['ModuleA'], optionalDeps: [] },
                { moduleClass: ModuleC, name: 'ModuleC', rootPath: '/c', requiredDeps: ['ModuleB'], optionalDeps: [] },
                { moduleClass: ModuleA, name: 'ModuleA', rootPath: '/a', requiredDeps: [], optionalDeps: [] },
            ];
            const sorted = moduleManager.topologicalSort(decls);
            expect(sorted.map((d) => d.name)).toEqual(['ModuleA', 'ModuleB', 'ModuleC']);
        });

        it('should detect circular dependencies', () => {
            const decls: ModuleDeclaration[] = [
                { moduleClass: CircularModuleA, name: 'CircularA', rootPath: '/ca', requiredDeps: ['CircularB'], optionalDeps: [] },
                { moduleClass: CircularModuleB, name: 'CircularB', rootPath: '/cb', requiredDeps: ['CircularA'], optionalDeps: [] },
            ];
            expect(() => moduleManager.topologicalSort(decls)).toThrow('Circular dependency');
        });

        it('should detect self-dependency as circular', () => {
            const decls: ModuleDeclaration[] = [
                { moduleClass: SelfDependentModule, name: 'SelfDep', rootPath: '/s', requiredDeps: ['SelfDep'], optionalDeps: [] },
            ];
            expect(() => moduleManager.topologicalSort(decls)).toThrow('Circular dependency');
        });
    });

    describe('resolveAndInstantiateAll', () => {
        it('should load independent modules via topological order', async () => {
            const loadSpy = vi.spyOn(moduleManager, 'loadModuleFile');
            const instanceSpy = vi.spyOn(moduleManager, 'instanceModule');

            loadSpy.mockResolvedValueOnce(ModuleA as typeof Module);
            loadSpy.mockResolvedValueOnce(ModuleB as typeof Module);

            await moduleManager.resolveAndInstantiateAll([
                { rootPath: '/a', name: 'ModuleA' },
                { rootPath: '/b', name: 'ModuleB' },
            ]);

            expect(instanceSpy).toHaveBeenCalledTimes(2);
            const firstCall = instanceSpy.mock.calls[0];
            const secondCall = instanceSpy.mock.calls[1];
            expect(firstCall[2]).toBe('ModuleA');
            expect(secondCall[2]).toBe('ModuleB');

            loadSpy.mockRestore();
            instanceSpy.mockRestore();
        });

        it('should skip modules with no valid index file', async () => {
            const loadSpy = vi.spyOn(moduleManager, 'loadModuleFile');
            loadSpy.mockResolvedValueOnce(Module);

            await moduleManager.resolveAndInstantiateAll([
                { rootPath: '/empty', name: 'EmptyModule' },
            ]);

            const all = moduleManager.getAll();
            expect(all.size).toBe(0);

            loadSpy.mockRestore();
        });

        it('should handle modules with missing dependency gracefully', async () => {
            const loadSpy = vi.spyOn(moduleManager, 'loadModuleFile');
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            loadSpy.mockResolvedValueOnce(ModuleB as typeof Module);

            await moduleManager.resolveAndInstantiateAll([
                { rootPath: '/b', name: 'ModuleB' },
            ]);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('ModuleB'),
            );

            consoleSpy.mockRestore();
            loadSpy.mockRestore();
        });
    });
});
