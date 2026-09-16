<template>
    <div
        class="flex items-center rounded border border-transparent px-2 py-0.5 text-xs font-semibold select-none"
        :class="[
            colorClass,
            {
                'bg-primary text-primary-foreground': !color && variant === 'primary',
                'border bg-secondary text-secondary-foreground': !color && variant === 'secondary',
                'bg-destructive text-destructive-foreground': !color && variant === 'destructive',
                'bg-warning text-warning-foreground': !color && variant === 'warning',
                'bg-info text-info-foreground': !color && variant === 'info',
                'bg-success text-success-foreground': !color && variant === 'success',
                'text-contrast bg-chart-1': !color && variant === 'chart-1',
                'text-contrast bg-chart-2': !color && variant === 'chart-2',
                'text-contrast bg-chart-3': !color && variant === 'chart-3',
                'text-contrast bg-chart-4': !color && variant === 'chart-4',
                'text-contrast bg-chart-5': !color && variant === 'chart-5',
                'cursor-pointer hover:underline': type === 'link'
            }
        ]"

        @click="handleClick"
    >
        <span v-if="label">
            {{ label }}
        </span>

        <slot v-else />
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "Badge",

    props: {
        label: {
            type: String,
            required: false
        },

        variant: {
            type: String as PropType<
                | "primary"
                | "secondary"
                | "destructive"
                | "warning"
                | "info"
                | "success"
                | "chart-1"
                | "chart-2"
                | "chart-3"
                | "chart-4"
                | "chart-5"
            >,
            default: "primary",
            required: false
        },

        /**
         * Tailwind color token (e.g. `sky-500`, `red-200`). Takes precedence over `variant`.
         */
        color: {
            type: String,
            required: false
        },

        type: {
            type: String as PropType<"normal" | "link">,
            default: "normal",
            required: false
        },

        link: {
            type: String,
            required: false
        },

        external: {
            type: Boolean,
            default: false,
            required: false
        }
    },

    emits: ["click"],

    computed: {
        colorClass(): string | null {
            if (!this.color) {
                return null;
            }

            return `bg-${this.color} text-contrast`;
        }
    },

    methods: {
        handleClick() {
            if (this.link && this.external) {
                const newWindow = window.open(this.link, "_blank");

                if (newWindow) {
                    newWindow.focus();
                }
            } else if (this.link && !this.external) {
                (this as any).$router?.push(this.link);
            }

            this.$emit("click");
        }
    }
});
</script>
