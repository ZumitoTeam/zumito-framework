import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceContainer } from '../services/ServiceContainer.js';

class TestServiceA {
    getValue() { return 'A'; }
}

class TestServiceB {
    getValue() { return 'B'; }
}

class TestServiceC {
    constructor(private dep: TestServiceA) {}
    getDep() { return this.dep.getValue(); }
}

beforeEach(() => {
    (ServiceContainer as any).services.clear();
});

describe('ServiceContainer', () => {
    describe('addService', () => {
        it('should register a service', () => {
            ServiceContainer.addService(TestServiceA, []);
            expect(ServiceContainer.hasService(TestServiceA)).toBe(true);
        });

        it('should register a service with dependencies', () => {
            ServiceContainer.addService(TestServiceA, []);
            ServiceContainer.addService(TestServiceC, [TestServiceA.name]);
            expect(ServiceContainer.hasService(TestServiceC)).toBe(true);
        });

        it('should register a singleton instance when provided', () => {
            const instance = new TestServiceA();
            ServiceContainer.addService(TestServiceA, [], true, instance);
            const resolved = ServiceContainer.getService(TestServiceA);
            expect(resolved).toBe(instance);
        });
    });

    describe('getService', () => {
        it('should return an instance of the service', () => {
            ServiceContainer.addService(TestServiceA, []);
            const instance = ServiceContainer.getService(TestServiceA);
            expect(instance).toBeInstanceOf(TestServiceA);
            expect(instance.getValue()).toBe('A');
        });

        it('should inject dependencies', () => {
            ServiceContainer.addService(TestServiceA, []);
            ServiceContainer.addService(TestServiceC, [TestServiceA.name]);
            const instance = ServiceContainer.getService(TestServiceC);
            expect(instance).toBeInstanceOf(TestServiceC);
            expect(instance.getDep()).toBe('A');
        });

        it('should return the same instance for singletons', () => {
            ServiceContainer.addService(TestServiceA, [], true);
            const a = ServiceContainer.getService(TestServiceA);
            const b = ServiceContainer.getService(TestServiceA);
            expect(a).toBe(b);
        });

        it('should create a new instance for non-singletons', () => {
            ServiceContainer.addService(TestServiceA, [], false);
            const a = ServiceContainer.getService(TestServiceA);
            const b = ServiceContainer.getService(TestServiceA);
            expect(a).not.toBe(b);
        });

        it('should resolve by string name', () => {
            ServiceContainer.addService(TestServiceB, []);
            const instance = ServiceContainer.getService('TestServiceB');
            expect(instance).toBeInstanceOf(TestServiceB);
        });

        it('should auto-instantiate no-arg constructors if not registered', () => {
            const instance = ServiceContainer.getService(TestServiceA);
            expect(instance).toBeInstanceOf(TestServiceA);
        });

        it('should throw for unknown services with constructor args', () => {
            expect(() => ServiceContainer.getService(TestServiceC)).toThrow(/not found/);
        });
    });

    describe('hasService', () => {
        it('should return false for unregistered services', () => {
            expect(ServiceContainer.hasService(TestServiceA)).toBe(false);
        });

        it('should return true for registered services', () => {
            ServiceContainer.addService(TestServiceA, []);
            expect(ServiceContainer.hasService(TestServiceA)).toBe(true);
        });

        it('should work with string name', () => {
            ServiceContainer.addService(TestServiceB, []);
            expect(ServiceContainer.hasService('TestServiceB')).toBe(true);
            expect(ServiceContainer.hasService('NonExistent')).toBe(false);
        });
    });
});
