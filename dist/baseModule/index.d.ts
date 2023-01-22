import { Module } from '../types/Module.js';
import { ZumitoFramework } from '../ZumitoFramework.js';
export declare class baseModule extends Module {
    constructor(modulePath: string, framework: ZumitoFramework);
    registerEvents(): Promise<any>;
}
