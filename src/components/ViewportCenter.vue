<template>
    <Teleport to="body">
        <div
            class="fixed z-50 flex flex-col items-center gap-3 pointer-events-none"

            :style="centerStyle"
        >
            <slot />
        </div>
    </Teleport>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "ViewportCenter",

    computed: {
        centerStyle(): Record<string, string> {
            const width = this.$project.device.viewportWidth;
            const height = this.$project.device.viewportHeight;

            return {
                left: `${width / 2}px`,
                top: `${height / 2}px`,
                transform: "translate(-50%, -50%)"
            };
        }
    }
});
</script>
