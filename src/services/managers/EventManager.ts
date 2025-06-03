export class EventManager {

    eventEmitters: Map<string, any> = new Map<string, any>();

    public addEventEmitter(name: string, eventEmitter: any) {
        this.eventEmitters.set(name, eventEmitter);
    }

    public getEventEmitter(name: string): any {
        return this.eventEmitters.get(name);
    }

    public removeEventEmitter(name: string) {
        this.eventEmitters.delete(name);
    }

    public emitEvent(eventName: string, eventEmitterName: string, ...args: any) {
        const eventEmitter = this.getEventEmitter(eventEmitterName);
        if (!eventEmitter) throw new Error(`EventEmitter ${eventEmitterName} not found`);
        eventEmitter.emit(eventName, ...args);
    }

    public addEventListener(eventEmitterName: string, eventName: string, callback: any, params?: any) {
        const eventEmitter = this.getEventEmitter(eventEmitterName);
        if (!eventEmitter) throw new Error(`EventEmitter ${eventEmitterName} not found`);
        const method = params?.once ? 'once' : 'on';
        eventEmitter[method](eventName, (...args: any) => {
            callback(...args);
        });
    }


}