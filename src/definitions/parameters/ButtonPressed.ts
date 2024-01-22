import { ButtonPressedParams } from './ButtonPressedParams.js';

export abstract class ButtonPressed {
    abstract buttonPressed(buttonPressedParams: ButtonPressedParams): void;
}
