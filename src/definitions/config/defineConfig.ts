import type { LauncherConfig } from './LauncherConfig.js';

/**
 * Type-safe helper for writing `zumito.config.ts`.
 * Provides autocompletion for all framework settings and module-specific
 * configs contributed via declaration merging on `ModuleConfigs`.
 *
 * Does not modify the config object — it's a pure identity function.
 */
export function defineConfig(config: LauncherConfig): LauncherConfig {
    return config;
}
