#!/usr/bin/env node

// eslint-disable-next-line check-file/filename-naming-convention
import { ZumitoFramework, FrameworkSettings } from './index';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

import dotenv from 'dotenv';
import { RecursiveObjectMerger } from './services/utilities/RecursiveObjectMerger';
import { EnvValidator } from './services/utilities/EnvValidator';
import { BotReadyLogger } from './services/utilities/BotReadyLogger';
import { LauncherConfig } from './definitions/config/LauncherConfig';
dotenv.config();

const REQUIRED_ENV_VARS = {
    DISCORD_TOKEN: 'Discord Bot Token',
    DISCORD_CLIENT_ID: 'Discord Client ID',
};

EnvValidator.validate(REQUIRED_ENV_VARS);

const defaultConfig: FrameworkSettings = {
    discordClientOptions: {
        intents: 3276799,
        token: process.env.DISCORD_TOKEN!,
        clientId: process.env.DISCORD_CLIENT_ID!,
    },
    defaultPrefix: process.env.BOT_PREFIX || "z-",
    logLevel: parseInt(process.env.LOGLEVEL || "3"),
};

const configFilePath = path.join(process.cwd(), 'zumito.config.ts');
if (!fs.existsSync(configFilePath)) {
    console.error(`Config file not found at ${configFilePath}. Please ensure the file exists.`);
    process.exit(1);
}
import(pathToFileURL(configFilePath).href)
    .then(({ config: userConfig }: { config: LauncherConfig }) => {
        const config: FrameworkSettings = RecursiveObjectMerger.merge(defaultConfig, userConfig);
        new ZumitoFramework(config, (bot: ZumitoFramework) => {
            BotReadyLogger.log(bot);
            userConfig.callbacks?.load?.(bot);
        });
    })
    .catch((error) => {
        console.error(`Failed to load config file at ${configFilePath}:`);
        throw error;
        process.exit(1);
    });