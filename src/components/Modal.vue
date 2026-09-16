<template>
    <Teleport to="body">
        <div
            v-show="modalOpen"

            class="fixed top-0 left-0 h-full w-full"
            :style="{ zIndex: overlayZIndex }"
        >
            <Transition name="fade-modal">
                <div
                    v-show="modalOpen"

                    class="absolute inset-0 bg-black/50"
                    aria-hidden="true"

                    @click="onOverlayDismiss"
                />
            </Transition>

            <div
                class="pointer-events-none absolute inset-0 flex"
                :class="shellAlignClass"
            >
                <Transition :name="panelTransitionName">
                    <!-- Modal panel: preview -->
                    <div
                        v-if="variant === 'preview'"
                        v-show="modalOpen"
                        ref="modalRef"

                        class="pointer-events-auto relative max-h-[90vh] max-w-[90vw]"
                    >
                        <slot name="body" />
                    </div>

                    <!-- Modal panel -->
                    <div
                        v-else
                        v-show="modalOpen"
                        ref="modalRef"

                        class="pointer-events-auto relative box-border bg-card p-0 shadow-2xl"
                        :class="[
                            panelSurfaceClass,
                            variant === 'drawer' ? 'flex min-h-0 flex-col' : ''
                        ]"
                        :style="drawerDragStyle"

                        @pointerdown="onDrawerPointerDown"
                    >
                        <div
                            v-if="variant === 'drawer' && side === 'bottom'"

                            class="flex shrink-0 touch-manipulation justify-center pt-3 pb-1 select-none"
                            aria-hidden="true"
                        >
                            <span class="h-1.5 w-10 rounded-full bg-muted-foreground/40" />
                        </div>

                        <div
                            v-if="variant !== 'blank'"

                            class="shrink-0 rounded-t px-4 pt-4"
                            :class="{
                                'cursor-grab active:cursor-grabbing': variant === 'drawer'
                            }"
                        >
                            <div class="flex items-center justify-between">
                                <!-- Header -->
                                <h5>
                                    <slot name="header" />
                                </h5>

                                <Button
                                    variant="transparent"

                                    @click="onCloseButtonClick"
                                >
                                    <i class="fa-solid fa-x text-xs" />
                                </Button>
                            </div>
                        </div>

                        <div
                            v-if="$slots.description && variant !== 'blank'"

                            class="shrink-0 px-4 pb-4"
                        >
                            <!-- Description -->
                            <p class="text-muted-foreground!">
                                <slot name="description" />
                            </p>
                        </div>

                        <div
                            v-if="$slots.body"
                            ref="bodyScrollRef"

                            class="overflow-auto"
                            :class="{
                                'mt-2': variant !== 'blank' && !$slots.description,
                                'px-4 pb-4': variant === 'modal' || variant === 'drawer',
                                'max-h-[50vh]':
                                    (variant === 'modal' || variant === 'blank') &&
                                    size === 'small',
                                'max-h-[60vh]':
                                    (variant === 'modal' || variant === 'blank') &&
                                    size === 'medium',
                                'max-h-[70vh]':
                                    (variant === 'modal' || variant === 'blank') &&
                                    size === 'large',
                                'max-h-[80vh]':
                                    (variant === 'modal' || variant === 'blank') &&
                                    size === 'extra-large',
                                'min-h-0 flex-1': variant === 'drawer'
                            }"
                        >
                            <!-- Body -->
                            <slot name="body" />
                        </div>

                        <div
                            v-if="$slots.footer && variant !== 'blank'"

                            class="shrink-0 rounded-b border-t bg-muted/50 p-4"
                            :class="{
                                'mt-auto': variant === 'drawer'
                            }"
                        >
                            <!-- Footer -->
                            <slot name="footer" />
                        </div>
                    </div>
                </Transition>
            </div>

            <Keybind
                key-name="Escape"
                :ignore-when-typing="false"
                :enabled="modalOpen"

                @trigger="onEscape"
            />
        </div>
    </Teleport>
</template>

<script lang="ts">
import { defineComponent, toRef, type PropType } from "vue";
import Button from "./Button.vue";
import Keybind from "./internal/Keybind.vue";
import {
    getModalLayerIndex,
    isTopModalLayer,
    popModalLayer,
    pushModalLayer
} from "@shared/frontend/keybinds";

