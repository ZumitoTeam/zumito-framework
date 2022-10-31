import { Translation } from "./types/Translation.js";
export class TranslationManager {
    translations = new Map();
    defaultLanguage = 'en';
    languages = [];
    constructor() { }
    get(key, language, params) {
        if (this.translations.has(key)) {
            return this.translations.get(key).get(language, params);
        }
        else {
            return key;
        }
    }
    set(key, language, text) {
        if (!this.translations.has(key)) {
            this.translations.set(key, new Translation());
        }
        this.translations.get(key).set(language, text);
        if (!this.languages.includes(language))
            this.languages.push(language);
    }
    has(key) {
        return this.translations.has(key);
    }
    getAll() {
        return this.translations;
    }
    setAll(translations) {
        this.translations = translations;
    }
    getDefaultLanguage() {
        return this.defaultLanguage;
    }
    setDefaultLanguage(language) {
        this.defaultLanguage = language;
    }
    getLanguages() {
        return this.languages;
    }
}
