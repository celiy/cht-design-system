<template>
    <button
        class="w-fit cursor-pointer font-semibold shadow-sm transition-all select-none hover:shadow-md! dark:hover:brightness-125 light:hover:brightness-90"
        :class="[
            {
                'bg-primary/95 text-primary-foreground': variant === 'primary',
                'bg-destructive/25 text-destructive hover:bg-destructive/40':
                    variant === 'destructive',
                'text-destructive hover:bg-destructive/40': variant === 'transparent-destructive',
                'bg-success/95 text-success-foreground': variant === 'success',
                'bg-info/95 text-info-foreground': variant === 'info',
                'bg-warning/95 text-warning-foreground': variant === 'warning',
                'border bg-secondary text-secondary-foreground': variant === 'secondary',
                'border bg-input/30 text-foreground/90 hover:bg-input/50': variant === 'default',
                'border border-transparent! bg-transparent text-secondary-foreground shadow-none! hover:bg-accent':
                    variant === 'transparent',
                'border border-border bg-transparent text-foreground hover:bg-accent':
                    variant === 'outline' || variant === 'bordered',

                'p-1 px-2.5 text-xs': size === 'small' && shape !== 'rounded',
                'p-1.5 px-3 text-sm': size === 'medium' && shape !== 'rounded',
                'p-2 px-3.5 text-base': size === 'large' && shape !== 'rounded',

                'hover:translate-y-[-0.2rem]': hoverEffect,

                rounded: shape === 'square',
                'flex aspect-square items-center justify-center justify-items-center rounded-full p-0':
                    shape === 'rounded'
            },
            buttonClass
        ]"
        :disabled="disabled"
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
        @mouseleave="handleMouseUp"
        @touchstart="handleMouseDown"
        @touchend="handleMouseUp"
        @touchleave="handleMouseUp"
        @click="handleClick"
    >
        <div
            class="flex h-full w-full items-center transition-all"
            :class="[
                {
                    'translate-y-[0.1rem]': isPressed,
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
        }
    },

    emits: ["click"],

    data() {
        return {
            isPressed: false
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
        }
    },

    methods: {
        handleClick(event: MouseEvent) {
            this.$emit("click", event);
        },

        handleMouseDown() {
            this.isPressed = true;
        },

        handleMouseUp() {
            this.isPressed = false;
        },

        handleMouseLeave() {
            this.isPressed = false;
        }
    }
});
</script>
