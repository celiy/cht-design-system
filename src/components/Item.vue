<template>
    <div
        class="flex gap-3 rounded p-3 transition-all"
        :class="[`items-${position}`, cardClass, hoverClass]"

        @click="onClick"
    >
        <!-- Icon -->
        <ItemIcon
            v-if="icon"

            :variant="type === 'solid' ? 'default' : variant"
            :icon="icon"
            :type="type === 'card' ? 'card' : 'icon'"
            :size="itemIconSize"
            :background-style="itemBackgroundStyle"
            :icon-style="itemIconStyle"
        />

        <!-- Label and description -->
        <div class="w-full min-w-0 flex-1">
            <div class="flex flex-col gap-0.5">
                <span
                    v-if="head"

                    class="mb-0.5 text-xs font-semibold text-muted-foreground"
                    :class="{ 'text-inherit! opacity-80': type === 'solid' }"
                >
                    {{ head }}
                </span>

                <!-- Label -->
                <span
                    v-if="label"

                    :class="titleClass"
                >
                    <b>{{ label }}</b>
                </span>

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
                    :class="{ 'text-inherit! opacity-80': type === 'solid' }"
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

type ItemVariant =
    "default" | "primary" | "secondary" | "success" | "warning" | "destructive" | "info";

export default defineComponent({
    name: "Item",

    components: {
        ItemIcon
    },

    props: {
        /**
         * The head of the item
         */
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
         * The small text of the item
         */
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

        /**
         * `card` puts the icon in a tinted well, `alert` leaves it loose, and `solid` uses the
         * alert layout on a solid `variant` background, without border.
         */
        type: {
            type: String as PropType<"card" | "alert" | "solid">,
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

        /**
         * The size of the item icon
         */
        itemIconSize: {
            type: String as PropType<"sm" | "md" | "lg">,
            default: "md"
        },

        position: {
            type: String as PropType<"start" | "center" | "end">,
            default: "center"
        },

        /**
         * The background style of the item
         */
        backgroundStyle: {
            type: String,
            required: false
        },

        /**
         * The border style of the item
         */
        borderStyle: {
            type: String,
            required: false
        },

        /**
         * The hover style of the item
         */
        hoverStyle: {
            type: String,
            required: false
        },

        /**
         * The background style of the item icon
         */
        itemBackgroundStyle: {
            type: String,
            required: false
        },

        /**
         * The icon style of the item icon
         */
        itemIconStyle: {
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

            if (this.type === "solid") {
                return (
                    this.backgroundStyle || {
                        "bg-card text-foreground": this.variant === "default",
                        "bg-primary text-primary-foreground": this.variant === "primary",
                        "bg-secondary text-secondary-foreground": this.variant === "secondary",
                        "bg-success text-success-foreground": this.variant === "success",
                        "bg-warning text-warning-foreground": this.variant === "warning",
                        "bg-destructive text-destructive-foreground": this.variant === "destructive",
                        "bg-info text-info-foreground": this.variant === "info"
                    }
                );
            }

            const defaultBorder = {
                "border-2-primary/40": this.variant === "primary",
                "border-2-secondary": this.variant === "secondary",
                "border-2-success/30": this.variant === "success",
                "border-2-warning/30": this.variant === "warning",
                "border-2-destructive/30": this.variant === "destructive",
                "border-2-info/30": this.variant === "info",
                "reveal-highlight": this.hoverEffect && !this.disabled
            };

            if (this.backgroundStyle || this.borderStyle) {
                return [
                    this.backgroundStyle || "item-background",
                    this.borderStyle || defaultBorder
                ];
            }

            return {
                "item-background": true,
                ...defaultBorder
            };
        },

        /**
         * Gets the hover class
         * @returns {unknown} The hover class
         */
        hoverClass() {
            if (this.hoverStyle) {
                return this.hoverStyle;
            }

            return {
                "cursor-pointer dark:hover:brightness-125 light:hover:brightness-90":
                    this.hoverEffect && !this.disabled
            };
        },

        /**
         * Gets the title class
         * @returns {unknown} The title class
         */
        titleClass() {
            // Solid inherits the foreground set on the card.
            if (this.type === "solid") {
                return "leading-normal";
            }

            if (this.type === "alert") {
                return [
                    "leading-normal",
                    {
                        "text-foreground!":
                            !this.disabled && (!this.variant || this.variant === "default"),
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

            return "text-foreground select-none leading-5";
        },

        /**
         * Gets the description class
         * @returns {unknown} The description class
         */
        descriptionClass() {
            if (this.type === "solid") {
                return "leading-normal text-base";
            }

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

            return "text-muted-foreground select-none text-sm mt-0.5";
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
