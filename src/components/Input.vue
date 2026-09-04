<template>
    <div
        class="flex flex-col"
        :class="[
            fit ? 'w-fit' : 'w-full'
        ]"
    >
        <!-- Label -->
        <label 
            v-if="label"

            class="mb-2"
            :for="inputId"
        >
            {{ label }} {{ required ? '*' : '' }}
        </label>

        <!-- Input container -->
        <div
            class="transition-shadow box-border"
            :class="{
                'rounded ring-[3px] ring-transparent ring-offset-0':
                    variant === 'secondary' && !isFocused,

                'rounded ring-[3px] ring-ring/50 ring-offset-0':
                    variant === 'secondary' && isFocused && !(error || errorsMessage.length > 0),

                'rounded ring-[3px] ring-destructive/50 ring-offset-0':
                    variant === 'secondary' && isFocused && (error || errorsMessage.length > 0)
            }"
        >
            <!-- Input/textarea -->
            <div
                :class=" [
                    borderClass,
                    'text-foreground/90 text-sm font-normal',
                    {
                        'p-1.5 px-2.5': !isTextarea,
                        'rounded bg-input/30': variant === 'secondary'
                    },
                ]"
            >
                <textarea
                    v-if="isTextarea"
                    :id="inputId"

                    ref="textareaEl"
                    class="focus:outline-none focus:ring-0 pl-2.5 pt-2"
                    :class="[
                        fit ? 'w-fit' : 'w-full',
                        inputClass
                    ]"
                    :style="textareaStyle"

                    :rows="expandOnTyping ? 1 : undefined"
                    :value="localValue"
                    :placeholder="placeholder"
                    :disabled="disabled"
                    :readonly="isReadonlyMode"

                    @focus="onFocus"
                    @blur="onBlur"
                    @input="onInput($event)"
                />

                <!-- Input/textarea content -->
                <div
                    v-else
                    class="flex min-w-0 items-center gap-2"
                    :class="[
                        fit ? 'w-fit' : 'w-full',
                        inputClass
                    ]"
                >
                    <!-- Input -->
                    <input
                        :id="inputId"
                        v-maska="mask"

                        class="focus:outline-none focus:ring-0 bg-transparent"
                        :class="[
                            inputClass,
                            'min-w-0 w-full flex-1'
                        ]"
                        :value="localValue"
                        :type="htmlInputType"
                        :name="id"
                        :autocomplete="inputAutocomplete"
                        :placeholder="placeholder"
                        :disabled="disabled"
                        :readonly="isReadonlyMode"

                        @focus="onFocus"
                        @blur="onBlur"
                        @input="onInput($event)"
                    />

                    <!-- Password toggle -->
                    <div 
                        v-if="showPasswordToggle"
                        class="flex shrink-0 self-center"
                    >
                        <button
                            type="button"
                            class="text-muted-foreground hover:text-foreground rounded-md transition-colors"
                            :aria-label="passwordRevealed ? 'Ocultar senha' : 'Mostrar senha'"
                            :disabled="disabled"
                            @click="togglePasswordVisibility"
                        >
                            <i
                                class="fa-solid text-sm"
                                :class="passwordRevealed ? 'fa-eye-slash' : 'fa-eye'"
                            />
                        </button>
                    </div>

                    <!-- Copy button -->
                    <div 
                        v-if="showCopyButton"
                        class="flex shrink-0 self-center"
                    >
                        <button
                            type="button"
                            class="text-muted-foreground hover:text-foreground rounded-md transition-colors"
                            aria-label="Copiar conteúdo"
                            :disabled="disabled"
                            @click="copyValueToClipboard"
                        >
                            <i class="fa-solid fa-copy text-sm" />
                        </button>
                    </div>
                </div>

                <slot name="input" />
            </div>
        </div>

        <!-- Error message -->
        <transition name="expand-error">
            <span 
                v-if="error || errorsMessage.length > 0"
                
                class="text-destructive/90 mt-2 block bg-destructive/10 p-1 px-1.5 rounded border-destructive/20! border"
                
                :class="{ 'error-active': isFocused }"
            >
                <i class="fa-solid fa-warning mr-2 text-sm"/>
                
                <span v-if="error">
                    {{ error }}
                </span>

                <span
                    v-for="(errorMessage, index) of errorsMessage"
                    v-else-if="errorsMessage?.length > 0"
                    :key="index"

                    class="text-sm"
                >
                    {{ errorMessage }}

                    <br v-if="index > 1"/>
                </span>
            </span>
        </transition>

        <!-- Helper text -->
        <small 
            v-if="helperText"

            class="mt-2 text-sm! text-muted-foreground!"
        >
            {{ helperText }}
        </small>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import validateEmail from "@shared/validators/email";
