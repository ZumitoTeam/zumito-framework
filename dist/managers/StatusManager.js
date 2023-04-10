export class StatusManager {
    /**
     * @param {ZumitoFramework} framework - The framework instance.
     * @param {StatusManagerOptions} options - The options for the status manager.
     */
    framework;
    options;
    statusQueue = [];
    currentStatusIndex = 0;
    constructor(framework, options) {
        this.framework = framework;
        this.options = options;
        this.delegateEvents();
    }
    /**
     * Delegates the events.
     * @returns {void}
     * @private
     */
    delegateEvents() {
        this.framework.client.on("ready", () => {
            this.setStatus();
            setInterval(() => {
                this.setStatus();
            }, this.options.updateInterval);
        });
    }
    /**
     * Sets the status of the bot.
     * If no presence data is provided, the status will be set to next in the queue.
     * @param {PresenceData} presenceData - The presence data to set.
     * @returns {void}
     * @example
     */
    setStatus(presenceData) {
        if (presenceData) {
            this.framework.client.user.setPresence(presenceData);
            this.framework.eventEmitter.emit("statusChanged", presenceData);
        }
        else {
            let status = this.getNextStatus();
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
    getMatchingStatuses() {
        const now = new Date();
        const matchingStatuses = [];
        this.options.statuses.forEach((status) => matchingStatuses.push(status));
        this.options.RuledStatuses.forEach((status) => {
            let match = status.rules.some((rule) => {
                if (rule.startTime && rule.startTime > now)
                    return false;
                if (rule.endTime && rule.endTime < now)
                    return false;
                return true;
            });
            if (match)
                matchingStatuses.push(status);
        });
        return matchingStatuses;
    }
    /**
     * Gets the next status in the queue.
     * @returns {PresenceData}
     * @private
     */
    getNextStatus() {
        let statuses = this.getMatchingStatuses();
        if (statuses.length === 0)
            return undefined;
        if (this.options.order === "random") {
            return this.getRandomStatus();
        }
        else {
            this.currentStatusIndex = (this.currentStatusIndex + 1) % statuses.length;
            return statuses[this.currentStatusIndex];
        }
    }
    /**
     * Gets a random status.
     * @returns {PresenceData}
     * @public
     */
    getRandomStatus() {
        return this.getMatchingStatuses()[Math.floor(Math.random() * this.getMatchingStatuses().length)];
    }
}
