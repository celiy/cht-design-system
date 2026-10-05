<template>
    <Teleport to="body">
        <div
            class="pointer-events-none fixed inset-0 z-[200000] flex p-4"
            :class="positionClass"
        >
            <div
                data-cht-toast
                class="toast-stack pointer-events-auto relative flex flex-col"
                :class="stackAlignClass"
                :style="stackBoxStyle"

                @mouseenter="onStackEnter"
                @mouseleave="onStackLeave"
            >
                <TransitionGroup
                    name="toast-item"
                    tag="div"
                    class="contents"
                >
                    <div
                        v-for="(item, index) in visibleItems"
                        :key="item.id"
                        :ref="(el) => bindPanel(item.id, el)"

                        class="toast-item-panel w-full touch-pan-y"
                        :class="stackItemClass"
                        :style="itemWrapperStyle(index, item.id)"

                        @mouseenter="onToastEnter(item.id)"
                        @mouseleave="onToastLeave(item.id)"
                        @touchstart="onTouchStart($event, item.id)"
                        @touchmove="onTouchMove($event, item.id)"
                        @touchend="onTouchEnd(item.id)"
                        @touchcancel="onTouchCancel"
                    >
                        <div
                            class="popover-background relative w-full overflow-hidden rounded border shadow-sm"
                            :class="variantClass(item.type)"
                        >
                            <div
                                class="relative flex items-center gap-2 px-3 py-2 text-xs font-medium"
                            >
                                <i
                                    class="fa-solid shrink-0 text-sm"
                                    :class="iconClass(item.type)"
                                />

                                <span class="wrap-break-words min-w-0 flex-1">
                                    {{ item.message }}
                                </span>

                                <Button
                                    v-if="item.closeButton"

                                    class="shrink-0"
                                    size="small"
                                    :label="item.closeButton"
                                    :hover-effect="false"

                                    @click.stop="closeItem(item.id)"
                                />
                            </div>

                            <div
                                v-if="item.timeoutMs"

                                class="h-0.5 w-full bg-border/40"
                            >
                                <div
                                    class="h-full origin-left"
                                    :class="progressBarClass(item.type)"
                                    :style="{ width: `${toastProgress(item.id) * 100}%` }"
                                />
                            </div>
                        </div>
                    </div>
                </TransitionGroup>
            </div>
        </div>
    </Teleport>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "./Button.vue";
import { toast, useToastItems, getToastProgress, type ToastType } from "../toast/toast";

export type ToastPosition =
    "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

const MAX_VISIBLE = 4;
const STACK_OFFSET_PX = 10;
const STACK_GAP_PX = 8;
const SWIPE_DISMISS_PX = 72;
const FALLBACK_TOAST_HEIGHT = 40;

