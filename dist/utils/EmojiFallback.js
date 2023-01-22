export class EmojiFallback {
    static getEmoji(client, emojiId, fallbackEmoji) {
        const emoji = client.emojis.cache.get(emojiId);
        return emoji?.toString() || fallbackEmoji;
    }
    static getEmojiByName(client, emojiName, fallbackEmoji) {
        const emoji = client.emojis.cache.find((emoji) => emoji.name === emojiName);
        return emoji?.toString() || fallbackEmoji;
    }
    static getEmojiByIdentifier(client, emojiId, fallbackEmoji) {
        const emoji = client.emojis.cache.find((emoji) => emoji.id === emojiId);
        return emoji?.toString() || fallbackEmoji;
    }
}
