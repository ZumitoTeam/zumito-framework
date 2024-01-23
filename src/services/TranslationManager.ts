import { Translation } from '../definitions/Translation.js';
import fs from 'fs';
import path from 'path';
import * as chokidar from 'chokidar';
import boxen from 'boxen';
import chalk from "chalk";

export class TranslationManager {
    private translations: Map<string, Translation> = new Map();
    private defaultLanguage = 'en';
    private languages: string[] = [];

    get(key: string, language?: string, params?: unknown): string {
        if (this.translations.has(key)) {
            return this.translations.get(key).get(language, params);
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

    importTranslationsJson(path: string, lang: string, json: object|string): void {
        if (typeof json === 'object') {
            for (const key in json) {
                this.importTranslationsJson(path + key + '.', lang, json[key]);
            }
        } else {
            this.set(path.slice(0, -1), lang, json);
        }
    }

    /**
     * Returns content of translation json file
     * @async
     * @public
     * @param filePath - Absolute path to translations file
     * @returns {Promise<any>}
     */
    async loadTranslationFile(filePath: string): Promise<object> {
        const json: any = fs.readFileSync(filePath);
        return JSON.parse(json);
    }

    /**
     * load translation files from folder and subfolders
     * @async
     * @public
     * @param folderPath - Absolute path to translations files folder
     * @param [baseKey=''] - (Optional) the translation key to start from. All translations loaded will be children translations of that key
     * @param watch - Watch folder for file modifications
     * @returns {Promise<void>}
     */
    async registerTranslationsFromFolder(folderPath: string, baseKey = '', watch = false) {
        if (!fs.existsSync(path.join(folderPath))) return;
        const files = fs.readdirSync(folderPath);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const json = await this.loadTranslationFile(path.join(folderPath, file));
                const lang = file.slice(0, -5);
                this.importTranslationsJson(baseKey, lang, json);
                console.debug('[🆕🟢 ] Translations file ' + chalk.blue(path.join(folderPath, file)) + ' loaded');
            } else if (
                fs
                    .lstatSync(
                        path.join(folderPath, file)
                    )
                    .isDirectory()
            ) {
                let key = baseKey;
                if (baseKey != '') key += ".";
                key += path.dirname(path.join(folderPath, file));
                await this.registerTranslationsFromFolder(path.join(folderPath, file), key, watch);
            }
        }
        if (watch) {
            this.watchTranslationFolder(folderPath, baseKey)
        }
    }

    watchTranslationFolder(folderPath: string, baseKey: string) {
        chokidar
            .watch(path.resolve(folderPath), {
                ignored: /^\./,
                persistent: true,
                ignoreInitial: true,
            })
            .on('add', async (filePath: string) => {
                const json = await this.loadTranslationFile(filePath);
                const lang = filePath.replace(/^.*[\\/]/, '').slice(0, -5);
                this.importTranslationsJson(baseKey, lang, json);
                console.debug('[🆕🟢 ] Translations file ' + chalk.blue(filePath) + ' loaded');
            })
            .on('change', async (filePath: string) => {
                const json = await this.loadTranslationFile(filePath);
                const lang = filePath.replace(/^.*[\\/]/, '').slice(0, -5);
                this.importTranslationsJson(baseKey, lang, json);
                console.debug('[🆕🟢 ] Translations file ' + chalk.blue(filePath) + ' loaded');
            })
            .on('error', (error: Error) => {
                console.error('[🔄🔴 ] Error reloading translation file');
                console.log(boxen(error + '\n' + error.stack, { padding: 1 }));
            })
            // TODO: Handle file removal
            //.on('unlink', function(path) {console.log('File', path, 'has been removed');})
    }
}
