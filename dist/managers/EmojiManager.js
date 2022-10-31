export class EmojiManager {
    /**
     * @param {Client} client - The client client instance.
     */
    client;
    emojiFallbacks = new Map();
    constructor(client) {
        this.client = client;
    }
    getEmojiByName(name) {
        let emoji = this.client.emojis.cache.find((e) => e.name === name);
        if (emoji) {
            return emoji.toString();
        }
        else if (this.emojiFallbacks.has(name)) {
            const fallback = this.emojiFallbacks.get(name);
            emoji = this.client.emojis.cache.find((e) => e.name === fallback);
            if (emoji) {
                return emoji.toString();
            }
            else {
                return fallback;
            }
        }
        else {
            throw new Error(`Emoji ${name} not found.`);
        }
    }
    registerEmojiFallback(id, fallback) {
        this.emojiFallbacks.set(id, fallback);
    }
}
