<template>
    <div
        v-if="separator" 
        :class="{
            'flex items-center': label
        }"
    >
        <div       
            :class="{
                'w-full border-t': orientation === 'horizontal',
                'h-full border-r w-fit': orientation === 'vertical'
            }"
        />

        <small v-if="label" class="px-4 text-muted-foreground!">
            {{ label }}
        </small>

        <div       
            v-if="label"
            :class="{
                'w-full border-t': orientation === 'horizontal'
            }"
        />
    </div>

    <div v-else class="flex items-center">
        <span 
            v-if="leftIcon" 
            :class="`fa-solid ${leftIcon} text-muted-foreground! mr-3`" 
        />
        
        <div
            v-if="leftNumber" 
            :class="`bg-muted-foreground rounded-full flex items-center justify-center h-6 w-6 text-background text-sm mr-3`"
        >
            {{ leftNumber }}
        </div>

        <span class="text-muted-foreground!">
            {{ label }}
        </span>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "Marker",

    emits: ["click"],

    props: {
        label: {
            type: String,
            required: false
        },

        leftIcon: {
            type: String,
            required: false
        },

        leftNumber: {
            type: Number,
            required: false
        },

        separator: {
            type: Boolean,
            required: false
        },

        orientation: {
            type: String as PropType <"horizontal" | "vertical">,
            default: "horizontal",
            required: false
        },

        color: {
            type: String,
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
        borderColor() {
            if (this.color) {
                return "border-" + this.color + "!";
            }
        }
    }
});
</script>
