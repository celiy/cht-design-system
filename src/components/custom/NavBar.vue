<template>
    <div class="navigator-background reveal-highlight relative w-full border-b shadow-sm">
        <slot />

        <div
            v-if="variant === 'simplified'"

            class="absolute bottom-0 left-0 grid h-px w-full translate-y-px grid-cols-[1fr_8fr_1fr]"
        >
            <div class="bg-linear-to-l from-transparent to-background" />

            <div />

            <div class="bg-linear-to-r from-transparent to-background" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "NavBar",

    props: {
        variant: {
            type: String as PropType<"default" | "simplified">,
            default: "default",
            required: false
        }
    }
});
</script>
