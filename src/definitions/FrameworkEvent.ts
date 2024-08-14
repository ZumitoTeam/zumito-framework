export abstract class FrameworkEvent {
    disabled = false;
    once = false;
    source: string;
    abstract execute(...args: any[]): any;
}
