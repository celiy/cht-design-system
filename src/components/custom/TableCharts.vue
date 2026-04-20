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
                    @update:value="filter = String($event)"
                />
            </div>
        </template>

        <template #description>
            {{ description }}
        </template>

        <template #body>
            <div class="relative my-2">
                <div class="relative min-h-80">
                    <!-- Background -->
                    <div class="absolute inset-0 pointer-events-none">
                        <div class="flex flex-col justify-between w-full h-full">
                            <div 
                                v-for="i in backgroundLinesCount"
                                :key="i"
                                class="separator opacity-50"
                            />
                        </div>
                    </div>

                    <!-- Chart: centro = zero; positivo sobe, negativo desce -->
                    <div
                        v-if="variant === 'bars'"
                        class="relative h-80 transition-all"
                    >
                        <div class="flex h-full items-stretch gap-2 md:gap-4">
                            <div
                                v-for="item in dateGroups"
                                :key="item.dateShort + item.label"
                                class="relative w-full h-full min-h-0 flex flex-col"
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
                            >
                                <div
                                    v-if="hasNegativeValues"
                                    class="flex flex-col flex-1 min-h-0 w-full"
                                >
                                    <div class="flex-1 flex items-end justify-center min-h-0 pb-px">
                                        <div
                                            v-if="item.value > 0"
                                            class="w-full max-w-[90%] bg-chart-3 rounded-t-lg"
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
                                            class="w-full max-w-[90%] bg-destructive rounded-b-lg"
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
                                        class="w-full max-w-[90%] bg-chart-3 rounded-t-lg"
                                        :style="{ height: `${positiveBarPercent(item.value)}%` }"
                                    />
                                </div>

                                <div
                                    class="absolute inset-0 pointer-events-none hidden md:flex justify-center"
                                    :class="hasNegativeValues ? 'items-center' : 'items-end pb-2'"
                                >
                                    <span class="h-fit max-w-full bg-accent border border-border p-1 px-2 rounded-lg text-xs overflow-hidden text-ellipsis whitespace-nowrap mx-2">
                                        <span v-if="data.displayAs === 'currency'">R$ </span>{{ item.value }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Wave chart: usa os mesmos dados com linha contínua -->
                    <div
                        v-else
                        ref="waveContainer"
                        class="relative h-80 transition-all"
                    >
                        <svg
                            class="absolute inset-0 w-full h-full"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                        >
                            <path
                                v-if="wavePath"
                                :d="wavePath"
                                fill="none"
                                stroke="var(--color-chart-3)"
                                stroke-width="1.5"
                                vector-effect="non-scaling-stroke"
                                stroke-linejoin="round"
                                stroke-linecap="round"
                            />
                        </svg>

                        <div
                            v-for="point in wavePoints"
                            :key="`wave-point-${point.index}`"
                            class="absolute top-0 bottom-0 w-6 -translate-x-1/2 hover:bg-accent/50"
                            :style="{ left: `${point.x}%` }"
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
                        />
                    </div>
                </div>

                <div class="relative">
                    <div
                        v-if="variant === 'wave'"
                        class="relative h-6 mt-2 text-sm text-muted-foreground"
                    >
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

                    <div
                        v-else
                        class="flex justify-around gap-2 md:gap-4 text-sm"
                    >
                        <div 
                            v-for="item in xAxisItems"
                            :key="`axis-${item.dateShort}-${item.value}`"
                            class="text-muted-foreground mt-2"
                        >
                            {{ item.dateShort }}
                        </div>
                    </div>

                    <div class="text-md font-medium mt-4">
                        {{ periodDescription }}
                    </div>
                </div>
            </div>
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Card from "../Card.vue";
import { monthNamesLong, monthNamesShort } from "@shared/constants/DateStrings";
import Select from "../Select.vue";

export default defineComponent({
    name: "TableCharts",

    components: {
        Card,
        Select
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
            waveContainerWidth: 0,
            waveResizeObserver: null as ResizeObserver | null,
            dateFilters: [
                {
                    label: "3 meses",
                    value: "3m"
                },
                {
                    label: "1 mês",
                    value: "1m"
                },
                {
                    label: "2 semanas",
                    value: "2s"
                },
                {
                    label: "7 dias",
                    value: "7d"
                },
            ],
            filter: "3m"
        };
    },

    watch: {
        variant() {
            this.$nextTick(() => {
                this.setupWaveObserver();
            });
        },
    },

    mounted() {
        this.setupWaveObserver();
    },

    beforeUnmount() {
        this.teardownWaveObserver();
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

            return 100 - normalized * 100;
        },

        buildWavePath(points: Array<{ x: number; y: number }>) {
            const first = points[0];
            if (!first) {
                return "";
            }

            if (points.length === 1) {
                return `M ${first.x} ${first.y}`;
            }

            let d = `M ${first.x} ${first.y}`;

            for (let index = 1; index < points.length; index += 1) {
                const previous = points[index - 1];
                const current = points[index];
                if (!previous || !current) {
                    continue;
                }
                const midX = (previous.x + current.x) / 2;
                const midY = (previous.y + current.y) / 2;

                d += ` Q ${previous.x} ${previous.y} ${midX} ${midY}`;
            }

            const last = points[points.length - 1];
            if (!last) {
                return d;
            }
            d += ` T ${last.x} ${last.y}`;

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

            if (this.variant !== "wave") {
                return;
            }

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
    },

    computed: {
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
            const grouped = new Map<string, number>();

            for (const item of this.data.items) {
                const date = new Date(item.date);
                const key = `${date.getFullYear()}-${date.getMonth()}`;
                const currentValue = grouped.get(key) ?? 0;

                grouped.set(key, currentValue + item.value);
            }

            return [...grouped.entries()]
                .sort((a, b) => {
                    const aParts = a[0].split("-");
                    const bParts = b[0].split("-");
                    const aYear = Number(aParts[0] ?? 0);
                    const aMonth = Number(aParts[1] ?? 0);
                    const bYear = Number(bParts[0] ?? 0);
                    const bMonth = Number(bParts[1] ?? 0);

                    return new Date(aYear, aMonth).getTime() - new Date(bYear, bMonth).getTime();
                })
                .map(([key, value]) => {
                    const parts = key.split("-");
                    const month = Number(parts[1] ?? 0);
                    const monthIndex = Math.min(Math.max(month, 0), 11);

                    return {
                        dateLong: monthNamesLong[monthIndex],
                        dateShort: monthNamesShort[monthIndex],
                        value,
                        label: this.data.label
                    };
                });
        },

        waveRawItems() {
            return [...this.data.items]
                .map((item) => {
                    const date = new Date(item.date);

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

            const lastItem = this.waveRawItems[this.waveRawItems.length - 1];
            if (!lastItem) {
                return [];
            }

            const startDate = this.getWaveFilterStartDate(lastItem.date);

            return this.waveRawItems.filter((item) => item.date.getTime() >= startDate.getTime());
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

        xAxisItems() {
            return this.variant === "wave" ? this.waveItems : this.dateGroups;
        },

        periodDescription() {
            if (this.variant === "wave") {
                const selectedFilter = this.dateFilters.find((option) => option.value === this.filter);
                const periodLabel = selectedFilter?.label ?? "período selecionado";

                return `Mostrando ${this.data.label} em ${this.waveItems.length} pontos (${periodLabel})`;
            }

            return `Mostrando ${this.data.label} nos últimos ${this.dateGroups.length} meses`;
        }
    }
});
</script>