import { ButtonInteraction, CommandInteraction } from 'discord.js';

import { Command } from '../../../../../definitions/commands/Command.js';
import { CommandType } from '../../../../../definitions/commands/CommandType.js';
import { EventParameters } from '../../../../../definitions/parameters/EventParameters.js';
import { FrameworkEvent } from '../../../../../definitions/FrameworkEvent.js';
import { ServiceContainer } from '../../../../../services/ServiceContainer.js';
import { InteractionHandler } from '../../../../../services/handlers/InteractionHandler.js';

export class InteractionCreate extends FrameworkEvent {
    once = false;
    source = 'discord';

    interactionHandler: InteractionHandler;

    constructor() {
        super();
        this.interactionHandler = ServiceContainer.getService(InteractionHandler);
    }

    async execute({
        interaction,
    }: EventParameters): Promise<void> {
        await this.interactionHandler.handleInteraction(interaction);
    }

}
