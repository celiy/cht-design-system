<template>
    <div class="w-full overflow-x-auto rounded-lg border-border border p-2 h-fit shadow-md">
        <div 
            v-if="selectCols" 
            class="flex items-center w-full mb-2"
        >
            <h4 class="ml-2">{{ title }}</h4>

            <div class="w-full flex justify-end">
                <Select
                    v-if="!loading"
                    header="Colunas"
                    class="w-fit!"
                    panelClass="w-fit!"

                    id="table-select-cols"
                    useMemo

                    :options="selectTableHeaders"
                    :selectMultiple="{ min: 2, allSelected: true }"

                    @update:value="(value) => selectedHeaders = value"
                />
            </div>
        </div>

        <table class="w-full text-foreground">
            <thead class="rounded-t-lg">
                <tr class="hover:bg-accent transition-all w-full">
                    <th 
                        v-if="selectable"
                        class="font-semibold p-2 text-sm text-left w-1"
                    >
                        <Checkbox
                            :checked="isAllSelected"
                            name="selectable"
                            id="selectable"
                            :disabled="loading"

                            @click="selectAll()"
                        />
                    </th>

                    <th 
                        v-for="head in displayHeaders"
                        :key="head.label"

                        class="font-semibold p-2 text-sm"
                        :class="{
                            'text-left': head.position === 'start',
                            'text-center': head.position === 'center',
                            'text-right': head.position === 'end'
                        }"
                    >
                        <span
                            class="block w-full min-w-0"
                            :class="{
                                'text-left': head.position === 'start',
                                'text-center': head.position === 'center',
                                'text-right': head.position === 'end'
                            }"
                        >
                            {{ head.label }}
                        </span>
                    </th>

                    <th
                        v-if="hasActions"
                        scope="col"
                        class="font-semibold p-2 text-sm text-right"
                    >
                        <span>Ações</span>
                    </th>
                </tr>
            </thead>

            <tbody>
                <tr v-if="loading" v-for="i in 4" :key="'skeleton-row-' + i" class="border-t border-border/50">
                    <td v-if="selectable" class="p-2 flex justify-start">
                        <Skeleton type="card" class="w-5 h-4" />
                    </td>

                    <td
                        v-for="head in displayHeaders"
                        :key="'skeleton-cell-' + i + '-' + head.label"
                        class="p-2"
                    >
                        <Skeleton type="text" class="w-full" />
                    </td>

                    <td v-if="hasActions" class="p-2 flex justify-end">
                        <Skeleton type="card" class="w-10 h-4" />
                    </td>
                </tr>

                <tr 
                    v-for="(item, index) in data"
                    class="hover:bg-accent/50 transition-all border-t border-border/50 text-sm"
                >
                    <td v-if="selectable" class="p-2">
                        <Checkbox
                            :checked="selectedRows.includes(index)"
                            :name="'row-' + index"
                            :id="'row-' + index"

                            @click="selectRow(index)"
                        />
                    </td>

                    <td 
                        v-for="cell in getRowDisplayCells(item)"
                        :key="cell.head.label"
                        class="p-2"
                    >
                        <div 
                            class="flex w-full"
                            :class="{
                                'justify-start': cell.head.position === 'start',
                                'justify-center': cell.head.position === 'center',
                                'justify-end': cell.head.position === 'end'
                            }"
                        >
                            <div v-if="isTextCellValue(cell.value)">
                                {{ cell.value }}
                            </div>

                            <div 
                                v-if="isBadgeCellValue(cell.value)"

                                :class="{
                                    'flex justify-start': cell.head.position === 'start',
                                    'flex justify-center': cell.head.position === 'center',
                                    'flex justify-end': cell.head.position === 'end'
                                }"
                            >
                                <Badge :variant="badgeVariant(cell.value)">
                                    {{ badgeLabel(cell.value) }}
                                </Badge>
                            </div>
                        </div>
                    </td>

                    <td
                        v-if="hasActions"
                        class="px-2 text-right align-middle"
                    >
                        <div class="flex w-full justify-end">
                            <Dropdown
                                class="w-fit!"
                                header="..."

                                :hideDropdownArrow="true"
                                :buttonAtributes="{ variant: 'transparent' }"
                                :options="actions"

                                @click:value="onActionClick($event, item)"
                            />
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

        <div 
            v-if="selectedRows.length > 0"
            class="flex border-t mt-2 pt-2 justify-between w-full"
        >
            <span class="text-muted-foreground text-sm place-self-center pl-2">
                Itens selecionados: {{ selectedRows.length }}
            </span>

            <Dropdown
                v-if="hasSelectableActions"

                class="w-fit!"
                header="Ações"

                :options="selectableActions"

                @click:value="onSelectableActionClick"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Select from "./Select.vue";
import Dropdown from "./Dropdown.vue";
import Badge from "./Badge.vue";
import Checkbox from "./Checkbox.vue";
import Skeleton from "./Skeleton.vue";
import type { OptionItem } from "./internal/OptionsList.vue";

type TableHeader = Record<string, unknown> & {
    label: string;
    field?: string;
    position?: "start" | "center" | "end";
};

