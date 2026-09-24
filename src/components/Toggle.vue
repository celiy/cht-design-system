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

        @click="onClick"
        @keydown="onKeydown"
    >
        <slot />
    </Button>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { ButtonVariants } from "@shared/constants/ButtonTypes";
import Button from "./Button.vue";

export default defineComponent({
    name: "Toggle",

    components: {
        Button
    },

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

        /**
         * Button variant used while the toggle is on. Off state is always `transparent`.
         */
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

        form: {
            type: String,
            required: false
        },

        modelValue: {
            type: Boolean,
            default: false
        }
    },

    emits: ["update:modelValue", "click", "keydown"],

    computed: {
        activeVariant(): ButtonVariants {
            return this.modelValue ? this.variant : "transparent";
        }
    },

    methods: {
        onClick(event: MouseEvent) {
            if (this.disabled) {
                return;
            }

            this.$emit("update:modelValue", !this.modelValue);
            this.$emit("click", event);
        },

        onKeydown(event: KeyboardEvent) {
            this.$emit("keydown", event);
        }
    }
});
</script>
