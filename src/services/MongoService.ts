import { MongoClient, Db } from 'mongodb';

export class MongoService {
    public client: MongoClient;
    public db: Db;

    constructor(private uri: string, private dbName: string) {}

    async connect() {
        if (!this.uri) {
            throw new Error('MongoDB connection string not provided.');
        }
        this.client = new MongoClient(this.uri);
        await this.client.connect();
        this.db = this.client.db(this.dbName);
        return this.db;
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
        }
    }
}
