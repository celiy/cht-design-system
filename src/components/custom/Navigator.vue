<template>
    <div class="w-full border-b bg-background">
        <!-- Left side -->
        <div class="flex flex-row gap-2 py-4 px-6">
            <!-- Links -->
            <div v-for="link in links" :key="link.path">
                <Button
                    variant="transparent"
                    size="small"
                    :label="link.label"
                    :link="link.path"
                    @click="navigateTo(link.path)"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "../Button.vue";

export default defineComponent({
    components: {
        Button
    },

    name: "Navigator",

    props: {
        links: {
            type: Array as PropType<{
                label: string;
                path: string;
            }[]>,
            required: true
        }
    },

    methods: {
        navigateTo(path: string) {
            this.$router.push(path);
        }
    }
});
</script>