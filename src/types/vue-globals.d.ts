import type { ProjectState } from "@base/project";

declare module "vue" {
    interface ComponentCustomProperties {
        /**
         * Injected by `cht-base` (`projectPlugin`). Types match `cht-base/src/project.ts`.
         */
        $project: ProjectState;
    }
}

declare module "@vue/runtime-core" {
    interface ComponentCustomProperties {
        $project: ProjectState;
    }
}

export {};
