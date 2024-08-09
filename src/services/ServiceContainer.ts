type service =  {
    class: any,
    dependencies: string[],
    singleton: boolean,
    instance?: any
}

class ServiceContainerManager {

    private services: Map<string, service> = new Map();

    addService(serviceClass: any, dependencies: string[], singleton = false, instance?: any) {
        this.services.set(serviceClass.name, {
            class: serviceClass,
            dependencies,
            singleton,
            instance
        });
    }

    getService(serviceClass: any) {
        const classname = typeof serviceClass === 'string' ? serviceClass : serviceClass.name;
        const service = this.services.get(classname);
        if (!service) throw new Error(`Service ${classname} not found`);
        if (service.singleton && service.instance) return service.instance;
        const dependencies = service.dependencies.map(dependency => this.getService(dependency));
        const instance = new service.class(...dependencies);
        if (service.singleton) service.instance = instance;
        return instance;
    }

    addInstance(serviceClass: any, instance: any) {
        if (!this.services.has(serviceClass.name)) return;
        this.services.get(serviceClass.name).instance = instance;
    }

}

export const ServiceContainer = new ServiceContainerManager()