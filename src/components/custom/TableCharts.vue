<template>
    <Card>
        <template #header>
            {{ header }}
        </template>

        <template #header-right-side>
            <div v-if="variant === 'wave'" class="flex w-full justify-end">
                <Select
                    class="lg:max-w-1/2"
                    :modelValue="filter"
                    :options="dateFilters"
                    @update:value="filter = String($event) as WaveFilter"
                />
            </div>
        </template>

        <template #description>
            {{ description }}
        </template>

        <template #body>
            <BarChart
                v-if="variant === 'bars'"
                :data="data"
            />

            <WaveChart
                v-else
                :data="data"
                :filter="filter"
            />
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Card from "../Card.vue";
import Select from "../Select.vue";
import BarChart from "./charts/BarChart.vue";
import WaveChart, { type WaveFilter } from "./charts/WaveChart.vue";

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
            type: Object as PropType<{
                label: string;
                color?: string;
                displayAs: "currency" | "sum";
                items: Array<{
                    date: Date;
                    value: number;
                }>;
            }>,
            required: true
        }
    },

    data() {
        return {
            dateFilters: [
                { label: "3 meses", value: "3m" },
                { label: "1 mês", value: "1m" },
                { label: "2 semanas", value: "2s" },
                { label: "7 dias", value: "7d" },
            ],
            filter: "3m" as WaveFilter
        };
    }
});
</script>
