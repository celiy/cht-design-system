<template>
    <div
        class="flex min-h-0 w-full min-w-0 flex-col overflow-hidden"
        :style="optionsScrollStyle"
    >
        <div
            v-if="drillPath.length > 0"

            class="flex shrink-0 items-center gap-1 border-b px-2 py-1.5 text-sm"
        >
            <button
                type="button"
                class="flex shrink-0 cursor-pointer items-center rounded p-1.5 hover:bg-accent"
                aria-label="Voltar"

                @click="drillBack"
            >
                <i class="fa-solid fa-chevron-left text-xs" />
            </button>

            <nav
                class="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap"
                aria-label="Camadas do menu"
            >
                <template
                    v-for="(crumb, crumbIndex) of drillCrumbs"
                    :key="`crumb-${crumbIndex}`"
                >
                    <i
                        v-if="crumbIndex > 0"

                        class="fa-solid fa-chevron-right shrink-0 text-[0.6rem] text-muted-foreground"
                    />

                    <span
                        v-if="crumbIndex === drillCrumbs.length - 1"

                        class="truncate font-semibold"
                    >
                        {{ crumb }}
                    </span>

                    <button
                        v-else

                        type="button"
                        class="shrink-0 cursor-pointer rounded px-1 py-0.5 text-muted-foreground hover:bg-accent"

                        @click="drillTo(crumbIndex)"
                    >
                        {{ crumb }}
                    </button>
                </template>
            </nav>
        </div>

        <div
            v-if="search && drillPath.length === 0"

            class="shrink-0"
        >
            <div class="flex items-center px-4">
                <span
                    class="text-sm text-muted-foreground!"
                    :class="externalSearchLoading ? 'fa-solid fa-spinner fa-spin' : 'fa fa-search'"
                />

                <Input
                    :id="searchInputId"
                    v-model="localSearchQuery"
                    class="my-1"
                    type="text"
                    variant="transparent"
                    placeholder="Pesquisar..."
                    no-shadow

                    @update:model-value="onSearchQueryUpdate"
                />
            </div>

            <Marker separator />
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
                        :indicator="item.indicator"
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
                        :option-helper-text="item.optionHelperText"

                        @click="onItemClick(item)"
                    />
                </div>
            </template>

            <div
                v-else

                class="flex flex-col items-center justify-center px-3 py-2 text-center text-sm text-muted-foreground!"
            >
                <small-muted>Nenhum resultado encontrado.</small-muted>

                <div
                    v-if="$slots.insideEmptyPanel"

                    class="contents"
                >
                    <slot name="insideEmptyPanel" />
                </div>
            </div>
        </div>

        <div
            v-if="$slots.panelFooter && visibleOptions.length > 0"

            class="shrink-0 border-t px-3 py-2"
        >
            <slot name="panelFooter" />
        </div>

        <Teleport to="body">
            <div
                v-if="nestedItem"
                ref="nestedPanelRef"

                class="popover-background absolute z-[1200] flex max-h-[280px] min-w-[11rem] flex-col overflow-y-auto overscroll-contain rounded border shadow-md"
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
import { defineComponent, unref, type PropType } from "vue";
import Input from "../Input.vue";
import Marker from "../Marker.vue";
import Option from "../Option.vue";
import tooltip from "@shared/frontend/tooltip";

export type OptionIndicator = {
    color?: string;
    size?: string;
    backgroundColor?: string;
};