const DRAWER_MOVE_LISTENER_OPTS = { passive: false, capture: true };
const DRAWER_UP_LISTENER_OPTS = { capture: true };
const OUTSIDE_CLICK_LISTENER_OPTS = { capture: true };

export default defineComponent({
    name: "Modal",

    components: {
        Button,
        Keybind
    },

    provide() {
        return {
            chtModalIsOpen: toRef(this, "modalOpen"),

            registerChtFloatingPanelCloser: (close: () => void) => {
                this.floatingPanelClosers.push(close);

                return () => {
                    const idx = this.floatingPanelClosers.indexOf(close);

                    if (idx !== -1) {
                        this.floatingPanelClosers.splice(idx, 1);
                    }
                };
            }
        };
    },

    props: {
        variant: {
            type: String as PropType<"modal" | "blank" | "drawer" | "preview">,
            default: "modal",
            required: false
        },

        color: {
            type: String as PropType<"destructive" | "success" | "warning" | "info">,
            default: "secondary",
            required: false
        },

        side: {
            type: String as PropType<"left" | "right" | "bottom">,
            default: "left",
            required: false
        },

        size: {
            type: String as PropType<"small" | "medium" | "large" | "extra-large">,
            default: "medium",
            required: false
        },

        isOpen: {
            type: Boolean,
            default: false,
            required: true
        }
    },

    emits: ["update:value"],

    data() {
        return {
            modalOpen: this.isOpen,
            floatingPanelClosers: [] as Array<() => void>,
            modalLayerId: Symbol("modal"),
            layerIndex: 0,

            drawerPointerDown: false,
            drawerDragCommitted: false,
            drawerDragStartX: 0,
            drawerDragStartY: 0,
            drawerDragX: 0,
            drawerDragY: 0,
            drawerCapturedPointerId: null as number | null
        };
    },

    computed: {
        overlayZIndex(): number {
            return 999 + this.layerIndex * 20;
        },

        /**
         * Calculates the shell align class.
         * @returns {string} The shell align class.
         */
        shellAlignClass(): string {
            if (
                this.variant === "modal" ||
                this.variant === "preview" ||
                this.variant === "blank"
            ) {
                return "items-center justify-center p-4";
            }

            if (this.side === "bottom") {
                return "flex-col items-stretch justify-end";
            }

            if (this.side === "right") {
                return "items-stretch justify-end";
            }

            return "items-stretch justify-start";
        },

        /**
         * Calculates the panel transition name.
         * @returns {string} The panel transition name.
         */
        panelTransitionName(): string {
            if (
                this.variant === "modal" ||
                this.variant === "preview" ||
                this.variant === "blank"
            ) {
                return "fade-modal";
            }

            if (this.side === "bottom") {
                return "drawer-slide-bottom";
            }

            if (this.side === "right") {
                return "drawer-slide-right";
            }

            return "drawer-slide-left";
        },

        /**
         * Calculates the panel surface class.
         * @returns {Record<string, boolean>} The panel surface class.
         */
        panelSurfaceClass(): Record<string, boolean> {
            const c: Record<string, boolean> = {
                "lg:w-[35%] md:w-[50%] sm:w-[70%] w-[90%]":
                    this.size === "small" && (this.variant === "modal" || this.variant === "blank"),
                "lg:w-[50%] md:w-[70%] sm:w-[80%] w-[94%]":
                    this.size === "medium" &&
                    (this.variant === "modal" || this.variant === "blank"),
                "lg:w-[70%] md:w-[80%] sm:w-[86%] w-[98%]":
                    this.size === "large" && (this.variant === "modal" || this.variant === "blank"),
                "lg:w-[80%] md:w-[85%] sm:w-[90%] w-[98%]":
                    this.size === "extra-large" &&
                    (this.variant === "modal" || this.variant === "blank"),
                "rounded border border-border/60!":
                    this.variant === "modal" || this.variant === "blank",

                "border-warning/50! border-2!": this.color === "warning",
                "border-destructive/50! border-2!": this.color === "destructive",
                "border-success/50! border-2!": this.color === "success",
                "border-info/50! border-2!": this.color === "info",

                "lg:w-[30%] md:w-[50%] sm:w-[80%] w-[90%]":
                    this.variant === "drawer" && this.side !== "bottom" && this.size === "small",
                "lg:w-[30%] md:w-[55%] sm:w-[85%] w-[90%]":
                    this.variant === "drawer" && this.side !== "bottom" && this.size === "medium",
                "lg:w-[30%] md:w-[60%] sm:w-[85%] w-[90%]":
                    this.variant === "drawer" && this.side !== "bottom" && this.size === "large",

                "h-full self-stretch max-h-full":
                    this.variant === "drawer" && (this.side === "left" || this.side === "right"),

                "w-full self-stretch max-h-[42vh] sm:max-h-[50vh] md:max-h-[58vh]":
                    this.variant === "drawer" && this.side === "bottom" && this.size === "small",
                "w-full self-stretch max-h-[58vh] sm:max-h-[68vh] md:max-h-[72vh]":
                    this.variant === "drawer" && this.side === "bottom" && this.size === "medium",
                "w-full self-stretch max-h-[78vh] sm:max-h-[85vh] md:max-h-[88vh]":
                    this.variant === "drawer" && this.side === "bottom" && this.size === "large",

                "rounded-r border-r border-border/60!":
                    this.variant === "drawer" && this.side === "left",
                "rounded-l border-l border-border/60!":
                    this.variant === "drawer" && this.side === "right",
                "rounded-t border-t border-border/60!":
                    this.variant === "drawer" && this.side === "bottom"
            };

            return c;
        },

        /**
         * Calculates the drawer drag style.
         * @returns {Record<string, string>} The drawer drag style.
         */
        drawerDragStyle(): Record<string, string> {
            if (this.variant !== "drawer" || !this.drawerDragCommitted) {
                return {};
            }

            if (this.drawerDragX === 0 && this.drawerDragY === 0) {
                return {};
            }

            return {
                transform: `translate(${this.drawerDragX}px, ${this.drawerDragY}px)`,
                transition: "none"
            };
        }
    },

    watch: {
        modalOpen: {
            handler(newVal: boolean) {
                if (newVal) {
                    this.resetDrawerDrag();
                    pushModalLayer(this.modalLayerId);
                    this.layerIndex = getModalLayerIndex(this.modalLayerId);

                    this.$nextTick(() => {
                        setTimeout(() => {
                            if (this.modalOpen) {
                                document.addEventListener(
                                    "click",
                                    this.handleClickOutside,
                                    OUTSIDE_CLICK_LISTENER_OPTS
                                );
                            }
                        }, 0);
                    });
                } else {
                    document.removeEventListener(
                        "click",
                        this.handleClickOutside,
                        OUTSIDE_CLICK_LISTENER_OPTS
                    );
                    this.resetDrawerDrag();
                    this.teardownDrawerPointerListeners();
                    popModalLayer(this.modalLayerId);
                    this.layerIndex = 0;
                    this.closeDescendantFloatingPanels();
                }

                this.$emit("update:value", newVal);
            },

            immediate: true
        },

        isOpen: {
            handler(newVal: boolean) {
                this.modalOpen = newVal;
            },

            immediate: true
        }
    },

    beforeUnmount() {
        document.removeEventListener("click", this.handleClickOutside, OUTSIDE_CLICK_LISTENER_OPTS);
        this.teardownDrawerPointerListeners();
        popModalLayer(this.modalLayerId);
    },

    methods: {
        /**
         * Scrolls the modal body slot container to the top (overflow area around `#body`).
         */
        scrollBodyToTop() {
            const el = this.$refs.bodyScrollRef as HTMLElement | undefined;

            if (el) {
                el.scrollTop = 0;
            }
        },

        /**
         * Opens the modal.
         */
        open() {
            this.modalOpen = true;
        },

        /**
         * Closes the modal.
         */
        close() {
            this.modalOpen = false;
        },

        /**
         * Closes select/dropdown panels opened inside this modal (teleported to body).
         */
        closeDescendantFloatingPanels() {
            const closers = this.floatingPanelClosers.splice(0);

            for (const close of closers) {
                close();
            }
        },

        /**
         * Closes only when this instance is the topmost open modal.
         *
         * @param event Click or pointer event from backdrop / outside
         */
        onOverlayDismiss(event: Event) {
            if (!isTopModalLayer(this.modalLayerId)) {
                return;
            }

            event.stopImmediatePropagation();
            this.close();
        },

        /**
         * Closes from the header X without letting the same click
         * count as an outside-click on the modal underneath.
         *
         * @param event Native click from the close button
         */
        onCloseButtonClick(event: MouseEvent) {
            if (!isTopModalLayer(this.modalLayerId)) {
                return;
            }

            event.stopImmediatePropagation();
            this.close();
        },

        /**
         * Handles the escape key.
         * @param {KeyboardEvent} event The keyboard event.
         */
        onEscape(event: KeyboardEvent) {
            if (!isTopModalLayer(this.modalLayerId)) {
                return;
            }

            event.stopImmediatePropagation();
            this.close();
        },

        /**
         * Toggles the open/close state of the modal.
         */
        toggleOpenClose() {
            this.modalOpen = !this.modalOpen;
        },

        /**
         * Resets the drawer drag.
         */
        resetDrawerDrag() {
            this.drawerPointerDown = false;
            this.drawerDragCommitted = false;
            this.drawerDragX = 0;
            this.drawerDragY = 0;
            this.drawerCapturedPointerId = null;
        },

        /**
         * Tears down the drawer pointer listeners.
         */
        teardownDrawerPointerListeners() {
            window.removeEventListener(
                "pointermove",
                this.onDrawerPointerMove,
                DRAWER_MOVE_LISTENER_OPTS
            );
            window.removeEventListener(
                "pointerup",
                this.onDrawerPointerUp,
                DRAWER_UP_LISTENER_OPTS
            );
            window.removeEventListener(
                "pointercancel",
                this.onDrawerPointerUp,
                DRAWER_UP_LISTENER_OPTS
            );
        },

        /**
         * Calculates the drawer close threshold.
         * @returns {number} The drawer close threshold.
         */
        drawerCloseThreshold(): number {
            if (this.side === "bottom") {
                return Math.max(56, window.innerHeight * 0.12);
            }

            return Math.max(56, window.innerWidth * 0.12);
        },

        /**
         * Handles the drawer pointer down event.
         * @param {PointerEvent} event The pointer event.
         */
        onDrawerPointerDown(event: PointerEvent) {
            if (this.variant !== "drawer" || !this.modalOpen) {
                return;
            }

            if (event.pointerType === "mouse" && event.button !== 0) {
                return;
            }

            const target = event.target as HTMLElement | null;

            if (target?.closest('button, a, input, textarea, select, label, [role="slider"]')) {
                return;
            }

            this.drawerPointerDown = true;
            this.drawerDragCommitted = false;
            this.drawerDragStartX = event.clientX;
            this.drawerDragStartY = event.clientY;
            this.drawerDragX = 0;
            this.drawerDragY = 0;

            window.addEventListener(
                "pointermove",
                this.onDrawerPointerMove,
                DRAWER_MOVE_LISTENER_OPTS
            );
            window.addEventListener("pointerup", this.onDrawerPointerUp, DRAWER_UP_LISTENER_OPTS);
            window.addEventListener(
                "pointercancel",
                this.onDrawerPointerUp,
                DRAWER_UP_LISTENER_OPTS
            );

            this.drawerCapturedPointerId = event.pointerId;

            const panel = this.$refs.modalRef as HTMLElement | undefined;

            try {
                panel?.setPointerCapture(event.pointerId);
            } catch {
                /* ignore */
            }
        },

        /**
         * Handles the drawer pointer move event.
         * @param {PointerEvent} event The pointer event.
         */
        onDrawerPointerMove(event: PointerEvent) {
            if (!this.drawerPointerDown || this.variant !== "drawer") {
                return;
            }

            const dx = event.clientX - this.drawerDragStartX;
            const dy = event.clientY - this.drawerDragStartY;

            if (!this.drawerDragCommitted) {
                const slop = 10;

                if (this.side === "left") {
                    if (dx > -slop || Math.abs(dx) < Math.abs(dy)) {
                        return;
                    }
                } else if (this.side === "right") {
                    if (dx < slop || Math.abs(dx) < Math.abs(dy)) {
                        return;
                    }
                } else if (this.side === "bottom") {
                    if (dy < slop || dy < Math.abs(dx) * 0.85) {
                        return;
                    }
                }

                this.drawerDragCommitted = true;
            }

            if (this.side === "left") {
                this.drawerDragX = Math.min(0, dx);
                this.drawerDragY = 0;
            } else if (this.side === "right") {
                this.drawerDragX = Math.max(0, dx);
                this.drawerDragY = 0;
            } else {
                this.drawerDragX = 0;
                this.drawerDragY = Math.max(0, dy);
            }

            if (event.cancelable) {
                event.preventDefault();
            }
        },

        /**
         * Handles the drawer pointer up event.
         */
        onDrawerPointerUp() {
            if (!this.drawerPointerDown) {
                return;
            }

            this.drawerPointerDown = false;

            const panel = this.$refs.modalRef as HTMLElement | undefined;
            const capId = this.drawerCapturedPointerId;

            if (panel != null && capId != null) {
                try {
                    panel.releasePointerCapture(capId);
                } catch {
                    /* ignore */
                }
            }

            this.drawerCapturedPointerId = null;
            this.teardownDrawerPointerListeners();

            if (!this.drawerDragCommitted) {
                this.resetDrawerDrag();

                return;
            }

            const t = this.drawerCloseThreshold();
            let shouldClose = false;

            if (this.side === "left") {
                shouldClose = this.drawerDragX < -t;
            } else if (this.side === "right") {
                shouldClose = this.drawerDragX > t;
            } else {
                shouldClose = this.drawerDragY > t;
            }

            this.drawerDragCommitted = false;
            this.drawerDragX = 0;
            this.drawerDragY = 0;

            if (shouldClose) {
                this.close();
            }
        },

        /**
         * Handles the click outside event.
         *
         * @param event The mouse event
         */
        handleClickOutside(event: MouseEvent) {
            if (!isTopModalLayer(this.modalLayerId)) {
                return;
            }

            const modal = this.$refs.modalRef as HTMLElement | undefined;
            const target = event.target as Node;

            if (target instanceof Element && target.closest("[data-cht-floating-panel]")) {
                return;
            }

            if (target instanceof Element && target.closest("[data-cht-toast]")) {
                return;
            }

            if (modal && !modal.contains(target)) {
                event.stopImmediatePropagation();
                this.close();
            }
        }
    }
});
</script>

