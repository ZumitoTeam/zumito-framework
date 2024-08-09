import { GuildMember, PermissionsBitField, TextChannel } from "discord.js";
import { ZumitoFramework } from "../ZumitoFramework";

export class MemberPermissionChecker {

    /**
     * Checks if a member has a permission in a channel.
     * @param member
     * @param channel
     * @param permission
     * @returns {Promise<boolean>}
     * @public
     * @example
     * // returns true if the member has the permission
     * memberHasPermission(member, channel, Permissions.FLAGS.MANAGE_MESSAGES);
     * @example
     * // returns true if the member has the permission
     * memberHasPermission(member, channel, Permissions.FLAGS.MANAGE_MESSAGES | Permissions.FLAGS.MANAGE_CHANNELS);
     * @example
     */
    public async hasPermissionOnChannel(
        member: GuildMember,
        channel: TextChannel,
        permission: bigint
    ) {
        const memberPermission: PermissionsBitField =
            await channel.permissionsFor(member);
        return memberPermission.has(permission);
    }
}