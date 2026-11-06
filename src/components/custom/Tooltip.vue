<template>
    <div
        ref="triggerRef"

        @pointerenter="onPointerEnter"
        @pointermove="onPointerMove"
        @pointerleave="onPointerLeave"
        @mouseleave="hideUnlessCaptured"
        @pointerdown="onPointerDown"
        @pointercancel="hide"
        @click="$emit('click', $event)"
    >
        <slot />

        <Teleport to="body">
            <Transition
                :name="`tooltip-${animation}`"
                :css="animation !== 'none'"
                :duration="Math.max(0, animationDuration)"
            >
                <div
                    v-if="visible"
                    ref="tipRef"

                    role="tooltip"
                    class="tooltip-background pointer-events-none fixed top-0 left-0 z-100000 max-w-64 rounded border px-2.5 py-1.5 text-xs leading-snug text-secondary-foreground shadow-md"
                    :class="{ invisible: !ready }"
                    :style="tipStyle"
                >
                    <slot name="tooltip" />
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { followTooltipPosition, TOOLTIP_DEFAULT_OFFSET } from "../internal/tooltipFollow";

const DEFAULT_SHOW_DELAY = 40;
const DEFAULT_FOLLOW_MS = 60;
const DEFAULT_ANIMATION_MS = 150;

