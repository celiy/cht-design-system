<template>
    <FloatingPanel
        ref="panelRef"

        :id="id"
        :label="label"
        :helperText="helperText"
        :header="header"
        :buttonAtributes="buttonAtributes"
        :buttonVariant="buttonVariant"
        :hideDropdownArrow="hideDropdownArrow"
        :maxHeightPx="maxHeightPx"
        :panelClass="panelClass"

        @open="onPanelOpen"
    >
        <template #triggerLabel>
            <span
                :class="{
                    'text-muted-foreground': selectTriggerMuted
                }"
            >
                {{ selectTriggerLabel }}
            </span>
        </template>

        <template #default>
            <OptionsList
                v-model:searchQuery="searchQuery"

                :options="options"
                :search="search"
                :showCheckmark="true"
                :isOptionSelected="isOptionSelected"

                @select="selectOption"
            />
        </template>
    </FloatingPanel>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import FloatingPanel from "./internal/FloatingPanel.vue";
import OptionsList, { type OptionItem, type SearchConfig } from "./internal/OptionsList.vue";

type SelectMultipleConfig = {
    min?: number;
    max?: number;
    allSelected?: boolean;
};

export default defineComponent({
    name: "Select",

    emits: ["update:modelValue", "update:value"],

    components: {
        FloatingPanel,
        OptionsList
    },

    props: {
        id: {
            type: String,
            required: false
        },

        label: {
            type: String,
            required: false
        },

        helperText: {
            type: String,
            required: false
        },

        header: {
            type: String,
            required: false
        },

        options: {
            type: Array as PropType<OptionItem[]>,
            required: false
        },

        /**
         * Enables the search input on top of the options list.
         */
        search: {
            type: Object as PropType<SearchConfig>,
            required: false
        },

        modelValue: {
            type: [String, Number, Array] as PropType<string | number | string[] | undefined>,
            required: false,
            default: undefined
        },

        buttonAtributes: {
            type: Object,
            required: false
        },

        buttonVariant: {
            type: String,
            default: "secondary",
            required: false
        },

        /**
         * Persists the selected value in localStorage under `id`.
         */
        useMemo: {
            type: Boolean,
            default: false
        },

        hideDropdownArrow: {
            type: Boolean,
            default: false
        },

        /**
         * Enables multi-selection mode with optional `min`, `max`, and `allSelected` bounds.
         */
        selectMultiple: {
            type: Object as PropType<SelectMultipleConfig>,
            required: false
        },

        maxHeightPx: {
            type: Number,
            default: 280
        },

        panelClass: {
            type: String,
            default: "",
            required: false
        }
    },

    data() {
        return {
            value: "",
            selectedValues: [] as string[],
            /** True once a valid entry was read from localStorage (including an empty array). */
            multiInitializedFromMemo: false,
            /** True after the first `modelValue` array resolution, prevents re-hydrating on repeated `[]`. */
            multiMemoHydrationDone: false,
            /** True when `modelValue` is not `undefined` (parent explicitly controls). */
            multiModelValueProvided: false,
            searchQuery: ""
        };
    },

    mounted() {
        if (this.useMemo) {
            if (this.isSelectMultiple) {
                if (
                    this.id
                    && !this.multiModelValueProvided
                    && this.selectedValues.length === 0
                ) {
                    if (this.tryHydrateMultiFromStorage()) {
                        this.multiMemoHydrationDone = true;
                        this.emitSelectionToParent();
                    }
                }
            } else if (this.id) {
                const raw = localStorage.getItem(this.id);

                if (!this.value) {
                    const next = raw ?? "";

                    if (next !== this.value) {
                        this.value = next;
                        this.emitSelectionToParent();
                    }
                }
            }
        }

        this.$nextTick(() => {
            this.applyInitialAllSelected();
        });
    },

    watch: {
        modelValue: {
            handler(newVal) {
                if (this.isSelectMultiple) {
                    if (newVal === undefined) {
                        return;
                    }

                    this.multiModelValueProvided = true;

                    if (newVal === null) {
                        this.selectedValues = [];
                        this.multiMemoHydrationDone = true;

                        return;
                    }

                    if (Array.isArray(newVal)) {
                        if (
                            newVal.length === 0
                            && this.useMemo
                            && this.id
                            && !this.multiMemoHydrationDone
                            && this.tryHydrateMultiFromStorage()
                        ) {
                            this.multiMemoHydrationDone = true;
                            this.emitSelectionToParent();

                            return;
                        }

                        this.multiMemoHydrationDone = true;
                        this.selectedValues = newVal.map(v => String(v));

                        return;
                    }

                    this.multiMemoHydrationDone = true;
                    this.selectedValues = [];

                    return;
                }

                if (newVal === undefined || newVal === null) {
                    return;
                }

                this.value = String(newVal);
            },
            immediate: true,
            deep: true
        }
    },

    methods: {
        /**
         * Pushes the current internal selection to the parent (v-model / @update:value).
         * Used after restoring from localStorage so consumers stay in sync on mount.
         */
        emitSelectionToParent() {
            if (this.isSelectMultiple) {
                this.$emit("update:value", [...this.selectedValues]);
                this.$emit("update:modelValue", [...this.selectedValues]);

                return;
            }

            this.$emit("update:value", this.value);
            this.$emit("update:modelValue", this.value);
        },

        /**
         * Persists the current value in localStorage when `useMemo` is enabled.
         */
        persistMemoValue(value: string | number | boolean | string[]) {
            if (!this.id) {
                return;
            }

            if (this.isSelectMultiple && Array.isArray(value)) {
                localStorage.setItem(this.id, JSON.stringify(value));

                return;
            }

            localStorage.setItem(this.id, String(value ?? ""));
        },

        /**
         * Restores the multi-selection from localStorage when `useMemo` is enabled.
         *
         * @returns true when a valid JSON array was read (possibly empty).
         */
        tryHydrateMultiFromStorage(): boolean {
            if (!this.useMemo || !this.isSelectMultiple || !this.id) {
                return false;
            }

            const raw = localStorage.getItem(this.id);

            if (raw === null || raw === "") {
                return false;
            }

            try {
                const parsed = JSON.parse(raw) as unknown;

                if (!Array.isArray(parsed)) {
                    return false;
                }

                this.selectedValues = parsed.map(v => String(v));
                this.multiInitializedFromMemo = true;

                return true;
            } catch {
                return false;
            }
        },

        /**
         * Pre-selects every option with value when `selectMultiple.allSelected` is truthy and
         * neither memo nor an explicit `modelValue` already provided a value.
         */
        applyInitialAllSelected() {
            if (!this.isSelectMultiple || !this.selectMultiple?.allSelected) {
                return;
            }

            if (this.multiModelValueProvided) {
                return;
            }

            if (this.multiInitializedFromMemo) {
                return;
            }

            if (this.selectedValues.length > 0) {
                return;
            }

            const allValues = (this.options ?? [])
                .filter(
                    o =>
                        !o.separator
                        && o.value !== undefined
                        && o.value !== ""
                )
                .map(o => String(o.value));

            const max = this.selectMultiple.max ?? Number.POSITIVE_INFINITY;
            const next = allValues.slice(0, max);

            this.selectedValues = next;

            if (this.id && this.useMemo) {
                this.persistMemoValue(this.selectedValues);
            }

            this.$emit("update:value", [...this.selectedValues]);
            this.$emit("update:modelValue", [...this.selectedValues]);
        },

        selectOption(val: string | undefined) {
            if (val === undefined) {
                return;
            }

            if (this.isSelectMultiple) {
                const min = this.selectMultiple?.min ?? 0;
                const max = this.selectMultiple?.max ?? Number.POSITIVE_INFINITY;
                const idx = this.selectedValues.indexOf(val);
                const next = [...this.selectedValues];

                if (idx >= 0) {
                    if (next.length <= min) {
                        return;
                    }

                    next.splice(idx, 1);
                } else {
                    if (next.length >= max) {
                        return;
                    }

                    next.push(val);
                }

                this.selectedValues = next;
                this.multiMemoHydrationDone = true;

                if (this.id) {
                    this.persistMemoValue(this.selectedValues);
                }

                this.$emit("update:value", [...this.selectedValues]);
                this.$emit("update:modelValue", [...this.selectedValues]);

                return;
            }

            this.close();

            if (this.value === val) {
                this.value = "";
            } else {
                this.value = val;
            }

            if (this.id) {
                this.persistMemoValue(this.value);
            }

            this.$emit("update:value", this.value);
            this.$emit("update:modelValue", this.value);
        },

        isOptionSelected(val: string | undefined): boolean {
            if (val === undefined || val === "") {
                return false;
            }

            if (this.isSelectMultiple) {
                return this.selectedValues.includes(val);
            }

            return this.value === val;
        },

        onPanelOpen() {
            if (!this.search) {
                return;
            }

            this.$nextTick(() => this.focusSearchInput());
        },

        focusSearchInput() {
            const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
                "[data-dropdown-floating-panel] input, [data-dropdown-floating-panel] textarea"
            );

            if (!input) {
                return;
            }

            input.focus({ preventScroll: true });

            if ("setSelectionRange" in input) {
                const length = input.value?.length ?? 0;
                input.setSelectionRange(length, length);
            }
        },

        open() {
            const panel = this.$refs.panelRef as InstanceType<typeof FloatingPanel> | undefined;
            panel?.open();
        },

        close() {
            const panel = this.$refs.panelRef as InstanceType<typeof FloatingPanel> | undefined;
            panel?.close();
        }
    },

    computed: {
        isSelectMultiple(): boolean {
            return this.selectMultiple != null;
        },

        /**
         * Text shown on the trigger button. Multi-select never surfaces the selected labels.
         */
        selectTriggerLabel(): string {
            if (this.isSelectMultiple) {
                return this.header ?? "Selecione...";
            }

            return this.selectedValueLabel || this.header || "Selecione...";
        },

        selectTriggerMuted(): boolean {
            if (this.isSelectMultiple) {
                return !this.header;
            }

            return !this.selectedValueLabel && !this.header;
        },

        selectedValueLabel(): string | undefined {
            if (!this.options) {
                return undefined;
            }

            for (const option of this.options) {
                if (this.value === option.value) {
                    return option.label;
                }
            }

            return undefined;
        }
    }
});
</script>
