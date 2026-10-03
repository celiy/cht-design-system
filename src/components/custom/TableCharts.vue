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
                :color-end="colorEnd"
                :negative-color="negativeColor"
                :negative-color-end="negativeColorEnd"
                :direction="direction"
                :clickable="clickable"
                :align="align"

                @click:bar="$emit('click:bar', $event)"
            />

            <WaveChart
                v-else

                :data="data"
                :filter="filter"
                :color="color"
                :color-end="colorEnd"
            />
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Card from "../Card.vue";
import Select from "../Select.vue";
import BarChart, {
    type BarChartAlign,
    type BarChartDirection
} from "./charts/BarChart.vue";
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
        /**
         * The variant of the tablecharts
         */
        variant: {
            type: String as PropType<"bars" | "wave">,
            required: true
        },

        /**
         * The header of the tablecharts
         */
        header: {
            type: String,
            required: true
        },

        /**
         * Whether the tablecharts is description
         */
        description: {
            type: String,
            required: true
        },

        /**
         * Whether the tablecharts is data
         */
        data: {
            type: Object as PropType<ChartSeries>,
            required: true
        },

        /**
         * Whether the tablecharts is hide label
         */
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

        /**
         * The color end of the tablecharts
         */
        colorEnd: {
            type: String,
            default: ""
        },

        /**
         * Whether the tablecharts is negative color end
         */
        negativeColorEnd: {
            type: String,
            default: ""
        },

        /**
         * Whether the tablecharts is direction
         */
        direction: {
            type: String as PropType<BarChartDirection>,
            default: "vertical"
        },

        /**
         * Whether the tablecharts is clickable
         */
        clickable: {
            type: Boolean,
            default: false
        },

        /**
         * Vertical BarChart only. Packed bar group: `left` / `center` / `right`.
         */
        align: {
            type: String as PropType<BarChartAlign>,
            default: "center"
        },

        /**
         * The card atributes of the tablecharts
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
         * Checks if the data uses groups
         * @returns {boolean} True if the data uses groups
         */
        usesGroups() {
            return chartUsesGroups(this.data.items);
        }
    }
});
</script>
