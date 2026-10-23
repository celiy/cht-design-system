<template>
    <div
        class="flex w-full items-center justify-between rounded text-sm font-medium transition-all"
        :class="[
            {
                'bg-primary/10 text-primary/80 hover:bg-primary/20 hover:text-primary hover:brightness-150':
                    variant === 'primary',
                'bg-transparent text-sidebar-foreground/80 hover:bg-accent hover:text-sidebar-foreground':
                    variant === 'transparent'
            }
        ]"
    >
        <slot name="left-side" />

        <div class="px-4 py-2">
            <slot name="body" />

            <span
                v-if="label || labelIcon"

                class="flex min-w-0 items-center gap-2 transition-all select-none"
            >
                <i
                    v-if="labelIcon"

                    class="fa-solid shrink-0 text-xs"
                    :class="labelIcon"
                />

                <span class="min-w-0 truncate">
                    {{ label }}
                </span>
            </span>
        </div>

        <slot name="right-side" />
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "Chip",

    props: {
        label: {
            type: String,
            required: false
        },

        labelIcon: {
            type: String,
            required: false
        },

        variant: {
            type: String as PropType<"primary" | "transparent">,
            default: "transparent",
            required: false
        }
    }
});
</script>
