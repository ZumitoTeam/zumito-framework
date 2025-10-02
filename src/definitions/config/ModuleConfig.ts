export type zumitoModulesDependency = {
    type: 'zumitoModule';
    packageName: string;
    minVersion?: string;
};

export type npmDependency = {
    type: 'npm';
    packageName: string;
    minVersion?: string;
};

export type dependency = zumitoModulesDependency | npmDependency;

export type ModuleConfig = {
    environmentVariables?: {
        key: string;
        defaultValue?: string;
        label?: string;
        description?: string;
    }[],
    moduleConstructorConfig?: {
        key: string;
        defaultValue?: string;
        label?: string;
        description?: string;
    }[],
    dependencies?: dependency[],
    
    /* 
     * This is a callback function that will be called when the module is installed
     * Useful for performing setup tasks with ts-morph to make easier automated module installation
     * 
     * Zumito-cli will call this function after automatic addition of module to user zumito.config.ts
     */
    install?: () => Promise<void> | void;
};

