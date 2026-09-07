<template>
    <div class="w-full">
        <div
            class="relative w-full overflow-hidden"

            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
        >
            <div
                class="flex"
                :class="{ 'transition-transform duration-500 ease-in-out': !isSwiping }"
                :style="{ transform: `translateX(calc(-${pos * 100}% + ${swipeOffset}px))` }"
            >
                <div
                    v-for="(_, index) in itemCount"
                    :key="index"

                    class="flex w-full shrink-0 items-center justify-center p-4"

                    @click.self="onOutsideClick"
                >
                    <div class="max-w-full">
                        <slot :name="`item-${index}`" />
                    </div>
                </div>
            </div>

            <button
                v-if="edgeClick && itemCount > 1"

                type="button"
                class="absolute inset-y-0 left-0 z-5 w-[18%] cursor-pointer border-0 bg-transparent p-0"
                aria-label="Item anterior"

                @click.stop="prev"
            />

            <button
                v-if="edgeClick && itemCount > 1"

                type="button"
                class="absolute inset-y-0 right-0 z-5 w-[18%] cursor-pointer border-0 bg-transparent p-0"
                aria-label="Item seguinte"

                @click.stop="next"
            />

            <Button
                v-if="showArrows && itemCount > 1"

                class="absolute top-1/2 left-2 z-10 h-10 w-10 -translate-y-1/2"
                type="button"
                variant="secondary"
                size="medium"
                shape="rounded"
                :hover-effect="false"

                @click="prev"
            >
                <i class="fa-solid fa-arrow-left" />
            </Button>

            <Button
                v-if="showArrows && itemCount > 1"

                class="absolute top-1/2 right-2 z-10 h-10 w-10 -translate-y-1/2"
                type="button"
                variant="secondary"
                size="medium"
                shape="rounded"
                :hover-effect="false"

                @click="next"
            >
                <i class="fa-solid fa-arrow-right" />
            </Button>

            <div
                v-if="stepsViewer === 'simplified' && itemCount > 1"

                class="absolute bottom-6 z-10 flex w-full justify-center"

                @mouseenter="hoverSelector = true"
                @mouseleave="hoverSelector = false"
            >
                <div class="flex w-fit justify-center gap-1.5 rounded bg-black/20 p-1">
                    <div
                        v-for="(_, index) in itemCount"
                        :key="index"

                        class="h-2 cursor-pointer rounded-full transition-all"
                        :class="{
                            'w-2 bg-white/40 hover:bg-white/60': index !== pos && !hoverSelector,
                            'w-4 bg-white/50 hover:bg-white/60': index !== pos && hoverSelector,
                            'w-4 bg-white/60 hover:bg-white/80': index === pos && !hoverSelector,
                            'w-8 bg-white/90 hover:bg-white/80': index === pos && hoverSelector,
                            'h-4': hoverSelector
                        }"

                        @click.stop="goTo(index)"
                    />
                </div>
            </div>
        </div>

        <div
            v-if="stepsViewer === 'advanced' && itemCount > 1"

            class="mt-2 flex justify-center"
        >
            <div
                class="inline-flex items-center rounded border border-input bg-input/30 text-sm text-foreground/90"
            >
                <button
                    type="button"
                    class="cursor-pointer rounded-l px-2.5 py-1.5 hover:bg-input/50"
                    aria-label="Item anterior"

                    @click.stop="prev"
                >
                    <i class="fa-solid fa-chevron-left text-xs" />
                </button>

                <span
                    class="min-w-16 border-x border-input px-2.5 py-1.5 text-center tabular-nums select-none"
                >
                    {{ pos + 1 }} / {{ itemCount }}
                </span>

                <button
                    type="button"
                    class="cursor-pointer rounded-r px-2.5 py-1.5 hover:bg-input/50"
                    aria-label="Item seguinte"

                    @click.stop="next"
                >
                    <i class="fa-solid fa-chevron-right text-xs" />
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "./Button.vue";

export default defineComponent({
    name: "Carousel",

    components: {
        Button
    },

    props: {
        /**
         * 0-based slide shown first (`#item-0` is 0). Clamped to the last slide.
         */
        startIndex: {
            type: Number,
            default: 0
        },

        showArrows: {
            type: Boolean,
            default: true
        },

        /**
         * Left/right 18% of the viewport go to the previous/next slide.
         */
        edgeClick: {
            type: Boolean,
            default: false
        },

        stepsViewer: {
            type: String as PropType<"simplified" | "advanced">,
            default: "simplified"
        }
    },

    emits: ["click:outside"],

    data() {
        return {
            pos: this.startIndex as number,
            hoverSelector: false,
            touchStartX: 0,
            swipeOffset: 0,
            isSwiping: false,
            itemCount: 0
        };
    },

    watch: {
        startIndex(value: number) {
            this.goTo(value);
        }
    },

    mounted() {
        this.refreshItemCount();
    },

    updated() {
        this.refreshItemCount();
    },

    methods: {
        /**
         * Counts `#item-n` slots, including those created with `v-for`.
         */
        refreshItemCount() {
            let index = 0;

            while (this.$slots[`item-${index}`]) {
                index += 1;
            }

            if (this.itemCount !== index) {
                this.itemCount = index;
            }

            if (this.itemCount === 0) {
                this.pos = 0;

                return;
            }

            const last = this.itemCount - 1;
            const start = Math.min(Math.max(this.startIndex, 0), last);

            if (this.pos > last) {
                this.pos = last;
            } else if (this.pos < 0) {
                this.pos = start;
            }
        },

        prev() {
            if (this.itemCount === 0) {
                return;
            }

            this.pos = this.pos > 0 ? this.pos - 1 : this.itemCount - 1;
        },

        next() {
            if (this.itemCount === 0) {
                return;
            }

            this.pos = this.pos < this.itemCount - 1 ? this.pos + 1 : 0;
        },

        goTo(to: number) {
            if (this.itemCount === 0) {
                this.pos = Math.max(to, 0);

                return;
            }

            this.pos = Math.min(Math.max(to, 0), this.itemCount - 1);
        },

        onOutsideClick() {
            this.$emit("click:outside");
        },

        onTouchStart(e: TouchEvent) {
            const touch = e.touches[0];

            if (!touch) {
                return;
            }

            this.touchStartX = touch.clientX;
            this.isSwiping = true;
            this.swipeOffset = 0;
        },

        onTouchMove(e: TouchEvent) {
            const touch = e.touches[0];

            if (!touch) {
                return;
            }

            this.swipeOffset = touch.clientX - this.touchStartX;
        },

        onTouchEnd() {
            this.isSwiping = false;
            const threshold = 100;

            if (this.swipeOffset < -threshold && this.pos < this.itemCount - 1) {
                this.next();
            } else if (this.swipeOffset > threshold && this.pos > 0) {
                this.prev();
            }

            this.swipeOffset = 0;
        }
    }
});
</script>
