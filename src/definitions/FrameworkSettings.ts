import { Module } from "./Module";
import { StatusManagerOptions } from "./StatusManagerOptions";

export interface FrameworkSettings {
    database: any;
    logLevel?: number;
    debug?: boolean;
    discordClientOptions: {
        intents?: number;
        token: string;
        clientId: string;
    };
    defaultPrefix?: string;
    statusOptions?: StatusManagerOptions;
    srcMode?: 'multiBundle' | 'monoBundle' | undefined;
}
