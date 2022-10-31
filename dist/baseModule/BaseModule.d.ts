import { Module } from "../types/Module";
import { ZumitoFramework } from "../ZumitoFramework";
export declare class baseModule extends Module {
    constructor(modulePath: string, framework: ZumitoFramework);
    registerEvents(): void;
}
