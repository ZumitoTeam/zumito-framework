import { ModalSubmitInteraction } from 'discord.js';

export interface ModalSubmitParameters {
    path: string[];
    interaction: ModalSubmitInteraction;
    /**
     * @deprecated
     */
    guildSettings?: any;
    trans: (key: string, params?: any) => string;
}
