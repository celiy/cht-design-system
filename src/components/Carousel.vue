<template>
    <div
        class="w-full"
        :class="{ 'flex flex-col': isVertical }"

        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
    >
        <div
            class="relative w-full overflow-hidden"
            :class="isVertical ? 'min-h-0 flex-1 touch-pan-x' : 'touch-pan-y'"

            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
        >
            <div
                :class="{
                    flex: !isFade,
                    'flex-col': !isFade && isVertical,
                    grid: isFade,
                    'h-full': isVertical
                }"
                :style="trackStyle"
            >
                <div
                    v-for="(_, index) in itemCount"
                    :key="index"

                    class="flex w-full shrink-0 items-center justify-center p-4"
                    :class="{
                        'h-full': isVertical,
                        'col-start-1 row-start-1': isFade,
                        'pointer-events-none opacity-0': isFade && index !== pos
                    }"
                    :style="fadeStyle"
                    :inert="isFade && index !== pos"

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
                class="absolute z-5 cursor-pointer border-0 bg-transparent p-0"
                :class="isVertical ? 'inset-x-0 top-0 h-[18%]' : 'inset-y-0 left-0 w-[18%]'"
                aria-label="Item anterior"

                @click.stop="prev"
            />

            <button
                v-if="edgeClick && itemCount > 1"

                type="button"
                class="absolute z-5 cursor-pointer border-0 bg-transparent p-0"
                :class="isVertical ? 'inset-x-0 bottom-0 h-[18%]' : 'inset-y-0 right-0 w-[18%]'"
                aria-label="Item seguinte"

                @click.stop="next"
            />

            <slot
                v-if="$slots.controls"

                name="controls"
                :prev="prev"
                :next="next"
                :go-to="goTo"
                :index="pos"
                :count="itemCount"
            />

            <template v-else-if="showArrows && itemCount > 1">
                <Button
                    class="absolute z-10 h-10 w-10"
                    :class="
                        isVertical
                            ? 'top-2 left-1/2 -translate-x-1/2'
                            : 'top-1/2 left-2 -translate-y-1/2'
                    "
                    type="button"
                    variant="secondary"
                    size="medium"
                    shape="rounded"
                    aria-label="Item anterior"
                    :hover-effect="false"

                    @click="prev"
                >
                    <i
                        class="fa-solid"
                        :class="isVertical ? 'fa-arrow-up' : 'fa-arrow-left'"
                    />
                </Button>

                <Button
                    class="absolute z-10 h-10 w-10"
                    :class="
                        isVertical
                            ? 'bottom-2 left-1/2 -translate-x-1/2'
                            : 'top-1/2 right-2 -translate-y-1/2'
                    "
                    type="button"
                    variant="secondary"
                    size="medium"
                    shape="rounded"
                    aria-label="Item seguinte"
                    :hover-effect="false"

                    @click="next"
                >
                    <i
                        class="fa-solid"
                        :class="isVertical ? 'fa-arrow-down' : 'fa-arrow-right'"
                    />
                </Button>
            </template>

            <div
                v-if="showSteps && stepsViewer === 'simplified' && itemCount > 1"

                class="absolute z-10 flex"
                :class="{
                    'bottom-6 w-full justify-center': indicatorSide === 'bottom',
                    'top-6 w-full justify-center': indicatorSide === 'top',
                    'inset-y-0 left-6 items-center': indicatorSide === 'left',
                    'inset-y-0 right-6 items-center': indicatorSide === 'right'
                }"

                @mouseenter="hoverSelector = true"
                @mouseleave="hoverSelector = false"
            >
                <div
                    class="flex w-fit justify-center gap-1.5 rounded bg-black/20 p-1"
                    :class="{ 'flex-col': isIndicatorStacked }"
                >
                    <div
                        v-for="(_, index) in itemCount"
                        :key="index"

                        class="cursor-pointer rounded-full transition-all"
                        :class="dotClass(index)"

                        @click.stop="goTo(index)"
                    />
                </div>
            </div>
        </div>

        <div
            v-if="showSteps && stepsViewer === 'advanced' && itemCount > 1"

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
                    class="min-w-16 border-x-input px-2.5 py-1.5 text-center tabular-nums select-none"
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

