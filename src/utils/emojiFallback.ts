import { Client, Emoji } from "discord.js";

export class EmojiFallback {
    public static getEmoji(client: Client, emojiId: string, fallbackEmoji: any) {
        const emoji = client.emojis.cache.get(emojiId);
        return emoji?.toString() || fallbackEmoji;
    }

    public static getEmojiByName(client: Client, emojiName: string, fallbackEmoji: any) {
        const emoji = client.emojis.cache.find(emoji => emoji.name === emojiName);
        return emoji?.toString() || fallbackEmoji;
    }

    public static getEmojiByIdentifier(client: Client, emojiId: string, fallbackEmoji: any) {
        const emoji = client.emojis.cache.find(emoji => emoji.id === emojiId);
        return emoji?.toString() || fallbackEmoji;
    }
}