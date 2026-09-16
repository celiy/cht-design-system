<template>
    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <div
            v-if="search"

            class="shrink-0"
        >
            <div class="flex items-center px-4">
                <span class="fa fa-search text-sm text-muted-foreground!" />

                <Input
                    id="options-list-search"
                    v-model="localSearchQuery"
                    class="my-1"
                    type="text"
                    variant="transparent"
                    placeholder="Pesquisar..."
                    no-shadow

                    @update:model-value="onSearchQueryUpdate"
                />
            </div>

            <div class="separator" />
        </div>

        <div
            ref="optionsScrollRef"

            class="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
            <template v-if="visibleOptions.length > 0">
                <div
                    v-for="(item, idx) of visibleOptions"
                    :key="item.value ?? item.label ?? String(idx)"
                    :ref="(el) => setOptionRef(idx, el)"

                    @mouseenter="onItemMouseEnter(idx, item)"
                    @mouseleave="onItemMouseLeave(item)"
                >
                    <Option
                        v-tooltip="optionTooltip(item)"
                        :label="item.label"
                        :icon="item.icon"
                        :separator="item.separator"
                        :value="item.value"
                        :variant="item.variant"
                        :show-checkmark="showCheckmark"
                        :selected="isItemSelected(item)"
                        :highlighted="isItemHighlighted(idx, item)"
                        :first="idx === 0"
                        :last="idx === visibleOptions.length - 1"
                        :disabled="item.disabled"
                        :has-children="hasChildren(item)"

                        @click="onItemClick(item)"
                    />
                </div>
            </template>

            <div
                v-else

                class="px-3 py-2 text-center text-sm text-muted-foreground!"
            >
                <small class="text-muted-foreground!">Nenhum resultado encontrado.</small>
            </div>
        </div>

        <Teleport to="body">
            <div
                v-if="nestedItem"
                ref="nestedPanelRef"

                class="absolute z-[1200] flex max-h-[280px] min-w-[11rem] flex-col overflow-hidden rounded border border-border bg-popover shadow-md"
                :style="nestedPanelStyle"
                data-cht-floating-panel

                @mouseenter="onNestedPanelEnter"
                @mouseleave="onNestedPanelLeave"
            >
                <OptionsList
                    :options="nestedItem.options"
                    :show-checkmark="showCheckmark"
                    :is-option-selected="nestedIsOptionSelected"

                    @select="onNestedSelect"
                />
            </div>
        </Teleport>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Input from "../Input.vue";
import Option from "../Option.vue";
import tooltip from "@shared/frontend/tooltip";

export type OptionItem = {
    separator?: boolean;
    icon?: string;
    label?: string;
    value?: string;
    selected?: boolean;
    tooltip?: string;
    variant?: "destructive";
    disabled?: boolean;
    /**
     * Nested options opened in a side panel on hover and/or click.
     */
    options?: OptionItem[];
    /**
     * How the nested panel opens. Default opens on hover and click.
     */
    openOn?: "hover" | "click";
};

export type SearchConfig = {
    external: boolean;
    /**
     * Backend field used when `external` is true.
     * Included in the `search:external` payload.
     */
    field?: string;
    route?: string;
};

export type SearchExternalPayload = {
    field: string;
    value: string;
};

const SEARCH_EXTERNAL_DEBOUNCE_MS = 300;

type IsOptionSelected = (
    value: string | undefined,
    item?: OptionItem,
    parent?: OptionItem
) => boolean;