const AXIS_LOCK_PX = 8;

type IndicatorPosition = "top" | "bottom" | "left" | "right";

const DOT_LENGTH = {
    horizontal: { 2: "w-2", 4: "w-4", 8: "w-8" },
    vertical: { 2: "h-2", 4: "h-4", 8: "h-8" }
} as const;

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

        /**
         * Whether to show arrows
         */
        showArrows: {
            type: Boolean,
            default: true
        },

        /**
         * Left/right 18% of the viewport go to the previous/next slide (top/bottom when vertical).
         */
        edgeClick: {
            type: Boolean,
            default: false
        },

        /**
         * The steps viewer of the carousel
         */
        stepsViewer: {
            type: String as PropType<"simplified" | "advanced">,
            default: "simplified"
        },

        /**
         * Whether to show the steps indicator
         */
        showSteps: {
            type: Boolean,
            default: true
        },

        /**
         * Slide direction. Vertical needs a height on the carousel (e.g. `class="h-80"`).
         */
        orientation: {
            type: String as PropType<"horizontal" | "vertical">,
            default: "horizontal"
        },

        /**
         * Side of the simplified dots. Defaults to `bottom`, or `right` when vertical.
         */
        indicatorPosition: {
            type: String as PropType<IndicatorPosition>,
            required: false
        },

        /**
         * Advances to the next slide every `interval` ms, looping at the end.
         */
        autoplay: {
            type: Boolean,
            default: false
        },

        /**
         * Autoplay delay in ms
         */
        interval: {
            type: Number,
            default: 5000
        },

        /**
         * Pauses autoplay while the pointer is over the carousel.
         */
        pauseOnHover: {
            type: Boolean,
            default: true
        },

        /**
         * How slides change: `slide` moves the track, `fade` cross-fades the opacity.
         */
        transition: {
            type: String as PropType<"slide" | "fade">,
            default: "slide"
        },

        /**
         * Transition length in ms
         */
        transitionDuration: {
            type: Number,
            default: 500
        },

        /**
         * CSS timing function of the transition (e.g. `linear`, `cubic-bezier(...)`)
         */
        transitionEasing: {
            type: String,
            default: "ease-in-out"
        }
    },

    emits: ["click:outside"],

    data() {
        return {
            pos: this.startIndex as number,
            hoverSelector: false,
            isHovered: false,
            touchStartX: 0,
            touchStartY: 0,
            swipeAxis: null as "x" | "y" | null,
            swipeOffset: 0,
            isSwiping: false,
            itemCount: 0,
            autoplayTimer: null as number | null
        };
    },

    computed: {
        isVertical(): boolean {
            return this.orientation === "vertical";
        },

        isFade(): boolean {
            return this.transition === "fade";
        },

        indicatorSide(): IndicatorPosition {
            return this.indicatorPosition ?? (this.isVertical ? "right" : "bottom");
        },

        isIndicatorStacked(): boolean {
            return this.indicatorSide === "left" || this.indicatorSide === "right";
        },

        /**
         * Moves the track along the main axis. Fade keeps it still.
         * @returns {Record<string, string>} The track style
         */
        trackStyle(): Record<string, string> {
            if (this.isFade) {
                return {};
            }

            const axis = this.isVertical ? "Y" : "X";

            return {
                transform: `translate${axis}(calc(-${this.pos * 100}% + ${this.swipeOffset}px))`,
                transition: this.isSwiping
                    ? "none"
                    : `transform ${this.transitionDuration}ms ${this.transitionEasing}`
            };
        },

        fadeStyle(): Record<string, string> | undefined {
            if (!this.isFade) {
                return undefined;
            }

            return { transition: `opacity ${this.transitionDuration}ms ${this.transitionEasing}` };
        },

        isAutoplayRunning(): boolean {
            return this.autoplay && this.itemCount > 1 && !(this.pauseOnHover && this.isHovered);
        }
    },

    watch: {
        /**
         * Start index
         * @param {number} value The value
         * @returns {void}
         */
        startIndex(value: number) {
            this.goTo(value);
        },

        // Restarting on every slide change gives a manual jump the full interval too.
        pos() {
            this.scheduleAutoplay();
        },

        isAutoplayRunning() {
            this.scheduleAutoplay();
        },

        interval() {
            this.scheduleAutoplay();
        }
    },

    /**
     * Mounts the component
     * @returns {void}
     */
    mounted() {
        this.refreshItemCount();
    },

    /**
     * Updates the component
     * @returns {void}
     */
    updated() {
        this.refreshItemCount();
    },

    beforeUnmount() {
        this.clearAutoplay();
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

        clearAutoplay() {
            if (this.autoplayTimer == null) {
                return;
            }

            window.clearTimeout(this.autoplayTimer);
            this.autoplayTimer = null;
        },

        scheduleAutoplay() {
            this.clearAutoplay();

            if (!this.isAutoplayRunning) {
                return;
            }

            this.autoplayTimer = window.setTimeout(() => {
                this.autoplayTimer = null;
                this.next();
            }, this.interval);
        },

        /**
         * Size and color of one simplified dot; it grows along the indicator's axis.
         * @param {number} index The dot index
         * @returns {string[]} The dot classes
         */
        dotClass(index: number): string[] {
            const active = index === this.pos;
            const hover = this.hoverSelector;
            const lengths = DOT_LENGTH[this.isIndicatorStacked ? "vertical" : "horizontal"];
            const length = active ? (hover ? 8 : 4) : hover ? 4 : 2;
            let thickness = hover ? "h-4" : "h-2";

            if (this.isIndicatorStacked) {
                thickness = hover ? "w-4" : "w-2";
            }

            let color = hover ? "bg-white/50 hover:bg-white/60" : "bg-white/40 hover:bg-white/60";

            if (active) {
                color = hover ? "bg-white/90 hover:bg-white/80" : "bg-white/60 hover:bg-white/80";
            }

            return [lengths[length], thickness, color];
        },

        /**
         * Goes to the previous item
         * @returns {void}
         */
        prev() {
            if (this.itemCount === 0) {
                return;
            }

            this.pos = this.pos > 0 ? this.pos - 1 : this.itemCount - 1;
        },

        /**
         * Goes to the next item
         * @returns {void}
         */
        next() {
            if (this.itemCount === 0) {
                return;
            }

            this.pos = this.pos < this.itemCount - 1 ? this.pos + 1 : 0;
        },

        /**
         * Goes to the item at the given index
         * @param {number} to The index to go to
         * @returns {void}
         */
        goTo(to: number) {
            if (this.itemCount === 0) {
                this.pos = Math.max(to, 0);

                return;
            }

            this.pos = Math.min(Math.max(to, 0), this.itemCount - 1);
        },

        /**
         * Handles the outside click
         * @returns {void}
         */
        onOutsideClick() {
            this.$emit("click:outside");
        },

        /**
         * Handles the touch start
         * @param {TouchEvent} e The event
         * @returns {void}
         */
        onTouchStart(e: TouchEvent) {
            const touch = e.touches[0];

            if (!touch) {
                return;
            }

            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.swipeAxis = null;
            this.isSwiping = false;
            this.swipeOffset = 0;
        },

        /**
         * Handles the touch move
         * @param {TouchEvent} e The event
         * @returns {void}
         */
        onTouchMove(e: TouchEvent) {
            const touch = e.touches[0];

            if (!touch) {
                return;
            }

            const dx = touch.clientX - this.touchStartX;
            const dy = touch.clientY - this.touchStartY;
            const mainAxis = this.isVertical ? "y" : "x";

            // Decide once per gesture: only a drag along the carousel axis moves it.
            if (this.swipeAxis === null) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_LOCK_PX) {
                    return;
                }

                this.swipeAxis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
                this.isSwiping = this.swipeAxis === mainAxis;
            }

            if (this.swipeAxis === mainAxis) {
                this.swipeOffset = mainAxis === "y" ? dy : dx;
            }
        },

        /**
         * Handles the touch end
         * @returns {void}
         */
        onTouchEnd() {
            this.isSwiping = false;
            this.swipeAxis = null;
            const threshold = 50;

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
