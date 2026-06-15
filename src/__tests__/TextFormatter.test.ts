import { describe, it, expect } from 'vitest';
import { TextFormatter } from '../services/utilities/TextFormatter.js';

describe('TextFormatter', () => {
    describe('getUser', () => {
        it('should format user mention', () => {
            expect(TextFormatter.getUser('12345')).toBe('<@12345>');
        });
    });

    describe('getChannel', () => {
        it('should format channel mention', () => {
            expect(TextFormatter.getChannel('67890')).toBe('<#67890>');
        });
    });

    describe('getRole', () => {
        it('should format role mention', () => {
            expect(TextFormatter.getRole('11111')).toBe('<@&11111>');
        });
    });

    describe('getEmoji', () => {
        it('should format emoji', () => {
            expect(TextFormatter.getEmoji('emojiName')).toBe('<:emojiName>');
        });
    });

    describe('getEmojiAnimated', () => {
        it('should format animated emoji', () => {
            expect(TextFormatter.getEmojiAnimated('wave')).toBe('<a:wave>');
        });
    });

    describe('getMember', () => {
        it('should format member mention', () => {
            expect(TextFormatter.getMember('22222')).toBe('<@!22222>');
        });
    });

    describe('getTimestamp', () => {
        it('should format timestamp with format', () => {
            expect(TextFormatter.getTimestamp(1700000000, 'F'))
                .toBe('<t:1700000000:F>');
        });
    });

    describe('getCodeBlock', () => {
        it('should format code block with language', () => {
            const result = TextFormatter.getCodeBlock('const x = 1;', 'ts');
            expect(result).toBe('```ts\nconst x = 1;\n```');
        });
    });

    describe('getInlineCodeBlock', () => {
        it('should format inline code', () => {
            expect(TextFormatter.getInlineCodeBlock('var')).toBe('`var`');
        });
    });

    describe('getBold', () => {
        it('should format bold text', () => {
            expect(TextFormatter.getBold('hello')).toBe('**hello**');
        });
    });

    describe('getItalic', () => {
        it('should format italic text', () => {
            expect(TextFormatter.getItalic('hello')).toBe('*hello*');
        });
    });

    describe('getUnderline', () => {
        it('should format underline text', () => {
            expect(TextFormatter.getUnderline('hello')).toBe('__hello__');
        });
    });

    describe('getStrikethrough', () => {
        it('should format strikethrough text', () => {
            expect(TextFormatter.getStrikethrough('hello')).toBe('~~hello~~');
        });
    });

    describe('getSpoiler', () => {
        it('should format spoiler text', () => {
            expect(TextFormatter.getSpoiler('secret')).toBe('||secret||');
        });
    });

    describe('getQuote', () => {
        it('should format quote', () => {
            expect(TextFormatter.getQuote('message')).toBe('> message');
        });
    });

    describe('getBlockQuote', () => {
        it('should format block quote', () => {
            expect(TextFormatter.getBlockQuote('message')).toBe('>>> message');
        });
    });

    describe('getHyperlink', () => {
        it('should format hyperlink', () => {
            expect(TextFormatter.getHyperlink('GitHub', 'https://github.com'))
                .toBe('[GitHub](https://github.com)');
        });
    });

    describe('getHyperlinkWithTooltip', () => {
        it('should format hyperlink with tooltip', () => {
            expect(TextFormatter.getHyperlinkWithTooltip('GitHub', 'https://github.com', 'Code'))
                .toBe('[GitHub](https://github.com "Code")');
        });
    });

    describe('getProgressbar', () => {
        it('should draw progress bar', () => {
            const result = TextFormatter.getProgressbar(5, 10, 10, '#', '-');
            expect(result).toBe('#####-----');
        });

        it('should handle full progress', () => {
            const result = TextFormatter.getProgressbar(10, 10, 5, 'X', '_');
            expect(result).toBe('XXXXX');
        });

        it('should handle zero progress', () => {
            const result = TextFormatter.getProgressbar(0, 10, 5, 'X', '_');
            expect(result).toBe('_____');
        });
    });

    describe('getProgressbarWithText', () => {
        it('should draw progress bar with text', () => {
            const result = TextFormatter.getProgressbarWithText(7, 10, 10, '#', '-', '70%');
            expect(result).toBe('#######--- 70%');
        });
    });
});
