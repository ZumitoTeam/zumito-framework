import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

export type EnvVarDefinitions = Record<string, string>;

export class EnvValidator {

    /**
     * Validate that all required env vars are present. If any are missing,
     * renders a visual error report and exits the process.
     * @param required - Map of { KEY: 'Human label' }
     */
    static validate(required: EnvVarDefinitions): void {
        const missing: string[] = [];
        const present: string[] = [];

        for (const [key] of Object.entries(required)) {
            if (process.env[key]) {
                present.push(key);
            } else {
                missing.push(key);
            }
        }

        if (missing.length === 0) return;

        const divider = chalk.yellow('━'.repeat(54));
        const envPath = path.join(process.cwd(), '.env');
        const hasEnvFile = fs.existsSync(envPath);

        console.error(`\n${divider}`);
        console.error(`  ${chalk.bold.red('CONFIGURATION ERROR')} — Missing environment variables`);
        console.error(divider);

        for (const key of present) {
            const label = required[key];
            const value = process.env[key]!;
            const display = value.length > 28 ? value.slice(0, 25) + '...' : value;
            console.error(`  ${chalk.green('✓')} ${chalk.green(key.padEnd(20))} ${chalk.dim(display)}`);
        }
        for (const key of missing) {
            const label = required[key];
            console.error(`  ${chalk.red('✗')} ${chalk.red(key.padEnd(20))} ${chalk.bold(label)}`);
        }

        console.error(divider);
        if (!hasEnvFile) {
            console.error(`  ${chalk.yellow('No .env file found in project root.')}`);
            console.error(`  ${chalk.dim('Create one from .env.example and fill in the missing values.')}`);
        } else {
            console.error(`  ${chalk.dim('.env file found but missing required variables.')}`);
        }
        console.error(divider + '\n');

        process.exit(1);
    }
}
