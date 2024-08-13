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
        const serviceName = typeof serviceClass == 'string' ? serviceClass : serviceClass.name;
        const service = this.services.get(serviceName);
        if (!service) throw new Error(`Service ${serviceName} not found`);
        if (service.singleton && service.instance) return service.instance;
        const dependencies = service.dependencies.map(dependency => this.getService(dependency));
        const instance = new service.class(...dependencies);
        if (service.singleton) service.instance = instance;
        return instance;
    }

    addInstance(serviceClass: any, instance: any) {
        const serviceName = typeof serviceClass == 'string' ? serviceClass : serviceClass.name;
        if (!this.services.has(serviceName)) return;
        this.services.get(serviceName).instance = instance;
    }

}

export const ServiceContainer = new ServiceContainerManager()