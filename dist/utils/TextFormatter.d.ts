export declare class TextFormatter {
    static getUser(userId: string): string;
    static getChannel(channelId: string): string;
    static getRole(roleId: string): string;
    static getEmoji(emojiId: string): string;
    static getEmojiAnimated(emojiId: string): string;
    static getMember(memberId: string): string;
    static getTimestamp(timestamp: number, format: string): string;
    static getTimestampFromDate(date: Date, format: string): string;
    static getTimestampFromNow(format: string): string;
    static getCodeBlock(code: string, language: string): string;
    static getInlineCodeBlock(code: string): string;
    static getBold(text: string): string;
    static getItalic(text: string): string;
    static getUnderline(text: string): string;
    static getStrikethrough(text: string): string;
    static getSpoiler(text: string): string;
    static getQuote(text: string): string;
    static getBlockQuote(text: string): string;
    static getHyperlink(text: string, url: string): string;
    static getHyperlinkWithTooltip(text: string, url: string, tooltip: string): string;
    static getHyperlinkWithTooltipAndImage(text: string, url: string, tooltip: string, imageUrl: string): string;
    static getHyperlinkWithImage(text: string, url: string, imageUrl: string): string;
    static getProgressbar(progress: number, max: number, length: number, filled: string, empty: string): string;
    static getProgressbarWithText(progress: number, max: number, length: number, filled: string, empty: string, text: string): string;
}
