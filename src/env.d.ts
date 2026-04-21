/// <reference types="vite/client" />

declare module "*.vue" {
    import type { DefineComponent } from "vue";

    const component: DefineComponent<object, object, unknown>;
    export default component;
}


import type { Router } from "vue-router";

declare module "vue" {
    interface ComponentCustomProperties {
        $router: Router;
    }
}
