export abstract class FrameworkEvent {
    once: boolean = false;
    disabled: boolean = false;
    abstract execute(...args: any[]): any;
}