import { Module } from "../types/Module.js";
import { ZumitoFramework } from "../ZumitoFramework.js";
import { InteractionCreate } from "./events/discord/interactionCreate.js";
import { MessageCreate } from "./events/discord/messageCreate.js";

export class baseModule extends Module {
    constructor(modulePath: string, framework: ZumitoFramework) {
        super(modulePath, framework);
    }

    async registerEvents(): Promise<any> {
        this.events.set('interactionCreate', new InteractionCreate());
        this.events.set('messageCreate', new MessageCreate());

        this.events.forEach(event => {
            this.registerDiscordEvent(event);
        });
    }
}