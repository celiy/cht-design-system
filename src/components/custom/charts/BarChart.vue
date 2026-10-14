<template>
    <div
        class="relative my-2"
        style="--bar-radius: 0.75rem"
    >
        <div :class="{ 'overflow-x-auto': vertical }">
            <Tooltip
                class="relative block"
                :class="{ 'w-max min-w-full': vertical }"
                :delay="0"

                @pointerenter="onPlotPointerMove"
                @pointermove="onPlotPointerMove"
            >
                <!-- Grid and zero line -->
                <div
                    class="pointer-events-none absolute"
                    :style="gridStyle"
                >
                    <div
                        class="flex h-full w-full justify-between"
                        :class="vertical ? 'flex-col' : 'flex-row'"
                    >
                        <div
                            v-for="line in backgroundLinesCount"
                            :key="line"

                            class="opacity-50"
                            :class="vertical ? 'separator' : 'h-full w-px bg-border'"
                        />
                    </div>

                    <div
                        v-if="zeroRatio !== null"

                        class="absolute bg-border"
                        :style="zeroLineStyle"
                    />
                </div>

                <div
                    class="relative flex"
                    :class="vertical ? ['w-full', justifyClass] : 'flex-col'"
                    :style="{ gap: `${groupGap}px` }"
                >
                    <div
                        v-for="(group, groupIndex) in groups"
                        :key="group.key"

                        :data-chart-group="groupIndex"
                        class="flex min-w-0"
                        :class="vertical ? 'flex-col items-center' : 'flex-row items-center gap-3'"
                        :style="groupStyle"
                    >
                        <div
                            v-if="!vertical && !hideAxisLabels"

                            class="w-28 shrink-0 truncate text-right text-sm text-muted-foreground"
                            :title="group.category.long"
                        >
                            {{ group.category.short }}
                        </div>

                        <div
                            class="relative flex"
                            :class="[
                                vertical ? 'h-80 w-full justify-center' : 'min-w-0 flex-1 flex-col',
                                { 'cursor-pointer': clickable }
                            ]"
                            :style="{ gap: `${barGap}px` }"

                            @click="onGroupClick(group)"
                        >
                            <div
                                v-for="column in group.columns"
                                :key="column.key"

                                class="relative"
                                :style="columnStyle"
                            >
                                <div
                                    v-for="segment in column.segments"
                                    :key="segment.key"

                                    class="absolute box-border"
                                    :class="[
                                        vertical ? 'inset-x-0' : 'inset-y-0',
                                        { 'transition-[filter] hover:brightness-110': clickable }
                                    ]"
                                    :style="segmentStyle(segment, groupIndex)"

                                    @click="onSegmentClick(segment, $event)"
                                />

                                <div
                                    v-for="label in column.labels"
                                    :key="label.key"

                                    class="pointer-events-none absolute whitespace-nowrap"
                                    :class="labelClasses"
                                    :style="labelStyle(label, groupIndex)"
                                >
                                    <slot
                                        name="label"
                                        v-bind="
                                            labelScope(
                                                label.value,
                                                group.categoryIndex,
                                                label.seriesIndex,
                                                label.color
                                            ) ?? {}
                                        "
                                    >
                                        {{ formatLabel(label, group.categoryIndex) }}
                                    </slot>
                                </div>
                            </div>
                        </div>

                        <div
                            v-if="vertical && !hideAxisLabels"

                            class="mt-2 text-center text-sm whitespace-nowrap text-muted-foreground"
                        >
                            {{ group.category.short }}
                        </div>
                    </div>
                </div>

                <template #tooltip>
                    <ChartTooltipContent
                        v-if="hoveredIndex !== null"

                        :title="model.categories[hoveredIndex]?.long ?? ''"
                        :rows="tooltipRows(hoveredIndex)"
                    />
                </template>
            </Tooltip>
        </div>

        <ChartLegend
            v-if="legend"

            :items="legendItems"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Tooltip from "../Tooltip.vue";
