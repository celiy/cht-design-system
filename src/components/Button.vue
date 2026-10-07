<template>
    <button
        class="w-fit cursor-pointer font-semibold shadow-sm transition-all select-none disabled:cursor-not-allowed disabled:opacity-80"
        :class="[
            hoverClass,
            backgroundClass,
            borderClass,
            shapeClass,
            {
                'p-1 px-2.5 text-xs': size === 'small' && shape !== 'rounded',
                'p-1.5 px-3 text-sm': size === 'medium' && shape !== 'rounded',
                'p-2 px-3.5 text-base': size === 'large' && shape !== 'rounded'
            },
            buttonClass
        ]"
        :disabled="disabled"
        :form="form"
        :type="type"
        :style="
            shape === 'rounded'
                ? {
                      width: circleButtonSize,
                      height: circleButtonSize,
                      minWidth: circleButtonSize,
                      minHeight: circleButtonSize
                  }
                : undefined
        "

        @mousedown="handleMouseDown"
        @mouseup="handleMouseUp"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @touchstart="handleMouseDown"
        @touchend="handleMouseUp"
        @touchleave="handleMouseUp"
        @click="handleClick"
        @keydown="handleKeydown"
    >
        <div
            class="flex h-full w-full items-center overflow-hidden text-ellipsis whitespace-nowrap transition duration-75"
            :class="[
                {
                    'translate-y-[0.08rem]': isPressed,
                    'items-center justify-center': shape === 'rounded',
                    'flex items-center gap-2': leftIcon || rightIcon,
                    'justify-start': contentPosition === 'start',
                    'justify-center': contentPosition === 'center',
                    'justify-end': contentPosition === 'end'
                },
                labelClass
            ]"
        >
            <span
                v-if="leftIcon"

                :class="`fa-solid ${leftIcon}`"
            />

            <span v-if="label">
                {{ label }}
            </span>

            <slot v-else />

            <span
                v-if="rightIcon"

                :class="`fa-solid ${rightIcon}`"
            />
        </div>
    </button>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { ButtonVariants } from "@shared/constants/ButtonTypes";

export const ButtonProps = {
    /**
     * The label of the button
     */
    label: {
        type: String,
        required: false
    },

    /**
     * The button class of the button
     */
    buttonClass: {
        type: String,
        required: false
    },

    /**
     * The label class of the button
     */
    labelClass: {
        type: String,
        required: false
    },

    /**
     * The shape of the button
     */
    shape: {
        type: String as PropType<"rounded" | "square">,
        default: "square",
        required: false
    },

    /**
     * The content position of the button
     */
    contentPosition: {
        type: String as PropType<"start" | "center" | "end" | "none">,
        default: "center",
        required: false
    },

    /**
     * The type of the button
     */
    type: {
        type: String as PropType<"button" | "reset" | "submit">,
        default: "button",
        required: false
    },

    /**
     * The size of the button
     */
    size: {
        type: String as PropType<"small" | "medium" | "large">,
        default: "medium",
        required: false
    },

    /**
     * The variant of the button
     */
    variant: {
        type: String as PropType<ButtonVariants>,
        default: "default",
        required: false
    },

    /**
     * Whether the button is disabled
     */
    disabled: {
        type: Boolean,
        default: false,
        required: false
    },

    /**
     * Whether the button uses hover effect
     */
    hoverEffect: {
        type: Boolean,
        default: true,
        required: false
    },

    /**
     * The left icon of the button
     */
    leftIcon: {
        type: String,
        required: false
    },

    /**
     * The right icon of the button
     */
    rightIcon: {
        type: String,
        required: false
    },

    /**
     * Associates the button with a form element (`id` of `<form>`).
     */
    form: {
        type: String,
        required: false
    },

    /**
     * The hover style of the button
     */
    hoverStyle: {
        type: String,
        required: false
    },

    /**
     * The background style of the button
     */
    backgroundStyle: {
        type: String,
        required: false
    },

    /**
     * The border style of the button
     */
    borderStyle: {
        type: String,
        required: false
    },

    /**
     * The radius style of the button
     */
    radiusStyle: {
        type: String,
        required: false
    }
} as const;

