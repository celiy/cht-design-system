<template>
    <div
        v-if="icon"

        class="flex shrink-0 items-center justify-center"
        :class="iconWrapClass"
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
        icon: {
            type: String
        },

        type: {
            type: String as PropType<"card" | "icon">,
            default: "card"
        },

        variant: {
            type: String as PropType<ItemVariant>,
            default: "primary",
            required: false
        },

        disabled: {
            type: Boolean,
            default: false
        }
    },

    computed: {
        /**
         * Font Awesome icon class.
         */
        iconClass(): string {
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

        iconWrapClass() {
            if (this.type === "icon") {
                return [
                    "pt-1",
                    {
                        "text-primary": this.variant === "primary",
                        "text-secondary-foreground": this.variant === "secondary",
                        "text-success": this.variant === "success",
                        "text-warning": this.variant === "warning",
                        "text-destructive": this.variant === "destructive",
                        "text-info": this.variant === "info"
                    }
                ];
            }

            return [
                "p-3.5 rounded",
                {
                    "bg-primary/15 text-primary": this.variant === "primary",
                    "bg-secondary text-secondary-foreground": this.variant === "secondary",
                    "bg-success/15 text-success": this.variant === "success",
                    "bg-warning/15 text-warning": this.variant === "warning",
                    "bg-destructive/15 text-destructive": this.variant === "destructive",
                    "bg-info/15 text-info": this.variant === "info",
                    "opacity-50": this.disabled
                }
            ];
        }
    }
});
</script>
