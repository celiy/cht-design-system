<template>
    <Card v-bind="cardAtributes">
        <template #header>
            <h4>{{ header }}</h4>
            <p class="text-muted-foreground!">{{ description }}</p>
        </template>

        <template #headerRightSide>
            <slot name="headerRightSide">
                <div
                    v-if="variant === 'wave' && !usesGroups"

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

                :data="data"
                :hide-label="hideLabel"
                :color="color"
                :negative-color="negativeColor"
                :direction="direction"
            />

            <WaveChart
                v-else

                :data="data"
                :filter="filter"
                :color="color"
            />
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Card from "../Card.vue";
import Select from "../Select.vue";
import BarChart, { type BarChartDirection } from "./charts/BarChart.vue";
import WaveChart, { type WaveFilter } from "./charts/WaveChart.vue";
import { chartUsesGroups, type ChartSeries } from "./charts/groupChartItems";

export default defineComponent({
    name: "TableCharts",

    components: {
        Card,
        Select,
        BarChart,
        WaveChart
    },

    props: {
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

        data: {
            type: Object as PropType<ChartSeries>,
            required: true
        },

        hideLabel: {
            type: Boolean,
            default: false
        },

        /**
         * Theme/Tailwind color token forwarded to BarChart / WaveChart
         * (`chart-3`, `green-500`, `success`, …).
         */
        color: {
            type: String as PropType<string>,
            default: "chart-3"
        },

        /**
         * Negative bar token (BarChart vertical only).
         */
        negativeColor: {
            type: String as PropType<string>,
            default: "chart-5"
        },

        direction: {
            type: String as PropType<BarChartDirection>,
            default: "vertical"
        },

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
        usesGroups() {
            return chartUsesGroups(this.data.items);
        }
    }
});
</script>
