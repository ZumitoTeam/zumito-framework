import { EventParameters } from "../../../types/EventParameters.js";
import { FrameworkEvent } from "../../../types/FrameworkEvent.js";
export declare class InteractionCreate extends FrameworkEvent {
    once: boolean;
    execute({ interaction, client, framework }: EventParameters): Promise<void>;
}
