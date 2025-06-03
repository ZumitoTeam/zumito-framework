// eslint-disable-next-line check-file/filename-naming-convention
import { ServiceContainer } from "../..";
import 'reflect-metadata';

export function Injectable(): ClassDecorator {
    return function (target: Function) {
        const paramTypes = Reflect.getMetadata('design:paramtypes', target);
        const paramTypeNames = paramTypes.map((paramType: any) => paramType.name);
        ServiceContainer.addService(target, paramTypeNames);
    }
}