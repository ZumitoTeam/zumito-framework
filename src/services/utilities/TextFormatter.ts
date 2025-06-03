type TimestampFormat = 'T'|'t'|'d'|'D'|'f'|'F'|'R';

export class TextFormatter {
    public static getUser(userId: string) {
        return `<@${userId}>`;
    }

    public static getChannel(channelId: string) {
        return `<#${channelId}>`;
    }

    public static getRole(roleId: string) {
        return `<@&${roleId}>`;
    }

    public static getEmoji(emojiId: string) {
        return `<:${emojiId}>`;
    }

    public static getEmojiAnimated(emojiId: string) {
        return `<a:${emojiId}>`;
    }

    public static getMember(memberId: string) {
        return `<@!${memberId}>`;
    }

    // Formats: https://discord.com/developers/docs/reference#message-formatting-formats
    public static getTimestamp(timestamp: number, format: TimestampFormat) {
        return `<t:${timestamp}:${format}>`;
    }

    // Formats: https://discord.com/developers/docs/reference#message-formatting-formats
    public static getTimestampFromDate(date: Date, format: TimestampFormat) {
        return `<t:${Math.trunc(date.getTime() / 1000)}:${format}>`;
    }

    // Formats: https://discord.com/developers/docs/reference#message-formatting-formats
    public static getTimestampFromNow(format: TimestampFormat) {
        return `<t:${Math.trunc(Math.floor(Date.now() / 1000))}:${format}>`;
    }

    public static getCodeBlock(code: string, language: string) {
        return `\`\`\`${language}
${code}
\`\`\``;
    }

    public static getInlineCodeBlock(code: string) {
        return `\`${code}\``;
    }

    public static getBold(text: string) {
        return `**${text}**`;
    }

    public static getItalic(text: string) {
        return `*${text}*`;
    }

    public static getUnderline(text: string) {
        return `__${text}__`;
    }

    public static getStrikethrough(text: string) {
        return `~~${text}~~`;
    }

    public static getSpoiler(text: string) {
        return `||${text}||`;
    }

    public static getQuote(text: string) {
        return `> ${text}`;
    }

    public static getBlockQuote(text: string) {
        return `>>> ${text}`;
    }

    public static getHyperlink(text: string, url: string) {
        return `[${text}](${url})`;
    }

    public static getHyperlinkWithTooltip(
        text: string,
        url: string,
        tooltip: string
    ) {
        return `[${text}](${url} "${tooltip}")`;
    }

    public static getHyperlinkWithTooltipAndImage(
        text: string,
        url: string,
        tooltip: string,
        imageUrl: string
    ) {
        return `[${text}](${url} "${tooltip}":${imageUrl})`;
    }

    public static getHyperlinkWithImage(
        text: string,
        url: string,
        imageUrl: string
    ) {
        return `[${text}](${url}:${imageUrl})`;
    }

    public static getProgressbar(
        progress: number,
        max: number,
        length: number,
        filled: string,
        empty: string
    ) {
        const percentage = progress / max;
        const filledLength = Math.round(length * percentage);
        const emptyLength = length - filledLength;
        return filled.repeat(filledLength) + empty.repeat(emptyLength);
    }

    public static getProgressbarWithText(
        progress: number,
        max: number,
        length: number,
        filled: string,
        empty: string,
        text: string
    ) {
        return `${this.getProgressbar(
            progress,
            max,
            length,
            filled,
            empty
        )} ${text}`;
    }
}
