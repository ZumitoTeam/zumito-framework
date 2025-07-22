import { ZumitoFramework } from "../../ZumitoFramework";
import { ServiceContainer } from "../ServiceContainer";
import { ObjectId } from "mongodb";

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
        const collection = this.framework.database.collection('guilds');
        let guild = await collection.findOne({ guild_id: guildId });
        console.log(guild);
        if (!guild) {
            guild = {
                _id: new ObjectId(),
                guild_id: guildId,
                lang: 'en',
                prefix: null,
                public: false,
                deleteCommands: false
            };
            await collection.insertOne(guild);
        }
        return guild;
    }

}