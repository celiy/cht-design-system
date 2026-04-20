<template>

</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "Example",

    emits: ["click"],

    props: {
        propType: {
            type: String as PropType<"normal" | "not-normal">,
            default: "normal",
            required: false
        }
    },

    data() {
        return {
    
        };
    },

    mounted() {

    },

    watch: {

    },

    methods: {

    }, 
    
    computed: {
    
    }
});
</script>