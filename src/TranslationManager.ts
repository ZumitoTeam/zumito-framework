import { Translation } from "./types/Translation.js";

export class TranslationManager {

    private translations: Map<string, Translation> = new Map();
    private defaultLanguage: string = 'en';
    private languages: string[] = [];

    constructor() {}

    get(key: string, language?: string, params?: any, fallbackString?: string): string {
        if (this.translations.has(key)) {
            return this.translations.get(key).get(language, params);
        } else if (fallbackString) {
            return fallbackString;
        } else {
            return key;
        }
    }

    set(key: string, language: string, text: string): void {
        if (!this.translations.has(key)) {
            this.translations.set(key, new Translation());
        }
        this.translations.get(key).set(language, text);
        if (!this.languages.includes(language)) this.languages.push(language);
    }

    has(key: string): boolean {
        return this.translations.has(key);
    }

    getAll(): Map<string, Translation> {
        return this.translations;
    }

    setAll(translations: Map<string, Translation>): void {
        this.translations = translations;
    }

    getDefaultLanguage(): string {
        return this.defaultLanguage;
    }

    setDefaultLanguage(language: string): void {
        this.defaultLanguage = language;
    }

    getLanguages(): string[] {
        return this.languages;
    } 

    getLanguagesDiscordFormat(): string[] {
        return this.languages.map(l => {
            switch(l) {
                case 'en': return 'en-GB';
                case 'es': return 'es-ES';
                case 'pt': return 'pt-BR';
                case 'sv': return 'sv-SE';
                case 'zh': return 'zh-CN';
                default: return l;
            }
        });
    }

    getLanguageDiscordFormat(language: string): string {
        switch(language) {
            case 'en': return 'en-GB';
            case 'es': return 'es-ES';
            case 'pt': return 'pt-BR';
            case 'sv': return 'sv-SE';
            case 'zh': return 'zh-CN';
            default: return language;
        }
    }
}