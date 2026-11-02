<template>
    <div class="relative h-fit w-full shadow-md">
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

        <div class="overflow-x-auto rounded border">
            <div
                v-if="selectCols"

                class="mb-2 flex w-full items-center"
            >
                <h4 class="ml-2">{{ title }}</h4>

                <div class="flex w-full justify-end pt-2 pr-2">
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

            <slot name="before" />

            <table class="w-full text-foreground">
                <!-- Header -->
                <!-- Background on thead: per-row backgrounds break under rowspan cells -->
                <thead class="rounded-t bg-accent/40 transition-all hover:bg-accent/60">
                    <tr
                        v-for="(headerRow, headerRowIndex) in headerRows"
                        :key="'header-row-' + headerRowIndex"

                        class="w-full"
                    >
                        <!-- Left-side checkbox -->
                        <th
                            v-if="selectable && headerRowIndex === 0"

                            class="w-1 p-2 text-left align-middle text-sm font-semibold"
                            :rowspan="headerRows.length"
                        >
                            <Checkbox
                                v-if="selectionMode === 'checkbox'"

                                :id="selectionId + '-all'"
                                :checked="isAllSelected"
                                :name="selectionId + '-all'"
                                :disabled="loading || selectableRowIndexes.length === 0"

                                @click="selectAll()"
                            />
                        </th>

                        <th
                            v-for="(headerCell, headerCellIndex) in headerRow"
                            :key="'header-' + headerRowIndex + '-' + headerCellIndex"

                            class="p-2 text-sm font-semibold"
                            :class="[
                                alignClass(headerCell.header),
                                verticalAlignClass(headerCell.header),
                                headerBorderClass(headerCell)
                            ]"
                            :colspan="headerCell.colSpan"
                            :rowspan="headerCell.rowSpan"
                        >
                            <slot
                                :name="'header-' + headerKey(headerCell.header)"
                                :header="headerCell.header"
                            >
                                <span
                                    v-if="headerCell.isGroup"

                                    class="inline-flex max-w-full items-center"
                                >
                                    {{ headerCell.header.label }}
                                </span>

                                <span
                                    v-else

                                    class="inline-flex max-w-full items-center gap-0.5"
                                    :class="{
                                        'cursor-pointer select-none hover:dark:brightness-120 hover:light:brightness-90':
                                            headerCell.header.canSort
                                    }"

                                    @mouseenter="hoverField = headerCell.header.field ?? ''"
                                    @mouseleave="hoverField = ''"
                                    @click="sortField(headerCell.header.field ?? '')"
                                >
                                    <!-- Mirrors the sort arrow so centered labels stay centered -->
                                    <span
                                        v-if="
                                            headerCell.header.canSort &&
                                            headerCell.header.position === 'center'
                                        "

                                        class="fa-solid fa-arrow-down text-xs opacity-0"
                                        aria-hidden="true"
                                    />

                                    {{ headerCell.header.label }}

                                    <span
                                        v-if="headerCell.header.canSort"

                                        class="fa-solid fa-arrow-down text-xs transition-all"
                                        :class="sortArrowClass(headerCell.header)"
                                    />
                                </span>
                            </slot>
                        </th>

                        <!-- Actions Header -->
                        <th
                            v-if="hasActions && headerRowIndex === 0"

                            scope="col"
                            class="p-2 text-right align-middle text-sm font-semibold"
                            :class="{ 'border-l/50': isGroupedHead }"
                            :rowspan="headerRows.length"
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

                            class="border-t/50 text-sm transition-all hover:bg-accent/40"
                            :class="{
                                'bg-accent/20': index % 2 !== 0
                            }"
                        >
                            <!-- Selection -->
                            <td
                                v-if="selectable"

                                class="p-2"
                            >
                                <Radio
                                    v-if="selectionMode === 'radio'"

                                    :id="selectionId + '-row-' + index"
                                    :name="selectionId"
                                    :value="index"
                                    :model-value="selectedRows[0]"
                                    :disabled="isRowDisabled(index)"

                                    @update:model-value="selectRow(index)"
                                />

                                <Checkbox
                                    v-else

                                    :id="selectionId + '-row-' + index"
                                    :checked="selectedRows.includes(index)"
                                    :name="selectionId + '-row-' + index"
                                    :disabled="isRowDisabled(index)"

                                    @click="selectRow(index)"
                                />
                            </td>

                            <!-- Data-->
                            <td
                                v-for="cell in bodyCells[index]"
                                :key="headerKey(cell.head)"

                                class="p-2"
                                :class="[
                                    alignClass(cell),
                                    verticalAlignClass(cell),
                                    {
                                        'border-l/50':
                                            isGroupedHead && (cell.startCol > 0 || selectable)
                                    }
                                ]"
                                :colspan="cell.colSpan > 1 ? cell.colSpan : undefined"
                                :rowspan="cell.rowSpan > 1 ? cell.rowSpan : undefined"
                            >
                                <slot
                                    :name="'cell-' + headerKey(cell.head)"
                                    :row="item"
                                    :value="cell.value"
                                    :header="cell.head"
                                    :index="index"
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
                                                {{
                                                    toggleCellText(
                                                        cell.value,
                                                        toggleKey(index, cell.head)
                                                    )
                                                }}
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
                                </slot>
                            </td>

                            <!-- Actions -->
                            <td
                                v-if="hasActions"

                                class="px-2 text-right align-middle"
                                :class="{ 'border-l/50': isGroupedHead }"
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

            <slot name="after" />

            <div
                v-if="selectedRows.length > 0"

                class="mt-2 flex w-full justify-between border-t py-2"
            >
                <span class="place-self-center pl-2 text-sm text-muted-foreground">
                    Itens selecionados: {{ selectedRows.length }}
                </span>

                <Dropdown
                    v-if="hasSelectableActions"

                    class="mr-2 w-fit!"
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
import Radio from "./Radio.vue";
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