export type OptionItem = {
    separator?: boolean;
    icon?: string;
    label?: string;
    value?: string;
    selected?: boolean;
    tooltip?: string;
    tooltipPlacement?: "top" | "bottom" | "left" | "right" | "center";
    variant?: "destructive";
    disabled?: boolean;
    indicator?: OptionIndicator;
    /**
     * Nested options opened in a side panel on hover and/or click.
     */
    options?: OptionItem[];
    /**
     * When `"click"`, the nested panel opens only on click (not on hover).
     * Omit or use `"hover"` for hover and click.
     */
    openOn?: "hover" | "click";
    optionHelperText?: string;
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

const SEARCH_EXTERNAL_DEBOUNCE_MS = 100;

type IsOptionSelected = (
    value: string | undefined,
    item?: OptionItem,
    parent?: OptionItem
) => boolean;

export default defineComponent({
    name: "OptionsList",

    components: {
        Input,
        Marker,
        Option
    },

    directives: {
        tooltip
    },

    inject: {
        chtModalIsOpen: {
            from: "chtModalIsOpen",
            default: null
        }
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
        },

        /**
         * Caps the option list so the panel scrolls instead of growing past the
         * floating shell. Omit for nested lists that inherit a parent max-height.
         */
        maxHeightPx: {
            type: Number,
            required: false
        },

        /**
         * When true, the search is loading
         */
        externalSearchLoading: {
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
            drillPath: [] as OptionItem[],
            nestedPanelStyle: {} as Record<string, string>,
            nestedCloseTimer: null as number | null,
            searchExternalTimer: null as number | null,
            searchInputId: `options-list-search-${Math.random().toString(36).slice(2, 10)}`
        };
    },

    computed: {
        /**
         * Gets the options scroll style
         * @returns {Record<string, string> | undefined} The options scroll style
         */
        optionsScrollStyle(): Record<string, string> | undefined {
            if (this.maxHeightPx == null) {
                return undefined;
            }

            return { maxHeight: `${this.maxHeightPx}px` };
        },

        /**
         * On mobile, submenus replace the list one layer at a time instead of opening a side panel
         * @returns {boolean} True if submenus drill down
         */
        isDrillDown(): boolean {
            return Boolean(this.$project?.device?.isMobile);
        },

        /**
         * Labels of the layers, root first, for the drill-down header
         * @returns {string[]} The crumbs
         */
        drillCrumbs(): string[] {
            return ["Início", ...this.drillPath.map((item) => item.label ?? "")];
        },

        /**
         * Gets the visible options
         * @returns {OptionItem[]} The visible options
         */
        visibleOptions(): OptionItem[] {
            const drilled = this.drillPath[this.drillPath.length - 1];
            const source = drilled?.options ?? this.options ?? [];

            if (drilled || !this.search || this.search.external) {
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
        /**
         * Handles the search query update
         * @param {string} next The next
         * @returns {void}
         */
        searchQuery(next: string) {
            if (next !== this.localSearchQuery) {
                this.localSearchQuery = next;
            }
        },

        /**
         * Handles the visible options update
         * @returns {void}
         */
        visibleOptions() {
            this.resetHighlight();
        },

        chtModalIsOpen(open: unknown) {
            if (!unref(open)) {
                return;
            }

            this.$nextTick(() => this.focusSearchInput());
        }
    },

    /**
     * Mounts the component
     * @returns {void}
     */
    mounted() {
        this.resetHighlight();
        this.$nextTick(() => this.focusSearchInput());
        document.addEventListener("keydown", this.onKeydown);
        window.addEventListener("scroll", this.onViewportChange, true);
        window.addEventListener("resize", this.onViewportChange);
    },

    /**
     * Unmounts the component
     * @returns {void}
     */
    beforeUnmount() {
        document.removeEventListener("keydown", this.onKeydown);
        window.removeEventListener("scroll", this.onViewportChange, true);
        window.removeEventListener("resize", this.onViewportChange);
        this.clearNestedCloseTimer();
        this.clearSearchExternalTimer();
    },

    methods: {
        /**
         * Checks if the item has children
         * @param {OptionItem} item The item
         * @returns {boolean} True if the item has children
         */
        hasChildren(item: OptionItem): boolean {
            return Array.isArray(item.options) && item.options.length > 0;
        },

        /**
         * Sets the option reference
         * @param {number} idx The index
         * @param {unknown} el The element
         * @returns {void}
         */
        setOptionRef(idx: number, el: unknown) {
            if (el instanceof HTMLElement) {
                this.optionRefs[idx] = el;

                return;
            }

            this.optionRefs[idx] = null;
        },

        /**
         * Handles the search query update
         * @param {string} value The value
         * @returns {void}
         */
        onSearchQueryUpdate(value: string) {
            this.localSearchQuery = value;
            this.$emit("update:searchQuery", value);
            this.scheduleExternalSearch(value);
        },

        /**
         * Schedules the external search
         * @param {string} value The value
         * @returns {void}
         */
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

        /**
         * Clears the search external timer
         * @returns {void}
         */
        clearSearchExternalTimer() {
            if (this.searchExternalTimer == null) {
                return;
            }

            window.clearTimeout(this.searchExternalTimer);
            this.searchExternalTimer = null;
        },

        /**
         * Checks if the item is selectable
         * @param {OptionItem} item The item
         * @returns {boolean} True if the item is selectable
         */
        isSelectable(item: OptionItem): boolean {
            return !item.separator && (Boolean(item.value) || this.hasChildren(item));
        },

        /**
         * Checks if the item is highlighted
         * @param {number} idx The index
         * @param {OptionItem} item The item
         * @returns {boolean} True if the item is highlighted
         */
        isItemHighlighted(idx: number, item: OptionItem): boolean {
            return this.highlightedIndex === idx && this.isSelectable(item);
        },

        /**
         * Checks if the item is selected
         * @param {OptionItem} item The item
         * @returns {boolean} True if the item is selected
         */
        isItemSelected(item: OptionItem): boolean {
            if (item.separator) {
                return false;
            }

            const parent = this.drillPath[this.drillPath.length - 1];

            return Boolean(this.isOptionSelected?.(item.value, item, parent));
        },

        /**
         * Enters a submenu (mobile drill-down)
         * @param {OptionItem} item The item with children
         * @returns {void}
         */
        drillInto(item: OptionItem) {
            this.drillPath = [...this.drillPath, item];
            this.scrollOptionsToTop();
        },

        /**
         * Goes back one layer
         * @returns {void}
         */
        drillBack() {
            this.drillPath = this.drillPath.slice(0, -1);
            this.scrollOptionsToTop();
        },

        /**
         * Jumps to a layer; index 0 is the root
         * @param {number} crumbIndex The crumb index
         * @returns {void}
         */
        drillTo(crumbIndex: number) {
            this.drillPath = this.drillPath.slice(0, crumbIndex);
            this.scrollOptionsToTop();
        },

        /**
         * Scrolls the list back to the top after a layer change
         * @returns {void}
         */
        scrollOptionsToTop() {
            this.$nextTick(() => {
                const scroller = this.$refs.optionsScrollRef as HTMLElement | undefined;

                if (scroller) {
                    scroller.scrollTop = 0;
                }
            });
        },

        /**
         * Checks if the nested item is selected
         * @param {string | undefined} value The value
         * @param {OptionItem | undefined} item The item
         * @returns {boolean} True if the nested item is selected
         */
        nestedIsOptionSelected(value: string | undefined, item?: OptionItem): boolean {
            if (!this.nestedItem) {
                return false;
            }

            return Boolean(this.isOptionSelected?.(value, item, this.nestedItem));
        },

        /**
         * Resets the highlight
         * @returns {void}
         */
        resetHighlight() {
            const idx = this.visibleOptions.findIndex((item) => this.isSelectable(item));
            this.highlightedIndex = idx;
            this.scrollHighlightedIntoView();
        },

        /**
         * Handles the item mouse enter
         * @param {number} idx The index
         * @param {OptionItem} item The item
         * @returns {void}
         */
        onItemMouseEnter(idx: number, item: OptionItem) {
            if (!this.isSelectable(item)) {
                return;
            }

            this.highlightedIndex = idx;

            if (this.isDrillDown) {
                return;
            }

            if (this.hasChildren(item) && item.openOn !== "click") {
                this.openNested(item, idx);
            }
        },

        /**
         * Handles the item mouse leave
         * @param {OptionItem} item The item
         * @returns {void}
         */
        onItemMouseLeave(item: OptionItem) {
            if (!this.hasChildren(item)) {
                return;
            }

            this.scheduleNestedClose();
        },

        /**
         * Handles the nested panel enter
         * @returns {void}
         */
        onNestedPanelEnter() {
            this.clearNestedCloseTimer();
        },

        /**
         * Handles the nested panel leave
         * @returns {void}
         */
        onNestedPanelLeave() {
            this.scheduleNestedClose();
        },

        /**
         * Opens the nested item
         * @param {OptionItem} item The item
         * @param {number | undefined} idx The index
         * @returns {void}
         */
        openNested(item: OptionItem, idx?: number) {
            this.clearNestedCloseTimer();
            this.nestedItem = item;
            this.$nextTick(() => this.updateNestedPosition(idx));
        },

        /**
         * Closes the nested item
         * @returns {void}
         */
        closeNested() {
            this.clearNestedCloseTimer();
            this.nestedItem = null;
            this.nestedPanelStyle = {};
        },

        /**
         * Schedules the nested close
         * @returns {void}
         */
        scheduleNestedClose() {
            this.clearNestedCloseTimer();
            this.nestedCloseTimer = window.setTimeout(() => {
                this.nestedCloseTimer = null;
                this.nestedItem = null;
                this.nestedPanelStyle = {};
            }, 160);
        },

        /**
         * Clears the nested close timer
         * @returns {void}
         */
        clearNestedCloseTimer() {
            if (this.nestedCloseTimer == null) {
                return;
            }

            window.clearTimeout(this.nestedCloseTimer);
            this.nestedCloseTimer = null;
        },

        /**
         * Handles the viewport change
         * @returns {void}
         */
        onViewportChange() {
            this.updateNestedPosition();
        },

        /**
         * Updates the nested position
         * @param {number | undefined} idx The index
         * @returns {void}
         */
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

        /**
         * Moves the highlight
         * @param {number} delta The delta
         * @returns {void}
         */
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

        /**
         * Scrolls the highlighted into view
         * @returns {void}
         */
        scrollHighlightedIntoView() {
            this.$nextTick(() => {
                const el = this.optionRefs[this.highlightedIndex];

                el?.scrollIntoView({ block: "nearest" });
            });
        },

        /**
         * Focuses the search input
         * @returns {void}
         */
        focusSearchInput() {
            if (!this.search || !this.isKeyListenerActive()) {
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
            /**
             * Gets the root element
             * @returns {Element | undefined} The root element
             */
            const root = this.$el;

            if (!(root instanceof Element) || !root.isConnected) {
                return false;
            }

            return root.getClientRects().length > 0;
        },

        /**
         * Consumes the key
         * @param {KeyboardEvent} event The event
         * @returns {void}
         */
        consumeKey(event: KeyboardEvent) {
            event.preventDefault();
            event.stopImmediatePropagation();
        },

        /**
         * Handles the keydown
         * @param {KeyboardEvent} event The event
         * @returns {void}
         */
        onKeydown(event: KeyboardEvent) {
            if (event.defaultPrevented || !this.isKeyListenerActive()) {
                return;
            }

            if (this.drillPath.length > 0 && event.key === "Escape") {
                this.consumeKey(event);
                this.drillBack();

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

                    if (this.isDrillDown) {
                        this.drillInto(item);
                    } else {
                        this.openNested(item, this.highlightedIndex);
                    }
                }

                return;
            }

            if (event.key !== "Enter" || event.repeat) {
                return;
            }

            this.consumeKey(event);

            let item = this.visibleOptions[this.highlightedIndex];

            if (!item || !this.isSelectable(item)) {
                const fallbackIndex = this.visibleOptions.findIndex((option) =>
                    this.isSelectable(option)
                );
                item = fallbackIndex >= 0 ? this.visibleOptions[fallbackIndex] : undefined;
            }

            if (!item || !this.isSelectable(item)) {
                return;
            }

            this.onItemClick(item);

            if (item.separator || item.disabled || this.hasChildren(item) || !item.value) {
                return;
            }
        },

        /**
         * Handles the item click
         * @param {OptionItem} item The item
         * @returns {void}
         */
        onItemClick(item: OptionItem) {
            if (item.separator || item.disabled) {
                return;
            }

            if (this.hasChildren(item) && this.isDrillDown) {
                this.drillInto(item);

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

            this.$emit("select", item.value, item, this.drillPath[this.drillPath.length - 1]);
            this.localSearchQuery = "";
            this.$emit("update:searchQuery", "");
            this.scheduleExternalSearch("");
        },

        /**
         * Handles the nested select
         * @param {string} value The value
         * @param {OptionItem} item The item
         * @param {OptionItem | undefined} parent The parent
         * @returns {void}
         */
        onNestedSelect(value: string, item: OptionItem, parent?: OptionItem) {
            this.$emit("select", value, item, parent ?? this.nestedItem ?? undefined);
        },

        /**
         * Gets the option tooltip
         * @param {OptionItem} item The item
         * @returns {{ content: string; placement: "top" | "bottom" | "left" | "right" | "center" } | undefined} The option tooltip
         */
        optionTooltip(
            item: OptionItem
        ):
            | { content: string; placement: "top" | "bottom" | "left" | "right" | "center" }
            | undefined {
            if (!item.tooltip) {
                return undefined;
            }

            return {
                content: item.tooltip,
                placement: item.tooltipPlacement ?? "right"
            };
        }
    }
});
</script>
