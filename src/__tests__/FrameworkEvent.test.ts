import { describe, it, expect } from 'vitest';
import { FrameworkEvent } from '../definitions/FrameworkEvent.js';

class ConcreteEvent extends FrameworkEvent {
    source = 'discord';
    once = false;

    async execute(...args: any[]) {
        return args;
    }
}

class OnceEvent extends FrameworkEvent {
    source = 'framework';
    once = true;

    async execute(...args: any[]) {
        return 'executed';
    }
}

describe('FrameworkEvent', () => {
    it('should have disabled defaulting to false', () => {
        const event = new ConcreteEvent();
        expect(event.disabled).toBe(false);
    });

    it('should have source property', () => {
        const event = new ConcreteEvent();
        expect(event.source).toBe('discord');
    });

    it('should have once property', () => {
        expect(new ConcreteEvent().once).toBe(false);
        expect(new OnceEvent().once).toBe(true);
    });

    it('should execute and return result', async () => {
        const event = new ConcreteEvent();
        const result = await event.execute('a', 'b');
        expect(result).toEqual(['a', 'b']);
    });

    it('should allow disabling the event', () => {
        const event = new ConcreteEvent();
        event.disabled = true;
        expect(event.disabled).toBe(true);
    });

    it('should support framework source', () => {
        const event = new OnceEvent();
        expect(event.source).toBe('framework');
    });

    it('should not be abstract on concrete implementations', () => {
        const event = new ConcreteEvent();
        expect(event).toBeInstanceOf(FrameworkEvent);
    });
});
