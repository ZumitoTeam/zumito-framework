import type { PresenceData } from "discord.js";

export interface PresenceDataRule {
    startTime?: Date;
    endTime?: Date;
}

export interface RuledPresenceData extends PresenceData {
    rules: PresenceDataRule[];
};

export interface StatusManagerOptions {
    statuses: PresenceData[];
    RuledStatuses: RuledPresenceData[];
    updateInterval: number;
    order: "random" | "sequential";
}
