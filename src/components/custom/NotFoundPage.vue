<template>
    <main class="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <code
            class="text-xl! font-bold tracking-tight text-muted-foreground"
            aria-hidden="true"
        >
            {{ code }}
        </code>

        <h1 class="text-2xl font-semibold text-foreground">
            {{ title }}
        </h1>

        <p class="max-w-md text-sm text-muted-foreground">
            {{ description }}
        </p>

        <div
            v-if="$slots.action || showDefaultAction"

            class="mt-2"
        >
            <slot name="action">
                <Button
                    v-if="showDefaultAction"

                    variant="primary"
                    :label="homeLabel"

                    @click="onHomeClick"
                />
            </slot>
        </div>
    </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Button from "../Button.vue";

export default defineComponent({
    name: "NotFoundPage",

    components: {
        Button
    },

    props: {
        code: {
            type: String,
            default: "404"
        },

        title: {
            type: String,
            default: "Página não encontrada"
        },

        description: {
            type: String,
            default: "O endereço pode estar incorreto ou o conteúdo foi removido."
        },

        homeLabel: {
            type: String,
            default: "Voltar ao início"
        },

        /**
         * When set, the default action navigates with the router if available,
         * otherwise falls back to `window.location.assign`.
         */
        homeHref: {
            type: String,
            default: ""
        }
    },

    emits: ["home"],

    computed: {
        showDefaultAction(): boolean {
            return Boolean(this.homeHref);
        }
    },

    methods: {
        onHomeClick() {
            this.$emit("home");

            if (!this.homeHref) {
                return;
            }

            const router = this.$router;

            if (router) {
                void router.push(this.homeHref);

                return;
            }

            if (typeof window !== "undefined") {
                window.location.assign(this.homeHref);
            }
        }
    }
});
</script>
