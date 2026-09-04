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

                    class="w-full shrink-0 flex justify-center items-center p-4"

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
                class="absolute inset-y-0 left-0 z-[5] w-[18%] cursor-pointer bg-transparent p-0 border-0"

                aria-label="Item anterior"

                @click.stop="prev"
            />

            <button
                v-if="edgeClick && itemCount > 1"

                type="button"
                class="absolute inset-y-0 right-0 z-[5] w-[18%] cursor-pointer bg-transparent p-0 border-0"

                aria-label="Item seguinte"

                @click.stop="next"
            />

            <Button
                v-if="showArrows && itemCount > 1"

                class="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 z-10"
                type="button"
                variant="outline"
                size="medium"
                shape="rounded"
                :hoverEffect="false"

                @click="prev"
            >
                <i class="fa-solid fa-arrow-left" />
            </Button>

            <Button
                v-if="showArrows && itemCount > 1"

                class="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 z-10"
                type="button"
                variant="outline"
                size="medium"
                shape="rounded"
                :hoverEffect="false"

                @click="next"
            >
                <i class="fa-solid fa-arrow-right" />
            </Button>

            <div
                v-if="stepsViewer === 'simplified' && itemCount > 1"

                class="w-full absolute bottom-6 flex justify-center z-10"

                @mouseenter="hoverSelector = true"
                @mouseleave="hoverSelector = false"
            >
                <div class="flex justify-center gap-1.5 bg-black/20 w-fit p-1 rounded">
                    <div
                        v-for="(_, index) in itemCount"
                        :key="index"

                        class="h-2 rounded-full cursor-pointer transition-all"
                        :class="{
                            'w-2 bg-foreground/40 hover:bg-foreground/60': index !== pos && !hoverSelector,
                            'w-4 bg-foreground/50 hover:bg-foreground/60': index !== pos && hoverSelector,
                            'w-4 bg-foreground/60 hover:bg-foreground/80': index === pos && !hoverSelector,
                            'w-8 bg-foreground/90 hover:bg-foreground/80': index === pos && hoverSelector,
                            'h-4': hoverSelector
                        }"

                        @click="goTo(index)"
                    />
                </div>
            </div>
        </div>

        <div
            v-if="stepsViewer === 'advanced' && itemCount > 1"

            class="flex justify-center mt-2"
        >
            <div class="inline-flex items-center rounded border border-input bg-input/30 text-sm text-foreground/90">
                <button
                    type="button"
                    class="px-2.5 py-1.5 cursor-pointer hover:bg-input/50 rounded-l"

                    aria-label="Item anterior"

                    @click.stop="prev"
                >
                    <i class="fa-solid fa-chevron-left text-xs" />
                </button>

                <span class="px-2.5 py-1.5 border-x border-input min-w-16 text-center tabular-nums select-none">
                    {{ pos + 1 }} / {{ itemCount }}
                </span>

                <button
                    type="button"
                    class="px-2.5 py-1.5 cursor-pointer hover:bg-input/50 rounded-r"

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

    emits: ["click:outside"],

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
    },

    watch: {
        startIndex(value: number) {
            this.goTo(value);
        }
    }
});
</script>
