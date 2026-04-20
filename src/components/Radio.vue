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

<template>
    <div
        class="transition-all"
        :class="{
            'p-3 border rounded-lg': variant === 'card',
            'border-primary/40 bg-primary/10': !disabled && variant === 'card' && isChecked,
            'border-input bg-input/10': !disabled && variant === 'card' && !isChecked,
            'bg-transparent border-border/50': disabled && variant === 'card'
        }"
    >
        <div class="flex">
            <input
                type="radio"
                class="custom-radio w-4 h-4 border border-input bg-input/30 transition-all rounded-full cursor-pointer relative shrink-0"
                :id="id"
                :name="name"
                :required="required"
                :disabled="disabled"
                :value="optionValue"
                :checked="isChecked"
                @change="onChange"
            />

            <div>
                <label
                    :for="id"
                    class="text-foreground font-medium text-sm ml-2 cursor-pointer"
                    :class="{
                        'text-muted-foreground': disabled
                    }"
                >
                    {{ label }}
                </label>

                <p v-if="description" class="text-muted-foreground! text-sm mt-1 ml-2">
                    {{ description }}
                </p>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: 'Radio',

    emits: ['click', 'update:modelValue'],

    props: {
        variant: {
            type: String as PropType<"normal" | "card">,
            default: "normal",
            required: false
        },

        label: {
            type: String,
            required: true
        },

        name: {
            type: String,
            required: true
        },

        id: {
            type: String,
            required: true
        },

        value: {
            type: [String, Number],
            required: true
        },

        modelValue: {
            type: [String, Number],
            default: undefined,
            required: false
        },

        description: {
            type: String,
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
        }
    },

    computed: {
        optionValue(): string | number {
            return this.value;
        },

        isChecked(): boolean {
            return this.modelValue !== undefined && this.modelValue !== null && this.modelValue === this.optionValue;
        }
    },

    methods: {
        onChange(event: Event) {
            if (this.disabled) {
                return;
            }

            this.$emit("update:modelValue", this.optionValue);
            this.$emit("click", event);
        },
    },
});
</script>