import chartBase from "./chartBase.ts";
import { chartColorCssVar, chartMixCss } from "./chartColors.ts";
import {
    domainRatio,
    spanDomain,
    type ChartCategory,
    type ChartDomain,
    type ChartSpan
} from "./chartModel.ts";
import { CHART_GROW_MS, CHART_MORPH_MS, CHART_STAGGER_MS } from "./chartMotion.ts";
import ChartLegend from "./internal/ChartLegend.vue";
import ChartTooltipContent from "./internal/ChartTooltipContent.vue";

export type BarChartDirection = "vertical" | "horizontal";
export type BarChartAlign = "left" | "center" | "right";

/** Payload of `click:bar`. */
export type BarChartClick = {
    id?: string;
    value: number;
    category: ChartCategory;
    series: { key: string; label: string };
};

type BarSegment = {
    key: string;
    seriesIndex: number;
    categoryIndex: number;
    span: ChartSpan;
    color: string;
    highlight: boolean;
    /** Outermost segment of its polarity in the column: gets the rounded end. */
    outer: boolean;
};

type BarLabel = {
    key: string;
    value: number;
    /** Value-axis position of the bar end the label sits on. */
    end: number;
    negative: boolean;
    /** `null` for the total of a stacked column. */
    seriesIndex: number | null;
    color: string;
};

type BarColumn = {
    key: string;
    segments: BarSegment[];
    labels: BarLabel[];
};

type BarGroup = {
    key: string;
    categoryIndex: number;
    category: ChartCategory;
    columns: BarColumn[];
};

/** Width cap of a bar when `barSize` is not set (bars share the available width). */
const AUTO_BAR_MAX_PX = 80;
const AUTO_BAR_MIN_PX = 24;
const HORIZONTAL_BAR_PX = 32;
/** Extra room on the value axis so labels at the bar ends stay inside the chart. */
const LABEL_HEADROOM = 0.12;

