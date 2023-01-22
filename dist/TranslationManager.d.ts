import { Translation } from './types/Translation.js';
export declare class TranslationManager {
    private translations;
    private defaultLanguage;
    private languages;
    constructor();
    get(key: string, language?: string, params?: any): string;
    set(key: string, language: string, text: string): void;
    has(key: string): boolean;
    getAll(): Map<string, Translation>;
    setAll(translations: Map<string, Translation>): void;
    getDefaultLanguage(): string;
    setDefaultLanguage(language: string): void;
    getLanguages(): string[];
}
