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

export default defineComponent({
    name: "Button",

    props: {
        label: {
            type: String,
            required: false
        },

        buttonClass: {
            type: String,
            required: false
        },

        labelClass: {
            type: String,
            required: false
        },

        shape: {
            type: String as PropType<"rounded" | "square">,
            default: "square",
            required: false
        },

        contentPosition: {
            type: String as PropType<"start" | "center" | "end" | "none">,
            default: "center",
            required: false
        },

        type: {
            type: String as PropType<"button" | "reset" | "submit">,
            default: "button",
            required: false
        },

        size: {
            type: String as PropType<"small" | "medium" | "large">,
            default: "medium",
            required: false
        },

        variant: {
            type: String as PropType<ButtonVariants>,
            default: "default",
            required: false
        },

        disabled: {
            type: Boolean,
            default: false,
            required: false
        },

        hoverEffect: {
            type: Boolean,
            default: true,
            required: false
        },

        leftIcon: {
            type: String,
            required: false
        },

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

        hoverStyle: {
            type: String,
            required: false
        },

        backgroundStyle: {
            type: String,
            required: false
        },

        borderStyle: {
            type: String,
            required: false
        },

        radiusStyle: {
            type: String,
            required: false
        }
    },

    emits: ["click", "keydown"],

    data() {
        return {
            isPressed: false,
            hovered: false
        };
    },

    computed: {
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
                "bg-transparent text-foreground":
                    this.variant === "outline" || this.variant === "bordered"
            };
        },

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
                "border-transparent": this.variant === "transparent"
            };
        },

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
        handleClick(event: MouseEvent) {
            this.$emit("click", event);
        },

        handleKeydown(event: KeyboardEvent) {
            this.$emit("keydown", event);
        },

        handleMouseDown() {
            this.isPressed = true;
        },

        handleMouseUp() {
            this.isPressed = false;
        },

        handleMouseEnter() {
            this.hovered = true;
        },

        handleMouseLeave() {
            this.isPressed = false;
            this.hovered = false;
        }
    }
});
</script>
