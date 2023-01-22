export class DatabaseConfigLoader {
    public static getFromEnv() {
        const config: any = {};
        if (!process.env.DATABASE_TYPE) {
            console.warn(
                'No database type specified. Using tingodb as default.\nIf this is intended, Set DATABASE_TYPE to "tingodb" in your .env file.'
            );
            config.type = 'tingodb';
        } else {
            config.type = process.env.DATABASE_TYPE;
        }
        if (config.type == 'mysql') {
            config.host = process.env.DATABASE_HOST;
            config.port = process.env.DATABASE_PORT || 3306;
            config.username = process.env.DATABASE_USERNAME;
            config.password = process.env.DATABASE_PASSWORD;
            config.database = process.env.DATABASE_NAME;
        } else if (config.type == 'sqlite') {
            config.database = process.env.DATABASE_NAME;
        } else if (config.type == 'postgres') {
            config.host = process.env.DATABASE_HOST;
            config.port = process.env.DATABASE_PORT || 5432;
            config.username = process.env.DATABASE_USERNAME;
            config.password = process.env.DATABASE_PASSWORD;
            config.database = process.env.DATABASE_NAME;
        } else if (config.type == 'mongodb') {
            config.uri = process.env.DATABASE_URI;
        } else if (config.type == 'tingodb') {
            config.database = './db/tingodb';
        } else if (config.type == 'couchdb') {
            config.host = process.env.DATABASE_HOST;
            config.port = process.env.DATABASE_PORT || 5984;
            config.username = process.env.DATABASE_USERNAME;
            config.password = process.env.DATABASE_PASSWORD;
            config.database = process.env.DATABASE_NAME;
        }
        return config;
    }
}
