<template>
    <div
        v-if="amount > 1"

        class="flex w-full justify-center gap-1 md:gap-2"
    >
        <Button
            v-tooltip="'Ir para primeira página'"
            variant="transparent"
            :class="[{ transparent: selectedPage > 1 }, { invisible: selectedPage === 1 }]"

            @click="goFirst"
        >
            <span class="fa-solid fa-angle-double-left" />
        </Button>

        <Button
            v-tooltip="'Voltar uma página'"
            variant="transparent"
            :class="[{ transparent: selectedPage > 1 }, { invisible: selectedPage === 1 }]"

            @click="goPrev"
        >
            <span class="flex items-center gap-1">
                <span class="fa-solid fa-arrow-left" />
            </span>
        </Button>

        <Popover
            v-if="pagesHiddenBeforeOptions.length > 0"

            class="w-fit!"
            header="..."
            panel-class="w-fit! p-1"
            close-on-content-click
        >
            <div
                class="inline-grid w-fit gap-1"
                :style="getHiddenPagesGridStyle(pagesHiddenBeforeOptions.length)"
            >
                <Button
                    v-for="page of pagesHiddenBeforeOptions"
                    :key="page.value"

                    :variant="
                        Number.parseInt(page.value, 10) !== selectedPage ? 'transparent' : 'default'
                    "

                    @click="selectPage(Number.parseInt(page.value, 10))"
                >
                    {{ page.label }}
                </Button>
            </div>
        </Popover>

        <div class="flex gap-1">
            <div
                v-for="page of pagesToShow"
                :key="page"
            >
                <Button
                    :variant="page != selectedPage ? 'transparent' : 'default'"

                    @click="selectPage(page)"
                >
                    {{ page }}
                </Button>
            </div>
        </div>

        <Popover
            v-if="pagesHiddenAfterOptions.length > 0"

            class="w-fit!"
            header="..."
            panel-class="w-fit! p-1"
            close-on-content-click
        >
            <div
                class="inline-grid w-fit gap-1"
                :style="getHiddenPagesGridStyle(pagesHiddenAfterOptions.length)"
            >
                <Button
                    v-for="page of pagesHiddenAfterOptions"
                    :key="page.value"

                    :variant="
                        Number.parseInt(page.value, 10) !== selectedPage ? 'transparent' : 'default'
                    "

                    @click="selectPage(Number.parseInt(page.value, 10))"
                >
                    {{ Number.parseInt(page.value, 10) }}
                </Button>
            </div>
        </Popover>

        <Button
            v-tooltip="'Avançar uma página'"
            variant="transparent"
            :class="[
                { transparent: selectedPage < amount },
                { invisible: selectedPage === amount }
            ]"

            @click="goNext"
        >
            <span class="flex items-center gap-1">
                <span class="fa-solid fa-arrow-right" />
            </span>
        </Button>

        <Button
            v-tooltip="'Ir para a última página'"
            variant="transparent"
            :class="[
                { transparent: selectedPage < amount },
                { invisible: selectedPage === amount }
            ]"

            @click="goLast"
        >
            <span class="fa-solid fa-angle-double-right" />
        </Button>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "../Button.vue";
import Popover from "../Popover.vue";

