import { Module } from "../types/Module.js";
import { InteractionCreate } from "./events/discord/interactionCreate.js";
import { MessageCreate } from "./events/discord/messageCreate.js";
export class baseModule extends Module {
    constructor(modulePath, framework) {
        super(modulePath, framework);
    }
    async registerEvents() {
        this.events.set('interactionCreate', new InteractionCreate());
        this.events.set('messageCreate', new MessageCreate());
        this.events.forEach(event => {
            this.registerDiscordEvent(event);
        });
    }
}
