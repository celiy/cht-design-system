<template>
    <div class="navigator-background w-full border-b shadow-sm reveal-highlight">
        <slot />
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "Navigator"
});
</script>
