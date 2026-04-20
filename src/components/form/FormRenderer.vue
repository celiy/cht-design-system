<template>
    <form @submit="onSubmit" class="flex flex-col gap-6">
        <div
            v-for="sectionObj in normalizedSections"
            :key="sectionObj.key"
            v-show="isSectionVisible(sectionObj.fields)"
        >
            <h3
                v-if="String(sectionObj.title)"
                class="text-foreground font-semibold text-base mb-3"
            >
                {{ sectionObj.title }}
            </h3>

            <div
                :class="{
                    'flex flex-col gap-4': activeSectionColumns <= 1,
                    'grid gap-4': activeSectionColumns > 1
                }"
                :style="activeSectionColumns > 1 ? { gridTemplateColumns: `repeat(${activeSectionColumns}, minmax(0, 1fr))` } : undefined"
            >
                <template v-for="field in sectionObj.fields" :key="field.id">
                    <div v-if="isFieldVisible(field)" :style="getFieldStyle(field)">
                        <Input
                            v-if="isInputType(field.type)"
                            :id="field.id"
                            :type="field.type as any"
                            :label="field.label"
                            :placeholder="field.placeholder"
                            :helperText="field.helperText"
                            :error="field.error"
                            :required="field.required"
                            :disabled="field.disabled"
                            :readonly="field.readonly"
                            :maxSize="field.maxSize"
                            :minSize="field.minSize"
                            :inputClass="field.inputClass"
                            :textMask="field.textMask"
                            :copiable="field.copiable"
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
                            :required="field.required"
                            :disabled="field.disabled"
                            :checked="formValues[field.id] ?? false"
                            :value="formValues[field.id] ?? false"

                            @update:value="updateValue(field.id, $event)"
                        />

                        <div v-else-if="field.type === 'radio'" class="flex flex-col gap-2">
                            <Radio
                                v-for="option in field.options"
                                :key="option.value"

                                :id="`${field.id}-${option.value}`"
                                :name="field.name || field.id"
                                :label="option.label"
                                :value="option.value"
                                :description="option.description"
                                :variant="(field.variant as 'normal' | 'card') || 'normal'"
                                :required="field.required"
                                :disabled="field.disabled"
                                :modelValue="formValues[field.id]"

                                @update:modelValue="updateValue(field.id, $event)"
                            />
                        </div>

                        <div v-else-if="field.type === 'select'" class="flex flex-col gap-2">
                            <Select
                                :header="field.label"
                                :options="field.options"
                                :modelValue="formValues[field.id]"

                                @update:value="updateValue(field.id, $event)"
                            />
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <slot name="submit" />
    </form>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Input from "../Input.vue";
import Checkbox from "../Checkbox.vue";
import Radio from "../Radio.vue";
import Select from "../Select.vue";
import Button from "../Button.vue";
import validateEmail from "@shared/validators/email";
import validatePhone from "@shared/validators/phone";
import { validateCPF, validateCNPJ } from "@shared/validators/documents";
import type { FormField as FormFieldType } from "@shared/interfaces/FormField";
import { INPUT_TYPES } from "@shared/constants/InputTypes";

interface FormSection {
    key?: string;
    title: string;
    fields: FormFieldType[];
}

