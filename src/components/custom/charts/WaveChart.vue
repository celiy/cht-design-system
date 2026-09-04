<template>
    <div class="relative my-2">
        <div class="relative min-h-80">
            <div class="absolute inset-0 pointer-events-none">
                <div class="flex flex-col justify-between w-full h-full">
                    <div
                        v-for="i in backgroundLinesCount"
                        :key="i"
                        class="separator opacity-50"
                    />
                </div>
            </div>

            <div
                ref="waveContainer"
                class="relative h-80 transition-all"
            >
                <svg
                    class="absolute inset-0 w-full h-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    <path
                        v-if="waveAreaPath"
                        :d="waveAreaPath"
                        :fill="strokeColor"
                        fill-opacity="0.5"
                        stroke="none"
                    />

                    <path
                        v-if="wavePath"
                        :d="wavePath"
                        fill="none"
                        :stroke="strokeColor"
                        stroke-width="1.5"
                        vector-effect="non-scaling-stroke"
                        stroke-linejoin="round"
                        stroke-linecap="round"
                    />
                </svg>

                <div
                    v-for="point in wavePoints"
                    :key="`wave-point-${point.index}`"
                    v-tooltip="{
                        content: `
                            <div>
                                <span class='text-muted-foreground mr-2'>${point.dateLong}</span>
                                ${formatValue(point.value)}
                            </div>
                        `,
                        placement: 'center',
                        html: true
                    }"
                    class="absolute top-0 bottom-0 w-6 -translate-x-1/2"
                    :style="{ left: `${point.x}%` }"

                    @mouseenter="() => hoveredPoint = point.index"
                    @mouseout="() => hoveredPoint = null"
                    @touchstart="() => hoveredPoint = point.index"
                    @touchend="() => hoveredPoint = null"
                    @touchleave="() => hoveredPoint = null"
                >
                    <div
                        class="absolute border h-full left-1/2 border-dashed pointer-events-none transition-colors"
                        :class="hoverLineClass"
                        :style="{
                            opacity: hoveredPoint === point.index ? 1 : 0,
                        }"
                    />
                </div>
            </div>
        </div>

        <div class="relative">
            <div class="relative h-6 mt-2 text-sm text-muted-foreground">
                <div
                    v-for="(point, visualIndex) in wavePoints"
                    :key="`axis-wave-${point.index}`"
                    class="absolute top-0 whitespace-nowrap"
                    :class="[
                        visualIndex === 0
                            ? 'translate-x-0'
                            : visualIndex === wavePoints.length - 1
                                ? '-translate-x-full'
                                : '-translate-x-1/2'
                    ]"
                    :style="{ left: `${point.x}%` }"
                >
                    {{ point.dateShort }}
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { chartColorBorderClass, chartColorCssVar, type ChartColor } from "./chartColors";
import { chartUsesGroups, groupChartItems, type ChartSeries } from "./groupChartItems";

export type WaveChartData = ChartSeries;

export type WaveFilter = "3m" | "1m" | "2s" | "7d";

