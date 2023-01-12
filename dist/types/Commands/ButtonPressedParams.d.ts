import { ButtonInteraction, Client } from "discord.js";
import { ZumitoFramework } from "../../ZumitoFramework";
export interface ButtonPressedParams {
    path: string[];
    interaction: ButtonInteraction;
    client: Client;
    framework: ZumitoFramework;
    guildSettings?: any;
    trans: (key: string, params?: any) => string;
}
