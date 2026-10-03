/**
 * Design system plugin
 * This file is used to register the design system components globally.
 */

import type { Component } from "vue";
import { startTextContrastObserver } from "./textContrast";

type DesignSystemApp = {
    component: (name: string, component: Component) => void;
};

/**
 * Extract the file name from a path.
 * @param path The path to extract the file name from.
 * @returns The file name.
 */
function fileNameFromPath(path: string): string {
    const file = path.split("/").pop() ?? "";

    return file.replace(/\.vue$/, "");
}

/**
 * Resolve the component name from a path.
 * @param path The path to resolve the component name from.
 * @param component The component to resolve the name from.
 * @returns The component name.
 */
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
export function designSystemPlugin(app: DesignSystemApp) {
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