type TableAlign = "start" | "center" | "end";

export type TableHeader = Record<string, unknown> & {
    label: string;
    field?: string;
    position?: TableAlign;
    /** Vertical alignment of the header and of this column's cells. */
    verticalPosition?: TableAlign;
    /** Display mask for text cells (falls back to inference from `field`). */
    format?: TableCellMaskFormat;
    /** Applied to every badge cell in this column (e.g. `variantStyle: "bordered"`). */
    badgeProps?: TableHeaderBadgeProps;
    /** Whether the column can be sorted. */
    canSort?: boolean;
    /** Makes this a group header spanning its children; only leaf headers are columns. */
    children?: TableHeader[];
};

/**
 * Wraps a cell value to span columns/rows or align it on its own. Covered cells are skipped,
 * so the rows below or the columns to the right just leave those fields out of the layout.
 */
export type TableSpanCell = {
    cell: unknown;
    colSpan?: number;
    rowSpan?: number;
    position?: TableAlign;
    verticalPosition?: TableAlign;
};

export function isTableSpanCell(value: unknown): value is TableSpanCell {
    return typeof value === "object" && value !== null && "cell" in value;
}

type HeaderCell = {
    header: TableHeader;
    colSpan: number;
    rowSpan: number;
    isGroup: boolean;
    /** Index of the first data column it covers. */
    startCol: number;
};

type BodyCell = {
    head: TableHeader;
    value: unknown;
    colSpan: number;
    rowSpan: number;
    position?: TableAlign;
    verticalPosition?: TableAlign;
    /** Index of the first data column it covers. */
    startCol: number;
};

