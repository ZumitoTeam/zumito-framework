import { ButtonPressedParams } from "./ButtonPressedParams";

export abstract class ButtonPressed {

    abstract buttonPressed({}: ButtonPressedParams): void;

}