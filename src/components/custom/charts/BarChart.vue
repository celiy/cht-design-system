<template>
    <div class="relative my-2">
        <!-- Vertical -->
        <div
            v-if="direction === 'vertical'"

            class="overflow-x-auto"
        >
            <div class="relative w-max min-w-full">
                <div class="pointer-events-none absolute inset-x-0 top-0 h-80">
                    <div class="flex h-full w-full flex-col justify-between">
                        <div
                            v-for="i in backgroundLinesCount"
                            :key="i"

                            class="separator opacity-50"
                        />
                    </div>
                </div>

                <!-- Packed at max bar width; leftover space uses `align`. Overflow scrolls. -->
                <div
                    class="relative flex w-full gap-1"
                    :class="barsJustifyClass"
                >
                    <div
                        v-for="(item, index) in dateGroups"
                        :key="item.dateShort + item.label"

                        class="flex w-max min-w-8 flex-col items-center"
                    >
                        <Tooltip
                            class="relative flex h-80 w-20 max-w-full flex-col"
                            :class="{
                                'group cursor-pointer': clickable
                            }"

                            @click="onBarClick(item)"
                        >
                            <div
                                v-if="hasNegativeValues"

                                class="flex min-h-0 w-full flex-1 flex-col"
                            >
                                <div class="flex min-h-0 flex-1 items-end justify-center pb-px">
                                    <div
                                        v-if="positiveAmount(item) > 0"

                                        class="relative w-full max-w-[90%] overflow-visible rounded-t"
                                        :class="{
                                            'transition-[filter] group-hover:brightness-110':
                                                clickable
                                        }"
                                        :style="barStyle(item, 'positive', index)"
                                    >
                                        <span
                                            v-if="!hideLabel && isConjunto"

                                            class="pointer-events-none absolute bottom-1 left-1/2 hidden max-w-[calc(100%-0.25rem)] -translate-x-1/2 overflow-hidden rounded border bg-accent px-1 py-0 text-xs text-ellipsis whitespace-nowrap text-foreground! md:block"
                                        >
                                            {{ formatAmount(positiveAmount(item)) }}
                                        </span>
                                    </div>
                                </div>

                                <div
                                    class="h-px w-full shrink-0 bg-border"
                                    aria-hidden="true"
                                />

                                <div class="flex min-h-0 flex-1 items-start justify-center pt-px">
                                    <div
                                        v-if="negativeAmount(item) > 0"

                                        class="relative w-full max-w-[90%] overflow-visible rounded-b"
                                        :class="{
                                            'transition-[filter] group-hover:brightness-110':
                                                clickable
                                        }"
                                        :style="barStyle(item, 'negative', index)"
                                    >
                                        <span
                                            v-if="!hideLabel && isConjunto"

                                            class="pointer-events-none absolute top-1 left-1/2 hidden max-w-[calc(100%-0.25rem)] -translate-x-1/2 overflow-hidden rounded border bg-accent px-1 py-0 text-xs text-ellipsis whitespace-nowrap text-foreground! md:block"
                                        >
                                            {{ formatAmount(negativeAmount(item)) }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div
                                v-else

                                class="flex min-h-0 w-full flex-1 items-end justify-center"
                            >
                                <div
                                    v-if="item.value > 0"

                                    class="w-full max-w-[90%] rounded-t"
                                    :class="{
                                        'transition-[filter] group-hover:brightness-110': clickable
                                    }"
                                    :style="barStyle(item, 'positive', index)"
                                />
                            </div>

                            <div
                                v-if="!hideLabel && !isConjunto"

                                class="pointer-events-none absolute inset-0 hidden justify-center md:flex"
                                :class="hasNegativeValues ? 'items-center' : 'items-end pb-2'"
                            >
                                <span
                                    class="mx-2 h-fit max-w-full overflow-hidden rounded border bg-accent px-1 py-0 text-xs text-ellipsis whitespace-nowrap text-foreground!"
                                >
                                    <span v-if="data.displayAs === 'currency'">R$ </span
                                    >{{ item.value }}
                                </span>
                            </div>

                            <template #tooltip>
                                <div class="flex flex-col gap-0.5">
                                    <span class="text-muted-foreground">{{ item.dateLong }}</span>
                                    <span v-if="hasBothPolarities(item)">
                                        <template v-if="data.displayAs === 'currency'">+</template>
                                        {{ formatAmount(positiveAmount(item)) }}
                                        <span class="text-muted-foreground"> / </span>
                                        <template v-if="data.displayAs === 'currency'">−</template>
                                        {{ formatAmount(negativeAmount(item)) }}
                                    </span>
                                    <span v-else>
                                        <template v-if="data.displayAs === 'currency'">R$ </template
                                        >{{ item.value }}
                                    </span>
                                </div>
                            </template>
                        </Tooltip>

                        <div
                            v-if="!hideAxisLabels"

                            class="mt-2 text-center text-sm whitespace-nowrap text-muted-foreground"
                        >
                            {{ item.dateShort }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Horizontal (no negative values) -->
        <div
            v-else

            class="relative flex gap-3"
        >
            <div
                v-if="!hideAxisLabels"

                class="flex w-28 shrink-0 flex-col gap-3"
            >
                <div
                    v-for="item in dateGroups"
                    :key="`label-${item.dateShort}-${item.label}`"

                    class="flex h-8 items-center justify-end truncate text-sm text-muted-foreground"
                    :title="item.dateLong"
                >
                    {{ item.dateShort }}
                </div>
            </div>

            <div class="relative min-w-0 flex-1">
                <div class="pointer-events-none absolute inset-0">
                    <div class="flex h-full w-full justify-between">
                        <div
                            v-for="i in backgroundLinesCount"
                            :key="i"

                            class="h-full w-px bg-border opacity-50"
                        />
                    </div>
                </div>

                <div class="relative flex flex-col gap-3">
                    <Tooltip
                        v-for="(item, index) in dateGroups"
                        :key="item.dateShort + item.label"

                        class="relative h-8 w-full min-w-0"
                        :class="{
                            'group cursor-pointer': clickable
                        }"

                        @click="onBarClick(item)"
                    >
                        <div
                            class="absolute inset-y-0 left-0 rounded-r"
                            :class="{
                                'transition-[filter] group-hover:brightness-110': clickable
                            }"
                            :style="{
                                ...barStyle(item, 'positive', index),
                                width: `${horizontalBarPercent(item.value)}%`
                            }"
                        />

                        <div
                            v-if="!hideLabel && displayValue(item.value) > 0"

                            class="pointer-events-none absolute inset-0 flex items-center pl-2"
                        >
                            <span
                                class="rounded border bg-accent px-1 py-0 text-xs text-foreground!"
                            >
                                <span v-if="data.displayAs === 'currency'">R$ </span
                                >{{ displayValue(item.value) }}
                            </span>
                        </div>

                        <template #tooltip>
                            <span class="mr-2 text-muted-foreground">{{ item.dateLong }}</span>
                            <template v-if="data.displayAs === 'currency'">R$ </template
                            >{{ displayValue(item.value) }}
                        </template>
                    </Tooltip>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Tooltip from "../Tooltip.vue";