export default defineComponent({
    name: 'FormRenderer',

    emits: ['submit'],

    components: {
        Input,
        Checkbox,
        Radio,
        Select,
        Button
    },

    props: {
        fields: {
            type: Array as PropType<FormFieldType[]>,
            required: false,
            default: () => [],
        },

        sections: {
            type: Array as PropType<FormSection[]>,
            required: false,
            default: () => [],
        },

        submitLabel: {
            type: String,
            default: 'Enviar'
        },

        sectionColumns: {
            type: [Number, Object] as PropType<number | { xs?: number; sm?: number; md?: number; lg?: number }>,
            default: 1
        }
    },

    data() {
        return {
            formValues: {} as Record<string, any>,
            activeSectionColumns: 1
        }
    },

    created() {
        for (const field of this.allFields) {
            if (field.value !== undefined) {
                this.formValues[field.id] = field.value;
            } else if (field.type === 'checkbox') {
                this.formValues[field.id] = false;
            } else {
                this.formValues[field.id] = '';
            }
        }
    },

    mounted() {
        this.activeSectionColumns = this.resolveSectionColumns();
        window.addEventListener('resize', this.onResize);
    },

    beforeUnmount() {
        window.removeEventListener('resize', this.onResize);
    },

    methods: {
        onResize() {
            this.activeSectionColumns = this.resolveSectionColumns();
        },

        resolveSectionColumns(): number {
            const sc = this.sectionColumns;

            if (typeof sc === 'number') {
                return sc;
            }

            const width = typeof window !== 'undefined' ? window.innerWidth : 0;

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

        updateValue(fieldId: string, value: any) {
            this.formValues[fieldId] = value;
        },

        onSubmit(event: Event) {
            event.preventDefault();

            const errors: string[] = [];

            for (const field of this.allFields) {
                if (!this.isFieldVisible(field)) continue;

                const value = this.formValues[field.id];

                if (field.required) {
                    if (field.type === 'checkbox' && !value) {
                        errors.push(`"${field.label}" é obrigatório.`);

                        continue;
                    }

                    if (field.type === 'radio' && !value) {
                        errors.push(`Selecione uma opção em "${field.label}".`);

                        continue;
                    }

                    if (field.type === 'select' && !value) {
                        errors.push(`Selecione uma opção em "${field.label}".`);

                        continue;
                    }

                    if (value === '' || value === undefined || value === null) {
                        errors.push(`"${field.label}" é obrigatório.`);

                        continue;
                    }
                }

                if (this.isInputType(field.type) && value) {
                    if (!this.validateFieldValue(field.type, value, field.minSize)) {
                        errors.push(`O campo ${field.label} é inválido.`);
                    }
                }
            }

            if (errors.length > 0) {
                for (const error of errors) {
                    (this as any).$toast.error(error);
                }

                return;
            }

            this.$emit("submit", { ...this.formValues });
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
                case 'email':
                    return validateEmail(str);
                case 'phone':
                    return validatePhone(str);
                case 'cpf':
                    return validateCPF(str);
                case 'cnpj':
                    return validateCNPJ(str);
                case 'cep':
                    return str.replace(/\D/g, '').length >= 8;
                default:
                    return true;
            }
        },

        getFieldStyle(field: FormFieldType): Record<string, string> {
            if (['checkbox', 'radio', 'textarea'].includes(field.type)) {
                return { gridColumn: '1 / -1' };
            }

            if (field.cols) {
                return { gridColumn: `span ${field.cols}` };
            }

            return {};
        },

        isFieldVisible(field: FormFieldType): boolean {
            if (!field.condition) return true;

            const current = this.formValues[field.condition.field];
            const expected = field.condition.value;

            if (field.condition.operator === 'neq') {
                return current !== expected;
            }

            return current === expected;
        },

        isSectionVisible(sectionFields: FormFieldType[]): boolean {
            return sectionFields.some(field => this.isFieldVisible(field));
        }
    },

    computed: {
        normalizedSections(): Array<{ key: string; title: string; fields: FormFieldType[] }> {
            if (this.sections && this.sections.length > 0) {
                return this.sections.map((sec, idx) => ({
                    key: sec.key ?? sec.title ?? `section-${idx}`,
                    title: sec.title ?? '',
                    fields: sec.fields ?? [],
                }));
            }

            const result: Record<string, FormFieldType[]> = {};

            for (const field of this.fields) {
                const sectionTitle = field.section ?? '';

                if (!result[sectionTitle]) {
                    result[sectionTitle] = [];
                }

                result[sectionTitle].push(field);
            }

            return Object.entries(result).map(([title, fields]) => ({
                key: title,
                title,
                fields,
            }));
        },

        allFields(): FormFieldType[] {
            return this.normalizedSections.flatMap((s) => s.fields);
        }
    }
});
</script>
