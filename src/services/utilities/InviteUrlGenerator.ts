export class InviteUrlGenerator {
    
    public generateBotInviteUrl(clientId?: string, permissions?: number) {
        if (!clientId) {
            clientId = process.env.DISCORD_CLIENT_ID;
        }
        if (!permissions) {
            permissions = 0;
        }

        if (!clientId) throw new Error('Client ID is not defined');
        if (!permissions) throw new Error('Permissions are not defined');

        return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot`;
    }
}