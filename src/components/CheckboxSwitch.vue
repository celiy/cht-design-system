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
        /**
         * Whether the checkbox switch is input id
         */
        inputId: {
            type: String,
            required: true
        },

        /**
         * Whether the checkbox switch is checked
         */
        checked: {
            type: Boolean,
            required: true
        },

        /**
         * Whether the checkbox switch is disabled
         */
        disabled: {
            type: Boolean,
            default: false,
            required: false
        },

        /**
         * Whether the checkbox switch is clickable
         */
        clickable: {
            type: Boolean,
            default: true,
            required: false
        },

        /**
         * The size of the checkbox switch
         */
        size: {
            type: String as PropType<"small" | "medium">,
            default: "medium",
            required: false
        },

        /**
         * Whether the checkbox switch is hovered
         */
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
        /**
         * Handles the focus
         * @returns {void}
         */
        onFocus() {
            this.isFocused = true;
        },

        /**
         * Handles the blur
         * @returns {void}
         */
        onBlur() {
            this.isFocused = false;
        }
    }
});
</script>
