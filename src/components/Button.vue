<template>
    <button
        class="transition-all w-fit cursor-pointer font-medium select-none hover:brightness-125"
        :class="[
            {
                'bg-primary/95 text-primary-foreground': variant === 'primary',
                'bg-destructive/25 text-destructive hover:bg-destructive/40': variant === 'destructive',
                'text-destructive hover:bg-destructive/40': variant === 'transparent-destructive',
                'bg-success/95 text-success-foreground': variant === 'success',
                'bg-warning/95 text-warning-foreground': variant === 'warning',
                'bg-secondary text-secondary-foreground border': variant === 'secondary',
                'bg-input/30 hover:bg-input/50 text-foreground/90 border': variant === 'default',
                'bg-transparent text-secondary-foreground hover:bg-accent border border-transparent!': variant === 'transparent',
                'bg-transparent text-secondary-foreground hover:bg-accent border': variant === 'bordered',
                'bg-transparent text-foreground hover:bg-accent border border-border': variant === 'outline',

                'p-1 px-2 text-[0.9rem]': size === 'extra-small' && shape !== 'rounded',
                'p-2.5 px-3 text-[0.94rem]': size === 'small' && shape !== 'rounded',
                'p-3 px-3.5 text-[1rem]': size === 'medium' && shape !== 'rounded',
                'p-3.5 px-4 text-[1.1rem]': size === 'large' && shape !== 'rounded',

                'hover:translate-y-[-0.2rem]': hoverEffect,
                
                'rounded-lg': shape === 'square',
                'rounded-full aspect-square flex items-center justify-center justify-items-center p-0': shape === 'rounded'
            }, 
            buttonClass
        ]"
        :disabled="disabled"
        :type="type"
        :style="shape === 'rounded' ? { 
            width: circleButtonSize, 
            height: circleButtonSize, 
            minWidth: circleButtonSize, 
            minHeight: circleButtonSize 
        } : undefined"

        @mousedown="handleMouseDown"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
        @touchstart="handleMouseDown"
        @touchend="handleMouseUp"
        @touchleave="handleMouseUp"
        @click="handleClick"
    >
        <div 
            class="w-full h-full flex transition-all" 
            :class="[{
                'translate-y-[0.1rem]': isPressed,
                'items-center justify-center': shape === 'rounded'
            }, 
                labelClass
            ]"
        >
            <span v-if="label">
                {{ label }}
            </span>

            <slot v-else/>
        </div>
    </button>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { ButtonVariants } from "@shared/constants/ButtonTypes";

export default defineComponent({
    name: 'Button',

    emits: ['click'],

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
            type: String as PropType<'rounded' | 'square'>,
            default: 'square',
            required: false
        },

        type: {
            type: String as PropType<"button" | "reset" | "submit">,
            default: "button",
            required: false
        },

        size: {
            type: String as PropType<"extra-small" | "small" | "medium" | "large">,
            default: "small",
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
        }
    },

    data() {
        return {
            isPressed: false
        };
    },

    watch: {

    },

    methods: {
        handleClick() {
            this.$emit("click");
        },

        handleMouseDown() {
            this.isPressed = true;
        },

        handleMouseUp() {
            this.isPressed = false;
        },

        handleMouseLeave() {
            this.isPressed = false;
        },
    }, 

    computed: {
        circleButtonSize(): string {
            if (this.shape !== "rounded") {
                return "";
            }

            const sizeMap: Record<"extra-small" | "small" | "medium" | "large", number> = {
                "extra-small": 30,
                "small": 34,
                "medium": 38,
                "large": 44
            };

            const base = sizeMap[this.size as "extra-small" | "small" | "medium" | "large"] ?? 34;

            return `${base}px`;
        }
    }
});
</script>