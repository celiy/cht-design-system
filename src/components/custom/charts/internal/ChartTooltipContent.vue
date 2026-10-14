<template>
    <div class="flex min-w-32 flex-col gap-1">
        <span class="font-semibold text-foreground">{{ title }}</span>

        <div
            v-for="row in rows"
            :key="row.key"

            class="flex items-center gap-2"
        >
            <span
                class="size-2 shrink-0 rounded-full"
                :style="{ backgroundColor: row.color }"
            />

            <span class="text-muted-foreground">{{ row.label }}</span>

            <span class="ml-auto pl-3 font-medium text-foreground tabular-nums">
                {{ row.value }}
            </span>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { ChartTooltipRow } from "../chartBase.ts";

export default defineComponent({
    name: "ChartTooltipContent",

    props: {
        /**
         * Category shown on top (date or group).
         */
        title: {
            type: String,
            default: ""
        },

        rows: {
            type: Array as PropType<ChartTooltipRow[]>,
            default: () => []
        }
    }
});
</script>
