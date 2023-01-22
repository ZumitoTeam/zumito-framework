import { DatabaseModel } from '../../types/DatabaseModel.js';
export declare class Guild extends DatabaseModel {
    getModel(schema: any): {
        guild_id: {
            type: any;
            required: boolean;
            unique: boolean;
        };
        lang: {
            type: any;
            default: string;
        };
        prefix: {
            type: any;
            default: string;
        };
        public: {
            type: any;
            default: boolean;
        };
        deleteCommands: {
            type: any;
            default: boolean;
        };
    };
    define(model: any, models: any): void;
}