export default defineComponent({
    name: "Toast",

    components: {
        Button
    },

    props: {
        /**
         * The position of the toast
         */
        position: {
            type: String as PropType<ToastPosition>,
            default: "bottom",
            required: false
        },

        /**
         * The width of the toast
         */
        width: {
            type: String,
            default: "20rem",
            required: false
        }
    },

    data() {
        return {
            stackHovered: false,
            hoveredToastId: null as number | null,
            swipeId: null as number | null,
            swipeDx: 0,
            swipeStartX: 0,
            swipeStartY: 0,
            swipeLocked: false,
            itemHeights: {} as Record<number, number>,
            resizeObservers: new Map() as Map<number, ResizeObserver>,
            panelEls: new Map() as Map<number, HTMLElement>
        };
    },

    computed: {
        /**
         * Gets the items
         * @returns {unknown} The items
         */
        items() {
            return useToastItems();
        },

        /**
         * Gets the visible items
         * @returns {unknown} The visible items
         */
        visibleItems() {
            return this.items.slice(-MAX_VISIBLE);
        },

        /**
         * Checks if top anchored
         * @returns {boolean} True if is top anchored
         */
        isTopAnchored() {
            return (
                this.position === "top" ||
                this.position === "top-left" ||
                this.position === "top-right"
            );
        },

        /**
         * Gets the stack align
         * @returns {unknown} The stack align
         */
        stackAlign() {
            if (this.position === "top" || this.position === "bottom") {
                return "center" as const;
            }

            if (
                this.position === "right" ||
                this.position === "top-right" ||
                this.position === "bottom-right"
            ) {
                return "end" as const;
            }

            return "start" as const;
        },

        /**
         * Gets the stack align class
         * @returns {unknown} The stack align class
         */
        stackAlignClass() {
            return {
                "items-start": this.stackAlign === "start",
                "items-center": this.stackAlign === "center",
                "items-end": this.stackAlign === "end"
            };
        },

        /**
         * Gets the stack box style
         * @returns {unknown} The stack box style
         */
        stackBoxStyle() {
            const items = this.visibleItems;
            const leaveX = this.stackAlign === "start" ? "-4.5rem" : "4.5rem";
            const enterY = this.isTopAnchored ? "-12px" : "12px";

            if (items.length === 0) {
                return {
                    "--toast-leave-x": leaveX,
                    "--toast-enter-y": enterY,
                    width: this.width,
                    height: "0px"
                };
            }

            let height = 0;

            if (this.stackHovered) {
                for (const item of items) {
                    height += this.heightOf(item.id);
                }

                height += STACK_GAP_PX * (items.length - 1);
            } else {
                const newest = items[items.length - 1];
                const frontHeight =
                    newest === undefined ? FALLBACK_TOAST_HEIGHT : this.heightOf(newest.id);

                height = frontHeight + STACK_OFFSET_PX * (items.length - 1);
            }

            return {
                "--toast-leave-x": leaveX,
                "--toast-enter-y": enterY,
                width: this.width,
                height: `${height}px`
            };
        },

        /**
         * Gets the position class
         * @returns {unknown} The position class
         */
        positionClass() {
            const classes: Record<ToastPosition, string> = {
                top: "flex-col items-center justify-start",
                bottom: "flex-col items-center justify-end",
                left: "flex-col items-start justify-center",
                right: "flex-col items-end justify-center",
                "top-left": "flex-col items-start justify-start",
                "top-right": "flex-col items-end justify-start",
                "bottom-left": "flex-col items-start justify-end",
                "bottom-right": "flex-col items-end justify-end"
            };

            return classes[this.position];
        },

        /**
         * Gets the stack item class
         * @returns {unknown} The stack item class
         */
        stackItemClass() {
            return {
                absolute: true,
                "left-0": this.stackAlign === "start",
                "right-0": this.stackAlign === "end",
                "toast-stack-center": this.stackAlign === "center"
            };
        }
    },

    /**
     * Unmounts the component
     * @returns {void}
     */
    beforeUnmount() {
        this.hoveredToastId = null;
        toast.resumeAll();

        for (const observer of this.resizeObservers.values()) {
            observer.disconnect();
        }

        this.resizeObservers.clear();
    },

    methods: {
        /**
         * From front
         * @param {number} index The index
         * @returns {void}
         */
        fromFront(index: number) {
            return this.visibleItems.length - 1 - index;
        },

        /**
         * Variant class
         * @param {ToastType} type The type
         * @returns {void}
         */
        variantClass(type: ToastType) {
            return {
                "border-2-success/50! text-success rounded": type === "success",
                "border-2-info/50! text-info rounded": type === "info",
                "border-2-destructive/50! text-destructive rounded": type === "error",
                "border-2-warning/50! text-warning rounded": type === "warning"
            };
        },

        /**
         * Icon class
         * @param {ToastType} type The type
         * @returns {void}
         */
        iconClass(type: ToastType) {
            return {
                "fa-check": type === "success",
                "fa-circle-info": type === "info",
                "fa-circle-exclamation": type === "error",
                "fa-triangle-exclamation": type === "warning"
            };
        },

        /**
         * Progress bar class
         * @param {ToastType} type The type
         * @returns {void}
         */
        progressBarClass(type: ToastType) {
            return {
                "bg-success": type === "success",
                "bg-info": type === "info",
                "bg-destructive": type === "error",
                "bg-warning": type === "warning"
            };
        },

        /**
         * Toast progress
         * @param {number} id The id
         * @returns {void}
         */
        toastProgress(id: number) {
            return getToastProgress(id);
        },

        /**
         * Height of
         * @param {number} id The id
         * @returns {void}
         */
        heightOf(id: number) {
            const height = this.itemHeights[id];

            if (height === undefined || height === 0) {
                return FALLBACK_TOAST_HEIGHT;
            }

            return height;
        },

        /**
         * Offset from front
         * @param {number} index The index
         * @returns {void}
         */
        offsetFromFront(index: number) {
            let offset = 0;

            for (let i = this.visibleItems.length - 1; i > index; i--) {
                const item = this.visibleItems[i];

                if (item === undefined) {
                    continue;
                }

                offset += this.heightOf(item.id) + STACK_GAP_PX;
            }

            return offset;
        },

        /**
         * Item y
         * @param {number} index The index
         * @returns {void}
         */
        itemY(index: number) {
            if (!this.stackHovered) {
                const offset = this.fromFront(index) * STACK_OFFSET_PX;

                return this.isTopAnchored ? offset : -offset;
            }

            const offset = this.offsetFromFront(index);

            return this.isTopAnchored ? offset : -offset;
        },

        /**
         * Bind panel
         * @param {number} id The id
         * @param {unknown} el The el
         * @returns {void}
         */
        bindPanel(id: number, el: unknown) {
            const node = el instanceof HTMLElement ? el : null;
            const current = this.panelEls.get(id);

            if (node === current) {
                return;
            }

            const previous = this.resizeObservers.get(id);

            if (previous !== undefined) {
                previous.disconnect();
                this.resizeObservers.delete(id);
            }

            if (node === null) {
                this.panelEls.delete(id);
                return;
            }

            this.panelEls.set(id, node);

            const measure = () => {
                const rect = node.getBoundingClientRect();

                this.itemHeights[id] = rect.height;
            };

            const observer = new ResizeObserver(measure);

            observer.observe(node);
            this.resizeObservers.set(id, observer);
            measure();
        },

        /**
         * Item wrapper style
         * @param {number} index The index
         * @param {number} id The id
         * @returns {void}
         */
        itemWrapperStyle(index: number, id: number) {
            const style: Record<string, string> = {
                zIndex: String(index + 1),
                "--toast-x": "0px",
                "--toast-y": `${this.itemY(index)}px`
            };

            style[this.isTopAnchored ? "top" : "bottom"] = "0";

            if (this.swipeId === id && this.swipeDx !== 0) {
                style["--toast-x"] = `${this.swipeDx}px`;
                style.opacity = String(Math.max(0.2, 1 - Math.abs(this.swipeDx) / 140));
            }

            return style;
        },

        /**
         * Handles the stack enter
         * @returns {void}
         */
        onStackEnter() {
            this.stackHovered = true;
            toast.pauseAll();
        },

        /**
         * Handles the stack leave
         * @returns {void}
         */
        onStackLeave() {
            this.stackHovered = false;
            this.hoveredToastId = null;
            toast.resumeAll();
        },

        /**
         * Handles the toast enter
         * @param {number} id The id
         * @returns {void}
         */
        onToastEnter(id: number) {
            this.hoveredToastId = id;
        },

        /**
         * Handles the toast leave
         * @param {number} id The id
         * @returns {void}
         */
        onToastLeave(id: number) {
            if (this.hoveredToastId === id) {
                this.hoveredToastId = null;
            }
        },

        /**
         * Handles the touch start
         * @param {TouchEvent} event The event
         * @param {number} id The id
         * @returns {void}
         */
        onTouchStart(event: TouchEvent, id: number) {
            const touch = event.touches[0];

            if (touch === undefined) {
                return;
            }

            this.swipeId = id;
            this.swipeDx = 0;
            this.swipeStartX = touch.clientX;
            this.swipeStartY = touch.clientY;
            this.swipeLocked = false;
        },

        /**
         * Handles the touch move
         * @param {TouchEvent} event The event
         * @param {number} id The id
         * @returns {void}
         */
        onTouchMove(event: TouchEvent, id: number) {
            if (this.swipeId !== id) {
                return;
            }

            const touch = event.touches[0];

            if (touch === undefined) {
                return;
            }

            const dx = touch.clientX - this.swipeStartX;
            const dy = touch.clientY - this.swipeStartY;

            if (!this.swipeLocked) {
                if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
                    return;
                }

                if (Math.abs(dy) > Math.abs(dx)) {
                    this.onTouchCancel();
                    return;
                }

                this.swipeLocked = true;
            }

            this.swipeDx = dx;
        },

        /**
         * Handles the touch end
         * @param {number} id The id
         * @returns {void}
         */
        onTouchEnd(id: number) {
            if (this.swipeId !== id) {
                return;
            }

            const shouldDismiss = this.swipeLocked && Math.abs(this.swipeDx) >= SWIPE_DISMISS_PX;

            this.swipeId = null;
            this.swipeDx = 0;
            this.swipeLocked = false;

            if (shouldDismiss) {
                this.dismissItem(id);
            }
        },

        /**
         * Handles the touch cancel
         * @returns {void}
         */
        onTouchCancel() {
            this.swipeId = null;
            this.swipeDx = 0;
            this.swipeLocked = false;
        },

        /**
         * Close item
         * @param {number} id The id
         * @returns {void}
         */
        closeItem(id: number) {
            toast.close(id);
        },

        /**
         * Dismiss item
         * @param {number} id The id
         * @returns {void}
         */
        dismissItem(id: number) {
            toast.dismiss(id);
        }
    }
});
</script>

<style scoped>
.toast-stack {
    transition:
        height 0.2s ease-out,
        width 0.2s ease-out;
}

.toast-item-panel {
    transform: translate3d(var(--toast-x, 0px), var(--toast-y, 0px), 0);
    transition:
        transform 0.2s ease-out,
        opacity 0.2s ease-out;
}

.toast-stack-center {
    left: 50%;
    translate: -50% 0;
}

.toast-item-enter-from {
    opacity: 0;
    transform: translate3d(
        var(--toast-x, 0px),
        calc(var(--toast-y, 0px) + var(--toast-enter-y, 12px)),
        0
    );
}

.toast-item-enter-active {
    transition:
        transform 0.2s ease-out,
        opacity 0.2s ease-out;
}

.toast-item-leave-active {
    transition:
        transform 0.2s ease,
        opacity 0.2s ease;
    pointer-events: none;
}

.toast-item-leave-to {
    opacity: 0;
    transform: translate3d(var(--toast-leave-x, 4.5rem), var(--toast-y, 0px), 0);
}

.toast-item-move {
    transition: none;
}
</style>
