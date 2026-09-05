<template>
    <div 
        class="border border-border/50! rounded w-full shadow-md"
        :class="{
            'bg-card': variant === 'default',
            'bg-transparent': variant === 'transparent'
        }"
    >
        <!-- Header -->
        <template v-if="$slots.header">
            <div 
                class="grid"
                :class="$slots.headerRightSide ? 'grid-cols-2' : ''"
            >
                <!-- Header left side -->
                <div class="px-4 pt-3">
                    <slot name="header" />
                </div>
            
                <!-- Header right side -->
                <div 
                    v-if="$slots.headerRightSide"
                    class="pt-4 px-4"
                >
                    <slot name="headerRightSide"/>
                </div>
            </div>
        </template>

        <!-- Card -->
        <template v-if="$slots.card">
            <slot name="card" />
        </template>

        <!-- Body -->
        <template v-if="$slots.body">
            <div 
                class="px-4 pb-4"

                :class="{
                    'pt-4': $slots.description || !$slots.header,
                    'pt-2': !$slots.description || !$slots.header
                }"
            >
                <slot name="body" />
            </div>
        </template>

        <!-- Footer -->
        <template v-if="$slots.footer">
            <div class="p-4 bg-muted/50 border-t rounded-b">
                <slot name="footer" />
            </div>
        </template>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: 'Card',

    props: {
        variant: {
            type: String as PropType<"default" | "transparent">,
            default: "default",
            required: false
        }
    }
});
</script>
