export declare abstract class FrameworkEvent {
    once: boolean;
    disabled: boolean;
    abstract execute(...args: any[]): any;
}
