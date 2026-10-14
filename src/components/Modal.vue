<template>
    <Teleport to="body">
        <div
            v-show="modalOpen"

            class="fixed top-0 left-0 h-full w-full transition-all"
            :class="showModal || isDrawer ? 'opacity-100' : 'opacity-0'"
            :style="{ zIndex: overlayZIndex }"
        >
            <Transition name="fade-modal">
                <div
                    v-show="modalOpen"

                    class="modal-overlay absolute inset-0"
                    aria-hidden="true"
                    :style="overlayStyle"

                    @click="onOverlayDismiss"
                />
            </Transition>

            <div
                class="pointer-events-none absolute inset-0 flex transition-all"
                :class="[
                    shellAlignClass,
                    showModal || isDrawer ? 'scale-x-100 scale-y-100' : 'scale-x-80 scale-y-80'
                ]"
            >
                <Transition :name="panelTransitionName">
                    <!-- Modal panel: preview -->
                    <div
                        v-if="isPreview"
                        v-show="modalOpen"
                        ref="modalRef"

                        class="pointer-events-auto relative"
                        :style="drawerDragStyle"
                        :data-drawer-handle="isDrawer ? '' : undefined"

                        @pointerdown="onDrawerPointerDown"
                        @touchstart="onDrawerTouchStart"
                        @touchmove="onDrawerTouchMove"
                        @touchend="onDrawerTouchEnd"
                        @touchcancel="onDrawerTouchCancel"
                    >
                        <slot name="body" />
                    </div>

                    <!-- Modal panel -->
                    <div
                        v-else
                        v-show="modalOpen"
                        ref="modalRef"

                        class="pointer-events-auto relative box-border p-0 shadow-2xl"
                        :class="[
                            backgroundClass,
                            panelSurfaceClass,
                            'flex min-h-0 flex-col',
                            isPlainModal ? 'max-h-[90vh]' : ''
                        ]"
                        :style="drawerDragStyle"

                        @pointerdown="onDrawerPointerDown"
                        @touchstart="onDrawerTouchStart"
                        @touchmove="onDrawerTouchMove"
                        @touchend="onDrawerTouchEnd"
                        @touchcancel="onDrawerTouchCancel"
                    >
                        <!-- Visual dragger for bottom drawer -->
                        <div
                            v-if="isDrawer && side === 'bottom'"

                            class="flex shrink-0 cursor-grab touch-none justify-center pt-3 pb-1 select-none active:cursor-grabbing"
                            aria-hidden="true"
                            data-drawer-handle
                        >
                            <span class="h-1.5 w-10 rounded-full bg-muted-foreground/40" />
                        </div>

                        <!-- Header with title and close button for Modal and Drawer -->
                        <div
                            v-if="!isBlank"

                            class="shrink-0 rounded-t px-4 pt-4"
                            :class="{
                                'cursor-grab select-none active:cursor-grabbing': isDrawer
                            }"
                            :data-drawer-handle="isDrawer ? '' : undefined"
                        >
                            <div class="flex items-center justify-between">
                                <!-- Header -->
                                <h5>
                                    <slot name="header" />
                                </h5>

                                <Button
                                    variant="transparent"
                                    class="p-2"

                                    @click="onCloseButtonClick"
                                >
                                    <span class="fa-solid fa-x text-xs" />
                                </Button>
                            </div>
                        </div>

                        <!-- Header description for Modal and Drawer -->
                        <div
                            v-if="$slots.description && !isBlank"

                            class="shrink-0 px-4 pb-4"
                        >
                            <!-- Description -->
                            <p class="text-muted-foreground!">
                                <slot name="description" />
                            </p>
                        </div>

                        <!-- Body for Modal, Blank and Drawer-->
                        <div
                            v-if="$slots.body"
                            ref="bodyScrollRef"

                            class="overflow-auto"
                            :class="{
                                'mt-2': !isBlank && !$slots.description,
                                'px-4 pb-4': !isBlank,
                                'overscroll-contain': isDrawer,
                                'max-h-[40vh]': isPlainModal && size === 'extra-small',
                                'max-h-[50vh]': isPlainModal && size === 'small',
                                'max-h-[60vh]': isPlainModal && size === 'medium',
                                'max-h-[70vh]': isPlainModal && size === 'large',
                                'max-h-[80vh]': isPlainModal && size === 'extra-large',
                                'min-h-0 flex-1': !isPreview
                            }"
                        >
                            <slot name="body" />
                        </div>

                        <!-- Footer for Modal, Blank and Drawer-->
                        <footer
                            v-if="$slots.footer"

                            :class="[footerClass, { 'mt-auto': isDrawer }]"
                        >
                            <slot name="footer" />
                        </footer>
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
import {
    MODAL_QUERY_PARAM,
    type ModalUrlRouter,
    consumeInitialModalQuery,
    parseModalQueryParam,
    registerModalUrlInstance,
    releaseModalUrlInstance,
    scheduleModalUrlQuerySync,
    trackModalUrlOpenState
} from "@shared/frontend/modalQuery";
import type { RouteLocationNormalizedLoaded } from "vue-router";
import {
    DRAWER_ANIMATION_EASING,
    DRAWER_ANIMATION_MS,
    DRAWER_FLING_STALE_MS,
    drawerClosedTransform,
    drawerDragOffset,
    drawerGestureBlockedByContent,
    drawerOffsetTransform,
    lockDrawerGesture,
    shouldCloseDrawer
} from "./internal/drawerSwipe.ts";
import { shouldRebaseTouchOrigin } from "./custom/sidebarSwipe.ts";

