<template>
    <div
        v-if="icon"

        class="flex h-fit shrink-0 items-center justify-center"
        :class="backgroundClass"
    >
        <i
            class="text-md"
            :class="iconClass"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

type ItemVariant = "primary" | "secondary" | "success" | "warning" | "destructive" | "info";

export default defineComponent({
    props: {
        /**
         * The icon of the component
         */
        icon: {
            type: String
        },

        /**
         * The type of the itemicon
         */
        type: {
            type: String as PropType<"card" | "icon">,
            default: "card"
        },

        /**
         * The variant of the component
         */
        variant: {
            type: String as PropType<ItemVariant>,
            default: "primary",
            required: false
        },

        /**
         * Whether the component is disabled
         */
        disabled: {
            type: Boolean,
            default: false
        },

        /**
         * The background style of the component
         */
        backgroundStyle: {
            type: String
        },

        /**
         * The icon style of the component
         */
        iconStyle: {
            type: String
        }
    },

    computed: {
        /**
         * Font Awesome icon class.
         */
        iconLabel(): string {
            if (!this.icon) {
                return "";
            }

            const icon = this.icon.trim();

            if (icon.includes(" ")) {
                return icon;
            }

            if (icon.startsWith("fa-")) {
                return `fa-solid ${icon}`;
            }

            return `fa-solid fa-${icon}`;
        },

        /**
         * Gets the icon class
         * @returns {unknown} The icon class
         */
        iconClass() {
            if (this.iconStyle) {
                return [this.iconLabel, this.iconStyle];
            }

            return [
                this.iconLabel,
                {
                    "text-primary": this.variant === "primary",
                    "text-secondary-foreground": this.variant === "secondary",
                    "text-success": this.variant === "success",
                    "text-warning": this.variant === "warning",
                    "text-destructive": this.variant === "destructive",
                    "text-info": this.variant === "info"
                }
            ];
        },

        /**
         * Gets the background class
         * @returns {unknown} The background class
         */
        backgroundClass() {
            if (this.type === "icon") {
                return ["pt-1"];
            }

            if (this.type === "card" && this.backgroundStyle) {
                return ["p-3.5 rounded", this.backgroundStyle];
            }

            return [
                "p-3.5 rounded",
                {
                    "bg-primary/15": this.variant === "primary",
                    "bg-secondary": this.variant === "secondary",
                    "bg-success/15": this.variant === "success",
                    "bg-warning/15": this.variant === "warning",
                    "bg-destructive/15": this.variant === "destructive",
                    "bg-info/15": this.variant === "info",
                    "opacity-50": this.disabled
                }
            ];
        }
    }
});
</script>
