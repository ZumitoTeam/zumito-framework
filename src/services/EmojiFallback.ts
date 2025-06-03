import { Client } from 'discord.js';
import { TranslationManager } from './managers/TranslationManager';

export class EmojiFallback {

    client: Client;
    translator: TranslationManager;

    constructor(client: Client, translator: TranslationManager) {
        this.client = client;
        this.translator = translator;
    }

    public getEmoji(
        emojiId: string,
        fallbackEmoji: any
    ) {
        if (this.translator.has(emojiId)) {
            emojiId = this.translator.get(emojiId);
        }
        const emoji = this.client.emojis.cache.get(emojiId);
        return emoji?.toString() || fallbackEmoji;
    }

    public getEmojiByName(
        emojiName: string,
        fallbackEmoji: any
    ) {
        const emoji = this.client.emojis.cache.find(
            (emoji) => emoji.name === emojiName
        );
        return emoji?.toString() || fallbackEmoji;
    }

    public getEmojiByIdentifier(
        emojiId: string,
        fallbackEmoji: any
    ) {
        if (this.translator.has(emojiId)) {
            emojiId = this.translator.get(emojiId);
        }
        const emoji = this.client.emojis.cache.find((emoji) => emoji.id === emojiId);
        return emoji?.toString() || fallbackEmoji;
    }
}