export default defineComponent({
    name: "BarChart",

    components: {
        ChartLegend,
        ChartTooltipContent,
        Tooltip
    },

    mixins: [chartBase],

    props: {
        /**
         * Vertical bars grow upward; horizontal bars grow to the right. Both accept negatives.
         */
        direction: {
            type: String as PropType<BarChartDirection>,
            default: "vertical"
        },

        /**
         * Single series only. The last bar uses this token and the bars in between mix
         * `color` → `colorEnd` as solids.
         */
        colorEnd: {
            type: String,
            default: ""
        },

        /**
         * Single series only. Token for negative bars.
         */
        negativeColor: {
            type: String,
            default: "chart-5"
        },

        /**
         * Single series only. Mixes `negativeColor` → this along the negative bars.
         */
        negativeColorEnd: {
            type: String,
            default: ""
        },

        /**
         * Bar thickness in px. Vertical: when unset, bars share the width (max 80px).
         * Horizontal: defaults to 32px.
         */
        barSize: {
            type: Number,
            required: false
        },

        /**
         * Space in px between the bars of one category (series side by side).
         */
        barGap: {
            type: Number,
            default: 4
        },

        /**
         * Space in px between categories.
         */
        groupGap: {
            type: Number,
            default: 12
        },

        /**
         * Vertical with `barSize`: where the bars sit when the chart is wider than them.
         */
        align: {
            type: String as PropType<BarChartAlign>,
            default: "center"
        },

        /**
         * Hides the category labels.
         */
        hideAxisLabels: {
            type: Boolean,
            default: false
        },

        /**
         * Hover brightness and pointer; emits `click:bar` with `BarChartClick`.
         */
        clickable: {
            type: Boolean,
            default: false
        },

        /**
         * Number of grid lines.
         */
        backgroundLinesCount: {
            type: Number,
            default: 5
        }
    },

    emits: ["click:bar"],

    data() {
        return {
            hoveredIndex: null as number | null
        };
    },

    computed: {
        /**
         * Whether bars are vertical.
         * @returns {boolean} True for vertical bars
         */
        vertical(): boolean {
            return this.direction === "vertical";
        },

        /**
         * Value range, with headroom for labels.
         * @returns {ChartDomain} The domain
         */
        domain(): ChartDomain {
            const domain = spanDomain(this.spans);

            if (!this.showLabels) {
                return domain;
            }

            const pad = (domain.max - domain.min) * LABEL_HEADROOM;

            return {
                min: domain.min < 0 ? domain.min - pad : domain.min,
                max: domain.max > 0 ? domain.max + pad : domain.max
            };
        },

        /**
         * Position of zero (percent) when the chart has negatives.
         * @returns {number | null} The zero position
         */
        zeroRatio(): number | null {
            if (this.domain.min >= 0) {
                return null;
            }

            return domainRatio(0, this.domain) * 100;
        },

        /**
         * Bars grouped by category; one column per series, or one stacked column.
         * @returns {BarGroup[]} The groups
         */
        groups(): BarGroup[] {
            const seriesIndexes = this.model.series.map((_, index) => index);
            const columnsOf = this.stack === "none" ? seriesIndexes.map((index) => [index]) : [seriesIndexes];

            return this.model.categories.map((category, categoryIndex) => ({
                key: category.key,
                categoryIndex,
                category,
                columns: columnsOf.map((indexes) => this.buildColumn(indexes, categoryIndex))
            }));
        },

        /**
         * Category-axis size of each column.
         * @returns {Record<string, string>} The column style
         */
        columnStyle(): Record<string, string> {
            if (!this.vertical) {
                return { height: `${this.barSize ?? HORIZONTAL_BAR_PX}px`, width: "100%" };
            }

            if (this.barSize != null) {
                return { width: `${this.barSize}px`, flex: "none", height: "100%" };
            }

            return {
                flex: "1 1 0",
                minWidth: "8px",
                maxWidth: `${AUTO_BAR_MAX_PX}px`,
                height: "100%"
            };
        },

        /**
         * Category-axis size of each group.
         * @returns {Record<string, string>} The group style
         */
        groupStyle(): Record<string, string> {
            if (!this.vertical || this.barSize != null) {
                return {};
            }

            // Fixed size at the max bar width, so categories sit next to each other and
            // `align` decides where the packed group goes; shrinks when the chart is narrow.
            const columns = this.stack === "none" ? this.model.series.length : 1;
            const width = columns * AUTO_BAR_MAX_PX + (columns - 1) * this.barGap;
            const minWidth = columns * AUTO_BAR_MIN_PX + (columns - 1) * this.barGap;

            return {
                flex: "0 1 auto",
                width: `${width}px`,
                minWidth: `${minWidth}px`,
                maxWidth: "100%"
            };
        },

        /**
         * Grid placement over the plot area only.
         * @returns {Record<string, string>} The grid style
         */
        gridStyle(): Record<string, string> {
            if (this.vertical) {
                return { left: "0", right: "0", top: "0", height: "20rem" };
            }

            return {
                top: "0",
                bottom: "0",
                right: "0",
                left: this.hideAxisLabels ? "0" : "calc(7rem + 0.75rem)"
            };
        },

        /**
         * Zero line position.
         * @returns {Record<string, string>} The zero line style
         */
        zeroLineStyle(): Record<string, string> {
            const position = `${this.zeroRatio ?? 0}%`;

            if (this.vertical) {
                return { left: "0", right: "0", height: "1px", bottom: position };
            }

            return { top: "0", bottom: "0", width: "1px", left: position };
        },

        /**
         * Justify class for packed bars.
         * @returns {string} The class
         */
        justifyClass(): string {
            if (this.align === "left") {
                return "justify-start";
            }

            if (this.align === "right") {
                return "justify-end";
            }

            return "justify-center";
        },

        /**
         * Delay between consecutive groups in the entrance animation.
         * @returns {number} The delay in ms
         */
        staggerMs(): number {
            return Math.min(CHART_STAGGER_MS, 700 / Math.max(1, this.model.categories.length));
        }
    },

    methods: {
        /**
         * Picks the category under (or nearest to) the pointer along the category axis.
         * One tooltip serves the whole chart, so moving between bars or across the gap
         * only swaps its content instead of hiding and showing separate tooltips.
         * @param {PointerEvent} event The pointer event
         * @returns {void}
         */
        onPlotPointerMove(event: PointerEvent) {
            const root = this.$el as HTMLElement;
            const elements = root.querySelectorAll<HTMLElement>("[data-chart-group]");
            const pointer = this.vertical ? event.clientX : event.clientY;
            let best: { index: number; distance: number } | null = null;

            elements.forEach((element) => {
                const rect = element.getBoundingClientRect();
                const from = this.vertical ? rect.left : rect.top;
                const to = this.vertical ? rect.right : rect.bottom;
                const distance =
                    pointer < from ? from - pointer : pointer > to ? pointer - to : 0;
                const index = Number(element.dataset.chartGroup);

                if (!best || distance < best.distance) {
                    best = { index, distance };
                }
            });

            const found = best as { index: number; distance: number } | null;

            this.hoveredIndex =
                found === null ? null : (this.groups[found.index]?.categoryIndex ?? null);
        },

        /**
         * Bar color: item color, otherwise the series color. A single series can paint
         * negatives with `negativeColor` and mix along the bars with `colorEnd`.
         * @param {number} seriesIndex The series index
         * @param {number} categoryIndex The category index
         * @returns {string} The CSS color
         */
        cellColor(seriesIndex: number, categoryIndex: number): string {
            const series = this.model.series[seriesIndex];
            const cell = series?.cells[categoryIndex];
            const total = this.model.categories.length;

            if (cell?.color) {
                return chartColorCssVar(cell.color);
            }

            if (!this.isMultiSeries && (cell?.value ?? 0) < 0) {
                return chartMixCss(
                    this.negativeColor,
                    this.negativeColorEnd || undefined,
                    categoryIndex,
                    total
                );
            }

            return chartMixCss(
                series?.color ?? this.color,
                this.isMultiSeries ? undefined : this.colorEnd || undefined,
                categoryIndex,
                total
            );
        },

        /**
         * Builds one column (one series, or every series stacked) of a category.
         * @param {number[]} seriesIndexes Series drawn in the column
         * @param {number} categoryIndex The category index
         * @returns {BarColumn} The column
         */
        buildColumn(seriesIndexes: number[], categoryIndex: number): BarColumn {
            const segments: BarSegment[] = [];

            for (const seriesIndex of seriesIndexes) {
                const series = this.model.series[seriesIndex];
                const cell = series?.cells[categoryIndex];
                const span = this.spans[seriesIndex]?.[categoryIndex];

                if (!series || !cell?.present || !span || span.start === span.end) {
                    continue;
                }

                segments.push({
                    key: series.key,
                    seriesIndex,
                    categoryIndex,
                    span,
                    color: this.cellColor(seriesIndex, categoryIndex),
                    highlight: cell.highlight,
                    outer: false
                });
            }

            const positives = segments.filter((segment) => segment.span.end > segment.span.start);
            const negatives = segments.filter((segment) => segment.span.end < segment.span.start);
            const topPositive = positives.reduce<BarSegment | null>(
                (best, segment) => (!best || segment.span.end > best.span.end ? segment : best),
                null
            );
            const bottomNegative = negatives.reduce<BarSegment | null>(
                (best, segment) => (!best || segment.span.end < best.span.end ? segment : best),
                null
            );

            if (topPositive) {
                topPositive.outer = true;
            }

            if (bottomNegative) {
                bottomNegative.outer = true;
            }

            return {
                key: seriesIndexes.join("-"),
                segments,
                labels: this.showLabels
                    ? this.buildLabels(segments, positives, negatives, topPositive, bottomNegative)
                    : []
            };
        },

        /**
         * Labels of a column: one per bar, or the totals of a stacked column.
         * @returns {BarLabel[]} The labels
         */
        buildLabels(
            segments: BarSegment[],
            positives: BarSegment[],
            negatives: BarSegment[],
            topPositive: BarSegment | null,
            bottomNegative: BarSegment | null
        ): BarLabel[] {
            if (this.stack === "none") {
                return segments.map((segment) => ({
                    key: segment.key,
                    value: this.cellValue(segment),
                    end: segment.span.end,
                    negative: segment.span.end < segment.span.start,
                    seriesIndex: segment.seriesIndex,
                    color: segment.color
                }));
            }

            const totals: BarLabel[] = [];
            const sum = (list: BarSegment[]) =>
                list.reduce((total, segment) => total + this.cellValue(segment), 0);

            if (topPositive) {
                totals.push({
                    key: "total-positive",
                    value: sum(positives),
                    end: topPositive.span.end,
                    negative: false,
                    seriesIndex: null,
                    color: topPositive.color
                });
            }

            if (bottomNegative) {
                totals.push({
                    key: "total-negative",
                    value: sum(negatives),
                    end: bottomNegative.span.end,
                    negative: true,
                    seriesIndex: null,
                    color: bottomNegative.color
                });
            }

            return totals;
        },

        /**
         * Raw value of a segment (not the stacked/expanded span).
         * @param {BarSegment} segment The segment
         * @returns {number} The value
         */
        cellValue(segment: BarSegment): number {
            return this.model.series[segment.seriesIndex]?.cells[segment.categoryIndex]?.value ?? 0;
        },

        /**
         * Percent position of a value on the value axis.
         * @param {number} value The value
         * @returns {number} The percent
         */
        percent(value: number): number {
            return domainRatio(value, this.domain) * 100;
        },

        /**
         * Transition list: grow on entrance (staggered), move on data changes.
         * @param {number} groupIndex The group index
         * @param {string[]} moving Properties that change with the data
         * @returns {string} The CSS transition
         */
        motionTransition(groupIndex: number, moving: string[]): string {
            if (!this.motion) {
                return "none";
            }

            const delay = Math.round(groupIndex * this.staggerMs);
            const grow = `transform ${CHART_GROW_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms`;
            const move = moving.map((property) => `${property} ${CHART_MORPH_MS}ms ease`);

            return [grow, ...move].join(", ");
        },

        /**
         * Position, size, color and motion of a segment.
         * @param {BarSegment} segment The segment
         * @param {number} groupIndex The group index
         * @returns {Record<string, string>} The style
         */
        segmentStyle(segment: BarSegment, groupIndex: number): Record<string, string> {
            const low = Math.min(segment.span.start, segment.span.end);
            const high = Math.max(segment.span.start, segment.span.end);
            const start = this.percent(low);
            const size = this.percent(high) - start;
            const negative = segment.span.end < segment.span.start;
            const rounded = segment.outer ? "var(--bar-radius)" : "0";
            const style: Record<string, string> = {
                backgroundColor: segment.highlight
                    ? `color-mix(in oklab, ${segment.color} 75%, transparent)`
                    : segment.color
            };

            if (segment.highlight) {
                style.border = `2px dashed ${segment.color}`;
            }

            if (this.vertical) {
                Object.assign(style, {
                    bottom: `${start}%`,
                    height: `${size}%`,
                    borderRadius: negative
                        ? `0 0 ${rounded} ${rounded}`
                        : `${rounded} ${rounded} 0 0`,
                    transformOrigin: negative ? "top" : "bottom",
                    transform: this.appeared ? "none" : "scaleY(0)",
                    transition: this.motionTransition(groupIndex, ["bottom", "height"])
                });

                return style;
            }

            return Object.assign(style, {
                left: `${start}%`,
                width: `${size}%`,
                borderRadius: negative
                    ? `${rounded} 0 0 ${rounded}`
                    : `0 ${rounded} ${rounded} 0`,
                transformOrigin: negative ? "right" : "left",
                transform: this.appeared ? "none" : "scaleX(0)",
                transition: this.motionTransition(groupIndex, ["left", "width"])
            });
        },

        /**
         * Label position at the bar end, shown after the bar has grown.
         * @param {BarLabel} label The label
         * @param {number} groupIndex The group index
         * @returns {Record<string, string>} The style
         */
        labelStyle(label: BarLabel, groupIndex: number): Record<string, string> {
            const position = this.percent(label.end);
            const delay = this.motion ? Math.round(groupIndex * this.staggerMs) + CHART_GROW_MS : 0;
            const style: Record<string, string> = {
                "--chart-color": label.color,
                opacity: this.appeared ? "1" : "0",
                transition: this.motion
                    ? `opacity 250ms ease ${delay}ms, bottom ${CHART_MORPH_MS}ms ease, top ${CHART_MORPH_MS}ms ease, left ${CHART_MORPH_MS}ms ease, right ${CHART_MORPH_MS}ms ease`
                    : "none"
            };

            if (this.vertical) {
                style.left = "50%";
                style.transform = "translateX(-50%)";

                if (label.negative) {
                    style.top = `calc(${100 - position}% + 4px)`;
                } else {
                    style.bottom = `calc(${position}% + 4px)`;
                }

                return style;
            }

            style.top = "50%";
            style.transform = "translateY(-50%)";

            if (label.negative) {
                style.right = `calc(${100 - position}% + 6px)`;
            } else {
                style.left = `calc(${position}% + 6px)`;
            }

            return style;
        },

        /**
         * Default label text.
         * @param {BarLabel} label The label
         * @param {number} categoryIndex The category index
         * @returns {string} The formatted value
         */
        formatLabel(label: BarLabel, categoryIndex: number): string {
            return (
                this.labelScope(label.value, categoryIndex, label.seriesIndex, label.color)
                    ?.formatted ?? ""
            );
        },

        /**
         * Click payload of a cell.
         * @param {number} seriesIndex The series index
         * @param {number} categoryIndex The category index
         * @returns {BarChartClick | null} The payload
         */
        clickPayload(seriesIndex: number, categoryIndex: number): BarChartClick | null {
            const series = this.model.series[seriesIndex];
            const cell = series?.cells[categoryIndex];
            const category = this.model.categories[categoryIndex];

            if (!series || !cell?.present || !category) {
                return null;
            }

            return {
                id: cell.id,
                value: cell.value,
                category,
                series: { key: series.key, label: series.label }
            };
        },

        /**
         * Click on a bar: that series' cell.
         * @param {BarSegment} segment The segment
         * @param {MouseEvent} event The click
         * @returns {void}
         */
        onSegmentClick(segment: BarSegment, event: MouseEvent) {
            if (!this.clickable) {
                return;
            }

            event.stopPropagation();

            const payload = this.clickPayload(segment.seriesIndex, segment.categoryIndex);

            if (payload) {
                this.$emit("click:bar", payload);
            }
        },

        /**
         * Click on the empty area of a category: only meaningful with a single series.
         * @param {BarGroup} group The group
         * @returns {void}
         */
        onGroupClick(group: BarGroup) {
            if (!this.clickable || this.isMultiSeries) {
                return;
            }

            const payload = this.clickPayload(0, group.categoryIndex);

            if (payload) {
                this.$emit("click:bar", payload);
            }
        }
    }
});
</script>
