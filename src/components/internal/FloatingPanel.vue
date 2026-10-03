<template>
    <Teleport to="body">
        <Transition :name="panelTransitionName">
            <div
                v-if="isOpen && !useSheetModal"
                ref="panelRef"

                class="absolute left-0 z-[1100] flex min-w-fit flex-col overflow-hidden rounded border border-border bg-popover shadow-md"
                :class="[panelClass, positionAbove ? 'dropdown-origin-bottom' : 'dropdown-origin-top']"
                :style="{ maxHeight: maxHeightPx + 'px', ...panelStyle }"
                data-cht-floating-panel

                @click.stop="onPanelClick"
                @mouseenter="onPanelMouseEnter"
                @mouseleave="onPanelMouseLeave"
            >
                <slot
                    :is-open="isOpen"
                    :close="close"
                />

                <div
                    v-if="$slots.helperText"

                    class="shrink-0"
                >
                    <slot name="helperText" />
                </div>
            </div>
        </Transition>
    </Teleport>

    <!--
        Keep the list unmounted while closed. Modal uses v-show, so a
        permanent #body slot would leave OptionsList listening to Enter.
    -->
    <Modal
        v-if="useSheetModal"
        variant="blank"
        size="small"
        :is-open="isOpen"

        @update:value="onSheetModalUpdate"
    >
        <template #body>
            <div
                v-if="isOpen"

                class="mt-1 flex min-h-0 flex-col overflow-hidden overscroll-contain"
                :style="{ maxHeight: maxHeightPx + 'px' }"

                @click.stop="onPanelClick"
            >
                <slot
                    :is-open="isOpen"
                    :close="close"
                />

                <div
                    v-if="$slots.helperText"

                    class="shrink-0"
                >
                    <slot name="helperText" />
                </div>
            </div>
        </template>
    </Modal>
</template>

<script lang="ts">
import { defineComponent, unref, type PropType } from "vue";
import {
    closeOtherFloatingPanels,
    registerOpenFloatingPanel,
    unregisterOpenFloatingPanel
} from "@shared/frontend/floatingPanels";
import Modal from "../Modal.vue";
import { shouldPositionAbove } from "./floatingPanelPlacement.js";

const NARROW_VIEWPORT = "(max-width: 767px)";
const HOVER_CLOSE_DELAY_MS = 120;