<style scoped>
/* Backdrop / modal panel — mesma curva que o overlay da Sidebar (opacity 0.2s ease) */
.fade-modal-enter-active,
.fade-modal-leave-active {
    transition: opacity 0.2s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
    opacity: 0;
}

.fade-modal-enter-to,
.fade-modal-leave-from {
    opacity: 1;
}

/*
 * Drawer: mesmo timing da Sidebar (`transition-transform duration-300 ease-out`).
 * ease-out Tailwind ≈ cubic-bezier(0, 0, 0.2, 1)
 */
.drawer-slide-left-enter-active,
.drawer-slide-left-leave-active,
.drawer-slide-right-enter-active,
.drawer-slide-right-leave-active,
.drawer-slide-bottom-enter-active,
.drawer-slide-bottom-leave-active {
    transition: transform 300ms cubic-bezier(0, 0, 0.2, 1);
}

.drawer-slide-left-enter-from,
.drawer-slide-left-leave-to {
    transform: translateX(-100%);
}

.drawer-slide-left-enter-to,
.drawer-slide-left-leave-from {
    transform: translateX(0);
}

.drawer-slide-right-enter-from,
.drawer-slide-right-leave-to {
    transform: translateX(100%);
}

.drawer-slide-right-enter-to,
.drawer-slide-right-leave-from {
    transform: translateX(0);
}

.drawer-slide-bottom-enter-from,
.drawer-slide-bottom-leave-to {
    transform: translateY(100%);
}

.drawer-slide-bottom-enter-to,
.drawer-slide-bottom-leave-from {
    transform: translateY(0);
}
</style>
