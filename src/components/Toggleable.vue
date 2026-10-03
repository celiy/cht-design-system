<template>
    <div class="flex w-full flex-col gap-2">
        <div
            v-if="label"

            class="flex w-full"
            :class="{
                'justify-center': labelPosition === 'center',
                'justify-start': labelPosition === 'left',
                'justify-end': labelPosition === 'right'
            }"
        >
            <label>
                {{ label }}
            </label>
        </div>

        <div
            class="flex w-full"
            :class="[
                {
                    'justify-center': toggleablePosition === 'center',
                    'justify-start': toggleablePosition === 'left',
                    'justify-end': toggleablePosition === 'right'
                }
            ]"
        >
            <div
                class="inline-flex w-fit flex-wrap items-center"
                :class="[borderClass, backgroundClass, radiusClass]"
            >
                <Toggle
                    v-for="option in options"
                    :key="String(option.value)"

                    :label="option.label"
                    :model-value="isSelected(option.value)"
                    :variant="variant"
                    :radius-style="radiusClass"
                    :size="size"
                    :disabled="disabled || Boolean(option.disabled)"
                    :hover-effect="false"
                    :left-icon="option.leftIcon"
                    :right-icon="option.rightIcon"

                    @update:model-value="onOptionToggle(option.value, $event)"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { ButtonVariants } from "@shared/constants/ButtonTypes";
import Toggle from "./Toggle.vue";

export type ToggleableOption = {
    label: string;
    value: string;
    disabled?: boolean;
    leftIcon?: string;
    rightIcon?: string;
};

export default defineComponent({
    name: "Toggleable",

    components: {
        Toggle
    },

    props: {
        /**
         * The label of the toggleable
         */
        label: {
            type: String,
            required: false
        },

        /**
         * The options of the toggleable
         */
        options: {
            type: Array as PropType<ToggleableOption[]>,
            required: true
        },

        /**
         * The model value of the toggleable
         */
        modelValue: {
            type: [String, Number, Boolean] as PropType<string | number | boolean | null>,
            default: null
        },

        /**
         * The label position of the toggleable
         */
        labelPosition: {
            type: String as PropType<"center" | "left" | "right">,
            default: "left",
            required: false
        },

        /**
         * The toggleable position of the toggleable
         */
        toggleablePosition: {
            type: String as PropType<"center" | "left" | "right">,
            default: "left",
            required: false
        },

        /**
         * Active toggle + container border color. Off toggles stay transparent.
         */
        variant: {
            type: String as PropType<ButtonVariants>,
            default: "default",
            required: false
        },

        /**
         * The size of the toggleable
         */
        size: {
            type: String as PropType<"small" | "medium" | "large">,
            default: "small",
            required: false
        },

        /**
         * Whether the toggleable is disabled
         */
        disabled: {
            type: Boolean,
            default: false,
            required: false
        },

        /**
         * The border style of the toggleable
         */
        borderStyle: {
            type: String,
            required: false
        },

        /**
         * The radius style of the toggleable
         */
        radiusStyle: {
            type: String,
            required: false
        },

        /**
         * The background style of the toggleable
         */
        backgroundStyle: {
            type: String,
            required: false
        }
    },

    emits: ["update:modelValue"],

    computed: {
        /**
         * Gets the border class
         * @returns {unknown} The border class
         */
        borderClass(): string {
            if (this.borderStyle) {
                return this.borderStyle;
            }

            return "border";
        },

        /**
         * Gets the background class
         * @returns {unknown} The background class
         */
        backgroundClass() {
            if (this.backgroundStyle) {
                return this.backgroundStyle;
            }

            return [
                "bg-input/30 gap-1",
                {
                    "p-1.5": this.size === "small",
                    "p-1": this.size === "medium",
                    "p-0.5": this.size === "large"
                }
            ];
        },

        /**
         * Gets the radius class
         * @returns {unknown} The radius class
         */
        radiusClass(): string {
            if (this.radiusStyle) {
                return this.radiusStyle;
            }

            return "rounded-full";
        }
    },

    methods: {
        /**
         * Gets the is selected
         * @param {string} value The value
         * @returns {void}
         */
        isSelected(value: string): boolean {
            return this.modelValue === value;
        },

        /**
         * Handles the option toggle
         * @param {string} value The value
         * @param {boolean} on The on
         * @returns {void}
         */
        onOptionToggle(value: string, on: boolean) {
            if (this.disabled) {
                return;
            }

            if (on) {
                this.$emit("update:modelValue", value);
                return;
            }

            if (this.modelValue === value) {
                this.$emit("update:modelValue", null);
            }
        }
    }
});
</script>
