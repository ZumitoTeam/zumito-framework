"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseModule = void 0;
const Module_1 = require("../types/Module");
const interactionCreate_1 = require("./events/discord/interactionCreate");
const messageCreate_1 = require("./events/discord/messageCreate");
class baseModule extends Module_1.Module {
    constructor(modulePath, framework) {
        super(modulePath, framework);
    }
    registerEvents() {
        this.events.set('interactionCreate', new interactionCreate_1.InteractionCreate());
        this.events.set('messageCreate', new messageCreate_1.MessageCreate());
    }
}
exports.baseModule = baseModule;
