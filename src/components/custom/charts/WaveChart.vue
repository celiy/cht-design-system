<template>
    <div class="relative my-2">
        <div class="relative">
            <div class="pointer-events-none absolute inset-x-0 top-0 h-80">
                <div class="flex h-full w-full flex-col justify-between">
                    <div
                        v-for="line in backgroundLinesCount"
                        :key="line"

                        class="separator opacity-50"
                    />
                </div>
            </div>

            <Tooltip
                class="relative block h-80"

                @pointerenter="onPointerMove"
            >
                <div
                    ref="plot"

                    class="absolute inset-0"

                    @pointermove="onPointerMove"
                    @pointerleave="hoveredPos = null"
                >
                    <svg
                        class="absolute inset-0 h-full w-full overflow-visible"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                    >
                        <defs>
                            <linearGradient
                                v-for="layer in layers"
                                :id="layer.gradientId"
                                :key="layer.gradientId"

                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    :stop-color="layer.color"
                                    stop-opacity="0.55"
                                />
                                <stop
                                    offset="100%"
                                    :stop-color="layer.color"
                                    stop-opacity="0.02"
                                />
                            </linearGradient>

                            <clipPath :id="clipId">
                                <rect
                                    :key="revealKey"

                                    class="wave-reveal"
                                    :class="revealClass"
                                    x="-1"
                                    y="-50"
                                    width="102"
                                    height="200"
                                />
                            </clipPath>
                        </defs>

                        <g
                            v-if="waveStyle === 'solid'"
                            :key="`areas-${revealKey}`"

                            class="wave-fade"
                            :class="revealClass"
                        >
                            <path
                                v-for="layer in layers"
                                :key="`area-${layer.key}`"

                                :d="layer.area"
                                :fill="gradientFill ? `url(#${layer.gradientId})` : layer.color"
                                :fill-opacity="gradientFill ? 1 : 0.45"
                                stroke="none"
                            />
                        </g>

                        <g :clip-path="`url(#${clipId})`">
                            <path
                                v-for="layer in layers"
                                :key="`line-${layer.key}`"

                                :d="layer.line"
                                fill="none"
                                :stroke="layer.color"
                                stroke-width="2"
                                vector-effect="non-scaling-stroke"
                                stroke-linejoin="round"
                                stroke-linecap="round"
                            />
                        </g>
                    </svg>

                    <div
                        v-if="hoveredPos !== null"

                        class="pointer-events-none absolute inset-y-0 border-l border-dashed border-muted-foreground/40"
                        :style="{ left: `${xs[hoveredPos] ?? 0}%` }"
                    />

                    <div
                        :key="`marks-${revealKey}`"

                        class="wave-fade wave-fade--late pointer-events-none absolute inset-0"
                        :class="revealClass"
                    >
                        <template
                            v-for="layer in layers"
                            :key="`marks-${layer.key}`"
                        >
                            <template
                                v-for="(point, pos) in layer.top"
                                :key="`mark-${layer.key}-${pos}`"
                            >
                                <span
                                    v-if="layer.present[pos] && (dots || hoveredPos === pos)"

                                    class="absolute rounded-full ring-2 ring-background transition-[width,height]"
                                    :class="hoveredPos === pos ? 'size-2.5' : 'size-2'"
                                    :style="markStyle(point, layer.pointColors[pos] ?? layer.color)"
                                />

                                <span
                                    v-if="showLabels && layer.present[pos]"

                                    class="absolute whitespace-nowrap"
                                    :class="labelClasses"
                                    :style="labelStyle(point, layer.pointColors[pos] ?? layer.color)"
                                >
                                    <slot
                                        name="label"
                                        v-bind="pointLabelScope(layer.seriesIndex, pos) ?? {}"
                                    >
                                        {{ pointLabelScope(layer.seriesIndex, pos)?.formatted }}
                                    </slot>
                                </span>
                            </template>
                        </template>
                    </div>
                </div>

                <template #tooltip>
                    <ChartTooltipContent
                        v-if="hoveredCategory !== null"

                        :title="model.categories[hoveredCategory]?.long ?? ''"
                        :rows="tooltipRows(hoveredCategory)"
                    />
                </template>
            </Tooltip>
        </div>

        <div
            v-if="!hideAxisLabels"

            class="relative mt-2 h-6 text-sm text-muted-foreground"
        >
            <div
                v-for="pos in axisPositions"
                :key="`axis-${visibleIndexes[pos]}`"

                class="absolute top-0 whitespace-nowrap"
                :class="axisLabelClass(pos)"
                :style="{ left: `${xs[pos] ?? 0}%` }"
            >
                {{ model.categories[visibleIndexes[pos] ?? -1]?.short }}
            </div>
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
import chartBase, { type ChartLabelScope } from "./chartBase.ts";
import { chartColorCssVar } from "./chartColors.ts";
import {
    categoriesInRange,
    domainRatio,
    evenlySpacedIndexes,
    spanDomain,
    type ChartBucket,
    type ChartDomain,
    type ChartRange
} from "./chartModel.ts";
import { CHART_MORPH_MS, tweenNumbers } from "./chartMotion.ts";
import { areaPath, linePath, type ChartCurve, type PlotPoint } from "./chartPaths.ts";
import ChartLegend from "./internal/ChartLegend.vue";
import ChartTooltipContent from "./internal/ChartTooltipContent.vue";

