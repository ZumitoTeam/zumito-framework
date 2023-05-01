/* eslint-disable check-file/filename-naming-convention */
import { Module } from '../types/Module.js';
import { ZumitoFramework } from '../ZumitoFramework.js';
import { InteractionCreate } from './events/discord/InteractionCreate.js';
import { MessageCreate } from './events/discord/MessageCreate.js';
import { Guild } from './models/Guild.js';

export class baseModule extends Module {
    constructor(modulePath: string, framework: ZumitoFramework) {
        super(modulePath, framework);
    }

    async registerEvents(): Promise<any> {
        this.events.set('interactionCreate', new InteractionCreate());
        this.events.set('messageCreate', new MessageCreate());

        this.events.forEach((event) => {
            this.registerDiscordEvent(event);
        });
    }

    async registerModels() {
        this.models.push(new Guild(this.framework));
    }
}
