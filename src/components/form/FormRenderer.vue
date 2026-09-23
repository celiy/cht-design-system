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
                            :disabled="field.disabled"
                            :readonly="isFieldReadonly(field)"
                            :variant="isFieldReadonly(field) ? 'display' : 'secondary'"
                            :max-size="field.maxSize"
                            :min-size="field.minSize"
                            :input-class="field.inputClass"
                            :text-mask="field.textMask"
                            :copiable="isFieldReadonly(field) || field.copiable"
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
                                :model-value="formValues[field.id]"
                                :select-multiple="field.selectMultiple"
                                :separate-selected="Boolean(field.selectSeparateSelected)"
                                :hide-dropdown-arrow="isViewMode"
                                :disabled="isViewMode || field.disabled"
                                :action-icon="isViewMode ? undefined : field.selectAction?.icon"
                                :action-label="isViewMode ? undefined : field.selectAction?.label"
                                :action-side="field.selectAction?.side ?? 'right'"
                                :action-tooltip="isViewMode ? undefined : field.selectAction?.tooltip"

                                @update:value="updateValue(field.id, $event)"
                                @click:action="onSelectAction(field)"
                                @click:selected="onSelectSelected(field, $event)"
                                @remove:selected="onSelectRemove(field, $event)"
                                @search:external="onSelectSearchExternal(field, $event)"
                            >
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
import Radio from "../Radio.vue";
import Select from "../Select.vue";
import validateEmail from "@shared/validators/email";
import validatePhone from "@shared/validators/phone";
import { validateCPF, validateCNPJ, isCnpjDocument } from "@shared/validators/documents";
import type { FormField as FormFieldType } from "@shared/interfaces/FormField";
import { INPUT_TYPES } from "@shared/constants/InputTypes";
import type { SearchExternalPayload } from "../internal/OptionsList.vue";

interface FormSection {
    key?: string;
    title: string;
    fields: FormFieldType[];
}

export default defineComponent({
    name: "FormRenderer",

    components: {
        Input,
        Checkbox,
        Radio,
        Select
    },

    props: {
        fields: {
            type: Array as PropType<FormFieldType[]>,
            required: false,
            default: () => []
        },

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

        values: {
            type: Object as PropType<Record<string, unknown> | null>,
            required: false,
            default: null
        },

        formId: {
            type: String,
            required: false
        },

        submitLabel: {
            type: String,
            default: "Enviar"
        },

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

    emits: ["submit", "click:select-action", "click:select-option", "click:select-remove", "search:external"],

    data() {
        return {
            formValues: {} as Record<string, any>,
            fieldErrors: {} as Record<string, string>,
            activeSectionColumns: 1,
            selectRefByFieldId: {} as Record<string, { close?: () => void } | null>
        };
    },

    computed: {
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

        allFields(): FormFieldType[] {
            return this.normalizedSections.flatMap((s) => s.fields);
        },

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

    created() {
        this.hydrateFormValues();
    },

    mounted() {
        this.activeSectionColumns = this.resolveSectionColumns();
        window.addEventListener("resize", this.onResize);
    },

    beforeUnmount() {
        window.removeEventListener("resize", this.onResize);
    },

    methods: {
        onResize() {
            this.activeSectionColumns = this.resolveSectionColumns();
        },

        isFieldReadonly(field: FormFieldType): boolean {
            return this.isViewMode || Boolean(field.readonly) || Boolean(field.disabled);
        },

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
         */
        submitForm() {
            const form = this.$el as HTMLFormElement | undefined;

            if (form && typeof form.requestSubmit === "function") {
                form.requestSubmit();
                return;
            }

            this.onSubmit(new Event("submit", { cancelable: true }));
        },

        applyFieldErrors(errors: Record<string, string>) {
            this.fieldErrors = { ...errors };
        },

        setFieldValue(fieldId: string, value: unknown) {
            this.formValues[fieldId] = value;

            if (this.fieldErrors[fieldId]) {
                const nextErrors = { ...this.fieldErrors };
                delete nextErrors[fieldId];
                this.fieldErrors = nextErrors;
            }
        },

        getFieldValue(fieldId: string): unknown {
            return this.formValues[fieldId];
        },

        registerSelectRef(fieldId: string, el: unknown) {
            if (el && typeof el === "object" && "close" in el) {
                this.selectRefByFieldId[fieldId] = el as { close?: () => void };

                return;
            }

            if (!el) {
                delete this.selectRefByFieldId[fieldId];
            }
        },

        closeSelect(fieldId: string) {
            this.selectRefByFieldId[fieldId]?.close?.();
        },

        onSelectAction(field: FormFieldType) {
            this.$emit("click:select-action", {
                id: field.id,
                field
            });
        },

        onSelectSelected(field: FormFieldType, value: string) {
            this.$emit("click:select-option", {
                id: field.id,
                value,
                field
            });
        },

        onSelectRemove(field: FormFieldType, value: string) {
            this.$emit("click:select-remove", {
                id: field.id,
                value,
                field
            });
        },

        onSelectSearchExternal(formField: FormFieldType, payload: SearchExternalPayload) {
            this.$emit("search:external", {
                id: formField.id,
                field: payload.field,
                value: payload.value
            });
        },

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

        updateValue(fieldId: string, value: unknown) {
            const field = this.allFields.find((item) => item.id === fieldId);

            if (field && this.isFieldReadonly(field)) {
                return;
            }

            this.formValues[fieldId] = value;

            if (this.fieldErrors[fieldId]) {
                const nextErrors = { ...this.fieldErrors };
                delete nextErrors[fieldId];
                this.fieldErrors = nextErrors;
            }
        },

        fieldError(field: FormFieldType): string {
            return this.fieldErrors[field.id] || field.error || "";
        },

        isEmptyValue(field: FormFieldType, value: any): boolean {
            if (field.type === "checkbox") {
                return !value;
            }

            if (Array.isArray(value)) {
                return value.length === 0;
            }

            if (field.type === "radio" || field.type === "select") {
                return value === "" || value === undefined || value === null;
            }

            if (typeof value === "string") {
                return value.trim() === "";
            }

            return value === "" || value === undefined || value === null;
        },

        requiredErrorMessage(field: FormFieldType): string {
            if (field.type === "radio" || field.type === "select") {
                return `Selecione uma opção em "${field.label}".`;
            }

            return `"${field.label}" é obrigatório.`;
        },

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

        isInputType(type: string): boolean {
            return INPUT_TYPES.includes(type);
        },

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

        getFieldStyle(field: FormFieldType): Record<string, string> {
            if (["checkbox", "radio", "textarea"].includes(field.type)) {
                return { gridColumn: "1 / -1" };
            }

            if (field.cols) {
                return { gridColumn: `span ${field.cols}` };
            }

            return {};
        },

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

        isSectionVisible(sectionFields: FormFieldType[]): boolean {
            return sectionFields.some((field) => this.isFieldVisible(field));
        }
    }
});
</script>
