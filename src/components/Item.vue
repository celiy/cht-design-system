<template>
    <div
        class="transition-all p-3 border rounded-lg flex items-start gap-3"
        :class="cardClass"

        @click="onClick"
    >
        <div
            class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            :class="iconWrapClass"
        >
            <i
                class="text-md"
                :class="iconClass"
            />
        </div>

        <div class="min-w-0">
            <p
                class="font-medium text-sm select-none leading-tight!"
                :class="disabled ? 'text-muted-foreground' : 'text-foreground'"
            >
                {{ label }}
            </p>

            <p
                v-if="description"

                class="text-muted-foreground! text-sm select-none"
            >
                {{ description }}
            </p>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

type ItemVariant = "primary" | "secondary" | "success" | "warning" | "destructive" | "info";

export default defineComponent({
    name: "Item",

    emits: ["click"],

    props: {
        /**
         * Title shown next to the icon.
         */
        label: {
            type: String,
            required: true
        },

        /**
         * Optional text under the label.
         */
        description: {
            type: String,
            required: false
        },

        /**
         * Font Awesome icon name, with or without the `fa-` prefix
         * (`user` or `fa-user`). Extra classes like `fa-regular` can be passed in full.
         */
        icon: {
            type: String,
            default: "fa-circle"
        },

        /**
         * Color of the icon well and of the selected card surface.
         */
        variant: {
            type: String as PropType<ItemVariant>,
            default: "primary",
            required: false
        },

        /**
         * Highlights the card like a selected radio/checkbox card.
         */
        selected: {
            type: Boolean,
            default: false
        },

        /**
         * Disables pointer interaction and mutes the card.
         */
        disabled: {
            type: Boolean,
            default: false
        },

        /**
         * Brightens the card on hover. Off by default.
         */
        hoverEffect: {
            type: Boolean,
            default: false
        }
    },

    computed: {
        /**
         * Font Awesome icon class.
         */
        iconClass(): string {
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
         * Icon wrap class.
         */
        iconWrapClass(): Record<string, boolean> {
            return {
                "bg-primary/15 text-primary": this.variant === "primary",
                "bg-secondary text-secondary-foreground": this.variant === "secondary",
                "bg-success/15 text-success": this.variant === "success",
                "bg-warning/15 text-warning": this.variant === "warning",
                "bg-destructive/15 text-destructive": this.variant === "destructive",
                "bg-info/15 text-info": this.variant === "info",
                "opacity-50": this.disabled
            };
        },

        /**
         * Card class.
         */
        cardClass(): Record<string, boolean> {
            if (this.disabled) {
                return {
                    "bg-transparent border-border/50 cursor-not-allowed": true
                };
            }

            if (this.selected) {
                return {
                    "cursor-pointer": true,
                    "hover:brightness-125": this.hoverEffect,
                    "border-primary/40 bg-primary/10": this.variant === "primary",
                    "border-border bg-secondary/40": this.variant === "secondary",
                    "border-success/40 bg-success/10": this.variant === "success",
                    "border-warning/40 bg-warning/10": this.variant === "warning",
                    "border-destructive/40 bg-destructive/10": this.variant === "destructive",
                    "border-info/40 bg-info/10": this.variant === "info"
                };
            }

            return {
                "cursor-pointer border-input bg-input/10": true,
                "hover:brightness-125": this.hoverEffect
            };
        }
    },

    methods: {
        /**
         * Forwards click when the item is not disabled.
         *
         * @param event Native click
         */
        onClick(event: MouseEvent) {
            if (this.disabled) {
                return;
            }

            this.$emit("click", event);
        }
    }
});
</script>