import { chartPaintStyle } from "./chartColors";
import {
    negativeAmount as polarNegative,
    polarScale,
    positiveAmount as polarPositive
} from "./chartPolarity";
import {
    chartUsesGroups,
    groupChartItems,
    groupChartItemsByDate,
    type ChartPoint,
    type ChartSeries
} from "./groupChartItems";

export type BarChartData = ChartSeries;
export type BarChartDirection = "vertical" | "horizontal";
export type BarChartAlign = "left" | "center" | "right";

/** Odd count so the middle divider marks the chart center. */
const GRID_LINES = 5;

export default defineComponent({
    name: "BarChart",

    components: {
        Tooltip
    },

    props: {
        /**
         * The data of the barchart
         */
        data: {
            type: Object as PropType<BarChartData>,
            required: true
        },

        /**
         * Theme/Tailwind color token for positive bars (`chart-3`, `green-500`, …).
         * Per-item `data.items[].color` overrides this.
         */
        color: {
            type: String as PropType<string>,
            default: "chart-3"
        },

        /**
         * Theme token for negative bars (vertical only). Default `chart-5`.
         */
        negativeColor: {
            type: String as PropType<string>,
            default: "chart-5"
        },

        /**
         * Optional second token: last bar of the series. Bars between mix
         * `color` → `colorEnd` as solids.
         */
        colorEnd: {
            type: String,
            default: ""
        },

        /**
         * Optional second token for negative bars (`negativeColor` → this).
         */
        negativeColorEnd: {
            type: String,
            default: ""
        },

        /**
         * If true, the value label will not be displayed on the bars.
         */
        hideLabel: {
            type: Boolean,
            default: false
        },

        /**
         * Vertical bars grow upward; horizontal grow to the right.
         * Horizontal does not support negative values.
         */
        direction: {
            type: String as PropType<BarChartDirection>,
            default: "vertical"
        },

        /**
         * Hides the axis label
         */
        hideAxisLabels: {
            type: Boolean,
            default: false
        },

        /**
         * Hover brightness + pointer; emits `click:bar` with the point (`id` if set).
         */
        clickable: {
            type: Boolean,
            default: false
        },

        /**
         * Vertical only. Where the packed bar group sits when the chart is wider than the bars.
         */
        align: {
            type: String as PropType<BarChartAlign>,
            default: "center"
        }
    },

    emits: ["click:bar"],

    computed: {
        /**
         * Checks if there are negative values
         * @returns {boolean} True if there are negative values
         */
        hasNegativeValues() {
            if (this.direction === "horizontal") {
                return false;
            }

            return this.dateGroups.some(
                (group) => group.value < 0 || (group.valueNegative ?? 0) > 0
            );
        },

        /**
         * Checks if the conjunto is active
         * @returns {boolean} True if the conjunto is active
         */
        isConjunto() {
            return this.dateGroups.some((group) => (group.valueNegative ?? 0) > 0);
        },

        /**
         * Gets the background lines count
         * @returns {number} The background lines count
         */
        backgroundLinesCount() {
            return GRID_LINES;
        },

        /**
         * Gets the global scale
         * @returns {number} The global scale
         */
        globalScale() {
            const values = this.dateGroups.map((g) =>
                this.direction === "horizontal"
                    ? Math.max(0, g.value)
                    : polarScale(g.value, g.valueNegative)
            );

            return values.length ? Math.max(...values, 0) : 0;
        },

        /**
         * Gets the date groups
         * @returns {ChartPoint[]} The date groups
         */
        dateGroups() {
            if (chartUsesGroups(this.data.items)) {
                return groupChartItems(this.data.items, this.data.label);
            }

            return groupChartItemsByDate(this.data.items, this.data.label);
        },

        /**
         * Gets the bars justify class
         * @returns {string} The bars justify class
         */
        barsJustifyClass() {
            if (this.align === "left") {
                return "justify-start";
            }

            if (this.align === "right") {
                return "justify-end";
            }

            return "justify-center";
        }
    },

    methods: {
        /**
         * Displays the value
         * @param {number} value The value
         * @returns {number} The displayed value
         */
        displayValue(value: number) {
            if (this.direction === "horizontal") {
                return Math.max(0, value);
            }

            return value;
        },

        /**
         * Gets the positive amount
         * @param {ChartPoint} item The item
         * @returns {number} The positive amount
         */
        positiveAmount(item: ChartPoint) {
            return polarPositive(item.value);
        },

        /**
         * Gets the negative amount
         * @param {ChartPoint} item The item
         * @returns {number} The negative amount
         */
        negativeAmount(item: ChartPoint) {
            return polarNegative(item.value, item.valueNegative);
        },

        /**
         * Checks if the item has both polarities
         * @param {ChartPoint} item The item
         * @returns {boolean} True if the item has both polarities
         */
        hasBothPolarities(item: ChartPoint) {
            return this.positiveAmount(item) > 0 && this.negativeAmount(item) > 0;
        },

        /**
         * Formats the amount
         * @param {number} value The value
         * @returns {string} The formatted amount
         */
        formatAmount(value: number) {
            if (this.data.displayAs === "currency") {
                return `R$ ${value}`;
            }

            return String(value);
        },

        /**
         * Resolves the color
         * @param {ChartPoint} item The item
         * @param {string} polarity The polarity
         * @returns {string} The resolved color
         */
        resolveColor(item: ChartPoint, polarity: "positive" | "negative") {
            if (polarity === "negative") {
                return this.negativeColor;
            }

            return item.color || this.data.color || this.color;
        },

        /**
         * Gets the bar style
         * @param {ChartPoint} item The item
         * @param {string} polarity The polarity
         * @param {number} index The index
         * @returns {string} The bar style
         */
        barStyle(item: ChartPoint, polarity: "positive" | "negative", index: number) {
            const colorEnd =
                polarity === "negative"
                    ? this.negativeColorEnd || undefined
                    : item.color
                      ? undefined
                      : this.colorEnd || undefined;
            const paint = chartPaintStyle(
                this.resolveColor(item, polarity),
                colorEnd,
                index,
                this.dateGroups.length
            );

            if (polarity === "positive" && this.direction === "vertical") {
                return {
                    ...paint,
                    height: `${this.positiveBarPercent(this.positiveAmount(item))}%`
                };
            }

            if (polarity === "negative") {
                return {
                    ...paint,
                    height: `${this.negativeBarPercentAmount(this.negativeAmount(item))}%`
                };
            }

            return paint;
        },

        /**
         * Gets the positive bar percent
         * @param {number} value The value
         * @returns {number} The positive bar percent
         */
        positiveBarPercent(value: number) {
            if (value <= 0 || this.globalScale <= 0) {
                return 0;
            }

            return (value / this.globalScale) * 100;
        },

        /**
         * Gets the negative bar percent amount
         * @param {number} value The value
         * @returns {number} The negative bar percent amount
         */
        negativeBarPercentAmount(value: number) {
            if (value <= 0 || this.globalScale <= 0) {
                return 0;
            }

            return (value / this.globalScale) * 100;
        },

        /**
         * Gets the horizontal bar percent
         * @param {number} value The value
         * @returns {number} The horizontal bar percent
         */
        horizontalBarPercent(value: number) {
            const v = Math.max(0, value);

            if (v <= 0 || this.globalScale <= 0) {
                return 0;
            }

            return (v / this.globalScale) * 100;
        },

        /**
         * Handles the bar click
         * @param {ChartPoint} item The item
         * @returns {void}
         */
        onBarClick(item: ChartPoint) {
            if (!this.clickable) {
                return;
            }

            this.$emit("click:bar", item);
        }
    }
});
</script>
