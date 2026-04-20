<!-- 
Example on how to use this component:

<TabsComponent>
    <template #tab-title-0>
        TAB TITLE 0
    </template>

    <template #tab-content-0>
        CONTENT 0
    </template>

    <template #tab-title-1>
        TAB TITLE 1
    </template>

    <template #tab-content-1>
        CONTENT 1
    </template>
</TabsComponent> 
-->

<template>
    <div class="w-full">
        <div 
            class="flex w-fit overflow-x-auto scrollbar-thin rounded-lg mb-2 px-1"
            :class="{
                'bg-secondary': variant === 'secondary',
                'bg-transparent': variant === 'transparent'
            }"
        >
            <button 
                v-for="(tab, index) in tabCount" 
                :key="index" 

                class="p-3 bg-transparent text-sm leading-1 my-1 rounded-lg hover:text-foreground transition-all border"
                :class="{
                    'text-foreground': index === activeTab,
                    'text-muted-foreground': index !== activeTab,
                    'border-transparent!': index !== activeTab,

                    'border-ring/50!': index === activeTab && variant === 'secondary',

                    'border-b-2 border-t-0 border-x-0 rounded-none!': variant === 'transparent',
                    'border-foreground!': index == activeTab && variant === 'transparent'
                }"
                
                @click="switchTab(index)"
            >
                <slot :name="`tab-title-${index}`" />
            </button>
        </div>
        
        <div class="rounded-b-lg text-foreground">
            <slot :name="`tab-content-${activeTab}`" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "Tabs",

    props: {
        variant: {
            type: String as PropType<"secondary" | "transparent">,
            default: "secondary",
            required: false
        }
    },
    
    data() {
        return {
            activeTab: 0,
            tabCount: 0,
        };
    },

    mounted() {
        let index = 0;

        // Count how many tab slots exist
        while (this.$slots[`tab-title-${index}`]) {
            index++;
        }
        
        this.tabCount = index;
    },

    methods: {
        switchTab(tab: number) {
            this.activeTab = tab;
        }
    }
});
</script>