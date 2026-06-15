import {
    PermissionsBitField,
    TextChannel,
} from 'discord.js';
import {
    CommandExecutionChecker,
} from '../../../services/CommandExecutionChecker.js';
import { ServiceContainer } from '../../../services/ServiceContainer.js';
import { MemberPermissionChecker } from '../../../services/utilities/MemberPermissionChecker.js';

async function isAdminOrOwner(ctx: any): Promise<boolean> {
    if (!ctx.member || !ctx.guild) return false;
    if (ctx.member.id === ctx.guild.ownerId) return true;
    const permChecker = ServiceContainer.getService(MemberPermissionChecker);
    return permChecker.hasPermissionOnChannel(
        ctx.member,
        ctx.guild.channels?.cache?.first?.() || {},
        PermissionsBitField.Flags.Administrator,
    );
}

async function checkUserPermissions(ctx: any): Promise<boolean> {
    if (!ctx.member || !ctx.guild) return false;
    const permChecker = ServiceContainer.getService(MemberPermissionChecker);
    const channel = (ctx.message?.channel ||
        ctx.interaction?.channel) as TextChannel;

    for (const permission of ctx.command.userPermissions) {
        if (
            !(await permChecker.hasPermissionOnChannel(
                ctx.member,
                channel,
                permission,
            ))
        ) {
            return false;
        }
    }
    return true;
}

export function registerDefaultExecutionRules(): void {
    const checker = ServiceContainer.getService(CommandExecutionChecker);

    checker.addRule('no-bots', {
        canRun: (ctx) => {
            return !ctx.member?.user?.bot;
        },
        errorMessage: 'Bots cannot use commands.',
    });

    checker.addRule('dm-disabled', {
        canRun: (ctx) => {
            if (ctx.command.dm) return true;
            if (ctx.guild === null || ctx.guild === undefined) return false;
            return true;
        },
        errorMessage: 'This command cannot be used in DMs.',
    });

    checker.addRule('admin-only', {
        canRun: async (ctx) => {
            if (!ctx.command.adminOnly) return true;
            if (ctx.type === 'button' || ctx.type === 'selectMenu' || ctx.type === 'modal') return true;
            return isAdminOrOwner(ctx);
        },
        errorMessage: 'This command is restricted to administrators.',
    });

    checker.addRule('user-permissions', {
        canRun: async (ctx) => {
            if (!ctx.command.userPermissions || ctx.command.userPermissions.length === 0) return true;
            if (ctx.type === 'button' || ctx.type === 'selectMenu' || ctx.type === 'modal') return true;
            if (await isAdminOrOwner(ctx)) return true;
            return checkUserPermissions(ctx);
        },
        errorMessage: (ctx) =>
            `You do not have permission to use \`${ctx.command.name}\`.`,
    });

    checker.addRule('nsfw-only', {
        canRun: async (ctx) => {
            if (!ctx.command.nsfw) return true;
            if (ctx.type === 'button' || ctx.type === 'selectMenu' || ctx.type === 'modal') return true;
            if (await isAdminOrOwner(ctx)) return true;

            const channel = (ctx.message?.channel ||
                ctx.interaction?.channel) as TextChannel;
            if (!channel || !('nsfw' in channel)) return true;
            return (channel as any).nsfw === true;
        },
        errorMessage: 'This command can only be used in NSFW channels.',
    });
}