export default defineComponent({
    name: "Button",

    props: {
        ...ButtonProps
    },

    emits: ["click", "keydown"],

    data() {
        return {
            isPressed: false,
            hovered: false
        };
    },

    computed: {
        /**
         * Gets the circle button size
         * @returns {unknown} The circle button size
         */
        circleButtonSize(): string {
            if (this.shape !== "rounded") {
                return "";
            }

            const sizeMap: Record<"extra-small" | "small" | "medium" | "large", number> = {
                "extra-small": 30,
                small: 34,
                medium: 38,
                large: 44
            };

            const base = sizeMap[this.size as "extra-small" | "small" | "medium" | "large"] ?? 34;

            return `${base}px`;
        },

        /**
         * Gets the hover class
         * @returns {unknown} The hover class
         */
        hoverClass() {
            if (this.hoverStyle) {
                return this.hoverStyle;
            }

            if (this.backgroundStyle) {
                return "hover:brightness-120";
            }

            if (this.disabled) {
                return "hover:brightness-80";
            }

            return {
                "hover-ring":
                    this.hoverEffect &&
                    this.hovered &&
                    (this.variant === "default" || this.variant === "secondary"),
                "hover-ring-primary":
                    this.hoverEffect && this.hovered && this.variant === "primary",
                "hover-ring-destructive":
                    this.hoverEffect && this.hovered && this.variant === "destructive",
                "hover-ring-success":
                    this.hoverEffect && this.hovered && this.variant === "success",
                "hover-ring-info": this.hoverEffect && this.hovered && this.variant === "info",
                "hover-ring-warning":
                    this.hoverEffect && this.hovered && this.variant === "warning",

                "hover:shadow-md": !this.disabled,
                "hover:bg-destructive/40":
                    this.variant === "transparent-destructive" || this.variant === "destructive",
                "hover:bg-input/50": this.variant === "default",
                "hover:bg-accent": this.variant === "transparent",
                "bg-accent! hover-ring":
                    this.hoverEffect &&
                    this.hovered &&
                    (this.variant === "outline" || this.variant === "bordered")
            };
        },

        /**
         * Gets the background class
         * @returns {unknown} The background class
         */
        backgroundClass() {
            if (this.backgroundStyle) {
                return this.backgroundStyle;
            }

            return {
                "bg-primary/95 text-primary-foreground": this.variant === "primary",
                "bg-destructive/25 text-destructive": this.variant === "destructive",
                "text-destructive": this.variant === "transparent-destructive",
                "bg-success/95 text-success-foreground": this.variant === "success",
                "bg-info/95 text-info-foreground": this.variant === "info",
                "bg-warning/95 text-warning-foreground": this.variant === "warning",
                "bg-secondary text-secondary-foreground": this.variant === "secondary",
                "bg-input/30 text-foreground/90": this.variant === "default",
                "bg-transparent text-secondary-foreground shadow-none!":
                    this.variant === "transparent",
                "bg-transparent text-foreground": this.variant === "outline",
                "background-transparent text-foreground": this.variant === "bordered"
            };
        },

        /**
         * Gets the border class
         * @returns {unknown} The border class
         */
        borderClass() {
            if (this.borderStyle) {
                return this.borderStyle;
            }

            if (this.backgroundStyle) {
                return "";
            }

            return {
                "border-primary": this.variant === "primary",
                "border-success": this.variant === "success",
                "border-info": this.variant === "info",
                "border-warning": this.variant === "warning",
                "border ":
                    this.variant === "secondary" ||
                    this.variant === "default" ||
                    this.variant === "outline" ||
                    this.variant === "bordered",
                "border-transparent": this.variant === "transparent",
                "reveal-highlight": this.variant === "bordered"
            };
        },

        /**
         * Gets the shape class
         * @returns {unknown} The shape class
         */
        shapeClass() {
            if (this.radiusStyle) {
                return this.radiusStyle;
            }

            return {
                rounded: this.shape === "square",
                "flex aspect-square items-center justify-center justify-items-center rounded-full p-0":
                    this.shape === "rounded"
            };
        }
    },

    methods: {
        /**
         * Handles the click
         * @param {MouseEvent} event The event
         * @returns {void}
         */
        handleClick(event: MouseEvent) {
            this.$emit("click", event);
        },

        /**
         * Handles the keydown
         * @param {KeyboardEvent} event The event
         * @returns {void}
         */
        handleKeydown(event: KeyboardEvent) {
            this.$emit("keydown", event);
        },

        /**
         * Handles the mouse down
         * @returns {void}
         */
        handleMouseDown() {
            this.isPressed = true;
        },

        /**
         * Handles the mouse up
         * @returns {void}
         */
        handleMouseUp() {
            this.isPressed = false;
        },

        /**
         * Handles the mouse enter
         * @returns {void}
         */
        handleMouseEnter() {
            this.hovered = true;
        },

        /**
         * Handles the mouse leave
         * @returns {void}
         */
        handleMouseLeave() {
            this.isPressed = false;
            this.hovered = false;
        }
    }
});
</script>
