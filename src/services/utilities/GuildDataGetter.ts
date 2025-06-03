import { ZumitoFramework } from "../../ZumitoFramework";
import { ServiceContainer } from "../ServiceContainer";

export class GuildDataGetter {

    framework: ZumitoFramework;

    constructor(framework: ZumitoFramework) {
        this.framework = framework;
    }

    /**
     * Gets the guild settings from the database.
     * If the guild is not in the database, it is added.
     * @param guildId
     * @returns {Promise<any>}
     * @public
     * @async
     * @example
     * // returns the guild settings
     * getGuildSettings('123456789012345678');
     * @example
     * // returns the guild settings
     * getGuildSettings(guild.id);
     * @example
     * // returns the guild settings
     * getGuildSettings(message.guild.id);
     * @example
     * // returns the guild settings
     * getGuildSettings(interaction.guild.id);
     * @example
     * // returns the guild settings
     * getGuildSettings(interaction.guildId);
     */
    public async getGuildSettings(guildId: string) {
        const Guild = this.framework.database.models.Guild;
        return await new Promise((resolve, reject) => {
            Guild.findOne({ where: { guild_id: guildId } }, (err, guild) => {
                if (err) reject(err);
                if (guild == null) {
                    guild = new Guild({
                        guild_id: guildId,
                    });
                    guild.save((err) => {
                        if (err) reject(err);
                        resolve(guild);
                    });
                } else {
                    resolve(guild);
                }
            });
        });
    }

}