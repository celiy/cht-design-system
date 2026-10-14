<template>
    <div class="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
        <span
            v-for="item in items"
            :key="item.key"

            class="flex items-center gap-1.5"
        >
            <span
                class="size-2.5 shrink-0 rounded-sm"
                :style="{ backgroundColor: item.color }"
            />

            {{ item.label }}
        </span>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { ChartLegendItem } from "../chartBase.ts";

export default defineComponent({
    name: "ChartLegend",

    props: {
        items: {
            type: Array as PropType<ChartLegendItem[]>,
            default: () => []
        }
    }
});
</script>
