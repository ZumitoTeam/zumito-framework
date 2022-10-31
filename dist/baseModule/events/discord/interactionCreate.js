import { CommandType } from "../../../types/CommandType.js";
import { FrameworkEvent } from "../../../types/FrameworkEvent.js";
export class InteractionCreate extends FrameworkEvent {
    once = false;
    async execute({ interaction, client, framework }) {
        let guildSettings;
        if (interaction.guildId) {
            guildSettings = await framework.getGuildSettings(interaction.guildId);
        }
        if (interaction.isCommand()) {
            if (!framework.commands.has(interaction.commandName))
                return;
            const commandInstance = framework.commands.get(interaction.commandName);
            let args = new Map();
            commandInstance.args.forEach(arg => {
                let option = interaction.options.get(arg.name);
                if (option) {
                    switch (arg.type) {
                        case "user":
                            args.set(arg.name, option.user);
                            break;
                        case "member":
                            args.set(arg.name, option.member);
                            break;
                        default:
                            args.set(arg.name, option.value || option.user || option.role || option.channel || option.options || option.message || option.member || option.focused || option.autocomplete || option.attachment);
                            break;
                    }
                }
            });
            if (![CommandType.any, CommandType.separated, CommandType.slash].includes(commandInstance.type))
                return;
            if (commandInstance.type === CommandType.separated || commandInstance.type === CommandType.slash) {
                await commandInstance.executeSlashCommand({ client, interaction, args, framework, guildSettings });
            }
            else {
                await commandInstance.execute({ client, interaction, args, framework, guildSettings });
            }
        }
        else if (interaction.isButton()) {
        }
        else if (interaction.isSelectMenu()) {
            let path = interaction.customId.split('.');
            const command = framework.commands.get(path[0]);
            if (command.selectMenu) {
                command.selectMenu({ path, interaction, client, framework, guildSettings });
            }
        }
    }
}
