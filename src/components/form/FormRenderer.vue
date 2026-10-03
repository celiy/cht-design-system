<template>
    <form
        :id="formId"
        class="flex flex-col gap-6"

        @submit="onSubmit"
        @keydown="onFormKeydown"
    >
        <div
            v-for="sectionObj in normalizedSections"
            v-show="isSectionVisible(sectionObj.fields)"
            :key="sectionObj.key"
        >
            <h4
                v-if="String(sectionObj.title)"

                class="mb-3"
            >
                {{ sectionObj.title }}
            </h4>

            <div
                :class="{
                    'flex flex-col gap-4': activeSectionColumns <= 1,
                    'grid gap-4': activeSectionColumns > 1
                }"
                :style="
                    activeSectionColumns > 1
                        ? { gridTemplateColumns: `repeat(${activeSectionColumns}, minmax(0, 1fr))` }
                        : undefined
                "
            >
                <template
                    v-for="field in sectionObj.fields"
                    :key="field.id"
                >
                    <div
                        v-if="isFieldVisible(field)"

                        class="min-w-0"
                        :style="getFieldStyle(field)"
                    >
                        <Input
                            v-if="isInputType(field.type)"

                            :id="field.id"
                            :type="field.type as any"
                            :label="field.label"
                            :placeholder="isViewMode ? undefined : field.placeholder"
                            :helper-text="field.helperText"
                            :error="fieldError(field)"
                            :required="!isViewMode && field.required"
                            :readonly="isFieldReadonly(field)"
                            :variant="isFieldReadonly(field) ? 'display' : 'secondary'"
                            :max-size="field.maxSize"
                            :min-size="field.minSize"
                            :input-class="field.inputClass"
                            :text-mask="field.textMask"
                            :copiable="isFieldReadonly(field) || field.copiable"
                            :autocomplete="field.autocomplete"
                            :disabled="isInputDisabled(field)"
                            :value="formValues[field.id] ?? ''"

                            @update:value="updateValue(field.id, $event)"
                        />

                        <Checkbox
                            v-else-if="field.type === 'checkbox'"

                            :id="field.id"
                            :name="field.name || field.id"
                            :label="field.label"
                            :description="field.description"
                            :variant="(field.variant as 'normal' | 'card') || 'normal'"
                            :checkbox-style="field.checkboxStyle ?? 'normal'"
                            :required="!isViewMode && field.required"
                            :disabled="isViewMode || field.disabled"
                            :checked="formValues[field.id] ?? false"
                            :value="formValues[field.id] ?? false"

                            @update:value="updateValue(field.id, $event)"
                        />

                        <Input
                            v-else-if="field.type === 'radio' && isViewMode"

                            :id="field.id"
                            type="text"
                            :label="field.label"
                            variant="display"
                            readonly
                            copiable
                            :value="selectDisplayValue(field)"
                        />

                        <div
                            v-else-if="field.type === 'radio'"

                            class="flex flex-col gap-2"
                        >
                            <Radio
                                v-for="option in field.options"

                                :id="`${field.id}-${option.value}`"
                                :key="option.value"

                                :name="field.name || field.id"
                                :label="option.label"
                                :value="option.value"
                                :description="option.description"
                                :variant="(field.variant as 'normal' | 'card') || 'normal'"
                                :required="field.required"
                                :disabled="field.disabled"
                                :model-value="formValues[field.id]"

                                @update:model-value="updateValue(field.id, $event)"
                            />
                        </div>

                        <Toggle
                            v-else-if="field.type === 'toggle'"

                            :label="field.label"
                            :variant="(field.variant as ButtonVariants) || 'default'"
                            :disabled="isViewMode || field.disabled"
                            :model-value="Boolean(formValues[field.id])"

                            @update:model-value="updateValue(field.id, $event)"
                        />

                        <Input
                            v-else-if="field.type === 'toggleable' && isViewMode"

                            :id="field.id"
                            type="text"
                            :label="field.label"
                            variant="display"
                            readonly
                            copiable
                            :value="selectDisplayValue(field)"
                        />

                        <Toggleable
                            v-else-if="field.type === 'toggleable'"

                            :label="field.label"
                            :options="field.options ?? []"
                            :variant="(field.variant as ButtonVariants) || 'default'"
                            :disabled="field.disabled"
                            :model-value="formValues[field.id] as string | number | boolean | null"

                            @update:model-value="updateValue(field.id, $event)"
                        />

                        <Input
                            v-else-if="field.type === 'select' && isViewMode && !field.selectSeparateSelected"

                            :id="field.id"
                            type="text"
                            :label="field.label"
                            variant="display"
                            readonly
                            copiable
                            :value="selectDisplayValue(field)"
                        />

                        <div
                            v-else-if="field.type === 'select'"

                            class="flex w-full flex-col gap-2"
                        >
                            <Select
                                :id="field.id"
                                :ref="(el) => registerSelectRef(field.id, el)"
                                :label="field.label"
                                :placeholder="field.placeholder || 'Selecione...'"
                                :header="field.placeholder || field.label"
                                :helper-text="field.helperText"
                                :options="field.options"
                                :search="field.selectSearch"
                                :external-search-loading="Boolean(field.selectSearchLoading)"
                                :model-value="formValues[field.id]"
                                :select-multiple="field.selectMultiple"
                                :separate-selected="Boolean(field.selectSeparateSelected)"
                                :show-selected-labels="field.selectShowSelectedLabels ?? true"
                                :hide-dropdown-arrow="isViewMode"
                                :disabled="isViewMode || field.disabled"
                                :trigger-aside-side="field.selectAction?.side ?? 'right'"

                                @update:value="updateValue(field.id, $event)"
                                @click:selected="onSelectSelected(field, $event)"
                                @remove:selected="onSelectRemove(field, $event)"
                                @search:external="onSelectSearchExternal(field, $event)"
                            >
                                <template
                                    v-if="selectActionVisible(field)"
                                    #trigger-aside
                                >
                                    <Button
                                        v-tooltip="field.selectAction?.tooltip || undefined"
                                        type="button"
                                        class="min-h-0 self-stretch"
                                        :class="selectActionLayoutClass(field)"
                                        button-class="box-border h-full"
                                        :hover-effect="false"
                                        :left-icon="field.selectAction?.icon"
                                        :label="field.selectAction?.label"
                                        :disabled="isViewMode || field.disabled"
                                        :aria-label="selectActionAriaLabel(field)"

                                        @click.stop="onSelectAction(field)"
                                    />
                                </template>

                                <template
                                    v-if="$slots['select-inside-empty-panel']"
                                    #inside-empty-panel
                                >
                                    <slot
                                        name="select-inside-empty-panel"
                                        :field="field"
                                    />
                                </template>

                                <template
                                    v-if="$slots['select-inside-empty-panel']"
                                    #panel-footer
                                >
                                    <slot
                                        name="select-inside-empty-panel"
                                        :field="field"
                                    />
                                </template>
                            </Select>
                        </div>

                        <p
                            v-if="!isInputType(field.type) && fieldError(field)"

                            class="mt-2 block rounded border border-destructive/20! bg-destructive/10! p-1 px-1.5 text-sm leading-5 font-light text-destructive/90!"
                        >
                            <i class="fa-solid fa-warning mr-2" />
                            {{ fieldError(field) }}
                        </p>
                    </div>
                </template>
            </div>
        </div>

        <div
            v-if="$slots.actions || $slots.submit"

            class="flex flex-wrap justify-end gap-2"
        >
            <slot name="actions">
                <slot name="submit" />
            </slot>
        </div>
    </form>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Input from "../Input.vue";
