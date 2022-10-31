export declare class Translation {
    text: Map<string, string>;
    constructor();
    get(language: string, params?: any): string;
    set(language: string, text: string): void;
    has(language: string): boolean;
    getAll(): Map<string, string>;
    setAll(text: Map<string, string>): void;
}
