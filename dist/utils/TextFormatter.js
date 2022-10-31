export class TextFormatter {
    static getUser(userId) {
        return `<@${userId}>`;
    }
    static getChannel(channelId) {
        return `<#${channelId}>`;
    }
    static getRole(roleId) {
        return `<@&${roleId}>`;
    }
    static getEmoji(emojiId) {
        return `<:${emojiId}>`;
    }
    static getEmojiAnimated(emojiId) {
        return `<a:${emojiId}>`;
    }
    static getMember(memberId) {
        return `<@!${memberId}>`;
    }
    // Formats: https://discord.com/developers/docs/reference#message-formatting-formats
    static getTimestamp(timestamp, format) {
        return `<t:${timestamp}:${format}>`;
    }
    // Formats: https://discord.com/developers/docs/reference#message-formatting-formats
    static getTimestampFromDate(date, format) {
        return `<t:${Math.trunc(date.getTime() / 1000)}:${format}>`;
    }
    // Formats: https://discord.com/developers/docs/reference#message-formatting-formats
    static getTimestampFromNow(format) {
        return `<t:${Math.trunc(Math.floor(Date.now() / 1000))}:${format}>`;
    }
    static getCodeBlock(code, language) {
        return `\`\`\`${language}
${code}
\`\`\``;
    }
    static getInlineCodeBlock(code) {
        return `\`${code}\``;
    }
    static getBold(text) {
        return `**${text}**`;
    }
    static getItalic(text) {
        return `*${text}*`;
    }
    static getUnderline(text) {
        return `__${text}__`;
    }
    static getStrikethrough(text) {
        return `~~${text}~~`;
    }
    static getSpoiler(text) {
        return `||${text}||`;
    }
    static getQuote(text) {
        return `> ${text}`;
    }
    static getBlockQuote(text) {
        return `>>> ${text}`;
    }
    static getHyperlink(text, url) {
        return `[${text}](${url})`;
    }
    static getHyperlinkWithTooltip(text, url, tooltip) {
        return `[${text}](${url} "${tooltip}")`;
    }
    static getHyperlinkWithTooltipAndImage(text, url, tooltip, imageUrl) {
        return `[${text}](${url} "${tooltip}":${imageUrl})`;
    }
    static getHyperlinkWithImage(text, url, imageUrl) {
        return `[${text}](${url}:${imageUrl})`;
    }
    static getProgressbar(progress, max, length, filled, empty) {
        const percentage = progress / max;
        const filledLength = Math.round(length * percentage);
        const emptyLength = length - filledLength;
        return filled.repeat(filledLength) + empty.repeat(emptyLength);
    }
    static getProgressbarWithText(progress, max, length, filled, empty, text) {
        return `${this.getProgressbar(progress, max, length, filled, empty)} ${text}`;
    }
}
