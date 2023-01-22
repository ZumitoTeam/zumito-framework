import { Client } from 'discord.js';
export declare class EmojiManager {
    /**
     * @param {Client} client - The client client instance.
     */
    client: Client;
    emojiFallbacks: Map<string, string>;
    constructor(client: Client);
    getEmojiByName(name: string): string;
    registerEmojiFallback(id: string, fallback: string): void;
}
