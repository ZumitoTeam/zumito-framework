import { StatusManagerOptions } from "../StatusManagerOptions";
import type { DatabaseConfig } from 'zumito-db';

/**
 * A module entry returned by a module factory function like `adminModule()`.
 * Provides typed configuration and optional path override.
 */
export interface ModuleEntry {
    /** Package name or module identifier (e.g., '@zumito-team/admin-module'). */
    name: string;
    /** Module-specific configuration. Typed by the factory function. */
    config?: Record<string, any>;
    /** Optional filesystem path override. Defaults to `require.resolve(name)`. */
    path?: string;
}

export interface FrameworkSettings {
    mongoQueryString?: string;
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
    /**
     * @deprecated Use `modules` instead.
     */
    bundles?: (string | {
        path: string,
        options?: Record<string, any>
    })[];
    /**
     * Modules to load. Each entry is either a package name string or a
     * `ModuleEntry` object returned by a module factory function (e.g., `adminModule({...})`).
     *
     * Strings are resolved via `require.resolve()`.
     * Factory functions provide type-safe autocompletion for module-specific config.
     *
     * @example
     * ```ts
     * import { adminModule } from '@zumito-team/admin-module';
     *
     * modules: [
     *     adminModule({ colors: { primary: '#ff0000' } }),
     *     '@zumito-team/canvas-module',
     * ]
     * ```
     */
    modules?: (string | ModuleEntry)[];
    webServer?: {
        port?: number;
        disableNotFoundHandler?: boolean;
    };
    /**
     * New database configuration for zumito-db.
     * If omitted, falls back to `mongoQueryString` with MongoDB driver.
     */
    database?: Partial<DatabaseConfig> & { migrations?: any[] };
    /**
     * Model classes to register with zumito-db.
     */
    models?: any[];
}