let tableUid = 0;

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
        Radio,
        Skeleton,
        ProgressBar
    },

    props: {
        /**
         * Whether the table is title
         */
        title: {
            type: String,
            required: false
        },

        /**
         * Whether the table is select cols
         */
        selectCols: {
            type: Boolean,
            default: false,
            required: false
        },

        /**
         * Whether the table is headers
         */
        headers: {
            type: Array as PropType<TableHeader[]>,
            required: true
        },

        /**
         * Whether the table is data
         */
        data: {
            type: Array as PropType<Array<Record<string, any>>>,
            required: false
        },

        /**
         * Whether the table is selectable
         */
        selectable: {
            type: Boolean,
            default: false,
            required: false
        },

        /**
         * `checkbox` selects many rows (with select-all); `radio` selects one.
         */
        selectionMode: {
            type: String as PropType<"checkbox" | "radio">,
            default: "checkbox",
            required: false
        },

        /**
         * Returns true for rows that cannot be selected. Select-all skips them.
         */
        rowDisabled: {
            type: Function as PropType<(row: Record<string, unknown>, index: number) => boolean>,
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

        /**
         * Whether the table is loading
         */
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
            selectionId: `table-${(tableUid += 1)}`,

            sortedField: {} as { field: string; direction: "asc" | "desc" }
        };
    },

    computed: {
        /**
         * Checks if actions
         * @returns {boolean} True if has actions
         */
        hasActions(): boolean {
            if (typeof this.actions === "function") {
                return true;
            }

            return Array.isArray(this.actions) && this.actions.length > 0;
        },

        /**
         * Checks if selectable actions
         * @returns {boolean} True if has selectable actions
         */
        hasSelectableActions(): boolean {
            return Array.isArray(this.selectableActions) && this.selectableActions.length > 0;
        },

        /**
         * Gets the selected items
         * @returns {unknown} The selected items
         */
        selectedItems(): Record<string, any>[] {
            const rows = this.data ?? [];

            return this.selectedRows
                .map((index) => rows[index])
                .filter((item): item is Record<string, any> => item != null);
        },

        /**
         * Checks if all selected
         * @returns {boolean} True if is all selected
         */
        isAllSelected() {
            const indexes = this.selectableRowIndexes;

            if (indexes.length === 0) {
                return false;
            }

            return indexes.every((i) => this.selectedRows.includes(i));
        },

        selectableRowIndexes(): number[] {
            return (this.data ?? [])
                .map((_: unknown, index: number) => index)
                .filter((index: number) => !this.isRowDisabled(index));
        },

        /**
         * Columns in order: headers with `children` are only groups, their leaves are the columns.
         * @returns {TableHeader[]} The leaf headers
         */
        leafHeaders(): TableHeader[] {
            const leaves: TableHeader[] = [];
            const walk = (nodes: TableHeader[]) => {
                for (const node of nodes) {
                    if (node.children && node.children.length > 0) {
                        walk(node.children);
                    } else {
                        leaves.push(node);
                    }
                }
            };

            walk(this.headers);

            return leaves;
        },

        /**
         * Header rows for grouped headers. A group spans its visible leaves; a leaf that sits
         * higher than the deepest level spans the remaining rows down.
         * @returns {HeaderCell[][]} One array per `<tr>` in the head
         */
        headerRows(): HeaderCell[][] {
            const visible = new Set(this.displayHeaders);
            const visibleLeafCount = (node: TableHeader): number => {
                if (!node.children || node.children.length === 0) {
                    return visible.has(node) ? 1 : 0;
                }

                return node.children.reduce((sum, child) => sum + visibleLeafCount(child), 0);
            };
            const depthOf = (node: TableHeader): number => {
                if (!node.children || node.children.length === 0) {
                    return visible.has(node) ? 1 : 0;
                }

                const childDepth = Math.max(0, ...node.children.map(depthOf));

                return childDepth > 0 ? childDepth + 1 : 0;
            };
            const depth = Math.max(1, ...this.headers.map(depthOf));
            const rows: HeaderCell[][] = Array.from({ length: depth }, () => []);
            const place = (nodes: TableHeader[], level: number, startCol: number) => {
                let col = startCol;

                for (const node of nodes) {
                    const count = visibleLeafCount(node);

                    if (count === 0) {
                        continue;
                    }

                    const isGroup = Boolean(node.children && node.children.length > 0);

                    rows[level]?.push({
                        header: node,
                        colSpan: count,
                        rowSpan: isGroup ? 1 : depth - level,
                        isGroup,
                        startCol: col
                    });

                    if (isGroup && node.children) {
                        place(node.children, level + 1, col);
                    }

                    col += count;
                }
            };

            place(this.headers, 0, 0);

            return rows;
        },

        /**
         * Grouped heads get vertical lines between columns, in the head and in the body, so it
         * is clear which columns a group covers. A flat head keeps no inner borders.
         * @returns {boolean} True when the head has more than one row
         */
        isGroupedHead(): boolean {
            return this.headerRows.length > 1;
        },

        /**
         * Cells per row with spans resolved. Slots covered by an earlier colSpan or rowSpan
         * are left out, so each `<tr>` only renders the cells it owns.
         * @returns {BodyCell[][]} One array per data row
         */
        bodyCells(): BodyCell[][] {
            const rows = this.data ?? [];
            const columns = this.displayHeaders;
            const covered = new Set<string>();

            return rows.map((item, rowIndex) => {
                const cells: BodyCell[] = [];
                let col = 0;

                while (col < columns.length) {
                    const head = columns[col];

                    if (!head || covered.has(`${rowIndex}:${col}`)) {
                        col += 1;
                        continue;
                    }

                    const raw = this.getCellValueForHeader(item, head);
                    const span = isTableSpanCell(raw) ? raw : undefined;
                    const colSpan = Math.min(
                        Math.max(1, Math.floor(span?.colSpan ?? 1)),
                        columns.length - col
                    );
                    const rowSpan = Math.min(
                        Math.max(1, Math.floor(span?.rowSpan ?? 1)),
                        rows.length - rowIndex
                    );

                    for (let r = 0; r < rowSpan; r++) {
                        for (let c = 0; c < colSpan; c++) {
                            if (r > 0 || c > 0) {
                                covered.add(`${rowIndex + r}:${col + c}`);
                            }
                        }
                    }

                    cells.push({
                        head,
                        value: span ? span.cell : raw,
                        colSpan,
                        rowSpan,
                        position: span?.position ?? head.position,
                        verticalPosition: span?.verticalPosition ?? head.verticalPosition,
                        startCol: col
                    });

                    col += colSpan;
                }

                return cells;
            });
        },

        /**
         * Gets the select table headers
         * @returns {unknown} The select table headers
         */
        selectTableHeaders() {
            return this.leafHeaders.map((header) => ({
                label: header.label,
                value: header.label
            }));
        },

        /**
         * Gets the display headers
         * @returns {unknown} The display headers
         */
        displayHeaders(): TableHeader[] {
            if (!this.selectCols) {
                return [...this.leafHeaders];
            }

            if (this.selectedHeaders.length === 0) {
                return [...this.leafHeaders];
            }

            const headersToDisplay: TableHeader[] = [];

            for (const head of this.leafHeaders) {
                if (this.selectedHeaders.includes(head.label)) {
                    headersToDisplay.push(head);
                }
            }

            return headersToDisplay;
        },

        /**
         * Checks if no data
         * @returns {boolean} True if has no data
         */
        hasNoData(): boolean {
            return !Array.isArray(this.data) || this.data.length === 0;
        },

        /**
         * Gets the table column count
         * @returns {unknown} The table column count
         */
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

    methods: {
        /**
         * Convert obj to arr
         * @param {object} obj The obj
         * @returns {void}
         */
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

        /**
         * Gets the get cell value for header
         * @param {Record<string} item The item
         * @param {unknown} unknown> The unknown>
         * @param {TableHeader} head The head
         * @returns {void}
         */
        getCellValueForHeader(item: Record<string, unknown>, head: TableHeader): unknown {
            if (head.field && head.field in item) {
                return item[head.field];
            }

            // Legacy fallback: keeps compatibility with previous index-based behavior.
            const colIndex = this.leafHeaders.indexOf(head);

            if (colIndex < 0) {
                return undefined;
            }

            const rowValues = this.convertObjToArr(item);

            return rowValues[colIndex];
        },

        /**
         * Align class
         * @param {{ position?: TableAlign }} target The header or cell
         * @returns {string} The text alignment class
         */
        alignClass(target: { position?: TableAlign }): string {
            if (target.position === "center") {
                return "text-center";
            }

            if (target.position === "end") {
                return "text-right";
            }

            return "text-left";
        },

        verticalAlignClass(target: { verticalPosition?: TableAlign }): string {
            if (target.verticalPosition === "start") {
                return "align-top";
            }

            if (target.verticalPosition === "end") {
                return "align-bottom";
            }

            return "align-middle";
        },

        /**
         * Name used by the `header-*` and `cell-*` slots.
         * @param {TableHeader} head The header
         * @returns {string} `field`, or `label` when there is no field
         */
        headerKey(head: TableHeader): string {
            return head.field ?? head.label;
        },

        /**
         * Grouped heads only: a line under each group and between columns.
         * @param {HeaderCell} cell The header cell
         * @returns {Record<string, boolean>} The border classes
         */
        headerBorderClass(cell: HeaderCell): Record<string, boolean> {
            return {
                "border-b/50": this.isGroupedHead && cell.isGroup,
                "border-l/50": this.isGroupedHead && (cell.startCol > 0 || this.selectable)
            };
        },

        sortArrowClass(head: TableHeader): Record<string, boolean> {
            const isSorted = this.sortedField.field === head.field;
            const isHovered = this.hoverField === head.field;

            return {
                "rotate-180": isSorted && this.sortedField.direction === "asc",
                "opacity-100": isHovered && isSorted,
                "opacity-60": isHovered && !isSorted,
                "opacity-40": !isHovered && isSorted,
                "opacity-0": !isHovered
            };
        },

        isRowDisabled(index: number): boolean {
            const row = this.data?.[index];

            if (!row || !this.rowDisabled) {
                return false;
            }

            return Boolean(this.rowDisabled(row, index));
        },

        /**
         * Format text cell
         * @param {string | number | boolean} value The value
         * @param {TableHeader} head The head
         * @returns {void}
         */
        formatTextCell(value: string | number | boolean, head: TableHeader): string {
            const text = String(value);
            const format = head.format ?? tableCellMaskForField(head.field);

            if (!format) {
                return text;
            }

            return formatTableCellMask(text, format);
        },

        /**
         * Gets the is text cell value
         * @param {unknown} value The value
         * @returns {void}
         */
        isTextCellValue(value: unknown): value is string | number | boolean {
            return (
                typeof value === "string" || typeof value === "number" || typeof value === "boolean"
            );
        },

        /**
         * Gets the is toggle cell value
         * @param {unknown} value The value
         * @returns {void}
         */
        isToggleCellValue(value: unknown): value is TableToggleCell {
            return isTableToggleCell(value);
        },

        /**
         * Toggles the key
         * @param {number} rowIndex The row index
         * @param {TableHeader} head The head
         * @returns {void}
         */
        toggleKey(rowIndex: number, head: TableHeader): string {
            return `${rowIndex}:${head.field ?? head.label}`;
        },

        /**
         * Gets the is toggle revealed
         * @param {string} key The key
         * @returns {void}
         */
        isToggleRevealed(key: string): boolean {
            return Boolean(this.revealedToggleKeys[key]);
        },

        /**
         * Toggles the cell text
         * @param {TableToggleCell} value The value
         * @param {string} key The key
         * @returns {void}
         */
        toggleCellText(value: TableToggleCell, key: string): string {
            return String(this.isToggleRevealed(key) ? value.altValue : value.value);
        },

        /**
         * Toggles the button props
         * @param {TableToggleCell} value The value
         * @returns {void}
         */
        toggleButtonProps(value: TableToggleCell): Record<string, unknown> {
            return value.buttonProps ?? {};
        },

        /**
         * Toggles the cell reveal
         * @param {number} rowIndex The row index
         * @param {TableHeader} head The head
         * @returns {void}
         */
        toggleCellReveal(rowIndex: number, head: TableHeader) {
            const key = this.toggleKey(rowIndex, head);

            this.revealedToggleKeys = {
                ...this.revealedToggleKeys,
                [key]: !this.revealedToggleKeys[key]
            };
        },

        /**
         * Resolve badge value
         * @param {unknown} value The value
         * @returns {void}
         */
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

        /**
         * Table badge props
         * @param {TableHeader} head The head
         * @param {unknown} value The value
         * @returns {void}
         */
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

        /**
         * Gets the is badge cell value
         * @param {unknown} value The value
         * @returns {void}
         */
        isBadgeCellValue(value: unknown): boolean {
            return this.resolveBadgeValue(value) !== undefined;
        },

        /**
         * Badge label
         * @param {unknown} value The value
         * @returns {void}
         */
        badgeLabel(value: unknown): string | undefined {
            return this.resolveBadgeValue(value)?.label;
        },

        /**
         * Badge tooltip
         * @param {unknown} value The value
         * @returns {void}
         */
        badgeTooltip(value: unknown): string {
            return this.resolveBadgeValue(value)?.tooltip ?? "";
        },

        /**
         * Badge color
         * @param {unknown} value The value
         * @returns {void}
         */
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

        /**
         * Select row
         * @param {number} row The row
         * @returns {void}
         */
        selectRow(row: number) {
            if (this.isRowDisabled(row)) {
                return;
            }

            if (this.selectionMode === "radio") {
                this.selectedRows = [row];

                return;
            }

            for (let n = 0; n < this.selectedRows.length; n++) {
                if (this.selectedRows[n] === row) {
                    this.selectedRows.splice(n, 1);

                    return;
                }
            }

            this.selectedRows.push(row);
        },

        /**
         * Select all
         * @returns {void}
         */
        selectAll() {
            if (this.isAllSelected) {
                // If all rows are selected, unselect all
                this.selectedRows = [];
            } else {
                // Otherwise, select all rows that are not disabled
                this.selectedRows = [...this.selectableRowIndexes];
            }
        },

        /**
         * Actions for row
         * @param {Record<string} item The item
         * @param {unknown} unknown> The unknown>
         * @returns {void}
         */
        actionsForRow(item: Record<string, unknown>): OptionItem[] {
            if (typeof this.actions === "function") {
                return this.actions(item) ?? [];
            }

            return this.actions ?? [];
        },

        /**
         * Handles the action click
         * @param {string} value The value
         * @param {Record<string} item The item
         * @param {unknown} any> The any>
         * @returns {void}
         */
        onActionClick(value: string, item: Record<string, any>) {
            this.$emit("click:action", value, item);
        },

        /**
         * Handles the selectable action click
         * @param {string} value The value
         * @returns {void}
         */
        onSelectableActionClick(value: string) {
            this.$emit("click:selectableAction", value, this.selectedItems);
        },

        /**
         * Sort field
         * @param {string} field The field
         * @returns {void}
         */
        sortField(field: string) {
            if (!this.leafHeaders.find((head) => head.field === field)?.canSort) {
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
