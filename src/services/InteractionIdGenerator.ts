export interface SelectMenuIdParams {
    id: string;
    params?: string[];
}

export class InteractionIdGenerator {
    module: string;
    command: string;

    constructor(module?: string, command?: string) {
        this.module = module;
        this.command = command;
    }

    protected generatePrefix(): string {
        const components = [];
        if (this.module) components.push(this.module);
        if (this.command) components.push(this.command);
        return components.join('.');
    }

    public generateSelectMenuId(id: string, params?: string[]): string {
        let components = [this.generatePrefix()];
        if (id) components.push(id);
        if (params) components = components.concat(params);
        return components.join('.');
    }

    public generateButtonId(id: string, params?: string[]): string {
        let components = [this.generatePrefix()];
        if (id) components.push(id);
        if (params) components = components.concat(params);
        return components.join('.');
    }

    public generateModalId(id: string, params?: string[]): string {
        let components = [this.generatePrefix()];
        if (id) components.push(id);
        if (params) components = components.concat(params);
        return components.join('.');
    }
}
