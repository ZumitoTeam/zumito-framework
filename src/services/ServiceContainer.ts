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

    getService<T>(serviceClass: new (...args: any[]) => T | string): T {
        const serviceName = typeof serviceClass === 'string' ? serviceClass : serviceClass.name;
        const service = this.services.get(serviceName);
        if (!service) throw new Error(`Service ${serviceName} not found`);
        if (service.singleton && service.instance) return service.instance as T;
        const dependencies = service.dependencies.map(dependency => this.getServiceByName(dependency));
        const instance = new service.class(...dependencies);
        if (service.singleton) service.instance = instance;
        return instance as T;
    }

    getServiceByName<T>(serviceName: string): T {
        const service = this.services.get(serviceName);
        if (!service) throw new Error(`Service ${serviceName} not found`);
        if (service.singleton && service.instance) return service.instance as T;
        const dependencies = service.dependencies.map(dependency => this.getServiceByName(dependency));
        const instance = new service.class(...dependencies);
        if (service.singleton) service.instance = instance;
        return instance as T;
    }

    addInstance(serviceClass: any, instance: any) {
        const serviceName = typeof serviceClass == 'string' ? serviceClass : serviceClass.name;
        if (!this.services.has(serviceName)) return;
        this.services.get(serviceName).instance = instance;
    }

    hasService(serviceClass: any): boolean {
        const serviceName = typeof serviceClass == 'string' ? serviceClass : serviceClass.name;
        return this.services.has(serviceName);
    }

}
if (!global.ServiceContainer) global.ServiceContainer = new ServiceContainerManager();
export const ServiceContainer: ServiceContainerManager = global.ServiceContainer;