export default defineComponent({
    name: "OptionsList",

    components: {
        Input,
        Option
    },

    directives: {
        tooltip
    },

    props: {
        /**
         * List of options to render. Items with `separator: true` render a divider.
         * Items with `options` open a nested panel on the side.
         */
        options: {
            type: Array as PropType<OptionItem[]>,
            required: false,
            default: () => []
        },

        /**
         * Enables the search input above the list.
         */
        search: {
            type: Object as PropType<SearchConfig>,
            required: false
        },

        /**
         * Current search query, propagated back via `update:searchQuery`.
         */
        searchQuery: {
            type: String,
            default: ""
        },

        /**
         * Function that reports whether an option's value is currently selected.
         */
        isOptionSelected: {
            type: Function as PropType<IsOptionSelected>,
            required: false
        },

        /**
         * When true, renders a checkmark column used by single/multi selects.
         */
        showCheckmark: {
            type: Boolean,
            default: false
        }
    },

    emits: ["select", "update:searchQuery", "search:external"],

    data() {
        return {
            localSearchQuery: this.searchQuery,
            highlightedIndex: -1,
            optionRefs: [] as (HTMLElement | null)[],
            nestedItem: null as OptionItem | null,
            nestedPanelStyle: {} as Record<string, string>,
            nestedCloseTimer: null as number | null,
            searchExternalTimer: null as number | null
        };
    },

    computed: {
        visibleOptions(): OptionItem[] {
            const source = this.options ?? [];

            if (!this.search || this.search.external) {
                return [...source];
            }

            const query = this.localSearchQuery?.trim().toLowerCase();

            if (!query) {
                return [...source];
            }

            const byLabel = source.filter(
                (item) => !item.separator && item.label && item.label.toLowerCase().includes(query)
            );

            if (byLabel.length > 0) {
                return byLabel;
            }

            return source.filter(
                (item) => !item.separator && item.value && item.value.toLowerCase().includes(query)
            );
        }
    },

    watch: {
        searchQuery(next: string) {
            if (next !== this.localSearchQuery) {
                this.localSearchQuery = next;
            }
        },

        visibleOptions() {
            this.resetHighlight();
        }
    },

    mounted() {
        this.resetHighlight();
        this.$nextTick(() => this.focusSearchInput());
        document.addEventListener("keydown", this.onKeydown);
        window.addEventListener("scroll", this.onViewportChange, true);
        window.addEventListener("resize", this.onViewportChange);
    },

    beforeUnmount() {
        document.removeEventListener("keydown", this.onKeydown);
        window.removeEventListener("scroll", this.onViewportChange, true);
        window.removeEventListener("resize", this.onViewportChange);
        this.clearNestedCloseTimer();
        this.clearSearchExternalTimer();
    },

    methods: {
        hasChildren(item: OptionItem): boolean {
            return Array.isArray(item.options) && item.options.length > 0;
        },

        setOptionRef(idx: number, el: unknown) {
            if (el instanceof HTMLElement) {
                this.optionRefs[idx] = el;

                return;
            }

            this.optionRefs[idx] = null;
        },

        onSearchQueryUpdate(value: string) {
            this.localSearchQuery = value;
            this.$emit("update:searchQuery", value);
            this.scheduleExternalSearch(value);
        },

        scheduleExternalSearch(value: string) {
            if (!this.search?.external) {
                return;
            }

            this.clearSearchExternalTimer();
            this.searchExternalTimer = window.setTimeout(() => {
                this.searchExternalTimer = null;
                this.$emit("search:external", {
                    field: this.search?.field ?? "",
                    value: value.trim()
                });
            }, SEARCH_EXTERNAL_DEBOUNCE_MS);
        },

        clearSearchExternalTimer() {
            if (this.searchExternalTimer == null) {
                return;
            }

            window.clearTimeout(this.searchExternalTimer);
            this.searchExternalTimer = null;
        },

        isSelectable(item: OptionItem): boolean {
            return !item.separator && (Boolean(item.value) || this.hasChildren(item));
        },

        isItemHighlighted(idx: number, item: OptionItem): boolean {
            return this.highlightedIndex === idx && this.isSelectable(item);
        },

        isItemSelected(item: OptionItem): boolean {
            return Boolean(this.isOptionSelected?.(item.value, item));
        },

        nestedIsOptionSelected(value: string | undefined, item?: OptionItem): boolean {
            if (!this.nestedItem) {
                return false;
            }

            return Boolean(this.isOptionSelected?.(value, item, this.nestedItem));
        },

        resetHighlight() {
            const idx = this.visibleOptions.findIndex((item) => this.isSelectable(item));
            this.highlightedIndex = idx;
            this.scrollHighlightedIntoView();
        },

        onItemMouseEnter(idx: number, item: OptionItem) {
            if (!this.isSelectable(item)) {
                return;
            }

            this.highlightedIndex = idx;

            if (this.hasChildren(item) && item.openOn !== "click") {
                this.openNested(item, idx);
            }
        },

        onItemMouseLeave(item: OptionItem) {
            if (!this.hasChildren(item)) {
                return;
            }

            this.scheduleNestedClose();
        },

        onNestedPanelEnter() {
            this.clearNestedCloseTimer();
        },

        onNestedPanelLeave() {
            this.scheduleNestedClose();
        },

        openNested(item: OptionItem, idx?: number) {
            this.clearNestedCloseTimer();
            this.nestedItem = item;
            this.$nextTick(() => this.updateNestedPosition(idx));
        },

        closeNested() {
            this.clearNestedCloseTimer();
            this.nestedItem = null;
            this.nestedPanelStyle = {};
        },

        scheduleNestedClose() {
            this.clearNestedCloseTimer();
            this.nestedCloseTimer = window.setTimeout(() => {
                this.nestedCloseTimer = null;
                this.nestedItem = null;
                this.nestedPanelStyle = {};
            }, 160);
        },

        clearNestedCloseTimer() {
            if (this.nestedCloseTimer == null) {
                return;
            }

            window.clearTimeout(this.nestedCloseTimer);
            this.nestedCloseTimer = null;
        },

        onViewportChange() {
            this.updateNestedPosition();
        },

        updateNestedPosition(idx?: number) {
            if (!this.nestedItem) {
                return;
            }

            const optionIndex =
                typeof idx === "number"
                    ? idx
                    : this.visibleOptions.findIndex(
                          (option) => option.value === this.nestedItem?.value
                      );
            const anchor = optionIndex >= 0 ? this.optionRefs[optionIndex] : undefined;

            if (!anchor) {
                return;
            }

            const rect = anchor.getBoundingClientRect();
            const panelWidth = 176;
            const gap = 4;
            const spaceRight = window.innerWidth - rect.right;
            const openLeft = spaceRight < panelWidth + gap;

            this.nestedPanelStyle = {
                position: "fixed",
                top: `${Math.max(8, rect.top)}px`,
                left: openLeft
                    ? `${Math.max(8, rect.left - panelWidth - gap)}px`
                    : `${rect.right - 4}px`,
                minWidth: `${panelWidth}px`
            };
        },

        moveHighlight(delta: number) {
            const selectable = this.visibleOptions
                .map((item, index) => ({ item, index }))
                .filter(({ item }) => this.isSelectable(item));

            if (selectable.length === 0) {
                this.highlightedIndex = -1;

                return;
            }

            let position = selectable.findIndex((entry) => entry.index === this.highlightedIndex);

            if (position < 0) {
                position = delta > 0 ? -1 : 0;
            }

            const next = selectable[(position + delta + selectable.length) % selectable.length];

            if (!next) {
                return;
            }

            this.highlightedIndex = next.index;
            this.scrollHighlightedIntoView();
        },

        scrollHighlightedIntoView() {
            this.$nextTick(() => {
                const el = this.optionRefs[this.highlightedIndex];

                el?.scrollIntoView({ block: "nearest" });
            });
        },

        focusSearchInput() {
            if (!this.search) {
                return;
            }

            const root = this.$el as HTMLElement | undefined;
            const input = root?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
                "input, textarea"
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

        /**
         * Hidden lists (closed modal `v-show`, leftover Teleport) must not
         * steal Enter/arrows from other selects or from form submit.
         */
        isKeyListenerActive(): boolean {
            const root = this.$el;

            if (!(root instanceof Element) || !root.isConnected) {
                return false;
            }

            return root.getClientRects().length > 0;
        },

        consumeKey(event: KeyboardEvent) {
            event.preventDefault();
            event.stopImmediatePropagation();
        },

        onKeydown(event: KeyboardEvent) {
            if (event.defaultPrevented || !this.isKeyListenerActive()) {
                return;
            }

            if (this.nestedItem) {
                if (event.key === "Escape") {
                    this.consumeKey(event);
                    this.closeNested();
                }

                return;
            }

            if (event.key === "ArrowDown") {
                this.consumeKey(event);
                this.moveHighlight(1);

                return;
            }

            if (event.key === "ArrowUp") {
                this.consumeKey(event);
                this.moveHighlight(-1);

                return;
            }

            if (event.key === "ArrowRight") {
                const item = this.visibleOptions[this.highlightedIndex];

                if (item && this.hasChildren(item)) {
                    this.consumeKey(event);
                    this.openNested(item, this.highlightedIndex);
                }

                return;
            }

            if (event.key !== "Enter" || event.repeat) {
                return;
            }

            this.consumeKey(event);

            const item = this.visibleOptions[this.highlightedIndex];

            if (!item || !this.isSelectable(item)) {
                return;
            }

            this.onItemClick(item);
        },

        onItemClick(item: OptionItem) {
            if (item.separator || item.disabled) {
                return;
            }

            if (this.hasChildren(item)) {
                if (this.nestedItem === item) {
                    this.closeNested();

                    return;
                }

                const idx = this.visibleOptions.indexOf(item);
                this.openNested(item, idx >= 0 ? idx : undefined);

                return;
            }

            if (!item.value) {
                return;
            }

            this.$emit("select", item.value, item);
        },

        onNestedSelect(value: string, item: OptionItem, parent?: OptionItem) {
            this.$emit("select", value, item, parent ?? this.nestedItem ?? undefined);
        },

        optionTooltip(item: OptionItem) {
            if (!item.tooltip) {
                return "";
            }

            return {
                content: item.tooltip,
                placement: "right" as const
            };
        }
    }
});
</script>
