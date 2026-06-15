import { describe, it, expect } from 'vitest';
import { CommandParser } from '../services/CommandParser.js';

describe('CommandParser', () => {
    describe('splitCommandLine', () => {
        it('should split simple space-separated args', () => {
            const result = CommandParser.splitCommandLine('a b c');
            expect(result).toEqual(['a', 'b', 'c']);
        });

        it('should handle quoted strings as single arg', () => {
            const result = CommandParser.splitCommandLine('a "b c" d');
            expect(result).toEqual(['a', 'b c', 'd']);
        });

        it('should handle nested quotes', () => {
            const result = CommandParser.splitCommandLine('"hello world" foo');
            expect(result).toEqual(['hello world', 'foo']);
        });

        it('should handle empty input', () => {
            const result = CommandParser.splitCommandLine('');
            expect(result).toEqual(['']);
        });

        it('should handle multiple spaces', () => {
            const result = CommandParser.splitCommandLine('a   b');
            expect(result).toEqual(['a', 'b']);
        });

        it('should handle single word', () => {
            const result = CommandParser.splitCommandLine('hello');
            expect(result).toEqual(['hello']);
        });

        it('should handle triple-quoted strings', () => {
            const result = CommandParser.splitCommandLine('a "b c d" e "f g"');
            expect(result).toEqual(['a', 'b c d', 'e', 'f g']);
        });

        it('should handle unterminated quote', () => {
            const result = CommandParser.splitCommandLine('a "b c');
            expect(result).toEqual(['a', 'b c']);
        });

        it('should handle command with prefix', () => {
            const result = CommandParser.splitCommandLine('!command arg1 arg2');
            expect(result).toEqual(['!command', 'arg1', 'arg2']);
        });

        it('should handle leading/trailing spaces', () => {
            const result = CommandParser.splitCommandLine('  a b  ');
            expect(result).toEqual(['', 'a', 'b', '']);
        });
    });
});
