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
                class="inline-flex w-fit flex-wrap items-center gap-1 rounded border bg-input/30 p-1"
                :class="borderClass"
            >
                <Toggle
                    v-for="option in options"
                    :key="String(option.value)"

                    :label="option.label"
                    :model-value="isSelected(option.value)"
                    :variant="variant"
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
        label: {
            type: String,
            required: false
        },

        options: {
            type: Array as PropType<ToggleableOption[]>,
            required: true
        },

        modelValue: {
            type: [String, Number, Boolean] as PropType<string | number | boolean | null>,
            default: null
        },

        labelPosition: {
            type: String as PropType<"center" | "left" | "right">,
            default: "left",
            required: false
        },

        toggleablePosition: {
            type: String as PropType<"center" | "left" | "right">,
            default: "center",
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

        size: {
            type: String as PropType<"small" | "medium" | "large">,
            default: "medium",
            required: false
        },

        disabled: {
            type: Boolean,
            default: false,
            required: false
        }
    },

    emits: ["update:modelValue"],

    computed: {
        borderClass(): string {
            const map: Record<ButtonVariants, string> = {
                default: "border-border",
                primary: "border-primary",
                secondary: "border-secondary",
                success: "border-success",
                info: "border-info",
                warning: "border-warning",
                destructive: "border-destructive",
                outline: "border-border",
                bordered: "border-border",
                transparent: "border-border",
                "transparent-destructive": "border-destructive"
            };

            return map[this.variant] ?? "border-border";
        }
    },

    methods: {
        isSelected(value: string): boolean {
            return this.modelValue === value;
        },

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
