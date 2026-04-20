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

<template>
    <div
        class="transition-all"
        :class="{
            'p-3 border rounded-lg': variant === 'card',
            'border-primary/40 bg-primary/10': !disabled && variant === 'card' && localChecked,
            'border-input/50 bg-input/20': !disabled && variant === 'card' && !localChecked,
            'bg-transparent border-input/30': disabled && variant === 'card'
        }"
    >
        <div class="flex">
            <input
                type="checkbox"

                :class="[
                    checkboxStyle === 'switch'
                        ? 'sr-only'
                        : 'custom-checkbox w-4 h-4 border border-input bg-input/30 transition-all rounded-sm cursor-pointer relative shrink-0'
                ]"
                
                :id="id"
                :name="name"
                :required="required"
                :disabled="disabled"
                :checked="localChecked"
                :value="value"

                @change="onChange"
            />

            <CheckboxSwitch
                v-if="checkboxStyle === 'switch'"
                :input-id="id"
                :checked="localChecked"
                :disabled="disabled"
                class="shrink-0"
            />

            <div>
                <label 
                    :for="id"

                    class="text-foreground font-medium text-sm"
                    :class="{
                        'ml-2': checkboxStyle !== 'switch',
                        'ml-3': checkboxStyle === 'switch',
                        'text-muted-foreground': disabled
                    }"
                >
                    {{ label }}
                </label>

                <p
                    v-if="description"
                    class="text-muted-foreground! text-sm mt-1"
                    :class="{
                        'ml-2': checkboxStyle !== 'switch',
                        'ml-3': checkboxStyle === 'switch'
                    }"
                >
                    {{ description }}
                </p>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import CheckboxSwitch from "./CheckboxSwitch.vue";

export default defineComponent({
    name: 'Checkbox',

    emits: ['click', 'update:value'],

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
            type: String as PropType<'normal' | 'switch'>,
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

    data() {
        return {
            localChecked: false,
        };
    },

    watch: {
        value: {
            handler(val: boolean | undefined) {
                if (val !== undefined && val !== null) {
                    this.localChecked = Boolean(val);
                }
            },
            immediate: true,
        },

        checked: {
            handler(val: boolean) {
                if (typeof val === 'boolean') {
                    this.localChecked = val;
                }
            },
            immediate: true,
        },
    },

    methods: {
        onChange(event: Event) {
            if (this.disabled) {
                return;
            }

            const target = event.target as HTMLInputElement;
            this.localChecked = target.checked;

            this.$emit("update:value", this.localChecked);
            this.$emit("click", event);
        },
    },
});
</script>