<template>
    <div class="h-fit w-full overflow-x-auto rounded border border-border p-2 shadow-md">
        <div v-if="selectCols" class="mb-2 flex w-full items-center">
            <h4 class="ml-2">{{ title }}</h4>

            <div class="flex w-full justify-end">
                <Select
                    v-if="!loading"
                    id="table-select-cols"
                    header="Colunas"
                    class="w-fit!"
                    panel-class="w-fit!"
                    use-memo
                    :options="selectTableHeaders"
                    :select-multiple="{ min: 2, allSelected: true }"
                    @update:value="(value) => (selectedHeaders = value)"
                />
            </div>
        </div>

        <table class="w-full text-foreground">
            <!-- Header -->
            <thead class="rounded-t">
                <tr class="w-full bg-accent/30 transition-all hover:bg-accent/60">
                    <!-- Left-side checkbox -->
                    <th v-if="selectable" class="w-1 p-2 text-left text-sm font-semibold">
                        <Checkbox
                            id="selectable"
                            :checked="isAllSelected"
                            name="selectable"
                            :disabled="loading"
                            @click="selectAll()"
                        />
                    </th>

                    <th
                        v-for="head in displayHeaders"
                        :key="head.label"
                        class="p-2 text-sm font-semibold"
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

                    <!-- Actions Header -->
                    <th v-if="hasActions" scope="col" class="p-2 text-right text-sm font-semibold">
                        <span>Ações</span>
                    </th>
                </tr>
            </thead>

            <tbody>
                <!-- Loading state -->
                <template v-if="loading">
                    <tr v-for="i in 5" :key="'skeleton-row-' + i" class="border-t border-border/50">
                        <td v-if="selectable" class="flex justify-start p-2">
                            <Skeleton type="card" class="h-4 w-5" />
                        </td>

                        <td
                            v-for="head in displayHeaders"
                            :key="'skeleton-cell-' + i + '-' + head.label"
                            class="p-2"
                        >
                            <Skeleton type="text" class="w-full" />
                        </td>

                        <td v-if="hasActions" class="flex justify-end p-2">
                            <Skeleton type="card" class="h-4 w-10" />
                        </td>
                    </tr>
                </template>

                <!-- Normal table rows -->
                <template v-else>
                    <tr
                        v-for="(item, index) in data"
                        :key="'row-' + index"
                        class="border-t border-border/50 text-sm transition-all hover:bg-accent/60"
                        :class="{
                            'bg-accent/30': index % 2 !== 0
                        }"
                    >
                        <!-- Checkbox -->
                        <td v-if="selectable" class="p-2">
                            <Checkbox
                                :id="'row-' + index"
                                :checked="selectedRows.includes(index)"
                                :name="'row-' + index"
                                @click="selectRow(index)"
                            />
                        </td>

                        <!-- Data-->
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

                        <!-- Actions -->
                        <td v-if="hasActions" class="px-2 text-right align-middle">
                            <div class="flex w-full justify-end">
                                <Dropdown
                                    class="w-fit!"
                                    header="..."
                                    :hide-dropdown-arrow="true"
                                    :button-atributes="{ variant: 'transparent' }"
                                    :options="actions"
                                    @click:value="onActionClick($event, item)"
                                />
                            </div>
                        </td>
                    </tr>
                </template>
            </tbody>
        </table>

        <div v-if="selectedRows.length > 0" class="mt-2 flex w-full justify-between border-t pt-2">
            <span class="place-self-center pl-2 text-sm text-muted-foreground">
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
    name: "Table",

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

    emits: ["click:action", "click:selectableAction"],

    data() {
        return {
            atributeFields: ["isCard", "isActions", "actions"],
            selectedHeaders: [] as string[],

            selectedRows: [] as number[]
        };
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
            return this.headers.map((header) => ({
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
    },

    watch: {},

    mounted() {},

    methods: {
        convertObjToArr(obj: object) {
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
            return this.displayHeaders.map((head) => ({
                head,
                value: this.getCellValueForHeader(item, head)
            }));
        },

        isTextCellValue(value: unknown): value is string | number | boolean {
            return (
                typeof value === "string" || typeof value === "number" || typeof value === "boolean"
            );
        },

        resolveBadgeValue(value: unknown): { label?: string; variant?: string } | undefined {
            if (typeof value !== "object" || value === null) {
                return undefined;
            }

            if (
                "badge" in value &&
                typeof (value as { badge?: unknown }).badge === "object" &&
                (value as { badge?: unknown }).badge !== null
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

        badgeVariant(
            value: unknown
        ):
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
            | "chart-5" {
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
            for (let n = 0; n < this.selectedRows.length; n++) {
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
    }
});
</script>
