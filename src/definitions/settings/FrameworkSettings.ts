import { ModuleParameters } from "../parameters/ModuleParameters";
import { StatusManagerOptions } from "../StatusManagerOptions";

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
    /**
     * Read the ./src folder as multiple modules or unique module
     * This feature is experimental and can disapear anytime
     * @experimental
     */
    srcMode?: 'multiBundle' | 'monoBundle' | undefined;
    bundles?: {
        path: string,
        options?: ModuleParameters
    }[];
    webServer?: {
        port: number;
    }
}
