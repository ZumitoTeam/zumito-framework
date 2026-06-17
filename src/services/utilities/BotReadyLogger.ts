import { ZumitoFramework } from '../../ZumitoFramework';

export class BotReadyLogger {

    /**
     * Log standard bot startup statistics (commands, events, modules, etc).
     */
    static log(bot: ZumitoFramework): void {
        console.log(`Loaded ${bot.commands.size} commands`);
        console.log(`Loaded ${bot.events.size} events`);
        console.log(`Loaded ${bot.modules.size} modules`);
        console.log(`Loaded ${bot.translations.getAll().size} translations`);
        console.log(`Loaded ${bot.routes.length} routes`);
    }
}
