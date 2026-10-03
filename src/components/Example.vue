<template>

</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "Example",

    props: {
        /**
         * The prop type of the example
         */
        propType: {
            type: String as PropType<"normal" | "not-normal">,
            default: "normal",
            required: false
        }
    },

    emits: ["click"],

    data() {
        return {
    
        };
    }, 
    
    computed: {
    
    },

    watch: {

    },

    /**
     * Mounts the component
     * @returns {void}
     */
    mounted() {

    },

    methods: {

    }
});
</script>