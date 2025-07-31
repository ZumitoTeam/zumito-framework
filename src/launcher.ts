#!/usr/bin/env node

// eslint-disable-next-line check-file/filename-naming-convention
import { ZumitoFramework, FrameworkSettings } from './index';
import path from 'path';
import fs from 'fs';

import dotenv from 'dotenv';
import { RecursiveObjectMerger } from './services/utilities/RecursiveObjectMerger';
import { LauncherConfig } from './definitions/config/LauncherConfig';
dotenv.config();
 
if (!process.env.DISCORD_TOKEN) {
    throw new Error("Discord Token not found (DISCORD_TOKEN)");
} else if (!process.env.DISCORD_CLIENT_ID) {
    throw new Error("Discord Client ID not found (DISCORD_CLIENT_ID)");
} else if (!process.env.MONGO_URI) {
    throw new Error("No MongoDB connection string specified in .env file (MONGO_URI)");
}

const defaultConfig: FrameworkSettings = {
    discordClientOptions: {
        intents: 3276799,
        token: process.env.DISCORD_TOKEN!,
        clientId: process.env.DISCORD_CLIENT_ID!,
    },
    defaultPrefix: process.env.BOT_PREFIX || "z-",
    mongoQueryString: process.env.MONGO_URI!,
    logLevel: parseInt(process.env.LOGLEVEL || "3"),
};

const configFilePath = path.join(process.cwd(), 'zumito.config.ts');
if (!fs.existsSync(configFilePath)) {
    console.error(`Config file not found at ${configFilePath}. Please ensure the file exists.`);
    process.exit(1);
}
import(configFilePath)
    .then(({ config: userConfig }: { config: LauncherConfig }) => {
        const config: FrameworkSettings = RecursiveObjectMerger.merge(defaultConfig, userConfig);
        new ZumitoFramework(config, (bot: ZumitoFramework) => { // Callback function when bot is ready
            // Log number of commands loaded
            console.log(`Loaded ${bot.commands.size} commands`);
            // Log number of events loaded
            console.log(`Loaded ${bot.events.size} events`);
            // Log number of modules loaded
            console.log(`Loaded ${bot.modules.size} modules`);
            // Log number of translations loaded
            console.log(`Loaded ${bot.translations.getAll().size} translations`);
            // Log number of routes registered
            console.log(`Loaded ${bot.routes.length} routes`);
            userConfig.callbacks?.load?.(bot);
        });
    })
    .catch((error) => {
        console.error(`Failed to load config file at ${configFilePath}:`, error.message || error);
        process.exit(1);
    });