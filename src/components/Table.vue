<template>
    <div class="relative h-fit w-full rounded border border-border shadow-md">
        <div
            v-if="loading && data"

            class="absolute inset-0 z-10 flex items-center justify-center bg-background/50"
        >
            <div class="w-fit shrink-0">
                <ProgressBar
                    loading
                    variant="circular"
                />
            </div>
        </div>

        <div class="overflow-x-auto p-2">
            <div
                v-if="selectCols"

                class="mb-2 flex w-full items-center"
            >
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
                        <th
                            v-if="selectable"

                            class="w-1 p-2 text-left text-sm font-semibold"
                        >
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
                            :class="alignClass(head)"
                        >
                            <span
                                class="inline-flex max-w-full items-center"
                                :class="{
                                    'cursor-pointer select-none hover:dark:brightness-120 hover:light:brightness-90':
                                        head.canSort
                                }"

                                @mouseenter="hoverField = head.field ?? ''"
                                @mouseleave="hoverField = ''"
                                @click="sortField(head.field ?? '')"
                            >
                                {{ head.label }}
                                <span
                                    v-if="head.canSort"

                                    class="fa-solid fa-arrow-down text-xs transition-all"
                                    :class="{
                                        'rotate-180':
                                            sortedField.field === head.field &&
                                            sortedField.direction === 'asc',
                                        'opacity-100':
                                            hoverField === head.field &&
                                            sortedField.field === head.field,
                                        'opacity-60':
                                            hoverField === head.field &&
                                            sortedField.field !== head.field,
                                        'opacity-40':
                                            hoverField !== head.field &&
                                            sortedField.field === head.field,
                                        'opacity-0': hoverField !== head.field
                                    }"
                                />
                            </span>
                        </th>

                        <!-- Actions Header -->
                        <th
                            v-if="hasActions"

                            scope="col"
                            class="p-2 text-right text-sm font-semibold"
                        >
                            <span>Ações</span>
                        </th>
                    </tr>
                </thead>

                <tbody>
                    <!-- Loading state -->
                    <template v-if="loading && !data">
                        <tr
                            v-for="i in 5"
                            :key="'skeleton-row-' + i"

                            class="border-t border-border/50"
                        >
                            <td
                                v-if="selectable"

                                class="flex justify-start p-2"
                            >
                                <Skeleton
                                    type="card"
                                    class="h-4 w-5"
                                />
                            </td>

                            <td
                                v-for="head in displayHeaders"
                                :key="'skeleton-cell-' + i + '-' + head.label"

                                class="p-2"
                            >
                                <Skeleton
                                    type="text"
                                    class="w-full"
                                />
                            </td>

                            <td
                                v-if="hasActions"

                                class="flex justify-end p-2"
                            >
                                <Skeleton
                                    type="card"
                                    class="h-4 w-10"
                                />
                            </td>
                        </tr>
                    </template>

                    <template v-else-if="hasNoData">
                        <tr>
                            <td
                                :colspan="tableColumnCount"
                                class="p-6 text-center text-sm text-muted-foreground"
                            >
                                <slot name="empty">
                                    <div class="flex flex-col items-center justify-center gap-2">
                                        <span class="font-medium text-foreground"
                                            >Nenhum dado encontrado.</span
                                        >
                                        <span>Não há registros para exibir neste momento.</span>
                                    </div>
                                </slot>
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
                            <td
                                v-if="selectable"

                                class="p-2"
                            >
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
                                :class="alignClass(cell.head)"
                            >
                                <div class="inline-flex max-w-full items-center">
                                    <div v-if="isTextCellValue(cell.value)">
                                        {{ formatTextCell(cell.value, cell.head) }}
                                    </div>

                                    <div
                                        v-else-if="isToggleCellValue(cell.value)"

                                        class="flex min-w-0 items-center gap-1"
                                    >
                                        <span class="min-w-0 truncate">
                                            {{ toggleCellText(cell.value, toggleKey(index, cell.head)) }}
                                        </span>

                                        <Button
                                            v-bind="toggleButtonProps(cell.value)"

                                            type="button"
                                            :left-icon="
                                                isToggleRevealed(toggleKey(index, cell.head))
                                                    ? 'fa-eye-slash'
                                                    : 'fa-eye'
                                            "
                                            :aria-label="
                                                isToggleRevealed(toggleKey(index, cell.head))
                                                    ? 'Ocultar valor'
                                                    : 'Mostrar valor'
                                            "

                                            @click.stop="toggleCellReveal(index, cell.head)"
                                        />
                                    </div>

                                    <Badge
                                        v-else-if="isBadgeCellValue(cell.value)"

                                        v-tooltip="badgeTooltip(cell.value)"
                                        v-bind="tableBadgeProps(cell.head, cell.value)"
                                        :color="badgeColor(cell.value)"
                                        :variant="badgeVariant(cell.value)"
                                        :label="badgeLabel(cell.value)"
                                    />
                                </div>
                            </td>

                            <!-- Actions -->
                            <td
                                v-if="hasActions"

                                class="px-2 text-right align-middle"
                            >
                                <div class="flex w-full justify-end">
                                    <Dropdown
                                        :options="actionsForRow(item)"

                                        @click:value="onActionClick($event, item)"
                                    >
                                        <template #button="{ toggle }">
                                            <Button
                                                variant="outline"
                                                class="p-2!"
                                                :hover-effect="false"

                                                @click="toggle"
                                            >
                                                <span class="fa-solid fa-ellipsis-h" />
                                            </Button>
                                        </template>
                                    </Dropdown>
                                </div>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>

            <div
                v-if="selectedRows.length > 0"

                class="mt-2 flex w-full justify-between border-t pt-2"
            >
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
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Select from "./Select.vue";
import Dropdown from "./Dropdown.vue";
import Badge from "./Badge.vue";
import Button from "./Button.vue";
import Checkbox from "./Checkbox.vue";
import Skeleton from "./Skeleton.vue";
import ProgressBar from "./ProgressBar.vue";
import type { OptionItem } from "./internal/OptionsList.vue";
import {
    formatTableCellMask,
    tableCellMaskForField,
    type TableCellMaskFormat
} from "@shared/format/displayMasks";

