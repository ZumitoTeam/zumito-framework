import { ZumitoFramework } from "../../ZumitoFramework";
import { ServiceContainer } from "../ServiceContainer";
import { GuildDataGetter } from "./GuildDataGetter";

export class PrefixResolver {

    constructor(
        private framework: ZumitoFramework = ServiceContainer.getService(ZumitoFramework),
        private guildDataGetter: GuildDataGetter = ServiceContainer.getService(GuildDataGetter)
    ) {}

    /**
     * Resolve the prefix for a given context (guildId or DM).
     * Priority:
     *   1. Guild DB prefix (if exists and not null)
     *   2. process.env.BOTPREFIX
     *   3. framework.settings.defaultPrefix
     *   4. 'z-'
     * @param context { guildId?: string, userId?: string }
     */
    async resolvePrefix(context: { guildId?: string, userId?: string }): Promise<string> {
        // 1. Guild DB prefix
        if (context.guildId) {
            const guild = await this.guildDataGetter.getGuildSettings(context.guildId);
            if (guild && guild.prefix) {
                return guild.prefix;
            }
        }
        // 2. Env var
        if (process.env.DEFAULT_PREFIX) {
            return process.env.DEFAULT_PREFIX;
        }
        // 3. Framework config
        if (this.framework.settings?.defaultPrefix) {
            return this.framework.settings.defaultPrefix;
        }
        // 4. Hardcoded fallback
        return "z-";
    }
}
