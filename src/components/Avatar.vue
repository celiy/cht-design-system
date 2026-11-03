<template>
    <div
        ref="root"

        class="relative inline-flex w-fit shrink-0"
    >
        <Skeleton
            v-if="loading"

            type="avatar"
            :size="size"
        />

        <div
            v-else

            class="relative overflow-hidden rounded-full"
            :class="{
                'h-8 w-8': size === 'small',
                'h-10 w-10': size === 'medium',
                'h-12 w-12': size === 'large'
            }"
            :style="customSizeStyle"
        >
            <Image
                v-if="displayImage"

                class="h-full w-full"
                image-class="h-full w-full object-cover"
                :src="displayImage"
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

        <Badge
            v-if="badge"

            :class="[
                'absolute',
                {
                    '-top-1 -right-2': badge.position === 'top-right',
                    '-right-2 -bottom-1': badge.position === 'bottom-right',
                    '-top-1 -left-2': badge.position === 'top-left',
                    '-bottom-1 -left-2': badge.position === 'bottom-left'
                }
            ]"
            v-bind="badge.attributes"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Skeleton from "./Skeleton.vue";
import Image from "./Image.vue";
import Badge from "./Badge.vue";
import { onFirstAppearance } from "./custom/charts/chartMotion";

type AvatarStatus = "online" | "away" | "do-not-disturb" | "offline";

const PRESET_SIZES = ["small", "medium", "large"];

export default defineComponent({
    name: "Avatar",

    components: {
        Skeleton,
        Image,
        Badge
    },

    props: {
        /**
         * The status of the avatar
         */
        status: {
            type: String as PropType<AvatarStatus>,
            required: false
        },

        /**
         * The badge of the avatar
         */
        badge: {
            type: Object as PropType<{
                attributes: object;
                position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
            }>,
            required: false
        },

        /**
         * The image of the avatar
         */
        image: {
            type: String,
            required: false
        },

        /**
         * The size of the avatar: "small", "medium", "large" or any CSS length (e.g. "20rem")
         */
        size: {
            type: String as PropType<"small" | "medium" | "large" | (string & {})>,
            required: false,
            default: "medium"
        },

        /**
         * Whether the avatar is loading
         */
        loading: {
            type: Boolean,
            required: false,
            default: false
        },

        /**
         * Only sets the image once the avatar enters the viewport
         */
        lazy: {
            type: Boolean,
            required: false,
            default: false
        }
    },

    emits: ["click"],

    data() {
        return {
            isVisible: !this.lazy,
            stopObserving: null as (() => void) | null
        };
    },

    computed: {
        /**
         * The image to render, held back until the avatar is visible when `lazy`
         * @returns {string | undefined} The image source
         */
        displayImage(): string | undefined {
            if (!this.isVisible) {
                return undefined;
            }

            return this.image;
        },

        /**
         * Inline size for custom CSS lengths, since Tailwind cannot generate classes from runtime values
         * @returns {Record<string, string>} The width and height, or an empty object for preset sizes
         */
        customSizeStyle(): Record<string, string> {
            if (PRESET_SIZES.includes(this.size)) {
                return {};
            }

            return { width: this.size, height: this.size };
        },

        /**
         * Checks if the status badge is shown
         * @returns {boolean} True if the status badge is shown
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
    },

    mounted() {
        if (!this.lazy) {
            return;
        }

        this.stopObserving = onFirstAppearance(this.$refs.root as Element, () => {
            this.isVisible = true;
        });
    },

    beforeUnmount() {
        this.stopObserving?.();
    }
});
</script>
