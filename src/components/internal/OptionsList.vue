<template>
    <div>
        <!-- Search input -->
        <div
            v-if="search"
            class="flex items-center px-4"
        >
            <span class="fa fa-search text-muted-foreground! text-sm" />

            <Input
                id="options-list-search"
                v-model="localSearchQuery"

                class="my-1"
                type="text"
                variant="transparent"
                placeholder="Pesquisar..."

                @update:model-value="onSearchQueryUpdate"
            />
        </div>

        <div
            v-if="search"
            class="separator"
        />

        <!-- Options list -->
        <template v-if="visibleOptions.length > 0">
            <div
                v-for="(item, idx) of visibleOptions"
                :key="item.value ?? item.label"
                :ref="(el) => setOptionRef(idx, el)"
            >
                <Option
                    v-tooltip="optionTooltip(item)"

                    :label="item.label"
                    :icon="item.icon"
                    :separator="item.separator"
                    :value="item.value"
                    :variant="item.variant"
                    :show-checkmark="showCheckmark"
                    :selected="Boolean(isOptionSelected?.(item.value))"
                    :highlighted="isItemHighlighted(idx, item)"
                    :first="idx === 0"
                    :last="idx === visibleOptions.length - 1"

                    @click="onItemClick(item)"
                    @mouseenter="onItemMouseEnter(idx, item)"
                />
            </div>
        </template>

        <!-- No options found -->
        <div
            v-else
            class="text-muted-foreground! text-sm px-3 py-2 text-center"
        >
            <small class="text-muted-foreground!">Nenhum resultado encontrado.</small>
        </div>
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
};

export type SearchConfig = {
    external: boolean;
    route?: string;
};

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
            type: Function as PropType<(value: string | undefined) => boolean>,
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

    emits: ["select", "update:searchQuery"],

    data() {
        return {
            localSearchQuery: this.searchQuery,
            highlightedIndex: -1,
            optionRefs: [] as (HTMLElement | null)[]
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
                item =>
                    !item.separator
                    && item.label
                    && item.label.toLowerCase().includes(query)
            );

            if (byLabel.length > 0) {
                return byLabel;
            }

            return source.filter(
                item =>
                    !item.separator
                    && item.value
                    && item.value.toLowerCase().includes(query)
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
    },

    beforeUnmount() {
        document.removeEventListener("keydown", this.onKeydown);
    },

    methods: {
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
        },

        isSelectable(item: OptionItem): boolean {
            return !item.separator && Boolean(item.value);
        },

        isItemHighlighted(idx: number, item: OptionItem): boolean {
            return this.highlightedIndex === idx && this.isSelectable(item);
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
            const input = root?.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea");

            if (!input) {
                return;
            }

            input.focus({ preventScroll: true });

            if ("setSelectionRange" in input) {
                const length = input.value?.length ?? 0;
                input.setSelectionRange(length, length);
            }
        },

        onKeydown(event: KeyboardEvent) {
            if (event.key === "ArrowDown") {
                event.preventDefault();
                this.moveHighlight(1);

                return;
            }

            if (event.key === "ArrowUp") {
                event.preventDefault();
                this.moveHighlight(-1);

                return;
            }

            if (event.key !== "Enter") {
                return;
            }

            const item = this.visibleOptions[this.highlightedIndex];

            if (!item || !this.isSelectable(item)) {
                return;
            }

            event.preventDefault();
            this.onItemClick(item);
        },

        onItemClick(item: OptionItem) {
            if (item.separator || !item.value) {
                return;
            }

            this.$emit("select", item.value);
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