export type WaveFilter = ChartRange;
export type WaveStyle = "solid" | "line";

type WaveLayer = {
    key: string;
    seriesIndex: number;
    color: string;
    gradientId: string;
    top: PlotPoint[];
    present: boolean[];
    pointColors: string[];
    line: string;
    area: string;
};

/** Minimum horizontal room per point before points are thinned out. */
const POINT_MIN_PX = 28;
/** Axis labels are wider than points, so fewer of them are shown. */
const AXIS_LABEL_MIN_PX = 64;

export default defineComponent({
    name: "WaveChart",

    components: {
        ChartLegend,
        ChartTooltipContent,
        Tooltip
    },

    mixins: [chartBase],

    props: {
        /**
         * Curve between points: `smooth`, `linear` or `step`.
         */
        type: {
            type: String as PropType<ChartCurve>,
            default: "smooth"
        },

        /**
         * `solid` fills under the line (flat on simplicia, gradient on hodiernus);
         * `line` draws the line only.
         */
        waveStyle: {
            type: String as PropType<WaveStyle>,
            default: "solid"
        },

        /**
         * Dated data only: keeps the last `3m`, `1m`, `2s` or `7d` (`all` keeps everything).
         */
        filter: {
            type: String as PropType<WaveFilter>,
            default: "all"
        },

        /**
         * Always shows a dot on each point (hover shows them anyway).
         */
        dots: {
            type: Boolean,
            default: false
        },

        /**
         * Hides the category labels under the chart.
         */
        hideAxisLabels: {
            type: Boolean,
            default: false
        },

        /**
         * Number of grid lines.
         */
        backgroundLinesCount: {
            type: Number,
            default: 4
        },

        /**
         * Empty space above the highest value, in percent of the chart height.
         */
        verticalPadding: {
            type: Number,
            default: 12
        }
    },

    data() {
        return {
            plotWidth: 0,
            resizeObserver: null as ResizeObserver | null,
            hoveredPos: null as number | null,
            renderYs: null as number[] | null,
            stopTween: null as (() => void) | null,
            revealKey: 0,
            nonce: `wave-${Math.random().toString(36).slice(2, 9)}`
        };
    },

    computed: {
        /**
         * Wave points are days unless `bucket` says otherwise.
         * @returns {ChartBucket} The bucket
         */
        defaultBucket(): ChartBucket {
            return "day";
        },

        /**
         * Categories drawn: inside the filter range, thinned to fit the width.
         * @returns {number[]} Category indexes
         */
        visibleIndexes(): number[] {
            const inRange = categoriesInRange(this.model.categories, this.filter);
            const max = Math.max(2, Math.floor((this.plotWidth || 360) / POINT_MIN_PX));

            return evenlySpacedIndexes(inRange.length, max).flatMap((pos) => {
                const index = inRange[pos];

                return index === undefined ? [] : [index];
            });
        },

        /**
         * Visible points that get an axis label, spread so the labels do not overlap.
         * @returns {number[]} Positions in `visibleIndexes`
         */
        axisPositions(): number[] {
            const max = Math.max(2, Math.floor((this.plotWidth || 360) / AXIS_LABEL_MIN_PX));

            return evenlySpacedIndexes(this.visibleIndexes.length, max);
        },

        /**
         * Horizontal position (percent) of each visible point.
         * @returns {number[]} The positions
         */
        xs(): number[] {
            const count = this.visibleIndexes.length;

            return this.visibleIndexes.map((_, pos) => (count <= 1 ? 50 : (pos / (count - 1)) * 100));
        },

        /**
         * Value range of the visible points.
         * @returns {ChartDomain} The domain
         */
        domain(): ChartDomain {
            return spanDomain(this.spans, this.visibleIndexes);
        },

        /**
         * Target plot y of every point, as `[top, bottom]` pairs by series then point.
         * Tweened into `renderYs` when only the values change.
         * @returns {number[]} The y values
         */
        targetYs(): number[] {
            return this.spans.flatMap((column) =>
                this.visibleIndexes.flatMap((categoryIndex) => {
                    const span = column[categoryIndex] ?? { start: 0, end: 0 };

                    return [this.toY(span.end), this.toY(span.start)];
                })
            );
        },

        /**
         * Changes when the data itself changes shape (series or categories), which redraws
         * the chart instead of morphing it.
         * @returns {string} The key
         */
        dataShapeKey(): string {
            const series = this.model.series.map((item) => item.key).join("|");
            const categories = this.model.categories.map((item) => item.key).join("|");

            return `${series}::${categories}::${this.filter}`;
        },

        /**
         * Paths and points of each series.
         * @returns {WaveLayer[]} The layers
         */
        layers(): WaveLayer[] {
            const ys = this.renderYs && this.renderYs.length === this.targetYs.length
                ? this.renderYs
                : this.targetYs;
            const count = this.visibleIndexes.length;

            return this.model.series.map((series, seriesIndex) => {
                const top: PlotPoint[] = [];
                const bottom: PlotPoint[] = [];
                const offset = seriesIndex * count * 2;

                this.xs.forEach((x, pos) => {
                    top.push({ x, y: ys[offset + pos * 2] ?? 100 });
                    bottom.push({ x, y: ys[offset + pos * 2 + 1] ?? 100 });
                });

                return {
                    key: series.key,
                    seriesIndex,
                    color: chartColorCssVar(series.color),
                    gradientId: `${this.nonce}-fill-${seriesIndex}`,
                    top,
                    present: this.visibleIndexes.map(
                        (categoryIndex) => series.cells[categoryIndex]?.present ?? false
                    ),
                    pointColors: this.visibleIndexes.map((categoryIndex) =>
                        this.cellColor(seriesIndex, categoryIndex)
                    ),
                    line: linePath(top, this.type),
                    area: areaPath(top, bottom, this.type)
                };
            });
        },

        /**
         * Category under the pointer.
         * @returns {number | null} The category index
         */
        hoveredCategory(): number | null {
            if (this.hoveredPos === null) {
                return null;
            }

            return this.visibleIndexes[this.hoveredPos] ?? null;
        },

        /**
         * Hodiernus paints the area with a vertical gradient; simplicia keeps it flat.
         * @returns {boolean} True for the gradient fill
         */
        gradientFill(): boolean {
            return this.$project?.style?.customTheme === "hodiernus";
        },

        /**
         * Entrance classes shared by the line clip, the area and the marks.
         * @returns {Record<string, boolean>} The classes
         */
        revealClass(): Record<string, boolean> {
            return {
                "is-drawn": this.appeared && this.motion,
                "is-static": !this.motion
            };
        },

        /**
         * Unique clip path id.
         * @returns {string} The id
         */
        clipId(): string {
            return `${this.nonce}-clip`;
        }
    },

    watch: {
        /**
         * Morphs to new values; redraws when the data changes shape.
         * @param {number[]} next The new targets
         * @param {number[]} previous The previous targets
         * @returns {void}
         */
        targetYs(next: number[], previous: number[]) {
            this.stopTween?.();
            this.stopTween = null;

            if (!this.motion || !this.appeared || next.length !== previous.length) {
                this.renderYs = null;

                return;
            }

            this.stopTween = tweenNumbers(this.renderYs ?? previous, next, CHART_MORPH_MS, (values) => {
                this.renderYs = values;
            });
        },

        /**
         * Replays the entrance animation for new data.
         * @returns {void}
         */
        dataShapeKey() {
            if (this.appeared && this.motion) {
                this.revealKey += 1;
            }
        }
    },

    /**
     * Tracks the plot width (points are thinned to fit).
     * @returns {void}
     */
    mounted() {
        const plot = this.$refs.plot as HTMLElement | undefined;

        if (!plot) {
            return;
        }

        this.plotWidth = plot.clientWidth;
        this.resizeObserver = new ResizeObserver(() => {
            this.plotWidth = plot.clientWidth;
        });
        this.resizeObserver.observe(plot);
    },

    /**
     * Stops observers and tweens.
     * @returns {void}
     */
    beforeUnmount() {
        this.resizeObserver?.disconnect();
        this.stopTween?.();
    },

    methods: {
        /**
         * Plot y (0 top, 100 bottom) of a value.
         * @param {number} value The value
         * @returns {number} The y
         */
        toY(value: number): number {
            const pad = Math.min(Math.max(this.verticalPadding, 0), 90);

            return pad + (1 - domainRatio(value, this.domain)) * (100 - pad);
        },

        /**
         * Picks the nearest point to the pointer.
         * @param {PointerEvent} event The pointer event
         * @returns {void}
         */
        onPointerMove(event: PointerEvent) {
            const plot = this.$refs.plot as HTMLElement | undefined;
            const count = this.visibleIndexes.length;

            if (!plot || count === 0) {
                return;
            }

            const rect = plot.getBoundingClientRect();
            const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;

            this.hoveredPos =
                count === 1 ? 0 : Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1))));
        },

        /**
         * Dot position and color.
         * @param {PlotPoint} point The point
         * @param {string} color The CSS color
         * @returns {Record<string, string>} The style
         */
        markStyle(point: PlotPoint, color: string): Record<string, string> {
            return {
                left: `${point.x}%`,
                top: `${point.y}%`,
                transform: "translate(-50%, -50%)",
                backgroundColor: color
            };
        },

        /**
         * Label position above the point.
         * @param {PlotPoint} point The point
         * @param {string} color The CSS color
         * @returns {Record<string, string>} The style
         */
        labelStyle(point: PlotPoint, color: string): Record<string, string> {
            return {
                "--chart-color": color,
                left: `${point.x}%`,
                top: `${point.y}%`,
                transform: "translate(-50%, calc(-100% - 6px))"
            };
        },

        /**
         * `label` slot scope of a point.
         * @param {number} seriesIndex The series index
         * @param {number} pos The visible point position
         * @returns {ChartLabelScope | null} The scope
         */
        pointLabelScope(seriesIndex: number, pos: number): ChartLabelScope | null {
            const categoryIndex = this.visibleIndexes[pos];

            if (categoryIndex === undefined) {
                return null;
            }

            const value = this.model.series[seriesIndex]?.cells[categoryIndex]?.value ?? 0;

            return this.labelScope(
                value,
                categoryIndex,
                seriesIndex,
                this.cellColor(seriesIndex, categoryIndex)
            );
        },

        /**
         * Keeps the first and last axis labels inside the chart.
         * @param {number} pos The visible point position
         * @returns {string} The translate class
         */
        axisLabelClass(pos: number): string {
            if (pos === 0 && this.visibleIndexes.length > 1) {
                return "translate-x-0";
            }

            if (pos === this.visibleIndexes.length - 1 && this.visibleIndexes.length > 1) {
                return "-translate-x-full";
            }

            return "-translate-x-1/2";
        }
    }
});
</script>

<style scoped>
/* Draws the lines left to right by growing their clip. */
.wave-reveal {
    transform-box: fill-box;
    transform-origin: left center;
    transform: scaleX(0);
}

.wave-reveal.is-drawn {
    animation: wave-draw 900ms ease-in-out both;
}

.wave-reveal.is-static {
    transform: none;
}

/* Area and marks fade in once the line is drawn. */
.wave-fade {
    opacity: 0;
}

.wave-fade.is-drawn {
    animation: wave-fade 450ms ease-out 650ms both;
}

.wave-fade--late.is-drawn {
    animation-delay: 850ms;
}

.wave-fade.is-static {
    opacity: 1;
}

@keyframes wave-draw {
    from {
        transform: scaleX(0);
    }

    to {
        transform: scaleX(1);
    }
}

@keyframes wave-fade {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}
</style>
