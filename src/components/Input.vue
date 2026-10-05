<template>
    <div
        class="flex flex-col"
        :class="[fit ? 'w-fit' : 'w-full']"

        @click="$emit('click', $event)"
    >
        <!-- Label -->
        <label
            v-if="label"

            class="mb-2 transition-all"
            :class="[
                {
                    'translate-x-3 translate-y-9 cursor-text text-muted-foreground!':
                        !isFocused && !localValue && floatingLabel
                }
            ]"
            :for="inputId"
        >
            {{ label }} {{ required ? "*" : "" }}
        </label>

        <!-- Input container -->
        <div
            class="box-border rounded transition-shadow"
            :class="{
                'shadow-sm': !noShadow && variant !== 'display',
                'cursor-text': !isReadonlyMode && !disabled,

                'hover-ring':
                    variant === 'secondary' &&
                    isFocused &&
                    !(error || errorsMessage.length > 0 || visualError),

                'hover-ring-destructive':
                    variant === 'secondary' &&
                    isFocused &&
                    (error || errorsMessage.length > 0 || visualError)
            }"

            @click="focusField"
        >
            <!-- Input/textarea -->
            <div
                :class="[
                    borderClass,
                    'flex items-center text-sm font-normal text-foreground/90',
                    {
                        'p-1.5 px-2.5': !isTextarea,
                        'rounded bg-input/30': variant === 'secondary'
                    }
                ]"
            >
                <slot name="prefix" />

                <!-- Textarea content -->
                <textarea
                    v-if="isTextarea"

                    :id="inputId"
                    ref="fieldEl"

                    class="pt-2 pl-2.5 focus:ring-0 focus:outline-none"
                    :class="[fit ? 'w-fit' : 'w-full', inputClass]"
                    :style="textareaStyle"
                    :rows="expandOnTyping ? 1 : undefined"
                    :value="localValue"
                    :placeholder="placeholder"
                    :disabled="disabled"
                    :readonly="isReadonlyMode"

                    @focus="onFocus"
                    @blur="onBlur"
                    @input="onInput($event)"
                    @keydown="onKeydown"
                    @paste="onPaste"
                    @beforeinput="onBeforeInput"
                />

                <!-- Input content -->
                <div
                    v-else

                    class="flex min-w-0 items-center gap-2"
                    :class="[fit ? 'w-fit' : 'w-full', inputClass]"
                >
                    <input
                        :id="inputId"
                        ref="fieldEl"

                        v-maska="mask"
                        class="bg-transparent focus:ring-0 focus:outline-none"
                        :class="[inputClass, 'w-full min-w-0 flex-1']"
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
                        @keydown="onKeydown"
                        @paste="onPaste"
                        @beforeinput="onBeforeInput"
                    />

                    <!-- Password toggle -->
                    <div
                        v-if="showPasswordToggle"

                        class="flex shrink-0 self-center"
                    >
                        <button
                            type="button"
                            class="rounded-md text-muted-foreground transition-colors hover:text-foreground"
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
                            class="rounded-md text-muted-foreground transition-colors hover:text-foreground"
                            aria-label="Copiar conteúdo"
                            :disabled="disabled"

                            @click="copyValueToClipboard"
                        >
                            <i class="fa-solid fa-copy text-sm" />
                        </button>
                    </div>
                </div>

                <div
                    v-if="kbd"

                    class="flex items-center gap-1"
                >
                    <div
                        v-for="key in kbd"
                        :key="key.key"

                        class="flex items-center gap-1"
                    >
                        <kbd class="small-kbd">
                            {{ key.key.toUpperCase() }}
                        </kbd>

                        <span
                            v-if="key.key !== kbd[kbd.length - 1]?.key"

                            class="-translate-y-0.5"
                        >
                            +
                        </span>
                    </div>
                </div>

                <slot name="input" />
            </div>
        </div>

        <!-- Error message -->
        <InputErrorMsg
            :error="error"
            :errors-message="errorsMessage"
            :is-focused="isFocused"
        />

        <!-- Helper text -->
        <small-muted
            v-if="helperText"

            class="mt-1.5"
        >
            {{ helperText }}
        </small-muted>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import validateEmail from "@shared/validators/email";
