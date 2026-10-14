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
                v-bind="$attrs"

                :data="data"
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
                v-bind="$attrs"

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
