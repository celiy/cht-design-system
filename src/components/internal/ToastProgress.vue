<template>
    <div :style="{ transform: `scaleX(${progress})` }" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { getToastProgress } from "../../toast/toast";

/**
 * The progress ticks every frame. Reading it in its own component keeps those frames from
 * re-rendering the whole Toast stack, where each update made TransitionGroup clone and
 * measure an item.
 */
export default defineComponent({
    name: "ToastProgress",

    props: {
        toastId: {
            type: Number,
            required: true
        }
    },

    computed: {
        progress(): number {
            return getToastProgress(this.toastId);
        }
    }
});
</script>
