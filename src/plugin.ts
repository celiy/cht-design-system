import type { App, Component } from "vue";
import { startTextContrastObserver } from "./textContrast";

function fileNameFromPath(path: string): string {
    const file = path.split("/").pop() ?? "";

    return file.replace(/\.vue$/, "");
}

function resolveComponentName(path: string, component: Component): string {
    const named = (component as { name?: string }).name;

    if (named) {
        return named;
    }

    return fileNameFromPath(path);
}

/**
 * Registers primitive and custom design-system components globally.
 * Internal helpers (`components/internal`) stay local imports.
 */
export const designSystemPlugin = {
    install(app: App) {
        const modules = {
            ...import.meta.glob("./components/*.vue", { eager: true }),
            ...import.meta.glob("./components/custom/*.vue", { eager: true }),
            ...import.meta.glob("./components/custom/charts/*.vue", { eager: true })
        };

        for (const [path, mod] of Object.entries(modules)) {
            const component = (mod as { default: Component }).default;

            app.component(resolveComponentName(path, component), component);
        }

        startTextContrastObserver();
    }
};
