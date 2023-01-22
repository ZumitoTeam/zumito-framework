export interface FrameworkSettings {
    logLevel?: number;
    debug?: boolean;
    discordClientOptions: {
        intents?: number;
        token: string;
        clientId: string;
    };
    defaultPrefix?: string;
    mongoQueryString: string;
}
