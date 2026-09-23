<template>
    <div
        class="flex items-center rounded px-2 py-0.5 text-xs font-semibold select-none"
        :class="rootClass"
        :style="rootStyle"

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

type BadgeVariant =
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
    | "chart-5";

const FILL_VARIANT_CLASS: Record<BadgeVariant, string> = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    warning: "bg-warning text-warning-foreground",
    info: "bg-info text-info-foreground",
    success: "bg-success text-success-foreground",
    "chart-1": "bg-chart-1 text-contrast",
    "chart-2": "bg-chart-2 text-contrast",
    "chart-3": "bg-chart-3 text-contrast",
    "chart-4": "bg-chart-4 text-contrast",
    "chart-5": "bg-chart-5 text-contrast"
};

const BORDERED_VARIANT_CLASS: Record<BadgeVariant, string> = {
    primary: "border-2 border-primary! bg-transparent text-primary",
    secondary: "border-2 border-secondary! bg-transparent text-secondary-foreground",
    destructive: "border-2 border-destructive! bg-transparent text-destructive",
    warning: "border-2 border-warning! bg-transparent text-warning",
    info: "border-2 border-info! bg-transparent text-info",
    success: "border-2 border-success! bg-transparent text-success",
    "chart-1": "border-2 border-chart-1! bg-transparent text-chart-1",
    "chart-2": "border-2 border-chart-2! bg-transparent text-chart-2",
    "chart-3": "border-2 border-chart-3! bg-transparent text-chart-3",
    "chart-4": "border-2 border-chart-4! bg-transparent text-chart-4",
    "chart-5": "border-2 border-chart-5! bg-transparent text-chart-5"
};

function cssColorToken(token: string): string {
    return `var(--color-${token})`;
}

export default defineComponent({
    name: "Badge",

    props: {
        label: {
            type: String,
            required: false
        },

        variant: {
            type: String as PropType<BadgeVariant>,
            default: "primary",
            required: false
        },

        variantStyle: {
            type: String as PropType<"fill" | "bordered">,
            default: "fill",
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
        },

        textColor: {
            type: String,
            required: false
        }
    },

    emits: ["click"],

    computed: {
        isBordered(): boolean {
            return this.variantStyle === "bordered";
        },

        rootClass(): Array<string | Record<string, boolean>> {
            const classes: Array<string | Record<string, boolean>> = [];

            if (this.color) {
                classes.push(this.isBordered ? "border-2 bg-transparent" : "text-contrast");
            } else if (this.isBordered) {
                classes.push(BORDERED_VARIANT_CLASS[this.variant] ?? BORDERED_VARIANT_CLASS.primary);
            } else {
                classes.push(FILL_VARIANT_CLASS[this.variant] ?? FILL_VARIANT_CLASS.primary);
            }

            if (this.textColor === "contrast") {
                classes.push("text-contrast");
            }

            if (this.type === "link") {
                classes.push("cursor-pointer hover:underline");
            }

            return classes;
        },

        rootStyle(): Record<string, string> {
            const style: Record<string, string> = {};

            if (this.color) {
                const paint = cssColorToken(this.color);

                if (this.isBordered) {
                    style.borderColor = paint;
                } else {
                    style.backgroundColor = paint;
                }
            }

            if (this.textColor && this.textColor !== "contrast") {
                style.color = cssColorToken(this.textColor);
            } else if (this.color && this.isBordered && this.textColor !== "contrast") {
                style.color = cssColorToken(this.color);
            }

            return style;
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
                this.$router?.push(this.link);
            }

            this.$emit("click");
        }
    }
});
</script>
