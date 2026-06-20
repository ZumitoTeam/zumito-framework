import { Module } from '../../../definitions/Module.js';

export class BaseModule extends Module {
    async initialize(): Promise<void> {
        await super.initialize();
    }
}