import validatePhone from "@shared/validators/phone";
import { validateCPF, validateCNPJ } from "@shared/validators/documents";
import { vMaska } from "maska/vue";
import type { MaskInputOptions } from "maska";

function formatMoneyMask(input: string): string {
    const digits = input.replace(/\D/g, "");

    if (digits === "") {
        return "";
    }

    const amount = Number(digits) / 100;

    if (!Number.isFinite(amount)) {
        return "";
    }

    return `$ ${new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount)}`;
}

const MONEY_MASK: MaskInputOptions = {
    mask: formatMoneyMask
};

export default defineComponent({
    name: 'Input',

    directives: { maska: vMaska },

    props: {
        /**
         * Unique field identifier.
         * Also used to link the label to the input.
         */
        id: {
            type: String,
            required: false
        },

        /**
         * Value controlled by the component's legacy pattern.
         * Use together with the update:value event.
         */
        value: {
            type: [String, Number, Boolean],
            required: false,
            default: ""
        },

        /**
         * Value controlled by Vue's v-model pattern.
         * When defined, it has priority over the value prop.
         */
        modelValue: {
            type: [String, Number, Boolean],
            required: false,
            default: undefined
        },

        /**
         * Text displayed above the field.
         */
        label: {
            type: String,
            required: false
        },

        /**
         * Semantic field type: input variants, textarea, or special types for validation and masking.
         */
        type: {
            type: String as PropType<
                | "cpf"
                | "cnpj"
                | "email"
                | "phone"
                | "cep"
                | "password"
                | "text"
                | "number"
                | "money"
                | "date"
                | "textarea"
            >,
            required: true
        },

        /**
         * When true, shows a copy action (hidden when type is password, which uses visibility toggle instead).
         */
        copiable: {
            type: Boolean,
            default: false,
            required: false
        },

        /**
         * Placeholder displayed in the field.
         */
        placeholder: {
            type: String,
            required: false
        },

        /**
         * Helper text displayed below the field.
         */
        helperText: {
            type: String,
            required: false
        },
        
        /**
         * External error message with priority over internal validation.
         */
        error: {
            type: String,
            required: false
        },

        /**
         * Indicates whether the field is required.
         */
        required: {
            type: Boolean,
            required: false
        },

        /**
         * Disables user interaction with the field.
         */
        disabled: {
            type: Boolean,
            required: false
        },

        /**
         * Keeps the field in read-only mode.
         */
        readonly: {
            type: Boolean,
            required: false
        },

        /**
         * Visual style variant for the field.
         */
        variant: {
            type: String as PropType<"secondary" | "transparent" | "display">,
            default: "secondary",
            required: false
        },

        /**
         * Maximum allowed character length.
         */
        maxSize: {
            type: Number,
            default: 255,
            required: false
        },

        /**
         * Minimum character length used for validation.
         */
        minSize: {
            type: Number,
            default: 0,
            required: false
        },

        /**
         * Additional classes applied to the inner input/textarea.
         */
        inputClass: {
            type: [Object, String],
            required: false
        },

        /**
         * Custom text mask for the maska directive.
         */
        textMask:{
            type: String,
            required: false
        },

        /**
         * Configuration used to restore the initial value from localStorage.
         */
        useMemo: {
            type: Boolean,
            required: false
        },

        /**
         * If the input should use w-fit instead of w-full.
         */
        fit: {
            type: Boolean,
            default: false,
            required: false
        },

        hideResize: {
            type: Boolean,
            default: false,
            required: false
        },

        /**
         * Grows the textarea with its content. Pair with `maxHeightPx` to cap height.
         */
        expandOnTyping: {
            type: Boolean,
            default: false
        },

        /**
         * Min height in pixels when `expandOnTyping` is on.
         */
        minHeightPx: {
            type: Number,
            required: false
        },

        /**
         * Max height in pixels when `expandOnTyping` is on. Beyond that, the field scrolls.
         */
        maxHeightPx: {
            type: Number,
            required: false
        }
    },

    emits: ['update:value', 'update:modelValue'],

    data() {
        return {
            isFocused: false,
            numericTypes: ["cpf", "cnpj", "cep", "phone", "money"],
            localValue: "",
            isInputValid: true,
            hasValueEver: false,
            passwordRevealed: false
        };
    }, 
    
    computed: {
        /**
         * Resolves the name displayed in validation messages.
         *
         * @Returns - Field label when available; otherwise uses the id.
         */
        fieldLabel(): string {
            return this.label ?? this.id ?? "";
        },

        /**
         * Checks whether the current value is empty.
         *
         * @Returns - true when empty; false when it contains content.
         */
        isEmptyValue(): boolean {
            return this.sourceValue === '' || this.sourceValue === null || this.sourceValue === undefined;
        },

        /**
         * Defines the single source of truth between modelValue and value.
         *
         * @Returns - Value prioritizing modelValue when it is defined.
         */
        sourceValue(): string | number | boolean | undefined {
            if (this.modelValue !== undefined) {
                return this.modelValue;
            }

            return this.value;
        },

        /**
         * Returns the final id applied to the input/textarea.
         *
         * @Returns - Field identifier.
         */
        inputId(): string {
            return this.id ?? `cht-input-${this.$.uid}`;
        },

        isTextarea(): boolean {
            return this.type === "textarea";
        },

        textareaStyle(): Record<string, string> | undefined {
            if (!this.hideResize && !this.expandOnTyping) {
                return undefined;
            }

            return {
                resize: "none"
            };
        },

        isMoney(): boolean {
            return this.type === "money";
        },

        showPasswordToggle(): boolean {
            return this.type === "password";
        },

        showCopyButton(): boolean {
            return this.copiable && this.type !== "password";
        },

        isReadonlyMode(): boolean {
            return this.readonly || this.variant === "display";
        },

        htmlInputType(): string {
            if (this.type === "password") {
                return this.passwordRevealed ? "text" : "password";
            }

            if (this.type === "number") {
                return "number";
            }

            if (this.type === "date") {
                return "date";
            }

            if (this.type === "email") {
                return "email";
            }

            return "text";
        },

        inputAutocomplete(): string {
            switch (this.type) {
                case "password":
                    return "current-password";
                case "email":
                    return "email";
                case "phone":
                    return "tel";
                case "date":
                    return "off";
                default:
                    return "off";
            }
        },

        /**
         * Builds error list based on required state, validation, and minimum length.
         *
         * @Returns - Array of error messages shown by the component.
         */
        errorsMessage() {
            const errors: string[] = [];
            const valStr = String(this.sourceValue ?? "");

            if (this.isEmptyValue) {
                if (this.required && this.hasValueEver) {
                    errors.push(`${this.fieldLabel} é obrigatório.`);
                }

                return errors;
            }

            if (!this.isValid()) {
                errors.push(`${this.fieldLabel} é inválido.`);
            }

            if (this.minSize && valStr.length < this.minSize) {
                errors.push(`${this.fieldLabel} precisa ter pelo menos ${this.minSize} caracteres.`);
            }

            return errors;
        },

        /**
         * Resolves border classes based on variant, focus, and error state.
         *
         * @Returns - String with border classes applied to the field container.
         */
        borderClass() {
            if (this.variant === "transparent") {
                return "";
            }

            if (this.variant === "display") {
                return "border-b"
            }

            let color = {
                focused: "border-ring",
                unfocused: "border-input"
            };

            if (this.error || this.errorsMessage.length > 0) {
                color.focused = "border-destructive";
                color.unfocused = "border-destructive/40";
            }

            if (this.isFocused) {
                return "border " + color.focused;
            } else {
                return "border " + color.unfocused;
            }
        },

        /**
         * Resolves the mask applied to the field, prioritizing custom textMask.
         *
         * @Returns - Maska-compatible mask or undefined when not applicable.
         */
        mask() {
            if (this.type === "textarea" || this.type === "password") {
                return undefined;
            }

            if (this.textMask) {
                return this.textMask;
            }

            if (this.type === "money") {
                return MONEY_MASK;
            }

            if (this.type === "phone") {
                return "(##) #########"
            }

            if (this.type === "cpf") {
                return "###.###.###-##"
            }

            if (this.type === "cnpj") {
                return "##.###.###/####.##"
            }

            if (this.type === "cep") {
                return "#####-###"
            }

            return undefined;
        }
    },

    watch: {
        sourceValue: {
            /**
             * Synchronizes local state with the value coming from props.
             */
            handler(newVal) {
                this.localValue = String(newVal ?? "");
                const normalized = String(newVal ?? "");

                if (normalized !== "") {
                    this.hasValueEver = true;
                }
            },
            immediate: true
        },

        localValue() {
            this.$nextTick(() => {
                this.syncTextareaHeight();
            });
        }
    },

    mounted() {
        if (this.useMemo) {
            const value = localStorage.getItem(this.id ?? "");

            if (!this.localValue) {
                this.localValue = value ?? "";
            }
        }

        this.$nextTick(() => {
            this.syncTextareaHeight();
        });
    },

    methods: {
        /**
         * Persists the current value in localStorage when useMemo is enabled.
         *
         * @param value - Final normalized value that should be persisted.
         */
        persistMemoValue(value: string | number | boolean) {
            if (!this.id) {
                return;
            }

            localStorage.setItem(this.id, String(value ?? ""));
        },

        /**
         * Handles typing, normalizes the value, and emits updates to the parent.
         *
         * @param event - Native input/textarea event.
         */
        onInput(event: Event) {
            if (this.isReadonlyMode) {
                return;
            }

            let value = (event.target as HTMLInputElement).value;

            for (const numericKind of this.numericTypes) {
                if (this.type === numericKind) {
                    value = String(value).replace(/\D/g, "");
                    break;
                }
            }

            // Enforce minSize and maxSize if value is a string
            if (typeof value === "string") {
                if (this.maxSize && value.length > this.maxSize) {
                    value = value.slice(0, this.maxSize);
                }
            }

            this.localValue = value;

            if (String(value ?? "") !== "") {
                this.hasValueEver = true;
            }

            if (this.id) {
                // Save the final normalized value for future restores.
                this.persistMemoValue(value);
            }

            this.$emit("update:value", value);
            this.$emit("update:modelValue", value);

            this.$nextTick(() => {
                this.syncTextareaHeight();
            });
        },

        syncTextareaHeight() {
            if (!this.expandOnTyping || !this.isTextarea) {
                return;
            }

            const el = this.$refs.textareaEl as HTMLTextAreaElement | undefined;

            if (!el) {
                return;
            }

            el.style.overflowY = "hidden";
            el.style.height = "0px";

            const contentHeight = el.scrollHeight;
            const min = this.minHeightPx;
            const max = this.maxHeightPx;
            let next = contentHeight;

            if (min != null) {
                next = Math.max(next, min);
            }

            if (max != null) {
                const cap = min != null ? Math.max(max, min) : max;
                next = Math.min(next, cap);
            }

            el.style.height = `${next}px`;
            el.style.overflowY = contentHeight > next ? "auto" : "hidden";
        },

        /**
         * Marks the field as focused to apply visual styles.
         */
        onFocus() {
            this.isFocused = true;
        }, 

        /**
         * Clears the focused state when the user leaves the field.
         */
        onBlur() {
            this.isFocused = false;
        },

        togglePasswordVisibility() {
            if (this.disabled) {
                return;
            }

            this.passwordRevealed = !this.passwordRevealed;
        },

        async copyValueToClipboard() {
            if (this.disabled) {
                return;
            }

            const text = String(this.localValue ?? "");
            const toast = (this as unknown as { $toast?: { success: (m: string) => void; error: (m: string) => void } }).$toast;

            try {
                await navigator.clipboard.writeText(text);
                toast?.success("Copiado para a área de transferência.");
            } catch {
                toast?.error("Não foi possível copiar.");
            }
        },

        /**
         * Validates the current value according to the configured field type.
         *
         * @Returns - true when the value is valid for the type; otherwise false.
         */
        isValid(): boolean {
            const valStr = String(this.sourceValue ?? "");

            switch (this.type) {
                case "textarea":
                case "text":
                case "password":
                case "number":
                case "money":
                case "date":
                    break;
                case "email":
                    if (!validateEmail(valStr)) {
                        return false;
                    }

                    break;
                case "phone":
                    if (!validatePhone(valStr)) {
                        return false;
                    }

                    break;

                case "cpf":
                    if (!validateCPF(valStr)) {
                        return false;
                    }

                    break;

                case "cnpj":
                    if (!validateCNPJ(valStr)) {
                        return false;
                    }

                    break;

                case "cep":
                    if (valStr.length < 8) {
                        return false;
                    }

                    break;
            }

            return true;
        }
    }
});
</script>

<style scoped>
.expand-error-enter-active, .expand-error-leave-active {
    transition: all 0.3s cubic-bezier(.4,0,.2,1);
}

.expand-error-enter-from, .expand-error-leave-to {
    max-height: 0;
    opacity: 0;
    margin-top: 0;
}

.expand-error-enter-to, .expand-error-leave-from {
    max-height: 40px;
    opacity: 1;
    margin-top: 0.5rem;
}

input {
  color-scheme: dark;
}
</style>