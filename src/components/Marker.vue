<template>
    <div
        v-if="separator" 
        :class="{
            'flex items-center': (label || centerIcon) && orientation === 'horizontal',
            'flex flex-col justify-center items-center': centerIcon && orientation === 'vertical'
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

        <span       
            v-else-if="centerIcon"
            :class="[
                `fa-solid ${centerIcon} text-muted-foreground!`,
                {
                    'mx-4': orientation === 'horizontal',
                    'my-4': orientation === 'vertical'
                }
            ]" 
        />

        <div       
            v-if="centerIcon && orientation === 'vertical'"
            class="h-full border-r w-fit': orientation === 'vertical"
        />

        <div       
            v-if="label || centerIcon"
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
            :class="[
                `rounded-full flex items-center justify-center h-6 w-6 text-sm mr-3`,
                {
                    'bg-muted text-foreground': color === 'foreground',
                    'bg-muted text-muted-foreground': color === 'muted'
                }
            ]"
        >
            {{ leftNumber }}
        </div>

        <span 
            class="font-medium"
            :class="{
                'text-foreground': color === 'foreground',
                'text-muted-foreground': color === 'muted'
            }"
        >
            {{ label }}
        </span>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "Marker",

    props: {
        label: {
            type: String,
            required: false
        },

        leftIcon: {
            type: String,
            required: false
        },

        centerIcon: {
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
            type: String as PropType <"foreground" | "muted">,
            default: "muted",
            required: false
        }
    }
});
</script>
