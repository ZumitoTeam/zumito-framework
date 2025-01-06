import { ZumitoFramework } from "../../ZumitoFramework";
import type { FrameworkSettings } from "../settings/FrameworkSettings";

export type LauncherConfig = {
    callbacks?: {
        load?: (bot: ZumitoFramework) => any;
    }
} & FrameworkSettings;

