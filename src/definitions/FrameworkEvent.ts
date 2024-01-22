export abstract class FrameworkEvent {
    once = false;
    disabled = false;
    abstract execute(...args: any[]): any;
}
