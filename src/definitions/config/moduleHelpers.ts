import { createRequire } from 'module';
import { ZumitoFramework } from '../../ZumitoFramework.js';
import type { ModuleEntry } from '../settings/FrameworkSettings.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

function findPackageJson(startPath: string): string | null {
    let dir = startPath;
    for (let i = 0; i < 10; i++) {
        const candidate = resolve(dir, 'package.json');
        if (existsSync(candidate)) return candidate;
        const parent = resolve(dir, '..');
        if (parent === dir) break;
        dir = parent;
    }
    return null;
}

function readModuleName(metaUrl: string): string | null {
    const filePath = fileURLToPath(metaUrl);
    const callerDir = dirname(filePath);
    const pkgPath = findPackageJson(callerDir);
    if (!pkgPath) return null;
    const require = createRequire(pkgPath);
    return require(pkgPath)?.name ?? null;
}

/**
 * Creates a type-safe factory function that returns a `ModuleEntry`.
 * Reads the module name from the nearest `package.json` by walking up
 * from the caller's location.
 *
 * @example
 * ```ts
 * // admin/index.ts
 * export const adminModule = createModuleEntry<AdminConfig>(import.meta.url);
 *
 * // Consumer's zumito.config.ts
 * adminModule({ colors: { primary: '#ff0000' } })
 * ```
 */
export function createModuleEntry<T = Record<string, any>>(metaUrl: string): (config?: T) => ModuleEntry {
    const name = readModuleName(metaUrl);
    if (!name) {
        throw new Error(`createModuleEntry: could not read 'name' from package.json near ${metaUrl}`);
    }
    return (config?: T): ModuleEntry => ({ name, config });
}

/**
 * Retrieves the module-specific configuration from the framework settings
 * by matching the module's package name against the `modules` array.
 *
 * Modules that are registered as plain strings in the `modules` array
 * (without config) will return an empty object.
 *
 * @example
 * ```ts
 * import { getModuleConfig } from 'zumito-framework';
 *
 * const config = getModuleConfig<MyConfig>(framework, import.meta.url);
 * ```
 */
export function getModuleConfig<T = Record<string, any>>(framework: ZumitoFramework | undefined, metaUrl: string): T {
    if (!framework) return {} as T;

    const name = readModuleName(metaUrl);
    if (!name) return {} as T;

    const modules = framework.settings?.modules ?? [];
    const entry = modules.find(
        (m): m is ModuleEntry => typeof m !== 'string' && m.name === name
    );
    return (entry?.config ?? {}) as T;
}
