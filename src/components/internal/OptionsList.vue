<template>
    <div>
        <!-- Search input -->
        <div
            v-if="search"
            class="flex items-center px-4"
        >
            <span class="fa fa-search text-muted-foreground! text-sm" />

            <Input
                v-model="localSearchQuery"

                class="my-1"
                type="text"
                variant="transparent"
                placeholder="Pesquisar..."

                @update:modelValue="onSearchQueryUpdate"
            />
        </div>

        <div
            v-if="search"
            class="separator"
        />

        <!-- Options list -->
        <div
            v-if="visibleOptions.length > 0"
            v-for="(item, idx) of visibleOptions"
            :key="item.value ?? item.label"
            v-tooltip="optionTooltip(item)"

            class="block select-none rounded-lg bg-popover text-sm"
            :class="{
                'text-destructive!': isDestructive(item),
                'text-popover-foreground': !isDestructive(item),
                'brightness-125': showCheckmark && isOptionSelected?.(item.value),
                'brightness-150': isItemHighlighted(idx, item),
                'hover:brightness-150 cursor-pointer px-2.5 py-1.5 mx-1': !item.separator && item.value,
                'p-1 px-2.5 m-1 text-muted-foreground! text-sm font-semibold': item.label && !item.value && !item.separator,
                'mt-1': idx === 0,
                'mb-1': idx === visibleOptions.length - 1
            }"
            :data-option-highlighted="isItemHighlighted(idx, item) ? 'true' : undefined"

            @click="onItemClick(item)"
            @mouseenter="onItemMouseEnter(idx, item)"
        >
            <div class="flex items-center justify-between gap-4">
                <div class="w-full">
                    <!-- Icon -->
                    <i
                        v-if="item.icon"
                        :class="[`fa-solid ${item.icon} mr-2 text-sm`]"
                    />

                    <!-- Separator -->
                    <div
                        v-if="item.separator"
                        class="separator my-1"
                    />

                    <!-- Label -->
                    <span class="text-sm">
                        {{ item.label }}
                    </span>
                </div>

                <!-- Checkmark -->
                <i
                    v-if="showCheckmark"

                    class="fa-solid fa-check text-xs text-muted-foreground"
                    :class="{
                        'opacity-100': isOptionSelected?.(item.value),
                        'opacity-0': !isOptionSelected?.(item.value)
                    }"
                />
            </div>
        </div>

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

    emits: ["select", "update:searchQuery"],

    components: {
        Input
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

    data() {
        return {
            localSearchQuery: this.searchQuery,
            highlightedIndex: -1
        };
    },

    mounted() {
        this.resetHighlight();
        this.$nextTick(() => this.focusSearchInput());
        document.addEventListener("keydown", this.onKeydown);
    },

    beforeUnmount() {
        document.removeEventListener("keydown", this.onKeydown);
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

    methods: {
        onSearchQueryUpdate(value: string) {
            this.localSearchQuery = value;
            this.$emit("update:searchQuery", value);
        },

        isSelectable(item: OptionItem): boolean {
            return !item.separator && Boolean(item.value);
        },

        isDestructive(item: OptionItem): boolean {
            return item.variant === "destructive" && this.isSelectable(item);
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
                const root = this.$el as HTMLElement | undefined;
                const el = root?.querySelector("[data-option-highlighted='true']");

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
    }
});
</script>
