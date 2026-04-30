<template>
    <div class="bg-card border border-border rounded-lg w-full shadow-md">
        <template v-if="$slots.header">
            <div 
                class="grid"
                :class="$slots.headerRightSide ? 'grid-cols-2' : ''"
            >
                <div>
                    <div class="pt-4 px-4 text-card-foreground text-lg font-semibold">
                        <slot name="header" />
                    </div>

                    <template v-if="$slots.description">
                        <div class="px-4 text-muted-foreground leading-5">
                            <slot name="description" />
                        </div>
                    </template>
                </div>
            
                <div 
                    v-if="$slots.headerRightSide"
                    class="pt-4 px-4"
                >
                    <slot name="headerRightSide"/>
                </div>
            </div>
        </template>

        <template v-if="$slots.body">
            <div 
                class="px-4 pb-4 text-card-foreground leading-5"

                :class="{
                    'pt-4': $slots.description || !$slots.header,
                    'pt-2': !$slots.description || !$slots.header
                }"
            >
                <slot name="body" />
            </div>
        </template>

        <template v-if="$slots.footer">
            <div class="p-4 bg-muted/50 border-t border-border text-card-foreground">
                <slot name="footer" />
            </div>
        </template>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: 'Card',
});
</script>