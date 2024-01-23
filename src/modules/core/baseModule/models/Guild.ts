import { DatabaseModel } from '../../../../definitions/DatabaseModel.js';

export class Guild extends DatabaseModel {
    getModel(schema: any) {
        return {
            guild_id: {
                type: schema.String,
                required: true,
                unique: true,
            },
            lang: {
                type: schema.String,
                default: 'en',
            },
            prefix: {
                type: schema.String,
                default: 'z-',
            },
            public: {
                type: schema.Boolean,
                default: false,
            },
            deleteCommands: {
                type: schema.Boolean,
                default: false,
            },
        };
    }

    define(model: any, models: any): void {
        model.validatesUniquenessOf('guild_id');
        model.validatesInclusionOf('lang', { in: ['en', 'es'] });
    }
}
