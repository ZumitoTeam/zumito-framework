import { ZumitoFramework } from '../ZumitoFramework.js';
/**
 * @name DatabaseModel
 * @description Base class for all database models.
 * @see {@link https://docs.zumito.ga/docs/custom/create-database-model}
 */
export declare abstract class DatabaseModel {
    readonly name: string;
    framework: ZumitoFramework;
    constructor(framework: ZumitoFramework);
    /**
     * @name getModel
     * @description This method should return the model that will be used by the framework.
     * @returns {any}
     * @example
     * ```ts
     * getModel(schema) {
     *  return {
     *      name:   { type: schema.String, required: true },
     *      age:    { type: schema.Number, required: true },
     *      email:  { type: schema.String,  limit: 155, unique: true },
     *      approved:   { type: schema.Boolean, default: false, index: true }
     *      joinedAt:   { type: schema.Date,    default: Date.now },
     * };
     * ```
     * @see {@link https://docs.zumito.ga/docs/custom/create-database-model#model}
     */
    abstract getModel(schema: any): any;
    /**
     * @name define
     * @description This method is called after all models are loaded. Here you can define relationships, validations, hooks, methods, etc.
     * @param {any} model The model that was returned by the {@link DatabaseModel.getModel} method.
     * @param {any} schema The schema of the database.
     * @example
     * Example of defining a relationship:
     * ```ts
     * define(model, models) {
     *  model.hasMany(models.SocialMediaUrl, {as: 'socialMediaUrl', foreignKey: 'userId'});
     * }
     * ```
     * @example
     * Example of defining a validation:
     * ```ts
     * define(model) {
     *  model.validatesPresenceOf('name', 'email')
     *  model.validatesUniquenessOf('email', {message: 'email is not unique'});
     *  model.validatesInclusionOf('gender', {in: ['male', 'female']});
     *  model.validatesNumericalityOf('age', {int: true});
     * ```
     * @example
     * Example of defining a hook:
     * ```ts
     * define(model) {
     *  model.afterUpdate = function (next) {
     *      this.updated = new Date();
     *      this.save();
     *      next();
     *  };
     * ```
     * @example
     * Example of defining a method:
     * ```ts
     * define(model) {
     * model.prototype.getNameAndAge = function () {
     *     return this.name + ', ' + this.age;
     * };
     * ```
     */
    abstract define(model: any, models: any): void;
}
