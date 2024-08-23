import { Client, PresenceData } from "discord.js";

import { StatusManagerOptions } from "../definitions/StatusManagerOptions";
import { ZumitoFramework } from "../ZumitoFramework";

export class StatusManager {

    /**	
     * @param {ZumitoFramework} framework - The framework instance.
     * @param {StatusManagerOptions} options - The options for the status manager.
     */
    framework: ZumitoFramework;
    options: StatusManagerOptions;
    statusQueue: PresenceData[] = [];
    currentStatusIndex = 0;

    constructor(framework: ZumitoFramework, options: StatusManagerOptions) {
        this.framework = framework;
        this.options = options;
        this.delegateEvents();
    }

    /**
     * Delegates the events.
     * @returns {void}
     * @private
     */
    private delegateEvents() {
        if (this.framework.client.isReady()) {
            this.initialize();
        } else {
            (this.framework.client as Client).on("ready", () => {
                this.initialize();
            });
        }
    }

    initialize() {
        this.setStatus();
        if (this.options.updateInterval) {
            setInterval(() => {
                this.setStatus();
            }, this.options.updateInterval);
        }
    }

    /**
     * Sets the status of the bot.
     * If no presence data is provided, the status will be set to next in the queue.
     * @param {PresenceData} presenceData - The presence data to set.
     * @returns {void}
     * @example
     */
    setStatus(presenceData?: PresenceData) {
        if (presenceData) {
            this.framework.client.user.setPresence(presenceData);
            this.framework.eventEmitter.emit("statusChanged", presenceData);
        } else {
            const status = this.getNextStatus();
            if (status) {
                this.framework.client.user.setPresence(status);
                this.framework.eventEmitter.emit("statusChanged", status);
            }
        }
    }

    /**
     * Gets list of all statuses matching rules if any.
     * @returns {PresenceData[]}
     * @public
     */
    public getMatchingStatuses(): PresenceData[] {
        const now = new Date();
        const matchingStatuses: PresenceData[] = [];
        this.options.statuses.forEach((status) => matchingStatuses.push(status));
        this.options.RuledStatuses.forEach((status) => {
            const match = status.rules.some((rule) => {
                if (rule.startTime && rule.startTime > now) return false;
                if (rule.endTime && rule.endTime < now) return false;
                return true;
            });
            if (match) matchingStatuses.push(status);
        });
        return matchingStatuses;
    }

    /**
     * Gets the next status in the queue.
     * @returns {PresenceData}
     * @private
     */
    private getNextStatus(): PresenceData | undefined {
        const statuses = this.getMatchingStatuses();
        if (statuses.length === 0) return undefined;
        if (this.options.order === "random") {
            return this.getRandomStatus();
        } else {
            this.currentStatusIndex = (this.currentStatusIndex + 1) % statuses.length;
            return statuses[this.currentStatusIndex];
        }
    }

    /**
     * Gets a random status.
     * @returns {PresenceData}
     * @public
     */
    public getRandomStatus(): PresenceData {
        return this.getMatchingStatuses()[Math.floor(Math.random() * this.getMatchingStatuses().length)];
    }

}