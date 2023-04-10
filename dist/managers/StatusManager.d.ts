import { PresenceData } from "discord.js";
import { StatusManagerOptions } from "../types/StatusManagerOptions";
import { ZumitoFramework } from "../ZumitoFramework";
export declare class StatusManager {
    /**
     * @param {ZumitoFramework} framework - The framework instance.
     * @param {StatusManagerOptions} options - The options for the status manager.
     */
    framework: ZumitoFramework;
    options: StatusManagerOptions;
    statusQueue: PresenceData[];
    currentStatusIndex: number;
    constructor(framework: ZumitoFramework, options: StatusManagerOptions);
    /**
     * Delegates the events.
     * @returns {void}
     * @private
     */
    private delegateEvents;
    /**
     * Sets the status of the bot.
     * If no presence data is provided, the status will be set to next in the queue.
     * @param {PresenceData} presenceData - The presence data to set.
     * @returns {void}
     * @example
     */
    setStatus(presenceData?: PresenceData): void;
    /**
     * Gets list of all statuses matching rules if any.
     * @returns {PresenceData[]}
     * @public
     */
    getMatchingStatuses(): PresenceData[];
    /**
     * Gets the next status in the queue.
     * @returns {PresenceData}
     * @private
     */
    private getNextStatus;
    /**
     * Gets a random status.
     * @returns {PresenceData}
     * @public
     */
    getRandomStatus(): PresenceData;
}