export default defineComponent({
    name: 'Table',

    emits: ["click:action", "click:selectableAction"],

    components: {
        Select,
        Dropdown,
        Badge,
        Checkbox,
        Skeleton
    },

    props: {
        title: {
            type: String,
            required: false
        },

        selectCols: {
            type: Boolean,
            default: false,
            required: false
        },

        headers: {
            type: Array as PropType<TableHeader[]>,
            required: true
        },

        data: {
            type: Array as PropType<Array<Record<string, any>>>,
            required: false
        },

        selectable: {
            type: Boolean,
            default: false,
            required: false
        },

        /**
         * Per-row menu options, same shape as Dropdown `options`.
         * Selecting an item emits `click:action` with `(value, row)`.
         */
        actions: {
            type: Array as PropType<OptionItem[]>,
            required: false
        },

        /**
         * Bulk menu options shown when at least one row is selected.
         * Same shape as Dropdown `options`. Selecting an item emits
         * `click:selectableAction` with `(value, selectedRows)`.
         */
        selectableActions: {
            type: Array as PropType<OptionItem[]>,
            required: false
        },

        loading: {
            type: Boolean,
            required: false,
            default: false
        }
    },

    data() {
        return {
            atributeFields: [
                "isCard",
                "isActions",
                "actions"
            ],
            selectedHeaders: [] as string[],

            selectedRows: [] as number[]
        };
    },

    mounted() {

    },

    watch: {

    },

    methods: {
        convertObjToArr(obj: Object) {
            const array: unknown[] = [];

            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === "object" && value !== null) {
                    const entry: Record<string, unknown> = {};

                    entry[key] = value;

                    array.push(entry);
                } else {
                    array.push(value);
                }
            }

            return array;
        },

        getCellValueForHeader(item: Record<string, unknown>, head: TableHeader): unknown {
            if (head.field && head.field in item) {
                return item[head.field];
            }

            // Legacy fallback: keeps compatibility with previous index-based behavior.
            const colIndex = this.headers.indexOf(head);

            if (colIndex < 0) {
                return undefined;
            }

            const rowValues = this.convertObjToArr(item);

            return rowValues[colIndex];
        },

        getRowDisplayCells(item: Record<string, unknown>) {
            return this.displayHeaders.map(head => ({
                head,
                value: this.getCellValueForHeader(item, head)
            }));
        },

        isTextCellValue(value: unknown): value is string | number | boolean {
            return (
                typeof value === "string"
                || typeof value === "number"
                || typeof value === "boolean"
            );
        },

        resolveBadgeValue(value: unknown): { label?: string; variant?: string } | undefined {
            if (typeof value !== "object" || value === null) {
                return undefined;
            }

            if (
                "badge" in value
                && typeof (value as { badge?: unknown }).badge === "object"
                && (value as { badge?: unknown }).badge !== null
            ) {
                return (value as { badge: { label?: string; variant?: string } }).badge;
            }

            if ("label" in value || "variant" in value) {
                return value as { label?: string; variant?: string };
            }

            return undefined;
        },

        isBadgeCellValue(value: unknown): boolean {
            return this.resolveBadgeValue(value) !== undefined;
        },

        badgeLabel(value: unknown): string | undefined {
            return this.resolveBadgeValue(value)?.label;
        },

        badgeVariant(value: unknown):
            | "primary"
            | "secondary"
            | "destructive"
            | "warning"
            | "info"
            | "success"
            | "chart-1"
            | "chart-2"
            | "chart-3"
            | "chart-4"
            | "chart-5"
        {
            const v = this.resolveBadgeValue(value)?.variant;
            const allowed = [
                "primary",
                "secondary",
                "destructive",
                "warning",
                "info",
                "success",
                "chart-1",
                "chart-2",
                "chart-3",
                "chart-4",
                "chart-5"
            ] as const;

            if (v && (allowed as readonly string[]).includes(v)) {
                return v as (typeof allowed)[number];
            }

            return "secondary";
        },

        selectRow(row: number) {
            for (let n=0; n < this.selectedRows.length; n++) {
                if (this.selectedRows[n] === row) {
                    this.selectedRows.splice(n, 1);

                    return;
                }
            }

            this.selectedRows.push(row);
        },

        selectAll() {
            if (this.isAllSelected) {
                // If all rows are selected, unselect all
                this.selectedRows = [];
            } else {
                // Otherwise, select all
                this.selectedRows = (this.data ?? []).map((_: any, index: number) => index);
            }
        },

        onActionClick(value: string, item: Record<string, any>) {
            this.$emit("click:action", value, item);
        },

        onSelectableActionClick(value: string) {
            this.$emit("click:selectableAction", value, this.selectedItems);
        }
    }, 
    
    computed: {
        hasActions(): boolean {
            return Array.isArray(this.actions) && this.actions.length > 0;
        },

        hasSelectableActions(): boolean {
            return Array.isArray(this.selectableActions) && this.selectableActions.length > 0;
        },

        selectedItems(): Record<string, any>[] {
            const rows = this.data ?? [];

            return this.selectedRows
                .map((index) => rows[index])
                .filter((item): item is Record<string, any> => item != null);
        },

        isAllSelected() {
            const rows = this.data ?? [];
            const n = rows.length;

            if (n === 0) {
                return false;
            }

            if (this.selectedRows.length !== n) {
                return false;
            }

            return rows.every((_: unknown, i: number) => this.selectedRows.includes(i));
        },

        selectTableHeaders() {
            return this.headers.map(header => ({
                label: header.label,
                value: header.label
            }));
        },

        displayHeaders(): TableHeader[] {
            if (!this.selectCols) {
                return [...this.headers];
            }

            if (this.selectedHeaders.length === 0) {
                return [...this.headers];
            }

            const headersToDisplay: TableHeader[] = [];

            for (const head of this.headers) {
                if (this.selectedHeaders.includes(head.label)) {
                    headersToDisplay.push(head);
                }
            }

            return headersToDisplay;
        }
    }
});
</script>