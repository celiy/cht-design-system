<template>
    <div class="w-full border-b bg-background shadow-sm">
        <slot />
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "Navigator"
});
</script>
