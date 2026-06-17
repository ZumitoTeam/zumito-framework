import { ZumitoFramework } from "../../ZumitoFramework";
import { ServiceContainer } from "../ServiceContainer";
import { ObjectId } from "mongodb";
import { DatabaseManager } from 'zumito-db';

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
        // Use new zumito-db DatabaseManager if available
        const db = ServiceContainer.getService(DatabaseManager) as DatabaseManager | undefined;
        if (db) {
            const driver = db.getDriver();
            const results = await driver.find('guilds', {
                collection: 'guilds',
                type: 'findOne',
                where: [{ field: 'guild_id', operator: 'eq', value: guildId, logic: 'and' }],
            });
            let guild = results && results.length > 0 ? results[0] : null;
            if (!guild) {
                guild = {
                    guild_id: guildId,
                    lang: 'en',
                    prefix: null,
                    public: false,
                    deleteCommands: false
                };
                await driver.insert('guilds', guild);
            }
            return guild;
        }

        // Fallback to deprecated raw MongoDB access
        console.warn('[🗄️⚠️] GuildDataGetter is using deprecated raw MongoDB access. Please update to zumito-db.');
        const collection = this.framework.database.collection('guilds');
        let guild = await collection.findOne({ guild_id: guildId });
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