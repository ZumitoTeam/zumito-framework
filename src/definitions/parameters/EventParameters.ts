import { Client, Interaction, Message } from 'discord.js';
import { ZumitoFramework } from '../../ZumitoFramework.js';

export interface EventParameters {
    message?: Message;
    interaction?: Interaction;
    /**
     * @deprecated 
     */
    client?: Client;
    /**
     * @deprecated 
     */
    framework: ZumitoFramework;
}
