<template>
    <div class="w-full overflow-x-auto rounded-lg border-border border p-2 h-fit shadow-md">
        <div 
            v-if="selectCols" 
            class="flex items-center w-full mb-2"
        >
            <h5 class="ml-2">{{ title }}</h5>

            <div class="w-full flex justify-end">
                <Select
                    header="Colunas"
                    class="w-fit!"

                    id="table-select-cols"
                    useMemo

                    :options="selectTableHeaders"
                    :selectMultiple="{ min: 2, allSelected: true }"
                    :buttonAtributes="{
                        size: 'small'
                    }"

                    @update:value="(value) => selectedHeaders = value"
                />
            </div>
        </div>

        <table class="w-full text-foreground">
            <thead class="rounded-t-lg">
                <tr class="hover:bg-accent transition-all w-full">
                    <th 
                        v-if="selectable"
                        class="font-semibold p-2 text-sm text-left"
                    >
                        <Checkbox
                            :checked="isAllSelected"
                            name="selectable"
                            id="selectable"

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
                        v-if="actions"
                        scope="col"
                        class="font-semibold p-2 text-sm text-right"
                    >
                        <span>Ações</span>
                    </th>
                </tr>
            </thead>

            <tbody>
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
                        v-if="actions"
                        class="px-2 text-right align-middle"
                    >
                        <div class="flex w-full justify-end">
                            <Popover
                                header="..."
                                class="w-fit!"
                                :buttonAtributes="{
                                    variant: 'transparent',
                                    size: 'extra-small'
                                }"
                            >
                                <div class="w-full flex flex-col gap-2">
                                    <Button
                                        v-if="actions.inspect"

                                        class="text-left w-full text-xs!"
                                        size="small"
                                        label="Visualizar"
                                        variant="transparent"
                                        :hoverEffect="false"

                                        @click="inspectItem(item.id)"
                                    />

                                    <Button
                                        v-if="actions.edit"

                                        class="text-left w-full text-xs!"
                                        size="small"
                                        label="Editar"
                                        variant="transparent"
                                        :hoverEffect="false"
                                        
                                        @click="editItem(item.id)"
                                    />

                                    <div v-if="actions.delete" class="separator"/>

                                    <Button
                                        v-if="actions.delete"

                                        class="text-left w-full text-xs!"
                                        size="small"
                                        label="Excluir"
                                        variant="transparent-destructive"
                                        :hoverEffect="false"
                                        
                                        @click="deleteItem(item.id)"
                                    />
                                </div>
                            </Popover>
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

            <Popover
                header="Ações"
                class="w-fit!"
                :buttonAtributes="{
                    size: 'small'
                }"
            >
                <div class="w-full flex flex-col gap-2">
                    <Button
                        class="text-left w-full text-xs!"
                        size="small"
                        label="Excluir itens selecionados"
                        variant="transparent-destructive"
                        :hoverEffect="false"
                        
                        @click="deleteSelectedItems()"
                    />
                </div>
            </Popover>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "./Button.vue";
import Select from "./Select.vue";
import Popover from "./Popover.vue";
import Badge from "./Badge.vue";
import Checkbox from "./Checkbox.vue";

type TableHeader = Record<string, unknown> & {
    label: string;
    field?: string;
    position?: "start" | "center" | "end";
};

export default defineComponent({
    name: 'Table',

    emits: ['click'],

    components: {
        Button,
        Select,
        Popover,
        Badge,
        Checkbox
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
            required: true
        },

        selectable: {
            type: Boolean,
            default: false,
            required: false
        },

        actions: {
            type: Object as PropType<{ 
                inspect?: boolean,
                edit?: boolean,
                delete?: boolean
            }>,

            required: false
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

        badgeVariant(value: unknown): "primary" | "secondary" | "destructive" | "warning" | "info" | "success" {
            const v = this.resolveBadgeValue(value)?.variant;
            const allowed = ["primary", "secondary", "destructive", "warning", "info", "success"] as const;

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
                this.selectedRows = this.data.map((_: any, index: number) => index);
            }
        },

        inspectItem(_item: string) {

        },

        editItem(_item: string) {

        },

        deleteItem(_item: string) {

        },

        deleteSelectedItems() {

        }
    }, 
    
    computed: {
        isAllSelected() {
            const n = this.data.length;

            if (n === 0) {
                return false;
            }

            if (this.selectedRows.length !== n) {
                return false;
            }

            return this.data.every((_: unknown, i: number) => this.selectedRows.includes(i));
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