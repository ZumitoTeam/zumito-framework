export const CommandType = {
    /**
     * The command is executed when the prefix is used. Running `executePrefixCommand` method or `execute` method as fallback.
     */
    prefix: 'prefix',
    /**
     * The command is executed when the slash is used. Running `executeSlashCommand` method or `execute` method as fallback.
     */
    slash: 'slash',
    /**
     * The command is executed when the prefix or slash is used. Running `executeSlashCommand` or `executePrefixCommand` method respectively or `execute` method as fallback.
     */
    separated: 'separated',
    /**
     * The command is executed when the prefix or slash is used. Running always `execute` method.
     */
    any: 'any',
};