/** Static props forwarded to `Badge` for badge columns (`header.badgeProps` + per-cell badge object). */
export type TableHeaderBadgeProps = {
    variantStyle?: "fill" | "bordered";
    type?: "normal" | "link";
    link?: string;
    external?: boolean;
};

export type TableToggleCell = {
    value: string | number;
    altValue: string | number;
    buttonProps?: Record<string, unknown>;
};

export function isTableToggleCell(value: unknown): value is TableToggleCell {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    return "value" in value && "altValue" in value;
}

export type TableHeader = Record<string, unknown> & {
    label: string;
    field?: string;
    position?: "start" | "center" | "end";
    /** Display mask for text cells (falls back to inference from `field`). */
    format?: TableCellMaskFormat;
    /** Applied to every badge cell in this column (e.g. `variantStyle: "bordered"`). */
    badgeProps?: TableHeaderBadgeProps;
    /** Whether the column can be sorted. */
    canSort?: boolean;
};

type ResolvedBadgeValue = {
    label?: string;
    variant?: string;
    color?: string;
    variantStyle?: "fill" | "bordered";
    type?: "normal" | "link";
    link?: string;
    external?: boolean;
    tooltip?: string;
};

export default defineComponent({
    name: "Table",

    components: {
        Select,
        Dropdown,
        Badge,
        Button,
        Checkbox,
        Skeleton,
        ProgressBar
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
         * A function receives the row so the menu can depend on it.
         * Selecting an item emits `click:action` with `(value, row)`.
         */
        actions: {
            type: [Array, Function] as PropType<
                OptionItem[] | ((row: Record<string, unknown>) => OptionItem[])
            >,
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

    emits: ["click:action", "click:selectableAction", "sort:field"],

    data() {
        return {
            atributeFields: ["isCard", "isActions", "actions"],
            selectedHeaders: [] as string[],
            hoverField: "" as string,
            selectedRows: [] as number[],
            revealedToggleKeys: {} as Record<string, boolean>,

            sortedField: {} as { field: string; direction: "asc" | "desc" }
        };
    },

    computed: {
        hasActions(): boolean {
            if (typeof this.actions === "function") {
                return true;
            }

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
        },

        hasNoData(): boolean {
            return !Array.isArray(this.data) || this.data.length === 0;
        },

        tableColumnCount(): number {
            let count = this.displayHeaders.length;

            if (this.selectable) {
                count += 1;
            }

            if (this.hasActions) {
                count += 1;
            }

            return count;
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

        alignClass(head: TableHeader): string {
            if (head.position === "center") {
                return "text-center";
            }

            if (head.position === "end") {
                return "text-right";
            }

            return "text-left";
        },

        formatTextCell(value: string | number | boolean, head: TableHeader): string {
            const text = String(value);
            const format = head.format ?? tableCellMaskForField(head.field);

            if (!format) {
                return text;
            }

            return formatTableCellMask(text, format);
        },

        isTextCellValue(value: unknown): value is string | number | boolean {
            return (
                typeof value === "string" || typeof value === "number" || typeof value === "boolean"
            );
        },

        isToggleCellValue(value: unknown): value is TableToggleCell {
            return isTableToggleCell(value);
        },

        toggleKey(rowIndex: number, head: TableHeader): string {
            return `${rowIndex}:${head.field ?? head.label}`;
        },

        isToggleRevealed(key: string): boolean {
            return Boolean(this.revealedToggleKeys[key]);
        },

        toggleCellText(value: TableToggleCell, key: string): string {
            return String(this.isToggleRevealed(key) ? value.altValue : value.value);
        },

        toggleButtonProps(value: TableToggleCell): Record<string, unknown> {
            return value.buttonProps ?? {};
        },

        toggleCellReveal(rowIndex: number, head: TableHeader) {
            const key = this.toggleKey(rowIndex, head);

            this.revealedToggleKeys = {
                ...this.revealedToggleKeys,
                [key]: !this.revealedToggleKeys[key]
            };
        },

        resolveBadgeValue(value: unknown): ResolvedBadgeValue | undefined {
            if (typeof value !== "object" || value === null) {
                return undefined;
            }

            if (
                "badge" in value &&
                typeof (value as { badge?: unknown }).badge === "object" &&
                (value as { badge?: unknown }).badge !== null
            ) {
                return (value as { badge: ResolvedBadgeValue }).badge;
            }

            if (
                "label" in value ||
                "variant" in value ||
                "color" in value ||
                "variantStyle" in value ||
                "tooltip" in value
            ) {
                return value as ResolvedBadgeValue;
            }

            return undefined;
        },

        tableBadgeProps(head: TableHeader, value: unknown): TableHeaderBadgeProps {
            const fromCell = this.resolveBadgeValue(value);
            const fromHeader = head.badgeProps ?? {};

            return {
                ...fromHeader,
                ...(fromCell?.variantStyle != null ? { variantStyle: fromCell.variantStyle } : {}),
                ...(fromCell?.type != null ? { type: fromCell.type } : {}),
                ...(fromCell?.link != null ? { link: fromCell.link } : {}),
                ...(fromCell?.external != null ? { external: fromCell.external } : {})
            };
        },

        isBadgeCellValue(value: unknown): boolean {
            return this.resolveBadgeValue(value) !== undefined;
        },

        badgeLabel(value: unknown): string | undefined {
            return this.resolveBadgeValue(value)?.label;
        },

        badgeTooltip(value: unknown): string {
            return this.resolveBadgeValue(value)?.tooltip ?? "";
        },

        badgeColor(value: unknown): string | undefined {
            return this.resolveBadgeValue(value)?.color;
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

        actionsForRow(item: Record<string, unknown>): OptionItem[] {
            if (typeof this.actions === "function") {
                return this.actions(item) ?? [];
            }

            return this.actions ?? [];
        },

        onActionClick(value: string, item: Record<string, any>) {
            this.$emit("click:action", value, item);
        },

        onSelectableActionClick(value: string) {
            this.$emit("click:selectableAction", value, this.selectedItems);
        },

        sortField(field: string) {
            if (!this.headers.find((head) => head.field === field)?.canSort) {
                return;
            }

            if (this.sortedField.field === field) {
                this.sortedField.direction = this.sortedField.direction === "desc" ? "asc" : "desc";
            } else {
                this.sortedField = { field: field as string, direction: "desc" };
            }

            this.$emit("sort:field", this.sortedField);
        }
    }
});
</script>
