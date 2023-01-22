/**
 * @name DatabaseModel
 * @description Base class for all database models.
 * @see {@link https://docs.zumito.ga/docs/custom/create-database-model}
 */
export class DatabaseModel {
    // set name to the name of the class capitalized first letter
    name = this.constructor.name.charAt(0).toUpperCase() +
        this.constructor.name.slice(1);
    framework;
    constructor(framework) {
        this.framework = framework;
    }
}
