import type { Directive } from "vue";
import type { Router } from "vue-router";
import type { ProjectState } from "@base/project";
import type { ToastApi } from "../toast/toast";

type TooltipPlacement = "top" | "bottom" | "left" | "right" | "center";

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
}

export {};
