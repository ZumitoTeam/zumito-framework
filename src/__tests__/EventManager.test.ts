import { describe, it, expect, vi } from 'vitest';
import { EventManager } from '../services/managers/EventManager.js';
import { EventEmitter } from 'tseep';

describe('EventManager', () => {
    let eventManager: EventManager;

    beforeEach(() => {
        eventManager = new EventManager();
    });

    describe('addEventEmitter', () => {
        it('should register an event emitter by name', () => {
            const emitter = new EventEmitter();
            eventManager.addEventEmitter('test', emitter);
            expect(eventManager.getEventEmitter('test')).toBe(emitter);
        });
    });

    describe('getEventEmitter', () => {
        it('should return undefined for unknown emitters', () => {
            expect(eventManager.getEventEmitter('unknown')).toBeUndefined();
        });

        it('should return the registered emitter', () => {
            const emitter = new EventEmitter();
            eventManager.addEventEmitter('discord', emitter);
            expect(eventManager.getEventEmitter('discord')).toBe(emitter);
        });
    });

    describe('removeEventEmitter', () => {
        it('should remove a registered emitter', () => {
            const emitter = new EventEmitter();
            eventManager.addEventEmitter('test', emitter);
            eventManager.removeEventEmitter('test');
            expect(eventManager.getEventEmitter('test')).toBeUndefined();
        });
    });

    describe('emitEvent', () => {
        it('should emit events on the specified emitter', () => {
            const emitter = new EventEmitter();
            const callback = vi.fn();
            emitter.on('ready', callback);

            eventManager.addEventEmitter('framework', emitter);
            eventManager.emitEvent('ready', 'framework', { foo: 'bar' });

            expect(callback).toHaveBeenCalledOnce();
            expect(callback.mock.calls[0][0]).toEqual({ foo: 'bar' });
        });

        it('should throw for unknown emitter names', () => {
            expect(() => eventManager.emitEvent('test', 'unknown'))
                .toThrow('EventEmitter unknown not found');
        });
    });

    describe('addEventListener', () => {
        it('should register a listener with on by default', () => {
            const emitter = new EventEmitter();
            const callback = vi.fn();
            eventManager.addEventEmitter('test', emitter);
            eventManager.addEventListener('test', 'eventName', callback);

            emitter.emit('eventName', 'arg1', 'arg2');
            expect(callback).toHaveBeenCalledOnce();
            expect(callback.mock.calls[0][0]).toBe('arg1');
            expect(callback.mock.calls[0][1]).toBe('arg2');
        });

        it('should register a once listener when params.once is true', () => {
            const emitter = new EventEmitter();
            const callback = vi.fn();
            eventManager.addEventEmitter('test', emitter);
            eventManager.addEventListener('test', 'eventName', callback, { once: true });

            emitter.emit('eventName', 'data');
            emitter.emit('eventName', 'data2');

            expect(callback).toHaveBeenCalledOnce();
            expect(callback.mock.calls[0][0]).toBe('data');
        });

        it('should throw for unknown emitter names', () => {
            const callback = vi.fn();
            expect(() => eventManager.addEventListener('unknown', 'event', callback))
                .toThrow('EventEmitter unknown not found');
        });

        it('should support multiple listeners on the same event', () => {
            const emitter = new EventEmitter();
            const cb1 = vi.fn();
            const cb2 = vi.fn();
            eventManager.addEventEmitter('test', emitter);
            eventManager.addEventListener('test', 'multi', cb1);
            eventManager.addEventListener('test', 'multi', cb2);

            emitter.emit('multi');
            expect(cb1).toHaveBeenCalledOnce();
            expect(cb2).toHaveBeenCalledOnce();
        });
    });
});
