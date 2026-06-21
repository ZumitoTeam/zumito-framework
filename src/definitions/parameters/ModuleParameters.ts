/**
 * Module parameters passed to the Module constructor.
 * Includes base framework fields plus any module-specific config.
 */
export type ModuleParameters = {
    path?: string;
    commandWhitelist?: string[];
    commandBlacklist?: string[];
    commandRenames?: Record<string, string>;
    [key: string]: any;
};
