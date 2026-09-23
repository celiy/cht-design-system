<template>
    <span
        class="inline-flex items-center"
        :class="{
            'cursor-pointer': !disabled,
            'cursor-not-allowed opacity-60': disabled
        }"

        @mouseenter="onFocus"
        @mouseleave="onBlur"
    >
        <span
            class="relative inline-flex items-center rounded-full transition-all"
            :class="{
                'bg-primary': checked,
                'bg-input/70': !checked && !disabled,
                'bg-input': disabled,
                'hover-ring': (isFocused || hovered) && !disabled && clickable,

                'h-3.5 w-7': size === 'small',
                'h-4.5 w-8': size === 'medium'
            }"
        >
            <span
                class="inline-block transform rounded-full bg-white transition-transform"
                :class="{
                    'h-3 w-3': size === 'small',
                    'translate-x-[15px]': checked && size === 'small',
                    'translate-x-[1px]': !checked && size === 'small',

                    'h-3.5 w-3.5': size === 'medium',
                    'translate-x-4': checked && size === 'medium',
                    'translate-x-0.5': !checked && size === 'medium'
                }"
            />
        </span>
    </span>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "CheckboxSwitch",

    props: {
        inputId: {
            type: String,
            required: true
        },

        checked: {
            type: Boolean,
            required: true
        },

        disabled: {
            type: Boolean,
            default: false,
            required: false
        },

        clickable: {
            type: Boolean,
            default: true,
            required: false
        },

        size: {
            type: String as PropType<"small" | "medium">,
            default: "medium",
            required: false
        },

        hovered: {
            type: Boolean,
            default: false,
            required: false
        }
    },

    data() {
        return {
            isFocused: false
        };
    },

    methods: {
        onFocus() {
            this.isFocused = true;
        },

        onBlur() {
            this.isFocused = false;
        }
    }
});
</script>