export default defineComponent({
    name: "WaveChart",

    props: {
        data: {
            type: Object as PropType<WaveChartData>,
            required: true
        },

        /**
         * Palette token for the stroke and the 50% fill under the line.
         */
        color: {
            type: String as PropType<ChartColor>,
            default: "chart-3"
        },

        filter: {
            type: String as PropType<WaveFilter>,
            default: "3m"
        },

        backgroundLinesCount: {
            type: Number,
            default: 4
        },

        verticalPadding: {
            type: Number,
            default: 12
        }
    },

    data() {
        return {
            waveContainerWidth: 0,
            waveResizeObserver: null as ResizeObserver | null,
            hoveredPoint: null as number | null,
        };
    },

    computed: {
        waveRawItems() {
            if (chartUsesGroups(this.data.items)) {
                return groupChartItems(this.data.items, this.data.label);
            }

            return [...this.data.items]
                .filter((item) => item.date != null)
                .map((item) => {
                    const date = new Date(item.date as Date);

                    return {
                        date,
                        dateLong: this.formatWaveLongDate(date),
                        dateShort: this.formatWaveShortDate(date),
                        value: item.value,
                        label: this.data.label,
                    };
                })
                .sort((a, b) => a.date.getTime() - b.date.getTime());
        },

        filteredWaveRawItems() {
            if (!this.waveRawItems.length) {
                return [];
            }

            if (chartUsesGroups(this.data.items)) {
                return this.waveRawItems;
            }

            const lastItem = this.waveRawItems[this.waveRawItems.length - 1];
            if (!lastItem || !("date" in lastItem) || !lastItem.date) {
                return [];
            }

            const startDate = this.getWaveFilterStartDate(lastItem.date);

            return this.waveRawItems.filter((item) => {
                if (!("date" in item) || !item.date) {
                    return false;
                }

                return item.date.getTime() >= startDate.getTime();
            });
        },

        maxWavePoints() {
            const fallbackWidth = 360;
            const width = this.waveContainerWidth || fallbackWidth;

            return Math.max(2, Math.floor(width / 48));
        },

        waveItems() {
            const total = this.filteredWaveRawItems.length;
            if (total <= this.maxWavePoints) {
                return this.filteredWaveRawItems.map((item, index) => ({
                    ...item,
                    index,
                }));
            }

            const selectedIndexes = new Set<number>([0, total - 1]);
            const step = (total - 1) / (this.maxWavePoints - 1);

            for (let index = 1; index < this.maxWavePoints - 1; index += 1) {
                selectedIndexes.add(Math.round(index * step));
            }

            return [...selectedIndexes]
                .sort((a, b) => a - b)
                .flatMap((sourceIndex) => {
                    const item = this.filteredWaveRawItems[sourceIndex];
                    if (!item) {
                        return [];
                    }

                    return [{
                        ...item,
                        index: sourceIndex,
                    }];
                });
        },

        waveMinValue() {
            if (!this.waveItems.length) {
                return 0;
            }

            return Math.min(...this.waveItems.map((item) => item.value));
        },

        waveMaxValue() {
            if (!this.waveItems.length) {
                return 0;
            }

            return Math.max(...this.waveItems.map((item) => item.value));
        },

        wavePoints() {
            const total = this.waveItems.length;

            return this.waveItems.map((item, index) => ({
                ...item,
                x: total <= 1 ? 50 : (index / (total - 1)) * 100,
                y: this.toWaveY(item.value),
            }));
        },

        wavePath() {
            return this.buildWavePath(this.wavePoints);
        },

        /**
         * Closed path from the wave line down to the bottom of the viewBox (`y = 100`).
         */
        waveAreaPath() {
            const line = this.wavePath;
            const first = this.wavePoints[0];
            const last = this.wavePoints[this.wavePoints.length - 1];

            if (!line || !first || !last) {
                return "";
            }

            return `${line} L ${last.x} 100 L ${first.x} 100 Z`;
        },

        strokeColor() {
            return chartColorCssVar(this.color);
        },

        hoverLineClass() {
            return chartColorBorderClass(this.color);
        }
    },

    mounted() {
        this.setupWaveObserver();
    },

    beforeUnmount() {
        this.teardownWaveObserver();
    },

    methods: {
        formatValue(value: number) {
            if (this.data.displayAs === "currency") {
                return `R$ ${value}`;
            }

            return String(value);
        },

        formatWaveShortDate(date: Date) {
            return date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
            });
        },

        formatWaveLongDate(date: Date) {
            return date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            });
        },

        getWaveFilterStartDate(lastDate: Date) {
            const startDate = new Date(lastDate);

            if (this.filter === "1m") {
                startDate.setMonth(startDate.getMonth() - 1);
                return startDate;
            }

            if (this.filter === "2s") {
                startDate.setDate(startDate.getDate() - 14);
                return startDate;
            }

            if (this.filter === "7d") {
                startDate.setDate(startDate.getDate() - 7);
                return startDate;
            }

            startDate.setMonth(startDate.getMonth() - 3);
            return startDate;
        },

        toWaveY(value: number) {
            if (this.waveMaxValue === this.waveMinValue) {
                return 50;
            }

            const normalized = (value - this.waveMinValue) / (this.waveMaxValue - this.waveMinValue);
            const usableRange = 100 - this.verticalPadding * 2;

            return this.verticalPadding + (1 - normalized) * usableRange;
        },

        buildWavePath(points: Array<{ x: number; y: number }>) {
            const first = points[0];
            if (!first) {
                return "";
            }

            if (points.length === 1) {
                return `M ${first.x} ${first.y}`;
            }

            const segmentCount = points.length - 1;
            const slopes: number[] = new Array(segmentCount).fill(0);
            const tangents: number[] = new Array(points.length).fill(0);

            for (let index = 0; index < segmentCount; index += 1) {
                const current = points[index];
                const next = points[index + 1];

                if (!current || !next) {
                    continue;
                }

                const dx = next.x - current.x;
                slopes[index] = dx === 0 ? 0 : (next.y - current.y) / dx;
            }

            tangents[0] = slopes[0] ?? 0;
            tangents[points.length - 1] = slopes[segmentCount - 1] ?? 0;

            for (let index = 1; index < points.length - 1; index += 1) {
                const previousSlope = slopes[index - 1] ?? 0;
                const nextSlope = slopes[index] ?? 0;

                if (previousSlope === 0 || nextSlope === 0 || Math.sign(previousSlope) !== Math.sign(nextSlope)) {
                    tangents[index] = 0;
                    continue;
                }

                tangents[index] = (2 * previousSlope * nextSlope) / (previousSlope + nextSlope);
            }

            let d = `M ${first.x} ${first.y}`;

            for (let index = 0; index < segmentCount; index += 1) {
                const current = points[index];
                const next = points[index + 1];
                if (!current || !next) {
                    continue;
                }

                const dx = next.x - current.x;
                const cp1x = current.x + dx / 3;
                const cp1y = current.y + ((tangents[index] ?? 0) * dx) / 3;
                const cp2x = next.x - dx / 3;
                const cp2y = next.y - ((tangents[index + 1] ?? 0) * dx) / 3;

                d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${next.x} ${next.y}`;
            }

            return d;
        },

        refreshWaveMetrics() {
            const element = this.$refs.waveContainer as HTMLElement | undefined;
            this.waveContainerWidth = element?.clientWidth ?? 0;
        },

        teardownWaveObserver() {
            if (this.waveResizeObserver) {
                this.waveResizeObserver.disconnect();
                this.waveResizeObserver = null;
            }
        },

        setupWaveObserver() {
            this.teardownWaveObserver();

            this.refreshWaveMetrics();

            const element = this.$refs.waveContainer as HTMLElement | undefined;
            if (!element) {
                return;
            }

            this.waveResizeObserver = new ResizeObserver(() => {
                this.refreshWaveMetrics();
            });
            this.waveResizeObserver.observe(element);
        }
    }
});
</script>