export default defineComponent({
    name: "FloatingPanel",

    components: {
        Modal
    },

    inject: {
        chtModalIsOpen: {
            from: "chtModalIsOpen",
            default: null
        },

        registerChtFloatingPanelCloser: {
            from: "registerChtFloatingPanelCloser",
            default: null
        }
    },

    props: {
        /**
         * Element used to size and position the floating panel.
         */
        anchor: {
            type: Object as PropType<HTMLElement | null>,
            default: null
        },

        /**
         * Maximum panel height in pixels.
         */
        maxHeightPx: {
            type: Number,
            default: 280
        },

        /**
         * Optional minimum panel width in pixels.
         */
        minWidthPx: {
            type: Number,
            required: false
        },

        /**
         * Extra classes applied to the floating panel container.
         */
        panelClass: {
            type: [String, Array, Object] as PropType<string | string[] | Record<string, boolean>>,
            required: false
        },

        /**
         * When true, any click inside the panel closes it.
         */
        closeOnContentClick: {
            type: Boolean,
            default: false
        },

        /**
         * On narrow viewports, open a blank modal instead of the floating panel.
         */
        mobileModal: {
            type: Boolean,
            default: true
        },

        /**
         * Always open a blank modal, including on desktop.
         */
        forceModal: {
            type: Boolean,
            default: false
        },

        /**
         * When defined, the panel is controlled by the parent (`v-model:open`).
         */
        open: {
            type: Boolean as PropType<boolean | undefined>,
            default: undefined
        },

        /**
         * Keeps the panel open while the pointer is over the panel after a hover open.
         */
        openOnHover: {
            type: Boolean,
            default: false
        },

        /**
         * Prefer opening above the anchor. Still flips below when above cannot fit
         * and the viewport has more room underneath.
         */
        preferAbove: {
            type: Boolean,
            default: false
        }
    },

    emits: ["open", "close", "panel-click", "update:open"],

    data() {
        return {
            localOpen: false,
            positionAbove: false,
            panelStyle: {} as Record<string, string>,
            isNarrow: false,
            outsideClickTimer: null as number | null,
            layoutObserver: null as ResizeObserver | null,
            positionFrame: null as number | null,
            hoverCloseTimer: null as number | null,
            unregisterFloatingPanelCloser: null as (() => void) | null,
            floatingPanelId: Symbol("cht-floating-panel")
        };
    },

    computed: {
        /**
         * Checks if controlled
         * @returns {boolean} True if is controlled
         */
        isControlled(): boolean {
            return this.open !== undefined;
        },

        /**
         * Checks if open
         * @returns {boolean} True if is open
         */
        isOpen(): boolean {
            return this.isControlled ? Boolean(this.open) : this.localOpen;
        },

        /**
         * Gets the use sheet modal
         * @returns {unknown} The use sheet modal
         */
        useSheetModal(): boolean {
            return this.forceModal || (this.mobileModal && this.isNarrow);
        },

        /**
         * Gets the panel transition name
         * @returns {unknown} The panel transition name
         */
        panelTransitionName(): "dropdown-up" | "dropdown-down" {
            return this.positionAbove ? "dropdown-up" : "dropdown-down";
        },

        /**
         * Gets the ancestor modal open
         * @returns {unknown} The ancestor modal open
         */
        ancestorModalOpen(): boolean {
            const open = unref(this.chtModalIsOpen);

            if (open === undefined || open === null) {
                return true;
            }

            return Boolean(open);
        }
    },

    watch: {
        /**
         * Ancestor modal open
         * @param {boolean} open The open
         * @returns {void}
         */
        ancestorModalOpen(open: boolean) {
            if (!open && this.isOpen) {
                this.close();
            }
        },

        /**
         * Anchor
         * @returns {void}
         */
        anchor() {
            if (this.isOpen && !this.useSheetModal) {
                this.attachLayoutObservers();
                this.schedulePositionUpdate();
            }
        },

        /**
         * Gets the is open
         * @param {boolean} open The open
         * @returns {void}
         */
        isOpen(open: boolean) {
            if (open) {
                closeOtherFloatingPanels(this.floatingPanelId);
                registerOpenFloatingPanel(this.floatingPanelId, () => {
                    this.close();
                });
                this.registerWithAncestorModal();

                if (!this.useSheetModal) {
                    this.$nextTick(() => this.updatePosition());
                    this.attachLayoutObservers();
                    window.addEventListener("scroll", this.schedulePositionUpdate, true);
                    window.addEventListener("resize", this.schedulePositionUpdate);
                    document.addEventListener("keydown", this.handleKeydown);
                    this.outsideClickTimer = window.setTimeout(() => {
                        this.outsideClickTimer = null;

                        if (this.isOpen && !this.useSheetModal) {
                            document.addEventListener("click", this.handleClickOutside, true);
                        }
                    }, 0);
                }

                this.$emit("open");
            } else {
                unregisterOpenFloatingPanel(this.floatingPanelId);
                this.unregisterFromAncestorModal();
                this.detachFloatingListeners();
                this.$emit("close");
            }
        }
    },

    /**
     * Mounts the component
     * @returns {void}
     */
    mounted() {
        this.syncNarrowViewport();
        window.matchMedia(NARROW_VIEWPORT).addEventListener("change", this.syncNarrowViewport);
    },

    /**
     * Unmounts the component
     * @returns {void}
     */
    beforeUnmount() {
        this.unregisterFromAncestorModal();
        this.close();
        this.detachFloatingListeners();
        window.matchMedia(NARROW_VIEWPORT).removeEventListener("change", this.syncNarrowViewport);
    },

    methods: {
        /**
         * Registers with the ancestor modal
         * @returns {void}
         */
        registerWithAncestorModal() {
            this.unregisterFromAncestorModal();

            const register = this.registerChtFloatingPanelCloser as
                | ((close: () => void) => () => void)
                | null;

            if (typeof register === "function") {
                this.unregisterFloatingPanelCloser = register(() => {
                    this.close();
                });
            }
        },

        /**
         * Unregisters from the ancestor modal
         * @returns {void}
         */
        unregisterFromAncestorModal() {
            if (this.unregisterFloatingPanelCloser) {
                this.unregisterFloatingPanelCloser();
                this.unregisterFloatingPanelCloser = null;
            }
        },

        /**
         * Opens the panel
         * @returns {void}
         */
        openPanel() {
            this.cancelHoverClose();
            closeOtherFloatingPanels(this.floatingPanelId);

            if (!this.useSheetModal) {
                this.syncPlacementForPanel();
            }

            this.setOpen(true);
        },

        /**
         * Closes the panel
         * @returns {void}
         */
        close() {
            this.cancelHoverClose();
            this.setOpen(false);
        },

        /**
         * Toggles the open close
         * @returns {void}
         */
        toggleOpenClose() {
            const opening = !this.isOpen;

            if (opening && !this.useSheetModal) {
                this.syncPlacementForPanel();
            }

            this.setOpen(opening);
        },

        /**
         * Requests the hover close
         * @returns {void}
         */
        requestHoverClose() {
            if (!this.openOnHover) {
                return;
            }

            this.cancelHoverClose();
            this.hoverCloseTimer = window.setTimeout(() => {
                this.hoverCloseTimer = null;
                this.close();
            }, HOVER_CLOSE_DELAY_MS);
        },

        /**
         * Cancels the hover close
         * @returns {void}
         */
        cancelHoverClose() {
            if (this.hoverCloseTimer == null) {
                return;
            }

            window.clearTimeout(this.hoverCloseTimer);
            this.hoverCloseTimer = null;
        },

        /**
         * Handles the panel mouse enter
         * @returns {void}
         */
        onPanelMouseEnter() {
            if (this.openOnHover) {
                this.cancelHoverClose();
            }
        },

        /**
         * Handles the panel mouse leave
         * @returns {void}
         */
        onPanelMouseLeave() {
            if (this.openOnHover) {
                this.requestHoverClose();
            }
        },

        /**
         * Sets the open
         * @param {boolean} next The next
         * @returns {void}
         */
        setOpen(next: boolean) {
            if (this.isControlled) {
                this.$emit("update:open", next);

                return;
            }

            this.localOpen = next;
        },

        /**
         * Handles the sheet modal update
         * @param {boolean} open The open
         * @returns {void}
         */
        onSheetModalUpdate(open: boolean) {
            if (!open) {
                this.close();
            }
        },

        /**
         * Syncs the narrow viewport
         * @returns {void}
         */
        syncNarrowViewport() {
            this.isNarrow = window.matchMedia(NARROW_VIEWPORT).matches;
        },

        /**
         * Cancels the position frame
         * @returns {void}
         */
        cancelPositionFrame() {
            if (this.positionFrame == null) {
                return;
            }

            window.cancelAnimationFrame(this.positionFrame);
            this.positionFrame = null;
        },

        /**
         * Schedules the position update
         * @returns {void}
         */
        schedulePositionUpdate() {
            if (!this.isOpen || this.useSheetModal) {
                return;
            }

            if (this.positionFrame != null) {
                return;
            }

            this.positionFrame = window.requestAnimationFrame(() => {
                this.positionFrame = null;
                this.updatePosition();
            });
        },

        /**
         * Reposition when the trigger or an ancestor changes size (e.g. a
         * centered modal grows after selected chips appear below the select).
         */
        attachLayoutObservers(): void {
            this.detachLayoutObservers();

            const trigger = this.getPanelAnchorElement();

            if (!trigger || typeof ResizeObserver === "undefined") {
                return;
            }

            this.layoutObserver = new ResizeObserver(() => {
                this.schedulePositionUpdate();
            });

            this.layoutObserver.observe(trigger);

            let ancestor: HTMLElement | null = trigger.parentElement;

            while (ancestor && ancestor !== document.body) {
                this.layoutObserver.observe(ancestor);

                ancestor = ancestor.parentElement;
            }
        },

        /**
         * Detaches the layout observers
         * @returns {void}
         */
        detachLayoutObservers(): void {
            if (this.layoutObserver == null) {
                return;
            }

            this.layoutObserver.disconnect();
            this.layoutObserver = null;
        },

        /**
         * Detaches the floating listeners
         * @returns {void}
         */
        detachFloatingListeners(): void {
            this.cancelHoverClose();

            if (this.outsideClickTimer != null) {
                window.clearTimeout(this.outsideClickTimer);
                this.outsideClickTimer = null;
            }

            this.cancelPositionFrame();
            this.detachLayoutObservers();
            window.removeEventListener("scroll", this.schedulePositionUpdate, true);
            window.removeEventListener("resize", this.schedulePositionUpdate);
            document.removeEventListener("click", this.handleClickOutside, true);
            document.removeEventListener("keydown", this.handleKeydown);
        },

        /**
         * Handles the panel click
         * @param {MouseEvent} event The event
         * @returns {void}
         */
        onPanelClick(event: MouseEvent) {
            this.$emit("panel-click", event);

            if (this.closeOnContentClick) {
                this.close();
            }
        },

        /**
         * Gets the panel anchor element
         * @returns {HTMLElement | null} The panel anchor element
         */
        getPanelAnchorElement(): HTMLElement | null {
            return this.anchor ?? null;
        },

        /**
         * Pre-calculates placement before opening so the transition plays from the correct origin.
         */
        syncPlacementForPanel(): void {
            const trigger = this.getPanelAnchorElement();

            if (!trigger || typeof trigger.getBoundingClientRect !== "function") {
                return;
            }

            const rect = trigger.getBoundingClientRect();
            const estimatedPanelHeight = Math.min(this.maxHeightPx + 24, 304);
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            this.positionAbove = shouldPositionAbove(
                spaceAbove,
                spaceBelow,
                estimatedPanelHeight,
                this.preferAbove
            );
        },

        /**
         * Updates the position
         * @returns {void}
         */
        updatePosition(): void {
            const trigger = this.getPanelAnchorElement();
            const panel = this.$refs.panelRef as HTMLElement | undefined;

            if (!trigger || typeof trigger.getBoundingClientRect !== "function" || !this.isOpen) {
                return;
            }

            const rect = trigger.getBoundingClientRect();
            const gap = 4;
            const viewportPadding = 8;
            const estimatedPanelHeight =
                panel?.offsetHeight ?? Math.min(this.maxHeightPx + 24, 304);
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const anchorWidth = rect.width;
            const minWidth = Math.max(anchorWidth, this.minWidthPx ?? 0);
            const maxLeft = Math.max(
                viewportPadding,
                window.innerWidth - minWidth - viewportPadding
            );
            const clampedLeft = Math.min(Math.max(rect.left, viewportPadding), maxLeft);

            this.positionAbove = shouldPositionAbove(
                spaceAbove,
                spaceBelow,
                estimatedPanelHeight,
                this.preferAbove
            );

            const available = this.positionAbove
                ? spaceAbove - gap - viewportPadding
                : spaceBelow - gap - viewportPadding;
            const maxHeight = Math.max(48, Math.min(this.maxHeightPx, available));

            this.panelStyle = {
                position: "fixed",
                left: `${clampedLeft}px`,
                width: `${minWidth}px`,
                maxWidth: `calc(100vw - ${viewportPadding * 2}px)`,
                height: "auto",
                maxHeight: `${maxHeight}px`,
                top: this.positionAbove ? "auto" : `${rect.bottom + gap}px`,
                bottom: this.positionAbove
                    ? `${window.innerHeight - rect.top + gap}px`
                    : "auto"
            };
        },

        /**
         * Handles the click outside
         * @param {MouseEvent} event The event
         * @returns {void}
         */
        handleClickOutside(event: MouseEvent): void {
            const trigger = this.getPanelAnchorElement();
            const panel = this.$refs.panelRef as HTMLElement | undefined;
            const target = event.target as Node;

            if (trigger?.contains(target) || panel?.contains(target)) {
                return;
            }

            // Nested option submenus are teleported to `body` (OptionsList).
            if (target instanceof Element && target.closest("[data-cht-floating-panel]")) {
                return;
            }

            if (target instanceof Element && target.closest("[data-cht-toast]")) {
                return;
            }

            this.close();
        },

        /**
         * Handles the keydown
         * @param {KeyboardEvent} event The event
         * @returns {void}
         */
        handleKeydown(event: KeyboardEvent): void {
            if (event.key !== "Escape") {
                return;
            }

            event.preventDefault();
            this.close();
        }
    }
});
</script>

<style scoped>
.dropdown-down-enter-active,
.dropdown-down-leave-active {
    transition:
        opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.dropdown-down-enter-from,
.dropdown-down-leave-to {
    opacity: 0;
    transform: translate3d(0, -0.4rem, 0) scale(0.98);
    transform-origin: top center;
}
.dropdown-down-enter-to,
.dropdown-down-leave-from {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
    transform-origin: top center;
}

.dropdown-up-enter-active,
.dropdown-up-leave-active {
    transition:
        opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.dropdown-up-enter-from,
.dropdown-up-leave-to {
    opacity: 0;
    transform: translate3d(0, 0.4rem, 0) scale(0.98);
    transform-origin: bottom center;
}
.dropdown-up-enter-to,
.dropdown-up-leave-from {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
    transform-origin: bottom center;
}

.dropdown-origin-top {
    transform-origin: top center;
}
.dropdown-origin-bottom {
    transform-origin: bottom center;
}
</style>
