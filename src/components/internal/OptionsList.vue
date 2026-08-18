<template>
    <div>
        <div
            v-if="search"
            class="flex items-center px-4"
        >
            <span class="fa fa-search text-muted-foreground" />

            <Input
                v-model="localSearchQuery"

                id="dropdown-search-input"
                class="my-1.5"
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

        <div
            v-if="visibleOptions.length > 0"
            v-for="(item, idx) of visibleOptions"
            :key="item.value ?? item.label"
            v-tooltip="optionTooltip(item)"

            class="block text-popover-foreground select-none rounded-lg bg-popover text-sm"
            :class="{
                'brightness-125': showCheckmark && isOptionSelected?.(item.value),
                'hover:brightness-150 cursor-pointer px-2 py-1.5 mx-1': !item.separator && item.value,
                'p-1 px-2 m-1 text-muted-foreground! text-sm font-semibold': item.label && !item.value && !item.separator,
                'mt-1': idx === 0,
                'mb-1': idx === visibleOptions.length - 1
            }"

            @click="onItemClick(item)"
        >
            <div class="flex items-center justify-between gap-4">
                <div class="w-full">
                    <i
                        v-if="item.icon"
                        :class="[`fa-solid ${item.icon} mr-2 text-sm`]"
                    />

                    <div
                        v-if="item.separator"
                        class="separator my-1"
                    />

                    <span class="text-sm">{{ item.label }}</span>
                </div>

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

        <div
            v-else
            class="text-muted-foreground! text-sm px-3 py-2 text-center"
        >
            <p class="text-muted-foreground!">Nenhum resultado encontrado.</p>
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
            localSearchQuery: this.searchQuery
        };
    },

    watch: {
        searchQuery(next: string) {
            if (next !== this.localSearchQuery) {
                this.localSearchQuery = next;
            }
        }
    },

    methods: {
        onSearchQueryUpdate(value: string) {
            this.localSearchQuery = value;
            this.$emit("update:searchQuery", value);
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