export default defineComponent({
    name: "Tooltip",

    props: {
        /**
         * Ms before the tooltip appears. `0` shows on the first pointer event.
         */
        delay: {
            type: Number,
            default: DEFAULT_SHOW_DELAY
        },

        /**
         * CSS follow lag in ms. Short enough to track the pointer, long enough to avoid jitter.
         */
        followMs: {
            type: Number,
            default: DEFAULT_FOLLOW_MS
        },

        /**
         * The offset of the tooltip
         */
        offset: {
            type: Number,
            default: TOOLTIP_DEFAULT_OFFSET
        },

        /**
         * Whether the tooltip is disabled
         */
        disabled: {
            type: Boolean,
            default: false
        },

        /**
         * Show and hide animation. `none` swaps the tooltip in and out without motion.
         */
        animation: {
            type: String as PropType<"none" | "fade" | "scale" | "slide-up" | "slide-down">,
            default: "none"
        },

        /**
         * Show and hide animation length in ms.
         */
        animationDuration: {
            type: Number,
            default: DEFAULT_ANIMATION_MS
        }
    },

    emits: ["click", "pointerenter", "pointerleave"],

    data() {
        return {
            visible: false,
            ready: false,
            skipFollow: true,
            pointerX: 0,
            pointerY: 0,
            tipX: 0,
            tipY: 0,
            showTimer: null as number | null,
            rafId: null as number | null,
            paintRafId: null as number | null,
            touchShown: false,
            showGen: 0,
            watchingDocument: false
        };
    },

    computed: {
        /**
         * Gets the tip style
         * @returns {Object} The tip style
         * @property {string} transform The transform
         * @property {string} transition The transition
         */
        tipStyle() {
            const follow = Math.max(0, this.followMs);

            return {
                transform: `translate3d(${this.tipX}px, ${this.tipY}px, 0)`,
                transition: this.skipFollow ? "none" : `transform ${follow}ms linear`,
                "--tooltip-animation-duration": `${Math.max(0, this.animationDuration)}ms`
            };
        }
    },

    /**
     * Unmounts the component
     * @returns {void}
     */
    beforeUnmount() {
        this.teardown();
    },

    methods: {
        /**
         * Checks if the tooltip has a slot
         * @returns {boolean} True if the tooltip has a slot
         */
        hasTooltipSlot() {
            return Boolean(this.$slots.tooltip);
        },

        /**
         * Handles the pointer enter event
         * @param {PointerEvent} event The event
         * @returns {void}
         */
        onPointerEnter(event: PointerEvent) {
            if (event.pointerType === "mouse") {
                this.touchShown = false;
            }

            this.$emit("pointerenter", event);
            this.beginShow(event);
        },

        /**
         * Handles the pointer move event
         * @param {PointerEvent} event The event
         * @returns {void}
         */
        onPointerMove(event: PointerEvent) {
            this.pointerX = event.clientX;
            this.pointerY = event.clientY;

            if (!this.visible) {
                return;
            }

            this.scheduleFollow();
        },

        /**
         * Handles the pointer leave event
         * @param {PointerEvent} event The event
         * @returns {void}
         */
        onPointerLeave(event: PointerEvent) {
            this.$emit("pointerleave", event);
            this.hideUnlessCaptured();
        },

        /**
         * Hides the tooltip, except when it was opened by touch: there it stays after the
         * finger lifts and only scroll or a touch outside closes it
         * @returns {void}
         */
        hideUnlessCaptured() {
            if (this.touchShown) {
                return;
            }

            this.hide();
        },

        /**
         * Handles the pointer down event
         * @param {PointerEvent} event The event
         * @returns {void}
         */
        onPointerDown(event: PointerEvent) {
            if (event.pointerType === "mouse") {
                return;
            }

            this.touchShown = true;
            this.beginShow(event);
        },

        /**
         * Begins the show
         * @param {PointerEvent} event The event
         * @returns {void}
         */
        beginShow(event: PointerEvent) {
            if (this.disabled || !this.hasTooltipSlot()) {
                return;
            }

            this.pointerX = event.clientX;
            this.pointerY = event.clientY;
            this.clearShowTimer();
            this.bindDocumentWatch();

            const delay = Math.max(0, this.delay);

            if (delay === 0) {
                this.show();

                return;
            }

            this.showTimer = window.setTimeout(() => {
                this.showTimer = null;
                this.show();
            }, delay);
        },

        /**
         * Shows the tooltip
         * @returns {void}
         */
        show() {
            if (this.disabled || !this.hasTooltipSlot()) {
                return;
            }

            const wasVisible = this.visible;
            const gen = this.showGen;

            this.skipFollow = true;
            this.ready = false;
            this.visible = true;
            this.bindDocumentWatch();

            if (!wasVisible) {
                this.bindWindowGuards();
            }

            void this.$nextTick(() => {
                if (gen !== this.showGen || !this.visible) {
                    return;
                }

                this.placeNow();
                this.ready = true;
                this.enableFollowAfterPaint(gen);
            });
        },

        /**
         * Hides the tooltip
         * @returns {void}
         */
        hide() {
            this.touchShown = false;
            this.showGen += 1;
            this.clearShowTimer();
            this.clearRaf();
            this.clearPaintRaf();
            this.unbindDocumentWatch();
            this.unbindWindowGuards();
            this.visible = false;
            this.ready = false;
            this.skipFollow = true;
        },

        /**
         * Enables the follow after paint
         * @param {number} gen The generation
         * @returns {void}
         */
        enableFollowAfterPaint(gen: number) {
            this.clearPaintRaf();
            this.paintRafId = window.requestAnimationFrame(() => {
                this.paintRafId = window.requestAnimationFrame(() => {
                    this.paintRafId = null;

                    if (gen !== this.showGen || !this.visible) {
                        return;
                    }

                    this.skipFollow = false;
                });
            });
        },

        /**
         * Schedules the follow
         * @returns {void}
         */
        scheduleFollow() {
            if (this.rafId != null) {
                return;
            }

            this.rafId = window.requestAnimationFrame(() => {
                this.rafId = null;

                if (!this.visible) {
                    return;
                }

                this.placeNow();
            });
        },

        /**
         * Places the tooltip now
         * @returns {void}
         */
        placeNow() {
            const tip = this.$refs.tipRef as HTMLElement | undefined;
            const rect = tip?.getBoundingClientRect();
            const next = followTooltipPosition(
                this.pointerX,
                this.pointerY,
                rect?.width ?? 0,
                rect?.height ?? 0,
                window.innerWidth,
                window.innerHeight,
                this.offset
            );

            this.tipX = next.x;
            this.tipY = next.y;

            if (this.skipFollow && tip) {
                tip.style.transition = "none";
                tip.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
            }
        },

        /**
         * Handles scroll: keeps the tooltip while the pointer is still over the trigger
         * @returns {void}
         */
        onScroll() {
            if (this.rafId != null) {
                return;
            }

            this.rafId = window.requestAnimationFrame(() => {
                this.rafId = null;

                if (!this.visible) {
                    return;
                }

                if (this.touchShown) {
                    this.hide();

                    return;
                }

                const trigger = this.$refs.triggerRef as HTMLElement | undefined;
                const target = document.elementFromPoint(this.pointerX, this.pointerY);

                if (trigger && target && trigger.contains(target)) {
                    this.placeNow();

                    return;
                }

                this.hide();
            });
        },

        /**
         * Binds the window guards
         * @returns {void}
         */
        bindWindowGuards() {
            window.addEventListener("scroll", this.onScroll, true);
            window.addEventListener("blur", this.hide);
        },

        /**
         * Unbinds the window guards
         * @returns {void}
         */
        unbindWindowGuards() {
            window.removeEventListener("scroll", this.onScroll, true);
            window.removeEventListener("blur", this.hide);
        },

        /**
         * Binds the document watch
         * @returns {void}
         */
        bindDocumentWatch() {
            if (this.watchingDocument) {
                return;
            }

            this.watchingDocument = true;
            document.addEventListener("pointermove", this.onDocumentPointer, true);
            document.addEventListener("pointerdown", this.onDocumentPointer, true);
        },

        /**
         * Unbinds the document watch
         * @returns {void}
         */
        unbindDocumentWatch() {
            if (!this.watchingDocument) {
                return;
            }

            this.watchingDocument = false;
            document.removeEventListener("pointermove", this.onDocumentPointer, true);
            document.removeEventListener("pointerdown", this.onDocumentPointer, true);
        },

        /**
         * Handles the document pointer event
         * @param {PointerEvent} event The event
         * @returns {void}
         */
        onDocumentPointer(event: PointerEvent) {
            this.pointerX = event.clientX;
            this.pointerY = event.clientY;

            if (this.isPointerOverTrigger(event.target)) {
                if (this.visible) {
                    this.scheduleFollow();
                }

                return;
            }

            this.hide();
        },

        /**
         * Checks if the pointer is over the trigger. Uses the event target, not the trigger
         * rect: a child can overflow the wrapper (an inline link taller than its line box),
         * and `pointerenter` fires there, so a rect check would hide the tooltip and cancel
         * the show with no new `pointerenter` to retry it
         * @param {EventTarget | null} target The element under the pointer
         * @returns {boolean} True if the pointer is over the trigger
         */
        isPointerOverTrigger(target: EventTarget | null) {
            const trigger = this.$refs.triggerRef as HTMLElement | undefined;

            return Boolean(trigger && target instanceof Node && trigger.contains(target));
        },

        /**
         * Clears the show timer
         * @returns {void}
         */
        clearShowTimer() {
            if (this.showTimer == null) {
                return;
            }

            window.clearTimeout(this.showTimer);
            this.showTimer = null;
        },

        /**
         * Clears the RAF
         * @returns {void}
         */
        clearRaf() {
            if (this.rafId == null) {
                return;
            }

            window.cancelAnimationFrame(this.rafId);
            this.rafId = null;
        },

        /**
         * Clears the paint RAF
         * @returns {void}
         */
        clearPaintRaf() {
            if (this.paintRafId == null) {
                return;
            }

            window.cancelAnimationFrame(this.paintRafId);
            this.paintRafId = null;
        },

        /**
         * Tears down the tooltip
         * @returns {void}
         */
        teardown() {
            this.hide();
        }
    }
});
</script>

