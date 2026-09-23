<template>
    <div class="flex w-full flex-col gap-2">
        <div class="w-full gap-2">
            <label
                v-if="label && !isCombobox"

                class="mb-2 block text-sm font-semibold text-foreground"
                :for="id"
            >
                {{ label }}
            </label>

            <div
                class="flex w-full items-stretch gap-2"
                :class="{ 'flex-row-reverse': hasActionButton && actionSide === 'left' }"
            >
                <div
                    ref="anchorRef"

                    class="min-w-0 flex-1"
                >
                    <div
                        v-if="isCombobox"

                        class="relative w-full"
                    >
                        <Input
                            :id="id"
                            type="text"
                            :label="header || label"
                            :variant="variant"
                            :value="comboboxQuery"
                            :disabled="disabled"
                            :readonly="comboboxSelectionLocked"
                            :error="error"

                            @focus="onComboboxFocus"
                            @click="onComboboxClick"
                            @update:value="onComboboxInput"
                        />

                        <button
                            v-if="comboboxSelectionLocked && !disabled"

                            type="button"
                            class="absolute right-2 bottom-1.5 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                            aria-label="Limpar seleção"

                            @click.stop="clearComboboxSelection"
                        >
                            <i class="fa-solid fa-xmark text-sm" />
                        </button>
                    </div>

                    <Button
                        v-else

                        v-bind="mergedButtonAtributes"
                        class="w-full"
                        :class="{
                            'ring-[3px]! ring-ring/50! ring-offset-0!': isPanelOpen
                        }"
                        :hover-effect="false"

                        @click.stop="toggleOpenClose"
                        @keydown.enter="onTriggerActivate"
                        @keydown.space="onTriggerActivate"
                    >
                        <div class="flex w-full items-center justify-between gap-2">
                            <div class="min-w-0 flex-1 text-left">
                                <div class="flex min-w-0 items-center gap-2 text-left">
                                    <span
                                        v-if="selectTriggerIndicator"

                                        class="block shrink-0 rounded-full border border-current/10"
                                        :style="selectTriggerIndicatorStyle"
                                    />

                                    <span
                                        class="block min-w-0 truncate"
                                        :class="{
                                            'text-muted-foreground': selectTriggerMuted
                                        }"
                                    >
                                        {{ selectTriggerLabel }}
                                    </span>
                                </div>
                            </div>

                            <i
                                v-if="!hideDropdownArrow"

                                class="fa-solid fa-chevron-down ml-2 text-xs transition-all"
                                :class="{ 'rotate-180': isPanelOpen }"
                            />
                        </div>
                    </Button>
                </div>

                <div
                    v-if="hasActionButton"

                    class="flex min-h-0 shrink-0 self-stretch"
                >
                    <Button
                        v-tooltip="actionTooltip || undefined"
                        type="button"
                        class="min-h-0 self-stretch"
                        :class="actionButtonLayoutClass"
                        :hover-effect="false"
                        :left-icon="actionIcon"
                        :label="actionLabel"
                        :disabled="disabled"
                        :aria-label="actionAriaLabel"
                        :button-class="actionButtonClass"

                        @click.stop="onActionClick"
                    />
                </div>
            </div>

            <small
                v-if="helperText"

                class="mt-2 text-muted-foreground!"
            >
                {{ helperText }}
            </small>
        </div>

        <FloatingPanel
            ref="panelRef"

            :anchor="triggerEl"
            :max-height-px="maxHeightPx"
            :panel-class="panelClass"
            :mobile-modal="mobileModal"
            :force-modal="forceModal"
            :open="internalOpen"

            @update:open="onPanelOpenUpdate"
        >
            <OptionsList
                v-model:search-query="searchQuery"
                :options="panelOptions"
                :search="listSearch"
                :show-checkmark="panelShowCheckmark"
                :is-option-selected="isOptionSelected"

                @select="selectOption"
                @search:external="onSearchExternal"
            >
                <template
                    v-if="$slots['inside-empty-panel']"
                    #insideEmptyPanel
                >
                    <slot name="inside-empty-panel" />
                </template>
            </OptionsList>

            <template #helperText>
                <small
                    v-if="inHelperText"

                    class="px-3 pb-2 text-muted-foreground!"
                >
                    {{ inHelperText }}
                </small>
            </template>
        </FloatingPanel>

        <div
            v-if="showSeparatedSelected"

            class="flex flex-wrap gap-2"
        >
            <div
                v-for="item in separatedSelectedItems"
                :key="item.value"

                class="flex items-stretch"
            >
                <Button
                    variant="outline"
                    size="small"
                    :class="{ 'rounded-r-none!': !disabled }"
                    :hover-effect="false"
                    :label="item.label"

                    @click.stop="onSeparatedLabelClick(item.value)"
                />

                <Button
                    v-if="!disabled"

                    variant="outline"
                    size="small"
                    class="rounded-l-none! border-l-0"
                    :hover-effect="false"
                    left-icon="fa-xmark"
                    :aria-label="`Remover ${item.label}`"

                    @click.stop="onSeparatedRemoveClick(item.value)"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import FloatingPanel from "./internal/FloatingPanel.vue";
