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

            <div class="relative h-80 transition-all">
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
                        class="relative w-full h-full min-h-0 flex flex-col"
                    >
                        <div
                            v-if="hasNegativeValues"
                            class="flex flex-col flex-1 min-h-0 w-full"
                        >
                            <div class="flex-1 flex items-end justify-center min-h-0 pb-px">
                                <div
                                    v-if="item.value > 0"
                                    class="w-full max-w-[90%] rounded-t"
                                    :class="positiveBarClass"
                                    :style="{ height: `${positiveBarPercent(item.value)}%` }"
                                />
                            </div>

                            <div
                                class="h-px w-full shrink-0 bg-border"
                                aria-hidden="true"
                            />

                            <div class="flex-1 flex items-start justify-center min-h-0 pt-px">
                                <div
                                    v-if="item.value < 0"
                                    class="w-full max-w-[90%] bg-chart-5 rounded-b"
                                    :style="{ height: `${negativeBarPercent(item.value)}%` }"
                                />
                            </div>
                        </div>

                        <div
                            v-else
                            class="flex flex-1 min-h-0 w-full items-end justify-center"
                        >
                            <div
                                v-if="item.value > 0"
                                class="w-full max-w-[90%] rounded-t"
                                :class="positiveBarClass"
                                :style="{ height: `${positiveBarPercent(item.value)}%` }"
                            />
                        </div>

                        <div
                            v-if="!hideLabel"
                            class="absolute inset-0 pointer-events-none hidden md:flex justify-center"
                            :class="hasNegativeValues ? 'items-center' : 'items-end pb-2'"
                        >
                            <span class="h-fit max-w-full bg-accent border border-border p-1 px-2 rounded text-xs overflow-hidden text-ellipsis whitespace-nowrap mx-2 text-foreground!">
                                <span v-if="data.displayAs === 'currency'">R$ </span>{{ item.value }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="relative">
            <div class="flex justify-around gap-2 md:gap-4 text-sm">
                <div
                    v-for="item in dateGroups"
                    :key="`axis-${item.dateShort}-${item.value}`"
                    class="text-muted-foreground mt-2"
                >
                    {{ item.dateShort }}
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { chartColorBgClass, type ChartColor } from "./chartColors";
import { chartUsesGroups, groupChartItems, groupChartItemsByDate, type ChartSeries } from "./groupChartItems";

export type BarChartData = ChartSeries;

export default defineComponent({
    name: "BarChart",

    props: {
        data: {
            type: Object as PropType<BarChartData>,
            required: true
        },

        /**
         * Palette token for positive bars (`chart-1` … `chart-5`).
         * Negative bars stay on `chart-5`.
         */
        color: {
            type: String as PropType<ChartColor>,
            default: "chart-3"
        },

        /**
         * If true, the label will not be displayed on top of the bars.
         */
        hideLabel: {
            type: Boolean,
            default: false
        }
    },

    computed: {
        positiveBarClass() {
            return chartColorBgClass(this.color);
        },

        hasNegativeValues() {
            return this.dateGroups.some((group) => group.value < 0);
        },

        backgroundLinesCount() {
            if (this.hasNegativeValues) {
                return 5;
            }

            return 4;
        },

        globalScale() {
            const values = this.dateGroups.map((g) => g.value);

            return values.length ? Math.max(...values.map((v) => Math.abs(v))) : 0;
        },

        dateGroups() {
            if (chartUsesGroups(this.data.items)) {
                return groupChartItems(this.data.items, this.data.label);
            }

            return groupChartItemsByDate(this.data.items, this.data.label);
        }
    },

    methods: {
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
    }
});
</script>