import Checkbox from "../Checkbox.vue";
import Button from "../Button.vue";
import Radio from "../Radio.vue";
import Select from "../Select.vue";
import Toggle from "../Toggle.vue";
import Toggleable from "../Toggleable.vue";
import validateEmail from "@shared/validators/email";
import validatePhone from "@shared/validators/phone";
import { validateCPF, validateCNPJ, isCnpjDocument } from "@shared/validators/documents";
import type { FormField as FormFieldType } from "@shared/interfaces/FormField";
import type { ButtonVariants } from "@shared/constants/ButtonTypes";
import { INPUT_TYPES } from "@shared/constants/InputTypes";
import type { SearchExternalPayload } from "../internal/OptionsList.vue";
import { cepDigits, parseViaCepResponse, viaCepUrl } from "@shared/cep/viaCep";

const CEP_LOOKUP_DEBOUNCE_MS = 400;
const CEP_LOOKUP_TIMEOUT_MS = 6000;
const CEP_ADDRESS_FIELDS = ["estado", "cidade", "bairro", "rua", "numero", "complemento"] as const;
const CEP_FILL_FIELDS = ["estado", "cidade", "bairro", "rua"] as const;

interface FormSection {
    key?: string;
    title: string;
    fields: FormFieldType[];
}

export default defineComponent({
    name: "FormRenderer",

    components: {
        Button,
        Input,
        Checkbox,
        Radio,
        Select,
        Toggle,
        Toggleable
    },

    props: {
        /**
         * The fields of the formrenderer
         */
        fields: {
            type: Array as PropType<FormFieldType[]>,
            required: false,
            default: () => []
        },

        /**
         * Whether the formrenderer is sections
         */
        sections: {
            type: Array as PropType<FormSection[]>,
            required: false,
            default: () => []
        },

        /**
         * When true, fields render in display style and submit is ignored.
         */
        readonly: {
            type: Boolean,
            default: false
        },

        /**
         * The values of the form
         */
        values: {
            type: Object as PropType<Record<string, unknown> | null>,
            required: false,
            default: null
        },

        /**
         * The id of the form
         */
        formId: {
            type: String,
            required: false
        },

        /**
         * The label of the submit button
         */
        submitLabel: {
            type: String,
            default: "Enviar"
        },

        /**
         * The columns of the sections
         */
        sectionColumns: {
            type: [Number, Object] as PropType<
                number | { xs?: number; sm?: number; md?: number; lg?: number }
            >,
            default: 1
        },

        /**
         * When true, Enter-to-submit and submit emission are ignored (e.g. another modal is open).
         */
        submitDisabled: {
            type: Boolean,
            default: false
        }
    },

    emits: ["submit", "click:select-action", "click:select-option", "click:select-remove", "search:external", "update:field"],

    data() {
        return {
            formValues: {} as Record<string, any>,
            fieldErrors: {} as Record<string, string>,
            activeSectionColumns: 1,
            selectRefByFieldId: {} as Record<string, { close?: () => void } | null>,
            cepLookupTimer: null as number | null,
            cepLookupTimeout: null as number | null,
            cepLookupAbort: null as AbortController | null,
            cepLookupSeq: 0,
            cepLookupLoading: false
        };
    },

    computed: {
        /**
         * The normalized sections
         * @returns {Array<{ key: string; title: string; fields: FormFieldType[] }>} The normalized sections
         */
        normalizedSections(): Array<{ key: string; title: string; fields: FormFieldType[] }> {
            if (this.sections && this.sections.length > 0) {
                return this.sections.map((sec, idx) => ({
                    key: sec.key ?? sec.title ?? `section-${idx}`,
                    title: sec.title ?? "",
                    fields: sec.fields ?? []
                }));
            }

            const result: Record<string, FormFieldType[]> = {};

            for (const field of this.fields) {
                const sectionTitle = field.section ?? "";

                if (!result[sectionTitle]) {
                    result[sectionTitle] = [];
                }

                result[sectionTitle].push(field);
            }

            return Object.entries(result).map(([title, fields]) => ({
                key: title,
                title,
                fields
            }));
        },

        /**
         * The all fields
         * @returns {FormFieldType[]} The all fields
         */
        allFields(): FormFieldType[] {
            return this.normalizedSections.flatMap((s) => s.fields);
        },

        /**
         * Checks if the form is in view mode
         * @returns {boolean} True if the form is in view mode
         */
        isViewMode(): boolean {
            return this.readonly;
        }
    },

    watch: {
        values: {
            handler() {
                this.hydrateFormValues();
            },

            deep: true
        }
    },

    /**
     * Creates the component
     * @returns {void}
     */
    created() {
        this.hydrateFormValues();
    },

    /**
     * Mounts the component
     * @returns {void}
     */
    mounted() {
        this.activeSectionColumns = this.resolveSectionColumns();
        window.addEventListener("resize", this.onResize);
    },

    /**
     * Unmounts the component
     * @returns {void}
     */
    beforeUnmount() {
        window.removeEventListener("resize", this.onResize);
        this.clearCepLookup();
    },

    methods: {
        /**
         * Handles the resize event
         * @returns {void}
         */
        onResize() {
            this.activeSectionColumns = this.resolveSectionColumns();
        },

        /**
         * Checks if the field is readonly
         * @param {FormFieldType} field The field
         * @returns {boolean} True if the field is readonly
         */
        isFieldReadonly(field: FormFieldType): boolean {
            return this.isViewMode || Boolean(field.readonly) || Boolean(field.disabled);
        },

        /**
         * Checks if the field is an address field
         * @param {string} fieldId The field id
         * @returns {boolean} True if the field is an address field
         */
        isAddressField(fieldId: string): boolean {
            return (CEP_ADDRESS_FIELDS as readonly string[]).includes(fieldId);
        },

        /**
         * Checks if the field is disabled
         * @param {FormFieldType} field The field
         * @returns {boolean} True if the field is disabled
         */
        isInputDisabled(field: FormFieldType): boolean {
            if (field.disabled || this.isViewMode) {
                return true;
            }

            return this.cepLookupLoading && this.isAddressField(field.id);
        },

        /**
         * Gets the display value of the field
         * @param {FormFieldType} field The field
         * @returns {string} The display value of the field
         */
        selectDisplayValue(field: FormFieldType): string {
            const current = this.formValues[field.id];
            const options = field.options ?? [];

            if (Array.isArray(current)) {
                const labels = current
                    .map((item) => {
                        const match = options.find((option) => {
                            return option.value === item || option.value === String(item);
                        });

                        return match?.label ?? String(item);
                    })
                    .filter((label) => label !== "");

                return labels.join(", ");
            }

            const match = options.find((option) => {
                return option.value === current || option.value === String(current ?? "");
            });

            if (match) {
                return match.label;
            }

            if (current === undefined || current === null) {
                return "";
            }

            return String(current);
        },

        /**
         * Resolves the incoming value of the field
         * @param {FormFieldType} field The field
         * @returns {unknown} The incoming value of the field
         */
        resolveIncomingValue(field: FormFieldType): unknown {
            if (this.values && Object.prototype.hasOwnProperty.call(this.values, field.id)) {
                return this.values[field.id];
            }

            if (this.formValues[field.id] !== undefined) {
                return this.formValues[field.id];
            }

            if (field.value !== undefined) {
                return field.value;
            }

            if (field.type === "checkbox") {
                return false;
            }

            if (field.type === "select" && field.selectMultiple) {
                return [];
            }

            return "";
        },

        /**
         * Hydrates the form values
         * @returns {void}
         */
        hydrateFormValues() {
            const next: Record<string, unknown> = { ...this.formValues };

            for (const field of this.allFields) {
                let value = this.resolveIncomingValue(field);

                if (field.type === "select" && field.selectMultiple) {
                    value = Array.isArray(value) ? value.map((item) => String(item)) : [];
                } else if (
                    field.type === "select" &&
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                ) {
                    value = String(value);
                }

                next[field.id] = value;
            }

            this.formValues = next;
        },

        /**
         * Validates and emits `submit`. Used by actions rendered outside the form.
         * @returns {void}
         */
        submitForm() {
            const form = this.$el as HTMLFormElement | undefined;

            if (form && typeof form.requestSubmit === "function") {
                form.requestSubmit();
                return;
            }

            this.onSubmit(new Event("submit", { cancelable: true }));
        },

        /**
         * Applies the field errors
         * @param {Record<string, string>} errors The errors
         * @returns {void}
         */
        applyFieldErrors(errors: Record<string, string>) {
            this.fieldErrors = { ...errors };
        },

        /**
         * Sets the field value
         * @param {string} fieldId The field id
         * @param {unknown} value The value
         * @returns {void}
         */
        setFieldValue(fieldId: string, value: unknown) {
            this.formValues[fieldId] = value;

            if (this.fieldErrors[fieldId]) {
                const nextErrors = { ...this.fieldErrors };
                delete nextErrors[fieldId];
                this.fieldErrors = nextErrors;
            }
        },

        /**
         * Gets the field value
         * @param {string} fieldId The field id
         * @returns {unknown} The field value
         */
        getFieldValue(fieldId: string): unknown {
            return this.formValues[fieldId];
        },

        /**
         * Registers the select ref
         * @param {string} fieldId The field id
         * @param {unknown} el The element
         * @returns {void}
         */
        registerSelectRef(fieldId: string, el: unknown) {
            if (el && typeof el === "object" && "close" in el) {
                this.selectRefByFieldId[fieldId] = el as { close?: () => void };

                return;
            }

            if (!el) {
                delete this.selectRefByFieldId[fieldId];
            }
        },

        /**
         * Closes the select
         * @param {string} fieldId The field id
         * @returns {void}
         */
        closeSelect(fieldId: string) {
            this.selectRefByFieldId[fieldId]?.close?.();
        },

        /**
         * Checks if the select action is visible
         * @param {FormFieldType} field The field
         * @returns {boolean} True if the select action is visible
         */
        selectActionVisible(field: FormFieldType): boolean {
            if (this.isViewMode) {
                return false;
            }

            return Boolean(field.selectAction?.icon || field.selectAction?.label);
        },

        /**
         * Gets the select action aria label
         * @param {FormFieldType} field The field
         * @returns {string} The select action aria label
         */
        selectActionAriaLabel(field: FormFieldType): string {
            return field.selectAction?.label || field.selectAction?.tooltip || "Adicionar";
        },

        /**
         * Gets the select action layout class
         * @param {FormFieldType} field The field
         * @returns {string} The select action layout class
         */
        selectActionLayoutClass(field: FormFieldType): string {
            if (field.selectAction?.label) {
                return "h-full";
            }

            return "aspect-square h-auto w-auto p-1.5!";
        },

        /**
         * Handles the select action
         * @param {FormFieldType} field The field
         * @returns {void}
         */
        onSelectAction(field: FormFieldType) {
            this.closeSelect(field.id);
            this.$emit("click:select-action", {
                id: field.id,
                field
            });
        },

        /**
         * Handles the select selected
         * @param {FormFieldType} field The field
         * @param {string} value The value
         * @returns {void}
         */
        onSelectSelected(field: FormFieldType, value: string) {
            this.$emit("click:select-option", {
                id: field.id,
                value,
                field
            });
        },

        /**
         * Handles the select remove
         * @param {FormFieldType} field The field
         * @param {string} value The value
         * @returns {void}
         */
        onSelectRemove(field: FormFieldType, value: string) {
            this.$emit("click:select-remove", {
                id: field.id,
                value,
                field
            });
        },

        /**
         * Handles the select search external
         * @param {FormFieldType} formField The form field
         * @param {SearchExternalPayload} payload The payload
         * @returns {void}
         */
        onSelectSearchExternal(formField: FormFieldType, payload: SearchExternalPayload) {
            this.$emit("search:external", {
                id: formField.id,
                field: payload.field,
                value: payload.value
            });
        },

        /**
         * Resolves the section columns
         * @returns {number} The section columns
         */
        resolveSectionColumns(): number {
            const sc = this.sectionColumns;

            if (typeof sc === "number") {
                return sc;
            }

            const width = typeof window !== "undefined" ? window.innerWidth : 0;

            if (width >= 1024 && sc.lg != null) {
                return sc.lg;
            }

            if (width >= 768 && sc.md != null) {
                return sc.md;
            }

            if (width >= 640 && sc.sm != null) {
                return sc.sm;
            }

            if (sc.xs != null) {
                return sc.xs;
            }

            // fallback
            return sc.lg ?? sc.md ?? sc.sm ?? sc.xs ?? 1;
        },

        /**
         * Updates the value
         * @param {string} fieldId The field id
         * @param {unknown} value The value
         * @returns {void}
         */
        updateValue(fieldId: string, value: unknown) {
            const field = this.allFields.find((item) => item.id === fieldId);

            if (field && this.isFieldReadonly(field)) {
                return;
            }

            this.formValues[fieldId] = value;
            this.$emit("update:field", { id: fieldId, value });

            if (this.fieldErrors[fieldId]) {
                const nextErrors = { ...this.fieldErrors };
                delete nextErrors[fieldId];
                this.fieldErrors = nextErrors;
            }

            if (field?.type === "cep") {
                this.scheduleCepLookup(value);
            }
        },

        /**
         * Stops the cep lookup timers
         * @returns {void}
         */
        stopCepLookupTimers() {
            if (this.cepLookupTimer != null) {
                window.clearTimeout(this.cepLookupTimer);
                this.cepLookupTimer = null;
            }

            if (this.cepLookupTimeout != null) {
                window.clearTimeout(this.cepLookupTimeout);
                this.cepLookupTimeout = null;
            }

            this.cepLookupAbort?.abort();
            this.cepLookupAbort = null;
        },

        /**
         * Clears the cep lookup
         * @returns {void}
         */
        clearCepLookup() {
            this.stopCepLookupTimers();
            this.cepLookupLoading = false;
        },

        /**
         * Schedules the cep lookup
         * @param {unknown} value The value
         * @returns {void}
         */
        scheduleCepLookup(value: unknown) {
            const digits = cepDigits(value);

            this.stopCepLookupTimers();

            if (digits.length !== 8 || this.isViewMode) {
                this.cepLookupLoading = false;
                return;
            }

            this.cepLookupLoading = true;
            this.cepLookupTimer = window.setTimeout(() => {
                this.cepLookupTimer = null;
                void this.lookupCep(digits);
            }, CEP_LOOKUP_DEBOUNCE_MS);
        },

        /**
         * Looks up the cep
         * @param {string} digits The digits
         * @returns {void}
         */
        async lookupCep(digits: string) {
            const hasAddressFields = CEP_ADDRESS_FIELDS.some((id) =>
                this.allFields.some((field) => field.id === id)
            );

            if (!hasAddressFields) {
                return;
            }

            this.cepLookupSeq += 1;
            const seq = this.cepLookupSeq;
            const abort = new AbortController();
            this.cepLookupAbort = abort;
            this.cepLookupLoading = true;

            this.cepLookupTimeout = window.setTimeout(() => {
                this.cepLookupTimeout = null;
                abort.abort();

                if (seq !== this.cepLookupSeq) {
                    return;
                }

                this.cepLookupLoading = false;
                this.notifyCepTimeout();
            }, CEP_LOOKUP_TIMEOUT_MS);

            try {
                const response = await fetch(viaCepUrl(digits), { signal: abort.signal });

                if (!response.ok) {
                    return;
                }

                const payload: unknown = await response.json();

                if (seq !== this.cepLookupSeq) {
                    return;
                }

                const address = parseViaCepResponse(payload);

                if (!address) {
                    return;
                }

                for (const id of CEP_FILL_FIELDS) {
                    if (!this.allFields.some((field) => field.id === id)) {
                        continue;
                    }

                    this.formValues[id] = address[id];
                }
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") {
                    return;
                }
            } finally {
                if (this.cepLookupTimeout != null) {
                    window.clearTimeout(this.cepLookupTimeout);
                    this.cepLookupTimeout = null;
                }

                if (this.cepLookupAbort === abort) {
                    this.cepLookupAbort = null;
                    this.cepLookupLoading = false;
                }
            }
        },

        /**
         * Notifies the cep timeout
         * @returns {void}
         */
        notifyCepTimeout() {
            const toast = (this as { $toast?: { error: (message: string) => void } }).$toast;

            toast?.error("Não foi possível buscar o endereço pelo CEP. Tente novamente.");
        },

        /**
         * Gets the field error
         * @param {FormFieldType} field The field
         * @returns {string} The field error
         */
        fieldError(field: FormFieldType): string {
            return this.fieldErrors[field.id] || field.error || "";
        },

        /**
         * Checks if the value is empty
         * @param {FormFieldType} field The field
         * @param {any} value The value
         * @returns {boolean} True if the value is empty
         */
        isEmptyValue(field: FormFieldType, value: any): boolean {
            if (field.type === "checkbox" || field.type === "toggle") {
                return !value;
            }

            if (Array.isArray(value)) {
                return value.length === 0;
            }

            if (field.type === "radio" || field.type === "select" || field.type === "toggleable") {
                return value === "" || value === undefined || value === null;
            }

            if (typeof value === "string") {
                return value.trim() === "";
            }

            return value === "" || value === undefined || value === null;
        },

        /**
         * Gets the required error message
         * @param {FormFieldType} field The field
         * @returns {string} The required error message
         */
        requiredErrorMessage(field: FormFieldType): string {
            if (field.type === "radio" || field.type === "select" || field.type === "toggleable") {
                return `Selecione uma opção em "${field.label}".`;
            }

            return `"${field.label}" é obrigatório.`;
        },

        /**
         * Handles the form submit
         * @param {Event} event The event
         * @returns {void}
         */
        onSubmit(event: Event) {
            event.preventDefault();

            if (this.isViewMode || this.submitDisabled) {
                return;
            }

            const nextErrors: Record<string, string> = {};
            const emptyFields: string[] = [];

            for (const field of this.allFields) {
                if (!this.isFieldVisible(field)) {
                    continue;
                }

                const value = this.formValues[field.id];

                if (
                    field.required
                    && !this.isFieldReadonly(field)
                    && this.isEmptyValue(field, value)
                ) {
                    nextErrors[field.id] = this.requiredErrorMessage(field);
                    emptyFields.push(field.label);
                    continue;
                }

                if (this.isInputType(field.type) && value) {
                    if (!this.validateFieldValue(field.type, value, field.minSize)) {
                        nextErrors[field.id] = `O campo ${field.label} é inválido.`;
                    }
                }
            }

            this.fieldErrors = nextErrors;

            if (emptyFields.length > 0) {
                (this as any).$toast.error(emptyFields.join(", ") + " são obrigatórios.");
            }

            if (Object.keys(nextErrors).length > 0) {
                return;
            }

            this.$emit("submit", { ...this.formValues });
        },

        /**
         * Enter in a field submits the form. Skips textareas, select
         * triggers, and an open floating panel (which uses Enter to pick).
         * @param {KeyboardEvent} event The event
         * @returns {void}
         */
        onFormKeydown(event: KeyboardEvent) {
            if (event.key !== "Enter" || event.repeat || event.defaultPrevented) {
                return;
            }

            if (this.isViewMode || this.submitDisabled) {
                return;
            }

            const target = event.target;

            if (!(target instanceof HTMLElement)) {
                return;
            }

            const form = this.$el as HTMLFormElement | undefined;

            if (!form?.contains(target)) {
                return;
            }

            if (target.closest("[data-cht-floating-panel]")) {
                return;
            }

            if (target.tagName === "TEXTAREA" || target.isContentEditable) {
                return;
            }

            if (target.tagName === "BUTTON") {
                return;
            }

            if (target instanceof HTMLInputElement && (target.type === "button" || target.type === "reset")) {
                return;
            }

            if (!form || typeof form.requestSubmit !== "function") {
                return;
            }

            event.preventDefault();
            form.requestSubmit();
        },

        /**
         * Checks if the type is an input type
         * @param {string} type The type
         * @returns {boolean} True if the type is an input type
         */
        isInputType(type: string): boolean {
            return INPUT_TYPES.includes(type);
        },

        /**
         * Validates the field value
         * @param {string} type The type
         * @param {any} value The value
         * @param {number} minSize The minimum size
         * @returns {boolean} True if the field value is valid
         */
        validateFieldValue(type: string, value: any, minSize?: number): boolean {
            const str = String(value);

            if (minSize && str.length < minSize) {
                return false;
            }

            switch (type) {
                case "email":
                    return validateEmail(str);
                case "phone":
                    return validatePhone(str);
                case "cpf":
                    return validateCPF(str);
                case "cnpj":
                    return validateCNPJ(str);
                case "cep":
                    return str.replace(/\D/g, "").length >= 8;
                default:
                    return true;
            }
        },

        /**
         * Gets the field style
         * @param {FormFieldType} field The field
         * @returns {Record<string, string>} The field style
         */
        getFieldStyle(field: FormFieldType): Record<string, string> {
            if (["checkbox", "radio", "textarea", "toggle", "toggleable"].includes(field.type)) {
                return { gridColumn: "1 / -1" };
            }

            if (field.cols) {
                return { gridColumn: `span ${field.cols}` };
            }

            return {};
        },

        /**
         * Checks if the field is visible
         * @param {FormFieldType} field The field
         * @returns {boolean} True if the field is visible
         */
        isFieldVisible(field: FormFieldType): boolean {
            if (!field.condition) {
                return true;
            }

            const current = this.formValues[field.condition.field];
            const operator = field.condition.operator ?? "eq";

            if (operator === "cnpj") {
                return isCnpjDocument(current);
            }

            if (operator === "neq") {
                return current !== field.condition.value;
            }

            return current === field.condition.value;
        },

        /**
         * Checks if the section is visible
         * @param {FormFieldType[]} sectionFields The section fields
         * @returns {boolean} True if the section is visible
         */
        isSectionVisible(sectionFields: FormFieldType[]): boolean {
            return sectionFields.some((field) => this.isFieldVisible(field));
        }
    }
});
</script>
