import type { App } from "vue";
import { setToastDefaultTimeout, toast } from "./toast";

export type ToastPluginOptions = {
    timeout?: number;
};

export const toastPlugin = {
    install(app: App, options?: ToastPluginOptions) {
        if (options?.timeout !== undefined) {
            setToastDefaultTimeout(options.timeout);
        }

        app.config.globalProperties.$toast = toast;
    }
};
