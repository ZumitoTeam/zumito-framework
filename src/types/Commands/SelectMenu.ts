import { SelectMenuParameters } from '../SelectMenuParameters.js';

export abstract class SelectMenuSelected {
    abstract selectMenu(selectMenuParameters: SelectMenuParameters): void;
}
