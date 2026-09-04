import { setToastDefaultTimeout, toast } from "./toast";

export type ToastPluginOptions = {
    timeout?: number;
};

type ToastApp = {
    config: {
        globalProperties: Record<string, unknown>;
    };
};

export function toastPlugin(app: ToastApp, options?: ToastPluginOptions) {
    if (options?.timeout !== undefined) {
        setToastDefaultTimeout(options.timeout);
    }

    app.config.globalProperties.$toast = toast;
}
