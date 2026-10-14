/**
 * The chart base module
 * This module is responsible for the props, model, tooltip rows and entrance trigger shared by every chart of the project.
 */

import { defineComponent, type PropType } from "vue";
import { chartColorCssVar } from "./chartColors.ts";
import {
    buildChartModel,
    formatChartValue,
    stackSpans,
    type ChartBucket,
    type ChartCategory,
    type ChartData,
    type ChartModel,
    type ChartModelSeries,
    type ChartSpan,
    type ChartStack
} from "./chartModel.ts";
import { onFirstAppearance, prefersReducedMotion } from "./chartMotion.ts";

export type ChartTooltipRow = {
    key: string;
    label: string;
    value: string;
    color: string;
};

export type ChartLegendItem = {
    key: string;
    label: string;
    color: string;
};

/** Scope of the `label` slot of every chart. */
export type ChartLabelScope = {
    value: number;
    formatted: string;
    category: ChartCategory;
    /** `null` for the total of a stacked column. */
    series: ChartModelSeries | null;
    /** CSS color of the bar/point, also exposed as `--chart-color` on the label. */
    color: string;
};

/**
 * Shared chart behavior. Charts extend it with `mixins: [chartBase]` and override
 * `defaultBucket` (computed) or `cellColor` (method) when they need to.
 */
export default defineComponent({
    props: {
        /**
         * One series or several (`ChartSeries | ChartSeries[]`). Items with `date` sit on a
         * time axis; items with `group` on a category axis.
         */
        data: {
            type: [Object, Array] as PropType<ChartData>,
            required: true
        },

        /**
         * Theme/Tailwind token of the first series (`chart-3`, `green-500`, `success`, ...).
         * Other series without a color continue the chart palette.
         */
        color: {
            type: String,
            default: "chart-3"
        },

        /**
         * How several series share a category: `none` (side by side / overlapping),
         * `stacked` or `expanded` (share of 100%).
         */
        stack: {
            type: String as PropType<ChartStack>,
            default: "none"
        },

        /**
         * Dated items: one category per `month` or per `day`. Defaults to month for bars and
         * day for waves.
         */
        bucket: {
            type: String as PropType<ChartBucket>,
            required: false
        },

        /**
         * Shows the series legend under the chart.
         */
        legend: {
            type: Boolean,
            default: false
        },

        /**
         * Shows the value next to each bar or point. Customize with the `label` slot or
         * `labelClass`.
         */
        showLabels: {
            type: Boolean,
            default: false
        },

        /**
         * Classes of every value label, replacing the default `text-xs font-medium
         * text-foreground`. `--chart-color` holds the bar/point color, e.g.
         * `text-xs text-(--chart-color)`.
         */
        labelClass: {
            type: String,
            default: ""
        },

        /**
         * Entrance and data-change animations. Always off with reduced motion.
         */
        animated: {
            type: Boolean,
            default: true
        }
    },

    data() {
        return {
            appeared: false,
            stopAppearance: null as (() => void) | null
        };
    },

    computed: {
        /**
         * Bucket used when the `bucket` prop is not set. Charts override it.
         * @returns {ChartBucket} The bucket
         */
        defaultBucket(): ChartBucket {
            return "month";
        },

        /**
         * The aligned chart model.
         * @returns {ChartModel} The model
         */
        model(): ChartModel {
            return buildChartModel(this.data, {
                bucket: this.bucket ?? this.defaultBucket,
                color: this.color
            });
        },

        /**
         * Spans after stacking, by series then category.
         * @returns {ChartSpan[][]} The spans
         */
        spans(): ChartSpan[][] {
            return stackSpans(this.model, this.stack);
        },

        /**
         * Whether several series are drawn.
         * @returns {boolean} True with more than one series
         */
        isMultiSeries(): boolean {
            return this.model.series.length > 1;
        },

        /**
         * Entries of the legend.
         * @returns {ChartLegendItem[]} The legend items
         */
        legendItems(): ChartLegendItem[] {
            return this.model.series.map((series) => ({
                key: series.key,
                label: series.label,
                color: chartColorCssVar(series.color)
            }));
        },

        /**
         * Label classes: `labelClass`, or the default style.
         * @returns {string} The classes
         */
        labelClasses(): string {
            return this.labelClass || "text-xs font-medium text-foreground";
        },

        /**
         * Whether animations run.
         * @returns {boolean} True unless disabled or reduced motion
         */
        motion(): boolean {
            return this.animated && !prefersReducedMotion();
        }
    },

    /**
     * Starts the entrance animation the first time the chart is on screen.
     * @returns {void}
     */
    mounted() {
        if (!this.motion) {
            this.appeared = true;

            return;
        }

        this.stopAppearance = onFirstAppearance(this.$el as Element, () => {
            this.appeared = true;
        });
    },

    /**
     * Stops observing the chart.
     * @returns {void}
     */
    beforeUnmount() {
        this.stopAppearance?.();
    },

    methods: {
        /**
         * CSS color of a cell: the item color, otherwise its series color.
         * @param {number} seriesIndex The series index
         * @param {number} categoryIndex The category index
         * @returns {string} The CSS color
         */
        cellColor(seriesIndex: number, categoryIndex: number): string {
            const series = this.model.series[seriesIndex];
            const cell = series?.cells[categoryIndex];

            return chartColorCssVar(cell?.color ?? series?.color ?? this.color);
        },

        /**
         * Tooltip rows of a category: one per series that has a value there.
         * @param {number} categoryIndex The category index
         * @returns {ChartTooltipRow[]} The rows
         */
        tooltipRows(categoryIndex: number): ChartTooltipRow[] {
            return this.model.series.flatMap((series, seriesIndex) => {
                const cell = series.cells[categoryIndex];

                if (!cell?.present) {
                    return [];
                }

                return [
                    {
                        key: series.key,
                        label: series.label,
                        value: formatChartValue(cell.value, series.displayAs),
                        color: this.cellColor(seriesIndex, categoryIndex)
                    }
                ];
            });
        },

        /**
         * Builds the `label` slot scope of a value.
         * @param {number} value The value
         * @param {number} categoryIndex The category index
         * @param {number | null} seriesIndex The series index, `null` for a stacked total
         * @param {string} color The CSS color of the bar/point
         * @returns {ChartLabelScope | null} The scope, `null` for an unknown category
         */
        labelScope(
            value: number,
            categoryIndex: number,
            seriesIndex: number | null,
            color: string
        ): ChartLabelScope | null {
            const category = this.model.categories[categoryIndex];

            if (!category) {
                return null;
            }

            const series = seriesIndex == null ? null : (this.model.series[seriesIndex] ?? null);
            const displayAs = (series ?? this.model.series[0])?.displayAs ?? "sum";

            return {
                value,
                formatted: formatChartValue(value, displayAs),
                category,
                series,
                color
            };
        }
    }
});
