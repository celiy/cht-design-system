import type { Directive } from "vue";
import type { Router } from "vue-router";
import type { AriaAttributes } from "@vue/runtime-dom";
import type { ProjectState } from "@base/project";
import type { ToastApi } from "../toast/toast";

type TooltipPlacement = "top" | "bottom" | "left" | "right" | "center";

/**
 * `vue-router` components are registered globally by the host app. The design
 * system has no runtime dependency on `vue-router`, so they are only typed
 * here to keep the templates type-safe whenever a router is present.
 */
type RouterComponents = {
    RouterLink: typeof import("vue-router").RouterLink;
    RouterView: typeof import("vue-router").RouterView;
};

type TooltipBinding = string | {
    content: string;
    placement?: TooltipPlacement;
    html?: boolean;
    offset?: number;
    maxWidth?: string;
};

declare module "vue" {
    interface ComponentCustomProperties {
        /**
         * Injected by `cht-base` (`projectPlugin`). Types match `cht-base/src/project.ts`.
         */
        $project: ProjectState;
        $toast: ToastApi;
        /**
         * Available when the host app registers vue-router (e.g. `cht-base`).
         */
        $router?: Router;
    }

    interface GlobalDirectives {
        vTooltip: Directive<HTMLElement, TooltipBinding>;
    }

    interface GlobalComponents extends RouterComponents {}
}

declare module "@vue/runtime-core" {
    interface ComponentCustomProperties {
        $project: ProjectState;
        $toast: ToastApi;
        $router?: Router;
    }

    interface GlobalDirectives {
        vTooltip: Directive<HTMLElement, TooltipBinding>;
    }

    interface GlobalComponents extends RouterComponents {}
}

/**
 * `data-*` attributes are valid HTML and are used as styling/behavior hooks by
 * the design system (e.g. `data-cht-toast`, `data-cht-floating-panel`).
 */
declare module "@vue/runtime-dom" {
    interface HTMLAttributes {
        [key: `data-${string}`]: unknown;
    }
}

/**
 * `aria-*` attributes are valid on every element and component, but Vue only
 * type-checks components against their declared props. Vue does not normalize
 * `aria-*` names either, so they must be allowed here instead of as props.
 */
declare module "@vue/runtime-core" {
    interface ComponentCustomProps extends AriaAttributes {}
}

export {};
