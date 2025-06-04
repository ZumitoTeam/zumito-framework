import { Channel, GuildChannel } from "discord.js"
import { GuildDataGetter } from "./GuildDataGetter";

export class PrefixRetriever {

    guildDataGetter: GuildDataGetter;

    constructor(guildDataGetter: GuildDataGetter) {
        this.guildDataGetter = guildDataGetter;
    }

    public async retrieve(params: {
        channel?: Channel,
        guildId?: string,
    }) {
        let prefix = 'z-';

        if (process.env.BOT_PREFIX) {
            prefix = process.env.BOT_PREFIX
        }

        if (!params.channel.isDMBased()) {
            const guildChannel = params.channel as GuildChannel;
            if (!params.guildId && guildChannel && guildChannel.guildId) {
                params.guildId = guildChannel.guildId;
            }
        }

        if (params.guildId) {
            const guildSettings: any = await this.guildDataGetter.getGuildSettings(params.guildId);
            if (guildSettings.prefix) {
                prefix = guildSettings.prefix;
            }
        }

        return prefix;
    }
}