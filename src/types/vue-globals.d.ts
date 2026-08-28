import type { ProjectState } from "@base/project";
import type { ToastApi } from "../toast/toast";

declare module "vue" {
    interface ComponentCustomProperties {
        /**
         * Injected by `cht-base` (`projectPlugin`). Types match `cht-base/src/project.ts`.
         */
        $project: ProjectState;
        $toast: ToastApi;
    }
}

declare module "@vue/runtime-core" {
    interface ComponentCustomProperties {
        $project: ProjectState;
        $toast: ToastApi;
    }
}

export {};
