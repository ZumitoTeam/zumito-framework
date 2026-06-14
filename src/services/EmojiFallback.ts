import { Client } from 'discord.js';
import { TranslationManager } from './managers/TranslationManager';

export class EmojiFallback {

    client: Client;
    translator: TranslationManager;

    constructor(client: Client, translator: TranslationManager) {
        this.client = client;
        this.translator = translator;
        if (client.isReady()) {
            client.application?.emojis?.fetch().catch(() => {});
        } else {
            client.once('ready', () => {
                client.application?.emojis?.fetch().catch(() => {});
            });
        }
    }

    public getEmoji(
        emojiId: string,
        fallbackEmoji: any
    ) {
        if (this.translator.has(emojiId)) {
            emojiId = this.translator.get(emojiId);
        }
        const emoji = this.client.emojis.cache.get(emojiId);
        if (emoji) return emoji.toString();

        const appEmoji = this.getApplicationEmoji(emojiId);
        if (appEmoji) return appEmoji.toString();

        return fallbackEmoji;
    }

    public getEmojiByName(
        emojiName: string,
        fallbackEmoji: any
    ) {
        const emoji = this.client.emojis.cache.find(
            (emoji) => emoji.name === emojiName
        );
        if (emoji) return emoji.toString();

        const appEmoji = this.getApplicationEmojiByName(emojiName);
        if (appEmoji) return appEmoji.toString();

        return fallbackEmoji;
    }

    public getEmojiByIdentifier(
        emojiId: string,
        fallbackEmoji: any
    ) {
        if (this.translator.has(emojiId)) {
            emojiId = this.translator.get(emojiId);
        }
        const emoji = this.client.emojis.cache.find((emoji) => emoji.id === emojiId);
        if (emoji) return emoji.toString();

        const appEmoji = this.getApplicationEmoji(emojiId);
        if (appEmoji) return appEmoji.toString();

        return fallbackEmoji;
    }

    public getApplicationEmoji(emojiId: string) {
        if (!this.client.application) return undefined;
        return this.client.application.emojis.cache.get(emojiId);
    }

    public getApplicationEmojiByName(emojiName: string) {
        if (!this.client.application) return undefined;
        return this.client.application.emojis.cache.find(
            (emoji) => emoji.name === emojiName
        );
    }
}