export default defineComponent({
    name: "Pagination",

    components: {
        Button,
        Popover
    },

    props: {
        /**
         * The prop type of the pagination
         */
        propType: {
            type: String as PropType<"normal" | "not-normal">,
            default: "normal",
            required: false
        },

        /**
         * The amount of the pagination
         */
        amount: {
            type: Number,
            required: true
        },

        /**
         * Whether to show max
         */
        showMax: {
            type: Number,
            default: 3,
            required: false
        },

        /**
         * When `useMemo` is true, current page is read and written under this key in localStorage.
         */
        id: {
            type: String,
            default: "pagination-page",
            required: false
        },

        /**
         * Persists the current page index in localStorage under `id` (same idea as `Select` useMemo).
         */
        useMemo: {
            type: Boolean,
            default: true,
            required: false
        }
    },

    emits: ["update:page"],

    data() {
        return {
            selectedPage: 1
        };
    },

    computed: {
        /**
         * Inclusive range of page numbers shown (length <= showMax, showMax is odd).
         */
        visiblePageRange(): { start: number; end: number } {
            const amount = this.amount;
            const showMax = this.showMax;
            const selected = this.selectedPage;

            if (amount <= 0) {
                return { start: 1, end: 0 };
            }

            if (amount <= showMax) {
                return { start: 1, end: amount };
            }

            const half = (showMax - 1) / 2;
            let start = selected - half;
            let end = start + showMax - 1;

            if (start < 1) {
                start = 1;
                end = showMax;
            }

            if (end > amount) {
                end = amount;
                start = amount - showMax + 1;
            }

            return { start, end };
        },

        /**
         * Gets the pages to show
         * @returns {unknown} The pages to show
         */
        pagesToShow(): number[] {
            const { start, end } = this.visiblePageRange;
            const pages: number[] = [];

            for (let p = start; p <= end; p++) {
                pages.push(p);
            }

            return pages;
        },

        /**
         * Gets the pages hidden before
         * @returns {unknown} The pages hidden before
         */
        pagesHiddenBefore(): number[] {
            return this.buildPagesHiddenBefore(this.visiblePageRange.start);
        },

        /**
         * Gets the pages hidden after
         * @returns {unknown} The pages hidden after
         */
        pagesHiddenAfter(): number[] {
            return this.buildPagesHiddenAfter(this.visiblePageRange.end);
        },

        /**
         * Options for Dropdown (value/label must be strings).
         */
        pagesHiddenBeforeOptions(): Array<{ value: string; label: string }> {
            return this.pagesHiddenBefore.map((p) => ({
                value: String(p),
                label: String(p)
            }));
        },

        /**
         * Gets the pages hidden after options
         * @returns {unknown} The pages hidden after options
         */
        pagesHiddenAfterOptions(): Array<{ value: string; label: string }> {
            return this.pagesHiddenAfter.map((p) => ({
                value: String(p),
                label: String(p)
            }));
        }
    },

    watch: {
        /**
         * Amount
         * @returns {void}
         */
        amount() {
            const cap = Math.max(1, this.amount);

            if (this.selectedPage > cap) {
                this.selectedPage = cap;
                this.notifyPageChange(cap);
            }
        }
    },

    /**
     * Mounts the component
     * @returns {void}
     */
    mounted() {
        const page = this.resolveInitialPage();

        this.selectedPage = page;
        this.notifyPageChange(page);
    },

    methods: {
        /**
         * Notifies the parent
         * @param {number} page The page
         * @returns {void}
         */
        notifyPageChange(page: number) {
            if (this.useMemo && this.id) {
                this.persistPage(page);
            }

            this.$emit("update:page", page);
        },

        /**
         * Reads a stored page index when memo is enabled; returns a value in [1, amount].
         * @returns {number} The initial page
         */
        resolveInitialPage(): number {
            const cap = Math.max(1, this.amount);

            if (!this.useMemo || !this.id) {
                return 1;
            }

            const raw = localStorage.getItem(this.id);

            if (raw === null || raw === "") {
                return 1;
            }

            const parsed = Number.parseInt(raw, 10);

            if (Number.isNaN(parsed)) {
                return 1;
            }

            return Math.min(Math.max(1, parsed), cap);
        },

        /**
         * Persists to localStorage when memo is on
         * @param {number} page The page
         * @returns {void}
         */
        persistPage(page: number) {
            if (!this.useMemo || !this.id) {
                return;
            }

            localStorage.setItem(this.id, String(page));
        },

        /**
         * Selects a page
         * @param {number} page The page
         * @returns {void}
         */
        selectPage(page: number) {
            const cap = Math.max(1, this.amount);
            const next = Math.min(Math.max(1, page), cap);

            if (next === this.selectedPage) {
                return;
            }

            this.selectedPage = next;
            this.notifyPageChange(next);
        },

        /**
         * Goes to the first page
         * @returns {void}
         */
        goFirst() {
            if (this.selectedPage <= 1) {
                return;
            }

            this.selectedPage = 1;
            this.notifyPageChange(this.selectedPage);
        },

        /**
         * Goes to the last page
         * @returns {void}
         */
        goLast() {
            if (this.selectedPage >= this.amount) {
                return;
            }

            this.selectedPage = this.amount;
            this.notifyPageChange(this.selectedPage);
        },

        /**
         * Goes to the previous page
         * @returns {void}
         */
        goPrev() {
            if (this.selectedPage <= 1) {
                return;
            }

            this.selectedPage -= 1;
            this.notifyPageChange(this.selectedPage);
        },

        /**
         * Goes to the next page
         * @returns {void}
         */
        goNext() {
            if (this.selectedPage >= this.amount) {
                return;
            }

            this.selectedPage += 1;
            this.notifyPageChange(this.selectedPage);
        },

        /**
         * Gets the hidden pages grid style
         * @param {number} optionCount The option count
         * @returns {string} The hidden pages grid style
         */
        getHiddenPagesGridStyle(optionCount: number): { gridTemplateColumns: string } {
            const columns = Math.max(1, Math.min(optionCount, 5));

            return {
                gridTemplateColumns: `repeat(${columns}, minmax(max-content, 1fr))`
            };
        },

        /**
         * Pages strictly before the visible window [1 .. start-1].
         * @param {number} start The start
         * @returns {number[]} The pages hidden before
         */
        buildPagesHiddenBefore(start: number): number[] {
            const out: number[] = [];

            for (let p = 1; p < start; p++) {
                out.push(p);
            }

            return out;
        },

        /**
         * Pages strictly after the visible window [end+1 .. amount].
         * @param {number} end The end
         * @returns {number[]} The pages hidden after
         */
        buildPagesHiddenAfter(end: number): number[] {
            const out: number[] = [];

            for (let p = end + 1; p <= this.amount; p++) {
                out.push(p);
            }

            return out;
        }
    }
});
</script>
