export type CommandLoadOptions = {
    whitelist?: string[],
    blacklist?: string[],
    renames?: {[key: string]: string};
}