const DRAWER_MOVE_LISTENER_OPTS = { passive: false, capture: true };
const DRAWER_INTERACTIVE_SELECTOR =
    'button, a, input, textarea, select, label, [role="slider"], [contenteditable="true"]';
const DRAWER_TRANSITION = `${DRAWER_ANIMATION_MS}ms ${DRAWER_ANIMATION_EASING}`;
const DRAWER_UP_LISTENER_OPTS = { capture: true };
const OUTSIDE_CLICK_LISTENER_OPTS = { capture: true };

/** Old `variant` values, still accepted. Use the `type` prop instead. */
type DeprecatedModalVariant = "blank" | "preview";

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
        /**
         * The variant of the modal
         */
        variant: {
            type: String as PropType<"modal" | "drawer" | DeprecatedModalVariant>,
            default: "modal",
            required: false
        },

        /**
         * The content layout of the modal panel: `blank` drops the header and description,
         * `preview` renders only the body
         */
        type: {
            type: String as PropType<"blank" | "preview">,
            required: false
        },

        /**
         * The color of the modal
         */
        color: {
            type: String as PropType<"destructive" | "success" | "warning" | "info">,
            default: "secondary",
            required: false
        },

        /**
         * The side of the modal
         */
        side: {
            type: String as PropType<"left" | "right" | "bottom">,
            default: "left",
            required: false
        },

        /**
         * The size of the modal
         */
        size: {
            type: String as PropType<"extra-small" | "small" | "medium" | "large" | "extra-large">,
            default: "medium",
            required: false
        },

        /**
         * Whether the modal open
         */
        isOpen: {
            type: Boolean,
            default: false,
            required: true
        },

        /**
         * Whether the modal is keep open
         */
        keepOpen: {
            type: Boolean,
            default: false,
            required: false
        },

        /**
         * Sync open state with `?modal=[id,...]` in the URL (history + Voltar).
         * Off skips register/query updates. Default on.
         * A full page reload always clears a leftover `?modal` and does not reopen.
         */
        urlSync: {
            type: Boolean,
            default: true,
            required: false
        },

        /**
         * The background style of the modal
         */
        backgroundStyle: {
            type: String,
            required: false
        },

        /**
         * The border style of the modal
         */
        borderStyle: {
            type: String,
            required: false
        },

        /**
         * The footer style of the modal
         */
        footerStyle: {
            type: String,
            required: false
        }
    },

    emits: ["update:value"],

    data() {
        return {
            modalOpen: this.isOpen,
            floatingPanelClosers: [] as Array<() => void>,
            modalLayerId: Symbol("modal"),
            layerIndex: 0,

            drawerTracking: false,
            drawerDragging: false,
            drawerSettling: false,
            drawerClosing: false,
            drawerStartX: 0,
            drawerStartY: 0,
            drawerLastX: 0,
            drawerLastY: 0,
            drawerLastMoveAt: 0,
            drawerOffset: 0,
            drawerVelocity: 0,
            drawerPanelSize: 0,
            drawerSettleTimer: null as number | null,

            modalUrlId: 0,

            urlSyncReady: false,
            urlSyncFromRoute: false,

            showModal: true,

            dismissLocked: false,
            dismissUnlockTimer: null as number | null,
            pointersDown: 0
        };
    },

    computed: {
        /**
         * Whether the modal is a drawer.
         * @returns {boolean} True for the drawer variant.
         */
        isDrawer(): boolean {
            return this.variant === "drawer";
        },

        /**
         * Whether the panel is blank, from `type` or the deprecated variant.
         * @returns {boolean} True when the header and description are hidden.
         */
        isBlank(): boolean {
            return this.type === "blank" || this.variant === "blank";
        },

        /**
         * Whether the panel is a preview, from `type` or the deprecated variant.
         * @returns {boolean} True when only the body is rendered.
         */
        isPreview(): boolean {
            return this.type === "preview" || this.variant === "preview";
        },

        /**
         * Whether the panel is a centered modal, blank or not.
         * @returns {boolean} True for the centered modal layout.
         */
        isPlainModal(): boolean {
            return !this.isDrawer && !this.isPreview;
        },

        /**
         * Gets the overlay zindex
         * @returns {unknown} The overlay zindex
         */
        overlayZIndex(): number {
            return 999 + this.layerIndex * 20;
        },

        /**
         * Calculates the shell align class.
         * @returns {string} The shell align class.
         */
        shellAlignClass(): string {
            if (!this.isDrawer) {
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
            if (!this.isDrawer) {
                return "fade-scale-modal";
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
         * Gets the background class
         * @returns {unknown} The background class
         */
        backgroundClass() {
            if (this.backgroundStyle) {
                return this.backgroundStyle;
            }

            return "bg-card";
        },

        /**
         * Gets the footer class
         * @returns {unknown} The footer class
         */
        footerClass() {
            if (this.footerStyle) {
                return this.footerStyle;
            }

            return "shrink-0 rounded-b border-t bg-muted/50 p-2 md:p-3";
        },

        /**
         * Calculates the panel surface class.
         * @returns {Array<string | Record<string, boolean>>} The panel surface class.
         */
        panelSurfaceClass(): Array<string | Record<string, boolean>> {
            const sizeLayout: Record<string, boolean> = {
                "lg:w-[25%] md:w-[40%] sm:w-[60%] w-[80%]":
                    this.size === "extra-small" && this.isPlainModal,
                "lg:w-[35%] md:w-[50%] sm:w-[70%] w-[90%]":
                    this.size === "small" && this.isPlainModal,
                "lg:w-[50%] md:w-[70%] sm:w-[80%] w-[94%]":
                    this.size === "medium" && this.isPlainModal,
                "lg:w-[70%] md:w-[80%] sm:w-[86%] w-[98%]":
                    this.size === "large" && this.isPlainModal,
                "lg:w-[80%] md:w-[85%] sm:w-[90%] w-[98%]":
                    this.size === "extra-large" && this.isPlainModal,

                "lg:w-[30%] md:w-[50%] sm:w-[80%] w-[90%]":
                    this.isDrawer && this.side !== "bottom" && this.size === "small",
                "lg:w-[30%] md:w-[55%] sm:w-[85%] w-[90%]":
                    this.isDrawer && this.side !== "bottom" && this.size === "medium",
                "lg:w-[30%] md:w-[60%] sm:w-[85%] w-[90%]":
                    this.isDrawer && this.side !== "bottom" && this.size === "large",

                "h-full self-stretch max-h-full":
                    this.isDrawer && (this.side === "left" || this.side === "right"),

                "w-full self-stretch max-h-[42vh] sm:max-h-[50vh] md:max-h-[58vh]":
                    this.isDrawer && this.side === "bottom" && this.size === "small",
                "w-full self-stretch max-h-[58vh] sm:max-h-[68vh] md:max-h-[72vh]":
                    this.isDrawer && this.side === "bottom" && this.size === "medium",
                "w-full self-stretch max-h-[78vh] sm:max-h-[85vh] md:max-h-[88vh]":
                    this.isDrawer && this.side === "bottom" && this.size === "large"
            };

            if (this.borderStyle) {
                return [
                    sizeLayout,
                    this.borderStyle,
                    {
                        rounded: this.isPlainModal,
                        "rounded-r": this.isDrawer && this.side === "left",
                        "rounded-l": this.isDrawer && this.side === "right",
                        "rounded-t": this.isDrawer && this.side === "bottom"
                    }
                ];
            }

            return [
                sizeLayout,
                {
                    "rounded border border-border/60!": this.isPlainModal,

                    "border-warning/50! border-2!": this.color === "warning",
                    "border-destructive/50! border-2!": this.color === "destructive",
                    "border-success/50! border-2!": this.color === "success",
                    "border-info/50! border-2!": this.color === "info",

                    "rounded-r border-r border-border/60!": this.isDrawer && this.side === "left",
                    "rounded-l border-l border-border/60!": this.isDrawer && this.side === "right",
                    "rounded-t border-t border-border/60!": this.isDrawer && this.side === "bottom"
                }
            ];
        },

        /**
         * Inline transform of the drawer panel: follows the finger while dragging, slides back
         * when released short of the threshold and slides out from wherever it is when closing.
         * @returns {Record<string, string>} The drawer drag style.
         */
        drawerDragStyle(): Record<string, string> {
            if (!this.isDrawer) {
                return {};
            }

            if (this.drawerClosing) {
                return {
                    transform: drawerClosedTransform(this.side, this.drawerOffset),
                    transition: `transform ${DRAWER_TRANSITION}`
                };
            }

            if (this.drawerDragging) {
                return {
                    transform: drawerOffsetTransform(this.side, this.drawerOffset),
                    transition: "none"
                };
            }

            if (this.drawerSettling) {
                return {
                    transform: drawerOffsetTransform(this.side, 0),
                    transition: `transform ${DRAWER_TRANSITION}`
                };
            }

            return {};
        },

        /**
         * Drawer backdrop fades with the drag and when the drawer closes.
         * @returns {Record<string, string> | undefined} The overlay style.
         */
        overlayStyle(): Record<string, string> | undefined {
            if (!this.isDrawer) {
                return undefined;
            }

            if (!this.showModal || this.drawerClosing) {
                return { opacity: "0", transition: `opacity ${DRAWER_TRANSITION}` };
            }

            if (!this.drawerDragging) {
                return { opacity: "1", transition: `opacity ${DRAWER_TRANSITION}` };
            }

            const progress =
                this.drawerPanelSize > 0 ? this.drawerOffset / this.drawerPanelSize : 0;

            return {
                opacity: String(Math.max(0, 1 - Math.min(1, progress))),
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
                    this.armDismissLock();

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
                    this.clearDismissLock();
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

                if (this.urlSyncReady && this.shouldSyncModalUrl() && this.modalUrlId !== 0) {
                    trackModalUrlOpenState(this.modalUrlId, newVal);

                    if (!this.urlSyncFromRoute) {
                        this.syncOpenStateToUrl(newVal, { reason: "state" });
                    }
                }

                this.$emit("update:value", newVal);
            },

            immediate: true
        },

        isOpen: {
            async handler(newVal: boolean) {
                this.modalOpen = newVal;
                this.showModal = newVal;
            },

            immediate: true
        }
    },

    /**
     * Creates the component
     * @returns {void}
     */
    created() {
        if (this.variant === "blank" || this.variant === "preview") {
            console.warn(
                `Modal: variant="${this.variant}" is deprecated. Use type="${this.variant}" instead.`
            );
        }

        if (this.urlSync) {
            this.modalUrlId = registerModalUrlInstance();
        }
    },

    /**
     * Mounts the component
     * @returns {void}
     */
    mounted() {
        window.addEventListener("pointerdown", this.trackPointerDown, true);
        window.addEventListener("pointerup", this.trackPointerUp, true);
        window.addEventListener("pointercancel", this.trackPointerUp, true);

        if (!this.shouldSyncModalUrl()) {
            this.urlSyncReady = true;

            return;
        }

        consumeInitialModalQuery(this.$router as ModalUrlRouter);
        this.urlSyncReady = true;

        if (this.modalOpen && this.modalUrlId !== 0) {
            trackModalUrlOpenState(this.modalUrlId, true);
            this.syncOpenStateToUrl(true, { reason: "state" });
        }

        this.$watch(
            () => this.$route?.query[MODAL_QUERY_PARAM],
            () => {
                this.syncOpenFromUrl();
            }
        );
    },

    /**
     * Unmounts the component
     * @returns {void}
     */
    beforeUnmount() {
        if (this.modalOpen && this.urlSyncReady && this.shouldSyncModalUrl()) {
            trackModalUrlOpenState(this.modalUrlId, false);
            this.syncOpenStateToUrl(false, { reason: "unmount" });
        }

        if (this.modalUrlId !== 0) {
            releaseModalUrlInstance(this.modalUrlId);
        }

        document.removeEventListener("click", this.handleClickOutside, OUTSIDE_CLICK_LISTENER_OPTS);
        this.clearDismissLock();
        window.removeEventListener("pointerdown", this.trackPointerDown, true);
        window.removeEventListener("pointerup", this.trackPointerUp, true);
        window.removeEventListener("pointercancel", this.trackPointerUp, true);
        this.teardownDrawerPointerListeners();
        this.clearDrawerSettleTimer();
        popModalLayer(this.modalLayerId);
    },

    methods: {
        /**
         * Should sync modal url
         * @returns {void}
         */
        shouldSyncModalUrl(): boolean {
            return this.urlSync && Boolean(this.$router) && Boolean(this.$route);
        },

        /**
         * Modal ids from route
         * @returns {void}
         */
        modalIdsFromRoute(): number[] {
            const route = this.$route as RouteLocationNormalizedLoaded | undefined;

            if (!route) {
                return [];
            }

            const raw = route.query[MODAL_QUERY_PARAM];
            const text = Array.isArray(raw) ? raw[0] : raw;

            return parseModalQueryParam(typeof text === "string" ? text : undefined);
        },

        /**
         * Sync open state to url
         * @param {boolean} _open The open state
         * @param {object} _options The options
         * @returns {void}
         */
        syncOpenStateToUrl(
            _open: boolean,
            _options: { reason: "state" | "unmount" } = { reason: "state" }
        ) {
            if (!this.shouldSyncModalUrl()) {
                return;
            }

            scheduleModalUrlQuerySync(this.$router as ModalUrlRouter);
        },

        /**
         * Sync open from url
         * @returns {void}
         */
        syncOpenFromUrl() {
            if (!this.shouldSyncModalUrl()) {
                return;
            }

            const shouldOpen = this.modalIdsFromRoute().includes(this.modalUrlId);

            if (shouldOpen === this.modalOpen) {
                return;
            }

            this.urlSyncFromRoute = true;
            this.modalOpen = shouldOpen;
            this.urlSyncFromRoute = false;
        },

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
            this.showModal = true;
            this.modalOpen = true;
        },

        /**
         * Closes the modal.
         */
        async close() {
            this.showModal = false;

            if (this.isDrawer) {
                // Slide out from the current position (a drag offset included).
                this.drawerClosing = true;
                this.drawerDragging = false;
                this.drawerTracking = false;
                this.teardownDrawerPointerListeners();

                await new Promise((resolve) => setTimeout(resolve, DRAWER_ANIMATION_MS));
            } else {
                await new Promise((resolve) => setTimeout(resolve, 250));
            }

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
            if (this.keepOpen || this.dismissLocked) {
                return;
            }

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
            this.drawerTracking = false;
            this.drawerDragging = false;
            this.drawerSettling = false;
            this.drawerClosing = false;
            this.drawerOffset = 0;
            this.drawerVelocity = 0;
            this.clearDrawerSettleTimer();
        },

        /**
         * Clears the timer that ends the slide-back animation.
         */
        clearDrawerSettleTimer() {
            if (this.drawerSettleTimer == null) {
                return;
            }

            window.clearTimeout(this.drawerSettleTimer);
            this.drawerSettleTimer = null;
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
         * Starts tracking a possible drag. Nothing moves until the gesture leaves the slop
         * along the drawer axis (see `lockDrawerGesture`).
         * @param {number} x The pointer x
         * @param {number} y The pointer y
         * @param {EventTarget | null} target The event target
         * @returns {boolean} True if the gesture is being tracked
         */
        startDrawerGesture(x: number, y: number, target: EventTarget | null): boolean {
            if (!this.isDrawer || !this.modalOpen || this.drawerClosing) {
                return false;
            }

            const panel = this.$refs.modalRef as HTMLElement | undefined;

            if (!panel) {
                return false;
            }

            if (target instanceof Element && target.closest(DRAWER_INTERACTIVE_SELECTOR)) {
                return false;
            }

            if (drawerGestureBlockedByContent(target, panel, this.side)) {
                return false;
            }

            this.clearDrawerSettleTimer();
            this.drawerSettling = false;
            this.drawerTracking = true;
            this.drawerDragging = false;
            this.drawerStartX = x;
            this.drawerStartY = y;
            this.drawerLastX = x;
            this.drawerLastY = y;
            this.drawerLastMoveAt = performance.now();
            this.drawerOffset = 0;
            this.drawerVelocity = 0;
            this.drawerPanelSize = this.side === "bottom" ? panel.offsetHeight : panel.offsetWidth;

            return true;
        },

        /**
         * Follows the pointer once the gesture is locked as a drawer drag.
         * @param {number} x The pointer x
         * @param {number} y The pointer y
         * @param {Event} event The move event (cancelled while dragging so nothing scrolls)
         */
        moveDrawerGesture(x: number, y: number, event: Event) {
            if (!this.drawerTracking) {
                return;
            }

            if (!this.drawerDragging) {
                const lock = lockDrawerGesture(
                    this.side,
                    x - this.drawerStartX,
                    y - this.drawerStartY
                );

                if (lock === null) {
                    return;
                }

                if (lock === "ignore") {
                    this.drawerTracking = false;

                    return;
                }

                // Start from here so the panel does not jump by the slop distance.
                this.drawerDragging = true;
                this.drawerStartX = x;
                this.drawerStartY = y;
            }

            const now = performance.now();
            const previous = this.drawerOffset;
            const offset = drawerDragOffset(
                this.side,
                x - this.drawerStartX,
                y - this.drawerStartY
            );
            const elapsed = now - this.drawerLastMoveAt;

            if (elapsed > 0) {
                this.drawerVelocity = (offset - previous) / elapsed;
            }

            this.drawerOffset = offset;
            this.drawerLastX = x;
            this.drawerLastY = y;
            this.drawerLastMoveAt = now;

            if (event.cancelable) {
                event.preventDefault();
            }
        },

        /**
         * Ends the gesture: closes past the threshold (or on a flick), otherwise slides back.
         */
        endDrawerGesture() {
            if (!this.drawerTracking) {
                return;
            }

            this.drawerTracking = false;

            if (!this.drawerDragging) {
                return;
            }

            const velocity =
                performance.now() - this.drawerLastMoveAt > DRAWER_FLING_STALE_MS
                    ? 0
                    : this.drawerVelocity;

            if (shouldCloseDrawer(this.drawerOffset, velocity, this.drawerCloseThreshold())) {
                void this.close();

                return;
            }

            this.settleDrawer();
        },

        /**
         * Slides the panel back into place after a drag that did not close it.
         */
        settleDrawer() {
            this.drawerDragging = false;
            this.drawerOffset = 0;
            this.drawerSettling = true;
            this.clearDrawerSettleTimer();
            this.drawerSettleTimer = window.setTimeout(() => {
                this.drawerSettleTimer = null;
                this.drawerSettling = false;
            }, DRAWER_ANIMATION_MS);
        },

        /**
         * Touch start on the drawer panel.
         * @param {TouchEvent} event The touch event.
         */
        onDrawerTouchStart(event: TouchEvent) {
            const touch = event.touches[0];

            if (!touch || event.touches.length > 1) {
                this.onDrawerTouchCancel();

                return;
            }

            this.startDrawerGesture(touch.clientX, touch.clientY, event.target);
        },

        /**
         * Touch move on the drawer panel.
         * @param {TouchEvent} event The touch event.
         */
        onDrawerTouchMove(event: TouchEvent) {
            const touch = event.touches[0];

            if (!touch || !this.drawerTracking) {
                return;
            }

            // Same teleport guard as the Sidebar: shift the origin instead of jumping.
            if (
                shouldRebaseTouchOrigin(
                    this.drawerLastX,
                    this.drawerLastY,
                    touch.clientX,
                    touch.clientY
                )
            ) {
                this.drawerStartX += touch.clientX - this.drawerLastX;
                this.drawerStartY += touch.clientY - this.drawerLastY;
                this.drawerLastX = touch.clientX;
                this.drawerLastY = touch.clientY;

                return;
            }

            this.moveDrawerGesture(touch.clientX, touch.clientY, event);
        },

        /**
         * Touch end on the drawer panel.
         */
        onDrawerTouchEnd() {
            this.endDrawerGesture();
        },

        /**
         * Touch cancel on the drawer panel: the drag is abandoned, the panel slides back.
         */
        onDrawerTouchCancel() {
            if (!this.drawerTracking) {
                return;
            }

            this.drawerTracking = false;

            if (this.drawerDragging) {
                this.settleDrawer();
            }
        },

        /**
         * Mouse drag on desktop, from the grab handle or the header only so text in the
         * body stays selectable. Touch is handled by the touch events.
         * @param {PointerEvent} event The pointer event.
         */
        onDrawerPointerDown(event: PointerEvent) {
            if (event.pointerType !== "mouse" || event.button !== 0) {
                return;
            }

            const target = event.target;

            if (!(target instanceof Element) || !target.closest("[data-drawer-handle]")) {
                return;
            }

            if (!this.startDrawerGesture(event.clientX, event.clientY, target)) {
                return;
            }

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
        },

        /**
         * Handles the drawer pointer move event.
         * @param {PointerEvent} event The pointer event.
         */
        onDrawerPointerMove(event: PointerEvent) {
            this.moveDrawerGesture(event.clientX, event.clientY, event);
        },

        /**
         * Handles the drawer pointer up event.
         */
        onDrawerPointerUp() {
            this.teardownDrawerPointerListeners();
            this.endDrawerGesture();
        },

        /**
         * Arms the dismiss lock.
         *
         * @param event The mouse event
         */
        armDismissLock() {
            this.clearDismissLock();
            this.dismissLocked = true;

            if (this.pointersDown > 0) {
                window.addEventListener("pointerup", this.onDismissLockPointerUp, true);
                window.addEventListener("pointercancel", this.onDismissLockPointerUp, true);
                return;
            }

            this.dismissUnlockTimer = window.setTimeout(() => {
                this.dismissUnlockTimer = null;
                this.dismissLocked = false;
            }, 0);
        },

        /**
         * Tracks the pointer down event.
         */
        trackPointerDown() {
            this.pointersDown += 1;
        },

        /**
         * Tracks the pointer up event.
         */
        trackPointerUp() {
            this.pointersDown = Math.max(0, this.pointersDown - 1);
        },

        /**
         * Handles the dismiss lock pointer up event.
         */
        onDismissLockPointerUp() {
            window.removeEventListener("pointerup", this.onDismissLockPointerUp, true);
            window.removeEventListener("pointercancel", this.onDismissLockPointerUp, true);

            this.clearDismissUnlockTimer();
            this.dismissUnlockTimer = window.setTimeout(() => {
                this.dismissUnlockTimer = null;
                this.dismissLocked = false;
            }, 0);
        },

        /**
         * Clears the dismiss unlock timer.
         */
        clearDismissUnlockTimer() {
            if (this.dismissUnlockTimer == null) {
                return;
            }

            window.clearTimeout(this.dismissUnlockTimer);
            this.dismissUnlockTimer = null;
        },

        /**
         * Clears the dismiss lock.
         */
        clearDismissLock() {
            this.dismissLocked = false;
            window.removeEventListener("pointerup", this.onDismissLockPointerUp, true);
            window.removeEventListener("pointercancel", this.onDismissLockPointerUp, true);
            this.clearDismissUnlockTimer();
        },

        /**
         * Handles the click outside event.
         *
         * @param event The mouse event
         */
        handleClickOutside(event: MouseEvent) {
            if (this.keepOpen || this.dismissLocked) {
                return;
            }

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
/* Backdrop — mesma curva que o overlay da Sidebar (opacity 0.2s ease) */
.fade-modal-enter-active,
.fade-modal-leave-active {
    transition: all 0.2s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
    opacity: 0;
}

.fade-modal-enter-to,
.fade-modal-leave-from {
    opacity: 1;
}

/* Backdrop — mesma curva que o overlay da Sidebar (opacity 0.2s ease) */
.fade-scale-modal-enter-active,
.fade-scale-modal-leave-active {
    transition: all 0.2s ease;
}

.fade-scale-modal-enter-from,
.fade-scale-modal-leave-to {
    opacity: 0;
    transform: scale(0.8);
}

.fade-scale-modal-enter-to,
.fade-scale-modal-leave-from {
    opacity: 1;
    transform: scale(1);
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
