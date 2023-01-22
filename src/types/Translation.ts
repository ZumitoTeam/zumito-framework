export class Translation {
    text: Map<string, string> = new Map();

    constructor() {}

    get(language: string, params?: any): string {
        let text;
        if (this.has(language)) {
            text = this.text.get(language);
        } else {
            text = this.text.get('en');
        }
        if (params) {
            Object.keys(params).forEach((key) => {
                text = text.replace(`{${key}}`, params[key]);
            });
        }
        return text;
    }

    set(language: string, text: string): void {
        this.text.set(language, text);
    }

    has(language: string): boolean {
        return this.text.has(language);
    }

    getAll(): Map<string, string> {
        return this.text;
    }

    setAll(text: Map<string, string>): void {
        this.text = text;
    }
}
