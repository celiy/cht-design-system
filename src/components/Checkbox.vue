<template>
    <div
        class="relative transition-colors"
        :class="{
            'rounded border p-3': variant === 'card',
            'border-primary/30! bg-primary/10': !disabled && variant === 'card' && localChecked,
            'border-input/50 bg-input/20': !disabled && variant === 'card' && !localChecked,
            'border-input/30 bg-transparent': disabled && variant === 'card',
            'cursor-pointer': !disabled,
            'cursor-not-allowed!': disabled
        }"

        @mouseenter="hovered = true"
        @mouseleave="hovered = false"
        @click="onClick"
    >
        <div class="flex">
            <!-- Input -->
            <input
                :id="id"
                type="checkbox"
                :class="[
                    checkboxStyle === 'switch'
                        ? 'sr-only'
                        : 'custom-checkbox relative h-4 w-4 shrink-0 cursor-pointer rounded-sm border border-input bg-input/30 transition-all',
                    {
                        'translate-y-0.5': checkboxStyle !== 'switch',
                        'ring-[3px] ring-ring/50 ring-offset-0': hovered && !disabled
                    }
                ]"
                :name="name"
                :required="required"
                :disabled="disabled"
                :checked="localChecked"
                :value="value"

                @change="onChange"
            />

            <!-- Switch -->
            <CheckboxSwitch
                v-if="checkboxStyle === 'switch'"

                :input-id="id"
                :checked="localChecked"
                :disabled="disabled"
                class="shrink-0"
            />

            <!-- Label -->
            <div v-if="label || description">
                <label
                    :for="id"
                    :class="{
                        'ml-2': checkboxStyle !== 'switch',
                        'ml-3': checkboxStyle === 'switch',
                        'text-muted-foreground!': disabled,
                        'cursor-pointer': !disabled,
                        'cursor-not-allowed!': disabled
                    }"
                >
                    {{ label }}
                </label>

                <!-- Description -->
                <small
                    v-if="description"

                    class="mt-1 text-sm! text-muted-foreground! select-none"
                    :class="{
                        'ml-2': checkboxStyle !== 'switch',
                        'ml-3': checkboxStyle === 'switch'
                    }"
                >
                    {{ description }}
                </small>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import CheckboxSwitch from "./CheckboxSwitch.vue";

export default defineComponent({
    name: "Checkbox",

    components: {
        CheckboxSwitch
    },

    props: {
        variant: {
            type: String as PropType<"normal" | "card">,
            default: "normal",
            required: false
        },

        checkboxStyle: {
            type: String as PropType<"normal" | "switch">,
            default: "normal",
            required: false
        },

        label: {
            type: String,
            required: false
        },

        name: {
            type: String,
            required: true
        },

        id: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: false
        },

        value: {
            type: Boolean,
            required: false
        },

        required: {
            type: Boolean,
            default: false,
            required: false
        },

        disabled: {
            type: Boolean,
            default: false,
            required: false
        },

        checked: {
            type: Boolean,
            default: false,
            required: false
        }
    },

    emits: ["click", "update:value"],

    data() {
        return {
            localChecked: false,
            hovered: false
        };
    },

    watch: {
        value: {
            handler(val: boolean | undefined) {
                if (val !== undefined && val !== null) {
                    this.localChecked = Boolean(val);
                }
            },
            immediate: true
        },

        checked: {
            handler(val: boolean) {
                if (typeof val === "boolean") {
                    this.localChecked = val;
                }
            },
            immediate: true
        }
    },

    methods: {
        /**
         * Handles the click event.
         * @param {Event} event The click event.
         */
        onClick(event: Event) {
            if (this.variant === "card") {
                event.stopPropagation();
            }

            if (this.disabled) {
                this.$emit("click", event);

                return;
            }

            const target = event.target as HTMLElement | null;

            /**
             * Clicks on the native input or an associated `<label for>` already
             * toggle via `@change`. Toggling again here cancelled the first click.
             */
            if (target?.closest("input, label[for]")) {
                this.$emit("click", event);

                return;
            }

            this.localChecked = !this.localChecked;
            this.$emit("update:value", this.localChecked);
            this.$emit("click", event);
        },

        /**
         * Handles the change event.
         * @param {Event} event The change event.
         */
        onChange(event: Event) {
            if (this.disabled) {
                return;
            }

            const target = event.target as HTMLInputElement;
            this.localChecked = target.checked;

            this.$emit("update:value", this.localChecked);
        }
    }
});
</script>

<style scoped>
.custom-checkbox {
    appearance: none;
    vertical-align: middle;
}

.custom-checkbox:checked {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
}

.custom-checkbox:checked::after {
    content: "";
    display: block;
    position: absolute;
    left: 5px;
    top: 1px;
    width: 4px;
    height: 10px;
    border: solid #fff;
    border-width: 0 2.5px 2.5px 0;
    transform: rotate(45deg);
}

.custom-checkbox:disabled {
    background-color: var(--color-input);
    opacity: 50%;
    cursor: not-allowed;
}
</style>
