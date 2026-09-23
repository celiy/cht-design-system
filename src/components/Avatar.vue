<template>
    <div class="relative inline-flex w-fit shrink-0">
        <Skeleton
            v-if="loading"

            type="avatar"
            :size="size"
        />

        <div
            v-else

            class="overflow-hidden rounded-full"
            :class="{
                'h-8 w-8': size === 'small',
                'h-10 w-10': size === 'medium',
                'h-12 w-12': size === 'large'
            }"
        >
            <Image
                v-if="image"

                class="h-full w-full"
                image-class="h-full w-full object-cover"
                :src="image"
                :draggable="false"
            />

            <svg
                v-else

                class="h-full w-full"
                viewBox="0 0 40 40"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <rect
                    width="40"
                    height="40"
                    fill="var(--color-muted)"
                />

                <circle
                    cx="20"
                    cy="15"
                    r="7.5"
                    fill="var(--color-muted-foreground)"
                />

                <ellipse
                    cx="20"
                    cy="39"
                    rx="14"
                    ry="12"
                    fill="var(--color-muted-foreground)"
                />
            </svg>
        </div>

        <div
            v-if="hasStatus"

            class="absolute bottom-0 rounded-full border-2 border-background"
            :class="{
                'left-5 h-3 w-3': size === 'small',
                'left-7 h-3.5 w-3.5': size === 'medium',
                'left-9 h-4 w-4': size === 'large',

                'bg-green-500': status === 'online',
                'bg-yellow-500': status === 'away',
                'bg-red-500': status === 'do-not-disturb',
                'bg-gray-500': status === 'offline'
            }"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Skeleton from "./Skeleton.vue";
import Image from "./Image.vue";

type AvatarStatus = "online" | "away" | "do-not-disturb" | "offline";

export default defineComponent({
    name: "Avatar",

    components: {
        Skeleton,
        Image
    },

    props: {
        status: {
            type: String as PropType<AvatarStatus>,
            required: false
        },

        image: {
            type: String,
            required: false
        },

        size: {
            type: String as PropType<"small" | "medium" | "large">,
            required: false,
            default: "medium"
        },

        loading: {
            type: Boolean,
            required: false,
            default: false
        }
    },

    emits: ["click"],

    computed: {
        /**
         * Status badge is shown only for known presence values, not while loading.
         */
        hasStatus(): boolean {
            if (this.loading) {
                return false;
            }

            return (
                this.status === "online" ||
                this.status === "away" ||
                this.status === "do-not-disturb" ||
                this.status === "offline"
            );
        }
    }
});
</script>
