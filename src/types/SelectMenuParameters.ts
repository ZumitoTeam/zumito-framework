import { Client, Interaction, SelectMenuInteraction } from 'discord.js';

import { ZumitoFramework } from '../ZumitoFramework.js';

export interface SelectMenuParameters {
    path: string[];
    interaction: SelectMenuInteraction;
    client: Client;
    framework: ZumitoFramework;
    guildSettings?: any;
    trans: (key: string, params?: any) => string;
}
