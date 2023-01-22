export class Translation {
    text = new Map();
    constructor() { }
    get(language, params) {
        let text;
        if (this.has(language)) {
            text = this.text.get(language);
        }
        else {
            text = this.text.get('en');
        }
        if (params) {
            Object.keys(params).forEach((key) => {
                text = text.replace(`{${key}}`, params[key]);
            });
        }
        return text;
    }
    set(language, text) {
        this.text.set(language, text);
    }
    has(language) {
        return this.text.has(language);
    }
    getAll() {
        return this.text;
    }
    setAll(text) {
        this.text = text;
    }
}
