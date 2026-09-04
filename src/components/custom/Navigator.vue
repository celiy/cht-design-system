<template>
    <div class="w-full border-b bg-background">
        <!-- Left side -->
        <div class="flex flex-row gap-2 py-4 px-6">
            <!-- Links -->
            <div v-for="link in links" :key="link.path">
                <Button
                    variant="transparent"
                    :label="link.label"
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

    name: "Navigator",
    components: {
        Button
    },

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
            if (this.$router) {
                this.$router.push(path);

                return;
            }

            window.location.assign(path);
        }
    }
});
</script>