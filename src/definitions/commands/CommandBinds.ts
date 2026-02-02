import { ModalSubmitParameters } from '../../definitions/parameters/ModalSubmitParameters.js';
import { ButtonPressedParams } from '../../index.js';
import { SelectMenuParameters } from '../parameters/SelectMenuParameters.js';

export type CommandBinds = {
    selectMenu?: (params: SelectMenuParameters) => Promise<void>
    modalSubmit?: (params: ModalSubmitParameters) => Promise<void>
    buttonClick?: (params: ButtonPressedParams) => Promise<void>
}