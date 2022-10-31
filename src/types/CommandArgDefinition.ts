import { CommandChoiceDefinition} from './CommandChoiceDefinition.js';

export interface CommandArgDefinition {
    name: string;
    optional: boolean;
    type: string;
    choices?: CommandChoiceDefinition[] | Function;
}
