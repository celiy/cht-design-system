<template>
    <Card v-bind="cardAtributes">
        <template #header>
            <h4>{{ header }}</h4>
            <p class="text-muted-foreground!">{{ description }}</p>
        </template>

        <template #headerRightSide>
            <slot name="headerRightSide">
                <div
                    v-if="showDateFilter"

                    class="flex w-full justify-end"
                >
                    <Select
                        class="lg:max-w-1/2"
                        :model-value="filter"
                        :options="dateFilters"

                        @update:value="filter = String($event) as WaveFilter"
                    />
                </div>
            </slot>
        </template>

        <template #body>
            <BarChart
                v-if="variant === 'bars'"

                v-bind="chartProps"
                :data="data"

                @click:bar="$emit('click:bar', $event)"
            >
                <template
                    v-if="$slots.label"
                    #label="scope"
                >
                    <slot
                        name="label"
                        v-bind="scope"
                    />
                </template>
            </BarChart>

            <WaveChart
                v-else

                v-bind="chartProps"
                :data="data"
                :filter="showDateFilter ? filter : 'all'"
            >
                <template
                    v-if="$slots.label"
                    #label="scope"
                >
                    <slot
                        name="label"
                        v-bind="scope"
                    />
                </template>
            </WaveChart>
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Card from "../Card.vue";
import Select from "../Select.vue";
import BarChart from "./charts/BarChart.vue";
import WaveChart, { type WaveFilter } from "./charts/WaveChart.vue";
import { chartUsesGroups, type ChartData } from "./charts/chartModel.ts";

/**
 * Card with a header around `BarChart` or `WaveChart`. Every other prop, event and the
 * `label` slot go straight to the chart.
 */
export default defineComponent({
    name: "TableCharts",

    components: {
        Card,
        Select,
        BarChart,
        WaveChart
    },

    inheritAttrs: false,

    props: {
        /**
         * Chart props, forwarded as they are. Unset ones keep the chart's own default.
         */
        color: { type: String, required: false },
        stack: { type: String, required: false },
        legend: { type: Boolean, default: false },
        showLabels: { type: Boolean, default: false },
        labelClass: { type: String, required: false },
        animated: { type: Boolean, default: true },
        bucket: { type: String, required: false },
        hideAxisLabels: { type: Boolean, default: false },
        backgroundLinesCount: { type: Number, required: false },
        clickable: { type: Boolean, default: false },
        direction: { type: String, required: false },
        colorEnd: { type: String, required: false },
        negativeColor: { type: String, required: false },
        negativeColorEnd: { type: String, required: false },
        barSize: { type: Number, required: false },
        barGap: { type: Number, required: false },
        groupGap: { type: Number, required: false },
        align: { type: String, required: false },
        type: { type: String, required: false },
        waveStyle: { type: String, required: false },
        dots: { type: Boolean, default: false },
        verticalPadding: { type: Number, required: false },

        /**
         * Which chart is drawn.
         */
        variant: {
            type: String as PropType<"bars" | "wave">,
            required: true
        },

        header: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        /**
         * One series or several (`ChartSeries | ChartSeries[]`).
         */
        data: {
            type: [Object, Array] as PropType<ChartData>,
            required: true
        },

        /**
         * Props forwarded to the `Card`.
         */
        cardAtributes: {
            type: Object,
            required: false
        }
    },

    emits: ["click:bar"],

    data() {
        return {
            dateFilters: [
                { label: "3 meses", value: "3m" },
                { label: "1 mês", value: "1m" },
                { label: "2 semanas", value: "2s" },
                { label: "7 dias", value: "7d" }
            ],
            filter: "3m" as WaveFilter
        };
    },

    computed: {
        /**
         * Chart props forwarded to the active chart (everything except the card's own).
         * @returns {Record<string, unknown>} The chart props
         */
        chartProps(): Record<string, unknown> {
            const own = ["variant", "header", "description", "cardAtributes", "data", "filter"];

            return Object.fromEntries(
                Object.entries(this.$props).filter(([key]) => !own.includes(key))
            );
        },

        /**
         * Whether the data is on a category axis (no date filter then).
         * @returns {boolean} True for grouped data
         */
        usesGroups(): boolean {
            return chartUsesGroups(this.data);
        },

        /**
         * The period filter only makes sense for daily wave points.
         * @returns {boolean} True when the filter is shown
         */
        showDateFilter(): boolean {
            return this.variant === "wave" && !this.usesGroups && this.$attrs.bucket !== "month";
        }
    }
});
</script>
