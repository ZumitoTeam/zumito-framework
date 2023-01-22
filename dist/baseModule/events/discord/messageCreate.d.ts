import { ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { EventParameters } from '../../../types/EventParameters.js';
import { FrameworkEvent } from '../../../types/FrameworkEvent.js';
export declare class MessageCreate extends FrameworkEvent {
    once: boolean;
    execute({ message, client, framework }: EventParameters): Promise<import("discord.js").Message<boolean>>;
    autocorrect(str: string, words: string[]): any;
    getErrorEmbed(error: any, parse: any): {
        embeds: EmbedBuilder[];
        components: ActionRowBuilder<import("discord.js").AnyComponentBuilder>[];
        allowedMentions: {
            repliedUser: boolean;
        };
    };
    parseError(error: any): any;
}
