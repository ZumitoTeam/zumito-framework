import { Client } from "discord.js";
export declare class EmojiFallback {
    static getEmoji(client: Client, emojiId: string, fallbackEmoji: any): any;
    static getEmojiByName(client: Client, emojiName: string, fallbackEmoji: any): any;
    static getEmojiByIdentifier(client: Client, emojiId: string, fallbackEmoji: any): any;
}