<style scoped>
/*
 * Keyframes animate `opacity`, `scale` and `translate`, never `transform` or `transition`:
 * both are inline styles that place the tip and make it follow the pointer.
 */
.tooltip-fade-enter-active,
.tooltip-scale-enter-active,
.tooltip-slide-up-enter-active,
.tooltip-slide-down-enter-active {
    animation-duration: var(--tooltip-animation-duration);
    animation-timing-function: ease-out;
    animation-fill-mode: both;
}

.tooltip-fade-leave-active,
.tooltip-scale-leave-active,
.tooltip-slide-up-leave-active,
.tooltip-slide-down-leave-active {
    animation-duration: var(--tooltip-animation-duration);
    animation-timing-function: ease-in;
    animation-direction: reverse;
    animation-fill-mode: both;
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
    animation-name: tooltip-fade;
}

.tooltip-scale-enter-active,
.tooltip-scale-leave-active {
    animation-name: tooltip-scale;
}

.tooltip-slide-up-enter-active,
.tooltip-slide-up-leave-active {
    animation-name: tooltip-slide-up;
}

.tooltip-slide-down-enter-active,
.tooltip-slide-down-leave-active {
    animation-name: tooltip-slide-down;
}

@keyframes tooltip-fade {
    from {
        opacity: 0;
    }
}

@keyframes tooltip-scale {
    from {
        opacity: 0;
        scale: 0.9;
    }
}

@keyframes tooltip-slide-up {
    from {
        opacity: 0;
        translate: 0 0.375rem;
    }
}

@keyframes tooltip-slide-down {
    from {
        opacity: 0;
        translate: 0 -0.375rem;
    }
}

@media (prefers-reduced-motion: reduce) {
    .tooltip-scale-enter-active,
    .tooltip-scale-leave-active,
    .tooltip-slide-up-enter-active,
    .tooltip-slide-up-leave-active,
    .tooltip-slide-down-enter-active,
    .tooltip-slide-down-leave-active {
        animation-name: tooltip-fade;
    }
}
</style>
