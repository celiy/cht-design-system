<template>
    <div
        ref="triggerRef"

        @pointerenter="onPointerEnter"
        @pointermove="onPointerMove"
        @pointerleave="onPointerLeave"
        @mouseleave="onPointerLeave"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
    >
        <slot />

        <Teleport to="body">
            <div
                v-if="visible"

                ref="tipRef"
                role="tooltip"

                class="pointer-events-none fixed top-0 left-0 z-100000 max-w-64 rounded border bg-secondary px-2.5 py-1.5 text-xs leading-snug text-secondary-foreground shadow-md"
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
import {
    followTooltipPosition,
    TOOLTIP_DEFAULT_OFFSET
} from "../internal/tooltipFollow";

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

        offset: {
            type: Number,
            default: TOOLTIP_DEFAULT_OFFSET
        },

        disabled: {
            type: Boolean,
            default: false
        }
    },

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
        tipStyle() {
            const follow = Math.max(0, this.followMs);

            return {
                transform: `translate3d(${this.tipX}px, ${this.tipY}px, 0)`,
                transition: this.skipFollow ? "none" : `transform ${follow}ms linear`
            };
        }
    },

    beforeUnmount() {
        this.teardown();
    },

    methods: {
        hasTooltipSlot() {
            return Boolean(this.$slots.tooltip);
        },

        onPointerEnter(event: PointerEvent) {
            this.beginShow(event);
        },

        onPointerMove(event: PointerEvent) {
            this.pointerX = event.clientX;
            this.pointerY = event.clientY;

            if (!this.visible) {
                return;
            }

            this.scheduleFollow();
        },

        onPointerLeave() {
            if (this.capturedPointerId != null) {
                return;
            }

            this.hide();
        },

        onPointerDown(event: PointerEvent) {
            if (event.pointerType === "mouse") {
                return;
            }

            const trigger = event.currentTarget as HTMLElement | null;

            trigger?.setPointerCapture(event.pointerId);
            this.capturedPointerId = event.pointerId;
            this.beginShow(event);
        },

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

        bindWindowGuards() {
            window.addEventListener("scroll", this.hide, true);
            window.addEventListener("blur", this.hide);
        },

        unbindWindowGuards() {
            window.removeEventListener("scroll", this.hide, true);
            window.removeEventListener("blur", this.hide);
        },

        bindDocumentWatch() {
            if (this.watchingDocument) {
                return;
            }

            this.watchingDocument = true;
            document.addEventListener("pointermove", this.onDocumentPointer, true);
            document.addEventListener("pointerdown", this.onDocumentPointer, true);
        },

        unbindDocumentWatch() {
            if (!this.watchingDocument) {
                return;
            }

            this.watchingDocument = false;
            document.removeEventListener("pointermove", this.onDocumentPointer, true);
            document.removeEventListener("pointerdown", this.onDocumentPointer, true);
        },

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

        isPointerOverTrigger() {
            const trigger = this.$refs.triggerRef as HTMLElement | undefined;

            if (!trigger) {
                return false;
            }

            const rect = trigger.getBoundingClientRect();

            return (
                this.pointerX >= rect.left
                && this.pointerX <= rect.right
                && this.pointerY >= rect.top
                && this.pointerY <= rect.bottom
            );
        },

        clearShowTimer() {
            if (this.showTimer == null) {
                return;
            }

            window.clearTimeout(this.showTimer);
            this.showTimer = null;
        },

        clearRaf() {
            if (this.rafId == null) {
                return;
            }

            window.cancelAnimationFrame(this.rafId);
            this.rafId = null;
        },

        clearPaintRaf() {
            if (this.paintRafId == null) {
                return;
            }

            window.cancelAnimationFrame(this.paintRafId);
            this.paintRafId = null;
        },

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
