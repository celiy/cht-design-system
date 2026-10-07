<template>
    <div
        ref="triggerRef"

        @pointerenter="onPointerEnter"
        @pointermove="onPointerMove"
        @pointerleave="onPointerLeave"
        @mouseleave="hideUnlessCaptured"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @click="$emit('click', $event)"
    >
        <slot />

        <Teleport to="body">
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
        </Teleport>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { followTooltipPosition, TOOLTIP_DEFAULT_OFFSET } from "../internal/tooltipFollow";

const DEFAULT_SHOW_DELAY = 40;
const DEFAULT_FOLLOW_MS = 60;

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
            capturedPointerId: null as number | null,
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
                transition: this.skipFollow ? "none" : `transform ${follow}ms linear`
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
         * Hides the tooltip unless captured
         * @returns {void}
         */
        hideUnlessCaptured() {
            if (this.capturedPointerId != null) {
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

            const trigger = event.currentTarget as HTMLElement | null;

            trigger?.setPointerCapture(event.pointerId);
            this.capturedPointerId = event.pointerId;
            this.beginShow(event);
        },

        /**
         * Handles the pointer up event
         * @param {PointerEvent} event The event
         * @returns {void}
         */
        onPointerUp(event: PointerEvent) {
            if (this.capturedPointerId == null) {
                return;
            }

            const trigger = event.currentTarget as HTMLElement | null;

            if (trigger?.hasPointerCapture(event.pointerId)) {
                trigger.releasePointerCapture(event.pointerId);
            }

            this.capturedPointerId = null;
            this.hide();
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

            if (this.isPointerOverTrigger()) {
                if (this.visible) {
                    this.scheduleFollow();
                }

                return;
            }

            this.hide();
        },

        /**
         * Checks if the pointer is over the trigger
         * @returns {boolean} True if the pointer is over the trigger
         */
        isPointerOverTrigger() {
            const trigger = this.$refs.triggerRef as HTMLElement | undefined;

            if (!trigger) {
                return false;
            }

            const rect = trigger.getBoundingClientRect();

            return (
                this.pointerX >= rect.left &&
                this.pointerX <= rect.right &&
                this.pointerY >= rect.top &&
                this.pointerY <= rect.bottom
            );
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

            if (this.capturedPointerId == null) {
                return;
            }

            const trigger = this.$refs.triggerRef as HTMLElement | undefined;

            if (trigger?.hasPointerCapture(this.capturedPointerId)) {
                trigger.releasePointerCapture(this.capturedPointerId);
            }

            this.capturedPointerId = null;
        }
    }
});
</script>
