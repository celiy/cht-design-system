<template>
    <Button
        :label="label"
        :button-class="buttonClass"
        :label-class="labelClass"
        :shape="shape"
        :content-position="contentPosition"
        :type="type"
        :size="size"
        :variant="activeVariant"
        :disabled="disabled"
        :hover-effect="hoverEffect"
        :left-icon="leftIcon"
        :right-icon="rightIcon"
        :form="form"
        :radius-style="radiusStyle"

        @click="onClick"
        @keydown="onKeydown"
    >
        <slot />
    </Button>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { ButtonVariants } from "@shared/constants/ButtonTypes";
import Button, { ButtonProps } from "./Button.vue";

export default defineComponent({
    name: "Toggle",

    components: {
        Button
    },

    props: {
        ...ButtonProps,
        
        /**
         * The model value of the toggle
         */
        modelValue: {
            type: Boolean,
            default: false
        }
    },

    emits: ["update:modelValue", "click", "keydown"],

    computed: {
        /**
         * Gets the active variant
         * @returns {unknown} The active variant
         */
        activeVariant(): ButtonVariants {
            return this.modelValue ? this.variant : "transparent";
        }
    },

    methods: {
        /**
         * Handles the click
         * @param {MouseEvent} event The event
         * @returns {void}
         */
        onClick(event: MouseEvent) {
            if (this.disabled) {
                return;
            }

            this.$emit("update:modelValue", !this.modelValue);
            this.$emit("click", event);
        },

        /**
         * Handles the keydown
         * @param {KeyboardEvent} event The event
         * @returns {void}
         */
        onKeydown(event: KeyboardEvent) {
            this.$emit("keydown", event);
        }
    }
});
</script>
