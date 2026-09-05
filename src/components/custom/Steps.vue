<template>
    <div class="flex flex-col">
        <div
            v-for="(_, index) in stepsCount"
            :key="index"

            class="flex flex-col"
        >
            <Marker
                color="foreground"

                :left-number="index + 1"
            >
                <template #label>
                    <slot :name="`step-title-${index}`" />
                </template>
            </Marker>

            <div
                v-if="$slots[`step-${index}`]"
                class="flex"
            >
                <Marker class="ml-3 mr-6 mb-2 mt-2" separator orientation="vertical"/>
                
                <div class="mb-4 mt-2">
                    <slot :name="`step-${index}`" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Marker from "../Marker.vue";

export default defineComponent({
    name: "Steps",

    components: {
        Marker
    },

    data() {
        return {
            stepsCount: 0
        };
    },

    mounted() {
        this.refreshStepsCount();
    },

    updated() {
        this.refreshStepsCount();
    },

    methods: {
        /**
         * Counts `#step-n` / `#step-title-n` slots, including those created with `v-for`.
         */
        refreshStepsCount() {
            let index = 0;

            while (this.$slots[`step-${index}`] || this.$slots[`step-title-${index}`]) {
                index += 1;
            }

            if (this.stepsCount !== index) {
                this.stepsCount = index;
            }
        }
    }
});
</script>
