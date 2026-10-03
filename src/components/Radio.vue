<template>
    <div
        class="transition-all"
        :class="{
            'rounded border p-3': variant === 'card',
            'border-primary/30! bg-primary/10': !disabled && variant === 'card' && isChecked,
            'border-input bg-input/30': !disabled && variant === 'card' && !isChecked,
            'border-border/50 bg-transparent': disabled && variant === 'card',
            'cursor-pointer': !disabled,
            'cursor-not-allowed!': disabled
        }"

        @mouseenter="hovered = true"
        @mouseleave="hovered = false"
        @click="onClick"
    >
        <div class="flex">
            <input
                :id="id"
                type="radio"
                class="custom-radio relative h-4 w-4 shrink-0 cursor-pointer rounded-full border border-input bg-input/30 transition-all"
                :class="{
                    'hover-ring': hovered && !disabled,
                    'translate-y-0.75': label || description
                }"
                :name="name"
                :required="required"
                :disabled="disabled"
                :value="optionValue"
                :checked="isChecked"

                @change="onChange"
            />

            <div v-if="label || description">
                <label
                    :for="id"
                    class="ml-2 select-none"
                    :class="{
                        'cursor-not-allowed! text-muted-foreground!': disabled,
                        'cursor-pointer': !disabled
                    }"
                >
                    {{ label }}
                </label>

                <small
                    v-if="description"

                    class="mt-1 ml-2 text-muted-foreground! select-none"
                >
                    {{ description }}
                </small>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "Radio",

    props: {
        /**
         * The variant of the radio
         */
        variant: {
            type: String as PropType<"normal" | "card">,
            default: "normal",
            required: false
        },

        /**
         * The label of the radio
         */
        label: {
            type: String,
            required: false
        },

        /**
         * The name of the radio
         */
        name: {
            type: String,
            required: true
        },

        /**
         * The id of the radio
         */
        id: {
            type: String,
            required: true
        },

        /**
         * The value of the radio
         */
        value: {
            type: [String, Number],
            required: true
        },

        /**
         * The model value of the radio
         */
        modelValue: {
            type: [String, Number],
            default: undefined,
            required: false
        },

        /**
         * Whether the radio is description
         */
        description: {
            type: String,
            required: false
        },

        required: {
            type: Boolean,
            default: false,
            required: false
        },

        /**
         * Whether the radio is disabled
         */
        disabled: {
            type: Boolean,
            default: false,
            required: false
        }
    },

    emits: ["click", "update:modelValue"],

    data() {
        return {
            hovered: false
        };
    },

    computed: {
        /**
         * Gets the option value
         * @returns {unknown} The option value
         */
        optionValue(): string | number {
            return this.value;
        },

        /**
         * Checks if checked
         * @returns {boolean} True if is checked
         */
        isChecked(): boolean {
            return (
                this.modelValue !== undefined &&
                this.modelValue !== null &&
                this.modelValue === this.optionValue
            );
        }
    },

    methods: {
        /**
         * Handles the click event.
         * @param {Event} event The click event.
         */
        onClick(event: Event) {
            if (this.disabled) {
                return;
            }

            if (this.variant === "card") {
                event.stopPropagation();
            }

            this.$emit("click", event);
            this.$emit("update:modelValue", this.optionValue);
        },

        /**
         * Handles the change event.
         * @param {Event} event The change event.
         */
        onChange(event: Event) {
            if (this.disabled) {
                return;
            }

            this.$emit("update:modelValue", this.optionValue);
            this.$emit("click", event);
        }
    }
});
</script>

<style scoped>
.custom-radio {
    appearance: none;
    vertical-align: middle;
}

.custom-radio:checked {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
}

.custom-radio:checked::after {
    content: "";
    display: block;
    position: absolute;
    left: 50%;
    top: 50%;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fff;
    transform: translate(-50%, -50%);
}

.custom-radio:disabled {
    background-color: var(--color-input);
    opacity: 50%;
    cursor: not-allowed;
}
</style>
