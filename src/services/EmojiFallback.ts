import { Client } from 'discord.js';
import { TranslationManager } from './managers/TranslationManager';

export class EmojiFallback {

    client: Client;
    translator: TranslationManager;
    private applicationEmojisPromise: Promise<unknown> | null = null;

    constructor(client: Client, translator: TranslationManager) {
        this.client = client;
        this.translator = translator;
    }

    private ensureApplicationEmojis(): Promise<unknown> {
        if (!this.applicationEmojisPromise) {
            if (this.client.application) {
                this.applicationEmojisPromise = this.client.application.emojis.fetch().catch(() => {});
            } else {
                this.applicationEmojisPromise = Promise.resolve();
            }
        }
        return this.applicationEmojisPromise;
    }

    public async getEmoji(
        emojiId: string,
        fallbackEmoji: any
    ) {
        if (this.translator.has(emojiId)) {
            emojiId = this.translator.get(emojiId);
        }
        const emoji = this.client.emojis.cache.get(emojiId);
        if (emoji) return emoji.toString();

        const appEmoji = await this.getApplicationEmoji(emojiId);
        if (appEmoji) return appEmoji.toString();

        return fallbackEmoji;
    }

    public async getEmojiByName(
        emojiName: string,
        fallbackEmoji: any
    ) {
        const emoji = this.client.emojis.cache.find(
            (emoji) => emoji.name === emojiName
        );
        if (emoji) return emoji.toString();

        const appEmoji = await this.getApplicationEmojiByName(emojiName);
        if (appEmoji) return appEmoji.toString();

        return fallbackEmoji;
    }

    public async getEmojiByIdentifier(
        emojiId: string,
        fallbackEmoji: any
    ) {
        if (this.translator.has(emojiId)) {
            emojiId = this.translator.get(emojiId);
        }
        const emoji = this.client.emojis.cache.find((emoji) => emoji.id === emojiId);
        if (emoji) return emoji.toString();

        const appEmoji = await this.getApplicationEmoji(emojiId);
        if (appEmoji) return appEmoji.toString();

        return fallbackEmoji;
    }

    public async getApplicationEmoji(emojiId: string) {
        if (!this.client.application) return undefined;
        await this.ensureApplicationEmojis();
        return this.client.application.emojis.cache.get(emojiId);
    }

    public async getApplicationEmojiByName(emojiName: string) {
        if (!this.client.application) return undefined;
        await this.ensureApplicationEmojis();
        return this.client.application.emojis.cache.find(
            (emoji) => emoji.name === emojiName
        );
    }
}
