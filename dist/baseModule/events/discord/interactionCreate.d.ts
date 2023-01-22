import { Command } from '../../../types/Command.js';
import { EventParameters } from '../../../types/EventParameters.js';
import { FrameworkEvent } from '../../../types/FrameworkEvent.js';
export declare class InteractionCreate extends FrameworkEvent {
    once: boolean;
    execute({ interaction, client, framework, }: EventParameters): Promise<void>;
    getTransMethod(commandInstance: Command, framework: any, guildSettings: any): (key: string, params?: any) => any;
}
