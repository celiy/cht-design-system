<template>
    <div
        class="flex items-start gap-3 rounded p-3 transition-all"
        :class="[cardClass, hoverClass]"

        @click="onClick"
    >
        <!-- Icon -->
        <ItemIcon
            v-if="icon"

            :variant="variant"
            :icon="icon"
            :type="type === 'alert' ? 'icon' : 'card'"
        />

        <!-- Label and description -->
        <div class="w-full min-w-0 flex-1">
            <div class="flex flex-col gap-0.5">
                <span
                    v-if="head"

                    class="text-xs font-semibold text-muted-foreground"
                >
                    {{ head }}
                </span>

                <!-- Label -->
                <p
                    v-if="label"

                    :class="titleClass"
                >
                    <b>{{ label }}</b>
                </p>

                <!-- Description -->
                <span
                    v-if="description"

                    :class="[descriptionClass]"
                >
                    {{ description }}
                </span>

                <!-- Smaller text -->
                <small
                    v-if="smallText"

                    class="text-muted-foreground!"
                >
                    {{ smallText }}
                </small>
            </div>

            <slot name="body" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import ItemIcon from "./ItemIcon.vue";

type ItemVariant = "primary" | "secondary" | "success" | "warning" | "destructive" | "info";

export default defineComponent({
    name: "Item",

    components: {
        ItemIcon
    },

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

        smallText: {
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
        },

        backgroundStyle: {
            type: String,
            required: false
        },

        borderStyle: {
            type: String,
            required: false
        },

        hoverStyle: {
            type: String,
            required: false
        }
    },

    emits: ["click"],

    computed: {
        /**
         * Card class.
         */
        cardClass() {
            if (this.disabled) {
                return {
                    "cursor-not-allowed! border bg-transparent": true
                };
            }

            const defaultBorder = {
                "border-2-primary/40": this.variant === "primary",
                "border-2-secondary": this.variant === "secondary",
                "border-2-success/30": this.variant === "success",
                "border-2-warning/30": this.variant === "warning",
                "border-2-destructive/30": this.variant === "destructive",
                "border-2-info/30": this.variant === "info"
            };

            if (this.backgroundStyle || this.borderStyle) {
                return [
                    this.backgroundStyle || "bg-muted/40",
                    this.borderStyle || defaultBorder
                ];
            }

            return {
                "bg-muted/40": true,
                ...defaultBorder
            };
        },

        hoverClass() {
            if (this.hoverStyle) {
                return this.hoverStyle;
            }

            return {
                "cursor-pointer dark:hover:brightness-125 light:hover:brightness-90":
                    this.hoverEffect && !this.disabled
            };
        },

        titleClass() {
            if (this.type === "alert") {
                return [
                    "font-bold!",
                    {
                        "text-foreground!": !this.disabled && !this.variant,
                        "text-muted-foreground!": this.disabled,
                        "text-info!": this.variant === "info",
                        "text-success!": this.variant === "success",
                        "text-warning!": this.variant === "warning",
                        "text-destructive!": this.variant === "destructive",
                        "text-primary!": this.variant === "primary",
                        "text-secondary-foreground!": this.variant === "secondary"
                    }
                ];
            }

            return "text-foreground! select-none";
        },

        descriptionClass() {
            if (this.type === "alert") {
                return [
                    "leading-normal text-base",
                    {
                        "text-info!": this.variant === "info",
                        "text-success!": this.variant === "success",
                        "text-warning!": this.variant === "warning",
                        "text-destructive!": this.variant === "destructive",
                        "text-primary!": this.variant === "primary",
                        "text-secondary-foreground!": this.variant === "secondary"
                    }
                ];
            }

            return "text-muted-foreground! select-none text-sm";
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
