<template>
    <div
        class="animate-pulse"

        :style="{ animationDelay: pulseDelay }"
    >
        <div v-if="type === 'text'">
            <div class="h-2.5 bg-muted rounded-full" />
        </div>

        <div v-if="type === 'card'" class="h-full">
            <div
                class="bg-muted rounded w-full h-full"
                :style="aspectRatio ? { aspectRatio: typeof aspectRatio === 'number' ? aspectRatio : aspectRatio.toString() } : {}"
            />
        </div>

        <div v-if="type === 'avatar'">
            <div 
                class="bg-muted rounded-full" 
                :class="{
                    'w-8 h-8': size === 'small',
                    'w-10 h-10': size === 'medium',
                    'w-12 h-12': size === 'large'
                }"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

const PULSE_DURATION_MS = 2000;

export default defineComponent({
    name: "Skeleton",

    emits: ["click"],

    props: {
        type: {
            type: String as PropType<"text" | "card" | "avatar">,
            required: false
        },

        aspectRatio: {
            type: [String, Number] as PropType<string | number>,
            required: false
        },

        size: {
            type: String as PropType<"small" | "medium" | "large">,
            required: false,
            default: "medium"
        }
    },

    data() {
        return {
            pulseDelay: "0ms"
        };
    },

    mounted() {
        this.syncPulse();
    },

    activated() {
        this.syncPulse();
    },

    methods: {
        /**
         * Aligns this instance to the shared 2s pulse cycle so siblings stay in phase.
         */
        syncPulse() {
            if (typeof performance === "undefined") {
                this.pulseDelay = "0ms";

                return;
            }

            this.pulseDelay = `${-(performance.now() % PULSE_DURATION_MS)}ms`;
        }
    }
});
</script>
