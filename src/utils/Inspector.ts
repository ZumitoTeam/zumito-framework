import { createRequire } from 'module';
import * as fs from 'fs';
import * as path from 'path';
import { ZumitoFramework } from '../ZumitoFramework.js';
import { ServiceContainer } from '../services/ServiceContainer.js';

const require = createRequire(import.meta.url);

export interface FrameworkSnapshot {
    version: string;
    uptime: number;
    discord: {
        status: 'connected' | 'disconnected';
        user: { id: string; tag: string } | null;
        guildCount: number;
    };
    database: {
        connected: boolean;
        driver: string;
    };
    commands: {
        total: number;
        items: Array<{
            name: string;
            type: string;
            description: string;
            aliases: string[];
            categories: string[];
            hidden: boolean;
        }>;
    };
    modules: {
        total: number;
        items: Array<{
            name: string;
            displayName: string;
            status: string;
            dependencies: string[];
            commandCount: number;
            eventCount: number;
        }>;
    };
    services: {
        total: number;
        items: Array<{
            name: string;
            singleton: boolean;
            hasInstance: boolean;
            dependencies: string[];
        }>;
    };
    events: {
        total: number;
        items: Array<{
            name: string;
            source: string;
        }>;
    };
}

/**
 * Write the inspector snapshot to .zumito/inspector-state.json in the current
 * working directory. Returns a cleanup function that stops the write interval.
 */
export function startInspectorFileWriter(framework: ZumitoFramework): () => void {
    const startTime = Date.now();
    let pkg: { version?: string } = {};
    try {
        pkg = require('../../package.json');
    } catch { /* ignore */ }

    let lastJson = '';
    let timer: ReturnType<typeof setInterval> | undefined;

    const write = () => {
        const state: FrameworkSnapshot = {
            version: pkg.version || 'unknown',
            uptime: Date.now() - startTime,
            discord: {
                status: framework.client?.isReady() ? 'connected' : 'disconnected',
                user: framework.client?.user
                    ? { id: framework.client.user.id, tag: framework.client.user.tag }
                    : null,
                guildCount: framework.client?.guilds?.cache?.size ?? 0,
            },
            database: {
                connected: !!framework.db,
                driver: framework.db ? getDriverName(framework) : 'none',
            },
            commands: serializeCommands(framework),
            modules: serializeModules(framework),
            services: serializeServices(),
            events: serializeEvents(framework),
        };

        const json = JSON.stringify(state);
        if (json === lastJson) { return; }
        lastJson = json;

        try {
            const dir = path.join(process.cwd(), '.zumito');
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(path.join(dir, 'inspector-state.json'), json, 'utf-8');
        } catch {
            // can't write – silently ignore
        }
    };

    // Write immediately, then every 3s
    write();
    timer = setInterval(write, 3000);

    return () => {
        if (timer) { clearInterval(timer); timer = undefined; }
    };
}

export function registerFrameworkInspector(framework: ZumitoFramework): void {
    const startTime = Date.now();
    let pkg: { version?: string } = {};

    try {
        pkg = require('../../package.json');
    } catch {
        // fallback if package.json can't be read
    }

    const inspector = {
        getSnapshot(this: void): string {
            const state: FrameworkSnapshot = {
                version: pkg.version || 'unknown',
                uptime: Date.now() - startTime,
                discord: {
                    status: framework.client?.isReady() ? 'connected' : 'disconnected',
                    user: framework.client?.user
                        ? { id: framework.client.user.id, tag: framework.client.user.tag }
                        : null,
                    guildCount: framework.client?.guilds?.cache?.size ?? 0,
                },
                database: {
                    connected: !!framework.db,
                    driver: framework.db ? getDriverName(framework) : 'none',
                },
                commands: serializeCommands(framework),
                modules: serializeModules(framework),
                services: serializeServices(),
                events: serializeEvents(framework),
            };

            return JSON.stringify(state);
        },

        getCommands(this: void): string {
            return JSON.stringify(serializeCommands(framework));
        },

        getModules(this: void): string {
            return JSON.stringify(serializeModules(framework));
        },

        getServices(this: void): string {
            return JSON.stringify(serializeServices());
        },

        getEvents(this: void): string {
            return JSON.stringify(serializeEvents(framework));
        },
    };

    try {
        (globalThis as any).__ZUMITO_INSPECT__ = inspector;
    } catch {
        // globalThis not available (non-Node environment?)
    }
}

function getDriverName(framework: ZumitoFramework): string {
    try {
        const driver = (framework.db as any).getDriver?.();
        if (driver) {
            return driver.constructor?.name || 'custom';
        }
    } catch {
        // ignore
    }
    return 'unknown';
}

function serializeCommands(framework: ZumitoFramework) {
    const items: FrameworkSnapshot['commands']['items'] = [];
    const allCommands = framework.commands?.getAll();
    if (allCommands) {
        for (const [, cmd] of allCommands) {
            items.push({
                name: cmd.name,
                type: (cmd as any).type || 'any',
                description: (cmd as any).description || '',
                aliases: cmd.aliases || [],
                categories: cmd.categories || [],
                hidden: (cmd as any).hidden === true,
            });
        }
    }
    return { total: items.length, items };
}

function serializeModules(framework: ZumitoFramework) {
    const items: FrameworkSnapshot['modules']['items'] = [];
    const allModules = framework.modules?.getAll();
    if (allModules) {
        for (const [name, mod] of allModules) {
            const modClass = Object.getPrototypeOf(mod)?.constructor;
            items.push({
                name,
                displayName: (modClass as any)?.moduleName || name,
                status: 'loaded',
                dependencies: Array.from((modClass as any)?.dependencies || []),
                commandCount: mod.getCommands?.()?.size ?? 0,
                eventCount: (mod as any).events?.size ?? 0,
            });
        }
    }
    return { total: items.length, items };
}

function serializeServices() {
    const items: FrameworkSnapshot['services']['items'] = [];
    try {
        const entries = ServiceContainer.getAllServiceEntries();
        for (const entry of entries) {
            items.push({
                name: entry.name,
                singleton: entry.singleton,
                hasInstance: entry.hasInstance,
                dependencies: entry.dependencies,
            });
        }
    } catch {
        // service container not ready
    }
    return { total: items.length, items };
}

function serializeEvents(framework: ZumitoFramework) {
    const items: FrameworkSnapshot['events']['items'] = [];
    const allEvents = framework.events;
    if (allEvents) {
        for (const [, evt] of allEvents) {
            items.push({
                name: (evt as any).name || 'unknown',
                source: (evt as any).source || (evt as any).emitter || 'framework',
            });
        }
    }
    return { total: items.length, items };
}