import validatePhone from "@shared/validators/phone";
import { validateCPF, validateCNPJ } from "@shared/validators/documents";
import { vMaska } from "maska/vue";
import type { MaskInputOptions } from "maska";
import { advanceKbdSequence, isTypingTarget, kbdKeyNames } from "@shared/frontend/keybinds";
import { constrainInputValue } from "./internal/inputValueConstraints.ts";
import InputErrorMsg from "./internal/InputErrorMsg.vue";

const KBD_SEQUENCE_MS = 1000;

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
    name: "Input",

    components: {
        InputErrorMsg
    },

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
         * Make the input visually error
         */
        visualError: {
            type: Boolean,
            required: false,
            default: false
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
         * Regex the field value must match while typing. Empty always allowed.
         */
        pattern: {
            type: [String, RegExp] as PropType<string | RegExp>,
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
         * The autocomplete of the input
         */
        autocomplete: {
            type: String,
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
        textMask: {
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

        /**
         * Whether the input is hide resize
         */
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
        },

        /**
         * When true, the label is displayed in a floating position.
         */
        floatingLabel: {
            type: Boolean,
            default: false,
            required: false
        },

        /**
         * Whether the input is no shadow
         */
        noShadow: {
            type: Boolean,
            default: false,
            required: false
        },

        /**
         * Shortcut keys that focus this field. One item focuses on that key;
         * several items must be pressed in array order.
         */
        kbd: {
            type: Array as PropType<{ key: string }[]>,
            default: () => [],
            required: false
        }
    },

    emits: [
        "update:value",
        "update:modelValue",
        "focus",
        "click",
        "keydown",
        "paste",
        "beforeinput"
    ],

    data() {
        return {
            isFocused: false,
            numericTypes: ["cpf", "cnpj", "cep", "phone", "money"],
            localValue: "",
            isInputValid: true,
            hasValueEver: false,
            passwordRevealed: false,
            kbdStep: 0,
            kbdTimer: null as number | null
        };
    },

    computed: {
        /**
         * Resolves the name displayed in validation messages.
         */
        fieldLabel(): string {
            return this.label || this.placeholder || this.id || "";
        },

        /**
         * Checks whether the current value is empty.
         *
         * @Returns - true when empty; false when it contains content.
         */
        isEmptyValue(): boolean {
            return (
                this.sourceValue === "" ||
                this.sourceValue === null ||
                this.sourceValue === undefined
            );
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

        /**
         * Checks if textarea
         * @returns {boolean} True if is textarea
         */
        isTextarea(): boolean {
            return this.type === "textarea";
        },

        /**
         * Gets the textarea style
         * @returns {unknown} The textarea style
         */
        textareaStyle(): Record<string, string> | undefined {
            if (!this.hideResize && !this.expandOnTyping) {
                return undefined;
            }

            return {
                resize: "none"
            };
        },

        /**
         * Checks if money
         * @returns {boolean} True if is money
         */
        isMoney(): boolean {
            return this.type === "money";
        },

        /**
         * Gets the show password toggle
         * @returns {unknown} The show password toggle
         */
        showPasswordToggle(): boolean {
            return this.type === "password";
        },

        /**
         * Gets the show copy button
         * @returns {unknown} The show copy button
         */
        showCopyButton(): boolean {
            return this.copiable && this.type !== "password";
        },

        /**
         * Checks if readonly mode
         * @returns {boolean} True if is readonly mode
         */
        isReadonlyMode(): boolean {
            return this.readonly || this.variant === "display";
        },

        /**
         * Gets the html input type
         * @returns {unknown} The html input type
         */
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

        /**
         * Gets the input autocomplete
         * @returns {unknown} The input autocomplete
         */
        inputAutocomplete(): string {
            if (this.autocomplete) {
                return this.autocomplete;
            }

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
                errors.push(
                    `${this.fieldLabel} precisa ter pelo menos ${this.minSize} caracteres.`
                );
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
                return "border border-border/80! rounded bg-input/15";
            }

            let color = {
                focused: "border-ring",
                unfocused: "border-input"
            };

            if (this.error || this.errorsMessage.length > 0 || this.visualError) {
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
                return "(##) #########";
            }

            if (this.type === "cpf") {
                return "###.###.###-##";
            }

            if (this.type === "cnpj") {
                return "##.###.###/####.##";
            }

            if (this.type === "cep") {
                return "#####-###";
            }

            return undefined;
        },

        kbdKeys(): string[] {
            return kbdKeyNames(this.kbd);
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

        /**
         * Local value
         * @returns {void}
         */
        localValue() {
            this.$nextTick(() => {
                this.syncTextareaHeight();
            });
        },

        kbdKeys: {
            handler() {
                this.resetKbdSequence();
                this.syncKbdListener();
            },
            immediate: true
        }
    },

    /**
     * Mounts the component
     * @returns {void}
     */
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

    beforeUnmount() {
        this.teardownKbdListener();
        this.clearKbdTimer();
    },

    methods: {
        /**
         * Focuses the field
         * @returns {void}
         */
        focusField() {
            const field = this.$refs.fieldEl as HTMLInputElement | undefined;

            if (field != null) {
                field.focus();
                field.select();
            }
        },

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

            const field = event.target as HTMLInputElement;
            let value = field.value;
            const previous = this.localValue;

            for (const numericKind of this.numericTypes) {
                if (this.type === numericKind) {
                    value = String(value).replace(/\D/g, "");
                    break;
                }
            }

            value = constrainInputValue(value, previous, {
                maxSize: this.maxSize,
                pattern: this.pattern
            });

            // Keep the DOM in sync when Vue skips the re-render (same localValue).
            field.value = value;

            if (value === previous) {
                return;
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

        /**
         * Sync textarea height
         * @returns {void}
         */
        syncTextareaHeight() {
            if (!this.expandOnTyping || !this.isTextarea) {
                return;
            }

            const el = this.$refs.fieldEl as HTMLTextAreaElement | undefined;

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
        onFocus(event: FocusEvent) {
            this.isFocused = true;
            this.$emit("focus", event);
        },

        /**
         * Clears the focused state when the user leaves the field.
         */
        onBlur() {
            this.isFocused = false;
        },

        /**
         * Handles the keydown
         * @param {KeyboardEvent} event The event
         * @returns {void}
         */
        onKeydown(event: KeyboardEvent) {
            this.$emit("keydown", event);
        },

        onPaste(event: ClipboardEvent) {
            this.$emit("paste", event);
        },

        onBeforeInput(event: InputEvent) {
            this.$emit("beforeinput", event);
        },

        /**
         * Syncs the keyboard listener
         * @returns {void}
         */
        syncKbdListener() {
            this.teardownKbdListener();

            if (this.kbdKeys.length === 0) {
                return;
            }

            window.addEventListener("keydown", this.onWindowKeydown);
        },

        /**
         * Teardown the keyboard listener
         * @returns {void}
         */
        teardownKbdListener() {
            window.removeEventListener("keydown", this.onWindowKeydown);
        },

        /**
         * Clears the keyboard timer
         * @returns {void}
         */
        clearKbdTimer() {
            if (this.kbdTimer == null) {
                return;
            }

            window.clearTimeout(this.kbdTimer);
            this.kbdTimer = null;
        },

        /**
         * Resets the keyboard sequence
         * @returns {void}
         */
        resetKbdSequence() {
            this.kbdStep = 0;
            this.clearKbdTimer();
        },

        /**
         * Handles the window keydown
         * @param {KeyboardEvent} event The event
         * @returns {void}
         */
        onWindowKeydown(event: KeyboardEvent) {
            if (this.disabled || this.kbdKeys.length === 0) {
                return;
            }

            if (isTypingTarget(event)) {
                this.resetKbdSequence();
                return;
            }

            const field = this.$refs.fieldEl as HTMLElement | undefined;

            if (field != null && document.activeElement === field) {
                return;
            }

            const next = advanceKbdSequence(this.kbdStep, event, this.kbdKeys);

            this.kbdStep = next.step;
            this.clearKbdTimer();

            if (next.complete) {
                event.preventDefault();
                field?.focus();
                return;
            }

            if (next.step > 0) {
                this.kbdTimer = window.setTimeout(() => {
                    this.kbdTimer = null;
                    this.kbdStep = 0;
                }, KBD_SEQUENCE_MS);
            }
        },

        /**
         * Toggles the password visibility
         * @returns {void}
         */
        togglePasswordVisibility() {
            if (this.disabled) {
                return;
            }

            this.passwordRevealed = !this.passwordRevealed;
        },

        /**
         * Copy value to clipboard
         * @returns {void}
         */
        async copyValueToClipboard() {
            if (this.disabled) {
                return;
            }

            const text = String(this.localValue ?? "");
            const toast = (
                this as unknown as {
                    $toast?: { success: (m: string) => void; error: (m: string) => void };
                }
            ).$toast;

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
