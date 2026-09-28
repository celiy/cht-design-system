<template>
    <div class="relative my-2">
        <!-- Vertical -->
        <div
            v-if="direction === 'vertical'"

            class="relative"
        >
            <div class="relative h-80">
                <div class="pointer-events-none absolute inset-0">
                    <div class="flex h-full w-full flex-col justify-between">
                        <div
                            v-for="i in backgroundLinesCount"
                            :key="i"

                            class="separator opacity-50"
                        />
                    </div>
                </div>

                <div class="relative h-full transition-all">
                    <div class="flex h-full items-stretch gap-2">
                        <div
                            v-for="item in dateGroups"
                            :key="item.dateShort + item.label"

                            v-tooltip="{
                                content: `
                                    <div>
                                        <span class=\'text-muted-foreground mr-2\'>${item.dateLong}</span>
                                        ${data.displayAs === 'currency' ? 'R$ ' : ''}${item.value}
                                    </div>
                                `,
                                placement: 'center',
                                html: true
                            }"
                            class="relative flex h-full min-h-0 w-full flex-col"
                        >
                            <div
                                v-if="hasNegativeValues"

                                class="flex min-h-0 w-full flex-1 flex-col"
                            >
                                <div class="flex min-h-0 flex-1 items-end justify-center pb-px">
                                    <div
                                        v-if="item.value > 0"

                                        class="w-full max-w-[90%] rounded-t"
                                        :style="barStyle(item, 'positive')"
                                    />
                                </div>

                                <div
                                    class="h-px w-full shrink-0 bg-border"
                                    aria-hidden="true"
                                />

                                <div class="flex min-h-0 flex-1 items-start justify-center pt-px">
                                    <div
                                        v-if="item.value < 0"

                                        class="w-full max-w-[90%] rounded-b"
                                        :style="barStyle(item, 'negative')"
                                    />
                                </div>
                            </div>

                            <div
                                v-else

                                class="flex min-h-0 w-full flex-1 items-end justify-center"
                            >
                                <div
                                    v-if="item.value > 0"

                                    class="w-full max-w-[90%] rounded-t"
                                    :style="barStyle(item, 'positive')"
                                />
                            </div>

                            <div
                                v-if="!hideLabel"

                                class="pointer-events-none absolute inset-0 hidden justify-center md:flex"
                                :class="hasNegativeValues ? 'items-center' : 'items-end pb-2'"
                            >
                                <span
                                    class="mx-2 h-fit max-w-full overflow-hidden rounded border border-border bg-accent p-1 px-2 text-xs text-ellipsis whitespace-nowrap text-foreground!"
                                >
                                    <span v-if="data.displayAs === 'currency'">R$ </span
                                    >{{ item.value }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                v-if="!hideAxisLabels"

                class="relative mt-2 flex gap-2 text-sm"
            >
                <div
                    v-for="item in dateGroups"
                    :key="`axis-${item.dateShort}-${item.value}`"

                    class="w-full text-center text-muted-foreground"
                >
                    {{ item.dateShort }}
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
                    <div
                        v-for="item in dateGroups"
                        :key="item.dateShort + item.label"

                        v-tooltip="{
                            content: `
                                <div>
                                    <span class=\'text-muted-foreground mr-2\'>${item.dateLong}</span>
                                    ${data.displayAs === 'currency' ? 'R$ ' : ''}${displayValue(item.value)}
                                </div>
                            `,
                            placement: 'center',
                            html: true
                        }"
                        class="relative h-8 min-w-0 w-full"
                    >
                        <div
                            class="absolute inset-y-0 left-0 rounded-r"
                            :style="{
                                ...barStyle(item, 'positive'),
                                width: `${horizontalBarPercent(item.value)}%`
                            }"
                        />

                        <div
                            v-if="!hideLabel && displayValue(item.value) > 0"

                            class="pointer-events-none absolute inset-0 flex items-center pl-2"
                        >
                            <span
                                class="rounded border border-border bg-accent px-2 py-0.5 text-xs text-foreground!"
                            >
                                <span v-if="data.displayAs === 'currency'">R$ </span
                                >{{ displayValue(item.value) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { chartPaintStyle } from "./chartColors";
import {
    chartUsesGroups,
    groupChartItems,
    groupChartItemsByDate,
    type ChartPoint,
    type ChartSeries
} from "./groupChartItems";

export type BarChartData = ChartSeries;
export type BarChartDirection = "vertical" | "horizontal";

/** Odd count so the middle divider marks the chart center. */
const GRID_LINES = 5;

export default defineComponent({
    name: "BarChart",

    props: {
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

        hideAxisLabels: {
            type: Boolean,
            default: false
        }
    },

    computed: {
        hasNegativeValues() {
            if (this.direction === "horizontal") {
                return false;
            }

            return this.dateGroups.some((group) => group.value < 0);
        },

        backgroundLinesCount() {
            return GRID_LINES;
        },

        globalScale() {
            const values = this.dateGroups.map((g) =>
                this.direction === "horizontal" ? Math.max(0, g.value) : Math.abs(g.value)
            );

            return values.length ? Math.max(...values, 0) : 0;
        },

        dateGroups() {
            if (chartUsesGroups(this.data.items)) {
                return groupChartItems(this.data.items, this.data.label);
            }

            return groupChartItemsByDate(this.data.items, this.data.label);
        }
    },

    methods: {
        displayValue(value: number) {
            if (this.direction === "horizontal") {
                return Math.max(0, value);
            }

            return value;
        },

        resolveColor(item: ChartPoint, polarity: "positive" | "negative") {
            if (polarity === "negative") {
                return this.negativeColor;
            }

            return item.color || this.data.color || this.color;
        },

        barStyle(item: ChartPoint, polarity: "positive" | "negative") {
            const paint = chartPaintStyle(this.resolveColor(item, polarity));

            if (polarity === "positive" && this.direction === "vertical") {
                return {
                    ...paint,
                    height: `${this.positiveBarPercent(item.value)}%`
                };
            }

            if (polarity === "negative") {
                return {
                    ...paint,
                    height: `${this.negativeBarPercent(item.value)}%`
                };
            }

            return paint;
        },

        positiveBarPercent(value: number) {
            if (value <= 0 || this.globalScale <= 0) {
                return 0;
            }

            return (value / this.globalScale) * 100;
        },

        negativeBarPercent(value: number) {
            if (value >= 0 || this.globalScale <= 0) {
                return 0;
            }

            return (Math.abs(value) / this.globalScale) * 100;
        },

        horizontalBarPercent(value: number) {
            const v = Math.max(0, value);

            if (v <= 0 || this.globalScale <= 0) {
                return 0;
            }

            return (v / this.globalScale) * 100;
        }
    }
});
</script>
