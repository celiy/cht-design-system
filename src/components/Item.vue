<template>
    <div
        class="transition-all p-3 border rounded flex items-start gap-3"
        :class="[
            cardClass,
            {
                'hover:brightness-125 cursor-pointer': hoverEffect
            }
        ]"

        @click="onClick"
    >
        <!-- Icon -->
        <div
            v-if="icon"
            class="flex items-center justify-center shrink-0"
            :class="iconWrapClass"
        >
            <i
                class="text-md"
                :class="iconClass"
            />
        </div>

        <!-- Label and description -->
        <div class="min-w-0">
            <div class="flex flex-col gap-1">
                <span 
                    v-if="head"
                    class="font-semibold text-xs text-muted-foreground"
                >
                    {{ head }}
                </span>

                <!-- Label -->
                <p
                    v-if="label"
                    class="select-none leading-tight! font-semibold!"
                    :class="disabled ? 'text-muted-foreground' : 'text-foreground'"
                >
                    {{ label }}
                </p>

                <!-- Description -->
                <span
                    v-if="description"

                    :class="[descriptionClass]"
                >
                    {{ description }}
                </span>
            </div>

            <slot name="body" />
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
        head: {
            type: String,
            required: false
        },

        /**
         * Title shown next to the icon.
         */
        label: {
            type: String,
            required: false
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
            type: String
        },

        /**
         * Color of the icon well and of the selected card surface.
         */
        variant: {
            type: String as PropType<ItemVariant>,
            default: "primary",
            required: false
        },

        type: {
            type: String as PropType<"card" | "alert">,
            default: "card",
            required: false
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
            default: true
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
        iconWrapClass() {
            if (this.type === 'alert') {
                return ['pt-1', {
                    "text-primary": this.variant === "primary",
                    "text-secondary-foreground": this.variant === "secondary",
                    "text-success": this.variant === "success",
                    "text-warning": this.variant === "warning",
                    "text-destructive": this.variant === "destructive",
                    "text-info": this.variant === "info"
                }]
            } 

            return ['p-3.5 rounded', {
                "bg-primary/15 text-primary": this.variant === "primary",
                "bg-secondary text-secondary-foreground": this.variant === "secondary",
                "bg-success/15 text-success": this.variant === "success",
                "bg-warning/15 text-warning": this.variant === "warning",
                "bg-destructive/15 text-destructive": this.variant === "destructive",
                "bg-info/15 text-info": this.variant === "info",
                "opacity-50": this.disabled
            }];
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

            return {
                "border-primary/40! bg-primary/10": this.variant === "primary",
                "bg-secondary/40": this.variant === "secondary",
                "border-success/30! bg-success/10!": this.variant === "success",
                "border-warning/30! bg-warning/10!": this.variant === "warning",
                "border-destructive/30! bg-destructive/10!": this.variant === "destructive",
                "border-info/30! bg-info/10!": this.variant === "info",
                "border-input bg-input/10": true
            };
        },

        descriptionClass() {
            if (this.type === 'alert') {
                return ['leading-normal text-base', {
                    'text-info!': this.variant === 'info',
                    'text-success!': this.variant === 'success',
                    'text-warning!': this.variant === 'warning',
                    'text-destructive!': this.variant === 'destructive',
                    'text-primary!': this.variant === 'primary',
                    'text-secondary-foreground!': this.variant === 'secondary'
                }]
            }

            return "text-muted-foreground! select-none text-sm"
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
