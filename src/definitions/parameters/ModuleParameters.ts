export type ModuleParameters = {
    commandWhitelist?: string[],
    commandBlacklist?: string[],
    commandRenames?: {[key: string]: string};
}