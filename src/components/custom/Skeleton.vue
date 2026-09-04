<template>

</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "CustomSkeleton",

    props: {
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

    mounted() {

    },

    methods: {

    }
});
</script>