import OptionsList, {
    type OptionItem,
    type SearchConfig,
    type SearchExternalPayload
} from "./internal/OptionsList.vue";
import Button from "./Button.vue";
import Input from "./Input.vue";
import tooltip from "@shared/frontend/tooltip";

type SelectMultipleConfig = {
    min?: number;
    max?: number;
    allSelected?: boolean;
};

export default defineComponent({
    name: "Select",

    components: {
        FloatingPanel,
        OptionsList,
        Button,
        Input
    },

    directives: {
        tooltip
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

        placeholder: {
            type: String,
            required: false
        },

        inHelperText: {
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

        /**
         * When true (default), multi-select shows selected labels on the trigger,
         * truncated with an ellipsis if they overflow the button.
         * When false, the trigger keeps the header/placeholder.
         */
        showSelectedLabels: {
            type: Boolean,
            default: true
        },

        /**
         * Multi-select only: render selected options as removable chips below the trigger
         * instead of listing labels on the trigger button.
         */
        separateSelected: {
            type: Boolean,
            default: false
        },

        maxHeightPx: {
            type: Number,
            default: 280
        },

        panelClass: {
            type: String,
            default: "",
            required: false
        },

        mobileModal: {
            type: Boolean,
            default: true
        },

        forceModal: {
            type: Boolean,
            default: false
        },

        /**
         * Icon class suffix for the side action (e.g. `fa-plus`). Same trigger style as the select.
         */
        actionIcon: {
            type: String,
            required: false
        },

        actionLabel: {
            type: String,
            required: false
        },

        actionSide: {
            type: String as PropType<"left" | "right">,
            default: "right"
        },

        actionTooltip: {
            type: String,
            required: false
        },

        disabled: {
            type: Boolean,
            default: false
        },

        /**
         * Replaces the trigger button with a text input. Typing searches and
         * can keep a value that is not in `options`; picking an option fills the input.
         */
        combobox: {
            type: Boolean,
            default: false
        },

        /**
         * Combobox: picking a panel option locks the input (like a normal select)
         * until the user clears with the X control. Free typing only when unlocked.
         */
        comboboxOption: {
            type: Boolean,
            default: false
        },

        /**
         * Visual variant of the combobox trigger input. Mirrors `Input.variant`,
         * so a combobox can sit inside denser layouts such as table cells.
         */
        variant: {
            type: String as PropType<"secondary" | "transparent" | "display">,
            default: "secondary"
        },

        /**
         * Free-text value of the combobox input (`v-model:query`).
         */
        query: {
            type: String,
            default: ""
        },

        error: {
            type: String,
            required: false
        }
    },

    emits: [
        "update:modelValue",
        "update:value",
        "update:query",
        "click:action",
        "click:selected",
        "remove:selected",
        "search:external"
    ],

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
            searchQuery: "",
            comboboxQuery: this.query ?? "",
            comboboxSearchTimer: null as number | null,
            triggerEl: null as HTMLElement | null,
            internalOpen: false
        };
    },

    computed: {
        isPanelOpen(): boolean {
            return this.internalOpen;
        },

        isSelectMultiple(): boolean {
            return this.selectMultiple != null;
        },

        isCombobox(): boolean {
            return this.combobox && !this.isSelectMultiple;
        },

        listSearch(): SearchConfig | undefined {
            if (this.isCombobox) {
                return undefined;
            }

            return this.search;
        },

        showLabelsOnTrigger(): boolean {
            if (this.separateSelected && this.isSelectMultiple) {
                return false;
            }

            return this.showSelectedLabels;
        },

        showSeparatedSelected(): boolean {
            return (
                this.separateSelected &&
                this.isSelectMultiple &&
                this.separatedSelectedItems.length > 0
            );
        },

        separatedSelectedItems(): Array<{ label: string; value: string }> {
            if (!this.isSelectMultiple) {
                return [];
            }

            const items: Array<{ label: string; value: string }> = [];

            for (const value of this.selectedValues) {
                items.push({
                    value,
                    label: this.optionLabelForValue(value) || value
                });
            }

            return items;
        },

        panelOptions(): OptionItem[] {
            let options = this.options ?? [];

            if (this.separateSelected && this.isSelectMultiple) {
                options = this.optionsExcludingSelected(options);
            }

            if (this.isCombobox && this.search && !this.search.external) {
                const query = this.comboboxQuery.trim().toLowerCase();

                if (query) {
                    options = options.filter((item) => {
                        return Boolean(item.label && item.label.toLowerCase().includes(query));
                    });
                }
            }

            return options;
        },

        panelShowCheckmark(): boolean {
            return !(this.separateSelected && this.isSelectMultiple);
        },

        /**
         * Text shown on the trigger button.
         */
        selectTriggerLabel(): string {
            if (this.isSelectMultiple) {
                if (this.showLabelsOnTrigger && this.selectedLabels.length > 0) {
                    return this.selectedLabels.join(", ");
                }

                return this.placeholder || this.header || "Selecione...";
            }

            return this.selectedValueLabel || this.placeholder || this.header || "Selecione...";
        },

        selectTriggerMuted(): boolean {
            if (this.isSelectMultiple) {
                return !(this.showLabelsOnTrigger && this.selectedLabels.length > 0);
            }

            return !this.selectedValueLabel && !this.header && !this.placeholder;
        },

        selectedLabels(): string[] {
            if (!this.isSelectMultiple || this.selectedValues.length === 0) {
                return [];
            }

            return this.labelsForValues(this.options ?? [], this.selectedValues);
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
        },

        selectedValueIndicator(): { color?: string; size?: string; backgroundColor?: string } | undefined {
            if (!this.options) {
                return undefined;
            }

            if (this.isSelectMultiple) {
                const [firstValue] = this.selectedValues;

                if (!firstValue) {
                    return undefined;
                }

                for (const option of this.options) {
                    if (option.value === firstValue) {
                        return option.indicator;
                    }

                    if (option.options && option.options.length > 0) {
                        const nested = this.findIndicatorForValue(option.options, firstValue);

                        if (nested) {
                            return nested;
                        }
                    }
                }

                return undefined;
            }

            for (const option of this.options) {
                if (this.value === option.value) {
                    return option.indicator;
                }

                if (option.options && option.options.length > 0) {
                    const nested = this.findIndicatorForValue(option.options, String(this.value));

                    if (nested) {
                        return nested;
                    }
                }
            }

            return undefined;
        },

        selectTriggerIndicator(): { color?: string; size?: string; backgroundColor?: string } | undefined {
            if (this.isSelectMultiple) {
                return this.selectedValueIndicator;
            }

            return this.selectedValueIndicator;
        },

        selectTriggerIndicatorStyle(): Record<string, string> {
            const size = this.selectTriggerIndicator?.size ?? "0.625rem";
            const color = this.selectTriggerIndicator?.color ?? "currentColor";
            const backgroundColor = this.selectTriggerIndicator?.backgroundColor ?? color;

            return {
                width: size,
                height: size,
                backgroundColor,
                borderColor: color
            };
        },

        hasActionButton(): boolean {
            return Boolean(this.actionIcon || this.actionLabel);
        },

        actionAriaLabel(): string {
            return this.actionLabel || this.actionTooltip || "Adicionar";
        },

        actionButtonLayoutClass(): string {
            if (this.actionLabel) {
                return "h-full";
            }

            return "aspect-square h-auto w-auto p-1.5!";
        },

        actionButtonClass(): string {
            return "box-border h-full";
        },

        mergedButtonAtributes(): Record<string, unknown> {
            const extra = (this.buttonAtributes ?? {}) as Record<string, unknown>;

            return {
                ...extra,
                disabled: this.disabled || Boolean(extra.disabled)
            };
        },

        comboboxSelectionLocked(): boolean {
            return Boolean(this.isCombobox && this.comboboxOption && this.value);
        }
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
                            newVal.length === 0 &&
                            this.useMemo &&
                            this.id &&
                            !this.multiMemoHydrationDone &&
                            this.tryHydrateMultiFromStorage()
                        ) {
                            this.multiMemoHydrationDone = true;
                            this.emitSelectionToParent();

                            return;
                        }

                        this.multiMemoHydrationDone = true;
                        this.selectedValues = newVal.map((v) => String(v));

                        return;
                    }

                    this.multiMemoHydrationDone = true;
                    this.selectedValues = [];

                    return;
                }

                if (newVal === undefined || newVal === null) {
                    return;
                }

                const nextValue = String(newVal);

                this.value = nextValue;

                if (this.isCombobox && nextValue) {
                    const label = this.optionLabelForValue(nextValue);

                    if (label) {
                        this.comboboxQuery = label;
                    }
                }
            },
            immediate: true,
            deep: true
        },

        query(next: string) {
            if (!this.isCombobox) {
                return;
            }

            this.comboboxQuery = next ?? "";
        }
    },

    mounted() {
        if (this.useMemo) {
            if (this.isSelectMultiple) {
                if (this.id && !this.multiModelValueProvided && this.selectedValues.length === 0) {
                    if (this.tryHydrateMultiFromStorage()) {
                        this.multiMemoHydrationDone = true;
                        this.emitSelectionToParent();
                    }
                }
            } else if (this.id && !this.isCombobox) {
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

        this.syncTriggerEl();
        this.$nextTick(() => {
            this.applyInitialAllSelected();
        });
    },

    updated() {
        this.syncTriggerEl();
    },

    beforeUnmount() {
        this.clearComboboxSearchTimer();
    },

    methods: {
        labelsForValues(options: OptionItem[], values: string[]): string[] {
            const labels: string[] = [];

            for (const option of options) {
                if (option.value && values.includes(String(option.value)) && option.label) {
                    labels.push(option.label);
                }

                if (option.options && option.options.length > 0) {
                    labels.push(...this.labelsForValues(option.options, values));
                }
            }

            return labels;
        },

        optionsExcludingSelected(options: OptionItem[]): OptionItem[] {
            const filtered: OptionItem[] = [];

            for (const option of options) {
                if (option.separator) {
                    filtered.push(option);
                    continue;
                }

                if (option.options && option.options.length > 0) {
                    const children = this.optionsExcludingSelected(option.options);

                    if (children.length === 0) {
                        continue;
                    }

                    filtered.push({
                        ...option,
                        options: children
                    });
                    continue;
                }

                if (option.value != null && this.selectedValues.includes(String(option.value))) {
                    continue;
                }

                filtered.push(option);
            }

            return filtered;
        },

        optionLabelForValue(value: string, options?: OptionItem[]): string | undefined {
            const list = options ?? this.options ?? [];

            for (const option of list) {
                if (option.value != null && String(option.value) === value) {
                    return option.label;
                }

                if (option.options && option.options.length > 0) {
                    const nested = this.optionLabelForValue(value, option.options);

                    if (nested) {
                        return nested;
                    }
                }
            }

            return undefined;
        },

        findIndicatorForValue(options: OptionItem[], value: string): { color?: string; size?: string; backgroundColor?: string } | undefined {
            for (const option of options) {
                if (option.value != null && String(option.value) === value) {
                    return option.indicator;
                }

                if (option.options && option.options.length > 0) {
                    const nested = this.findIndicatorForValue(option.options, value);

                    if (nested) {
                        return nested;
                    }
                }
            }

            return undefined;
        },

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

                this.selectedValues = parsed.map((v) => String(v));
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
                .filter((o) => !o.separator && o.value !== undefined && o.value !== "")
                .map((o) => String(o.value));

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

            if (this.isCombobox) {
                const label = this.optionLabelForValue(val) || val;

                this.value = val;
                this.comboboxQuery = label;
                this.clearComboboxSearchTimer();
                this.$emit("update:query", label);
                this.$emit("update:value", val);
                this.$emit("update:modelValue", val);
                this.close();

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

        onPanelOpenUpdate(next: boolean) {
            this.internalOpen = next;
        },

        syncTriggerEl() {
            const el = this.$refs.anchorRef as HTMLElement | undefined;

            if (el !== this.triggerEl) {
                this.triggerEl = el ?? null;
            }
        },

        onTriggerActivate(event: KeyboardEvent) {
            if (this.isPanelOpen) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            this.open();
        },

        toggleOpenClose() {
            const panel = this.$refs.panelRef as InstanceType<typeof FloatingPanel> | undefined;
            panel?.toggleOpenClose();
        },

        open() {
            const panel = this.$refs.panelRef as InstanceType<typeof FloatingPanel> | undefined;
            panel?.openPanel();
        },

        close() {
            const panel = this.$refs.panelRef as InstanceType<typeof FloatingPanel> | undefined;
            panel?.close();
        },

        onActionClick(event: MouseEvent) {
            this.close();
            this.$emit("click:action", event);
        },

        onSearchExternal(payload: SearchExternalPayload) {
            this.$emit("search:external", payload);
        },

        clearComboboxSearchTimer() {
            if (this.comboboxSearchTimer == null) {
                return;
            }

            window.clearTimeout(this.comboboxSearchTimer);
            this.comboboxSearchTimer = null;
        },

        onComboboxFocus() {
            this.openComboboxPanel();
        },

        onComboboxClick() {
            this.openComboboxPanel();
        },

        openComboboxPanel() {
            if (this.comboboxSelectionLocked) {
                return;
            }

            this.open();
            this.emitComboboxExternalSearch(this.comboboxQuery.trim(), true);
        },

        emitComboboxExternalSearch(value: string, immediate = false) {
            if (!this.search?.external) {
                return;
            }

            const payload = {
                field: this.search?.field ?? "",
                value
            };

            if (immediate) {
                this.clearComboboxSearchTimer();
                this.$emit("search:external", payload);

                return;
            }

            this.clearComboboxSearchTimer();
            this.comboboxSearchTimer = window.setTimeout(() => {
                this.comboboxSearchTimer = null;
                this.$emit("search:external", payload);
            }, 300);
        },

        clearComboboxSelection() {
            this.value = "";
            this.comboboxQuery = "";
            this.clearComboboxSearchTimer();
            this.$emit("update:query", "");
            this.$emit("update:value", "");
            this.$emit("update:modelValue", "");
            this.close();
        },

        onComboboxInput(value: unknown) {
            if (this.comboboxSelectionLocked) {
                return;
            }

            const text = String(value ?? "");

            this.comboboxQuery = text;
            this.$emit("update:query", text);

            if (this.value) {
                this.value = "";
                this.$emit("update:value", "");
                this.$emit("update:modelValue", "");
            }

            const trimmed = text.trim();

            if (trimmed) {
                this.open();
            } else {
                this.close();
            }

            this.emitComboboxExternalSearch(trimmed);
        },

        onSeparatedLabelClick(value: string) {
            this.$emit("click:selected", value);
        },

        onSeparatedRemoveClick(value: string) {
            if (this.disabled) {
                return;
            }

            const wasSelected = this.selectedValues.includes(value);

            this.selectOption(value);

            if (wasSelected && !this.selectedValues.includes(value)) {
                this.$emit("remove:selected", value);
            }
        }
    }
});
</script>
