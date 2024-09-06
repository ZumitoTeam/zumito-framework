import { SelectMenuParameters } from '../parameters/SelectMenuParameters.js';

export type CommandBinds = {
    selectMenu?: (params: SelectMenuParameters) => Promise<void>
}