<template>
    <Teleport to="body">
        <Transition :name="panelTransitionName">
            <div
                v-if="isOpen && !useSheetModal"
                ref="panelRef"

                class="absolute left-0 z-[1100] flex min-w-fit flex-col overflow-hidden rounded border border-border bg-popover shadow-md"
                :class="[
                    panelClass,
                    positionAbove
                        ? 'dropdown-origin-bottom bottom-full'
                        : 'dropdown-origin-top top-full'
                ]"
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

                class="mt-1 flex min-h-0 flex-col overflow-hidden"
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
        isControlled(): boolean {
            return this.open !== undefined;
        },

        isOpen(): boolean {
            return this.isControlled ? Boolean(this.open) : this.localOpen;
        },

        useSheetModal(): boolean {
            return this.forceModal || (this.mobileModal && this.isNarrow);
        },

        panelTransitionName(): "dropdown-up" | "dropdown-down" {
            return this.positionAbove ? "dropdown-up" : "dropdown-down";
        },

        ancestorModalOpen(): boolean {
            const open = unref(this.chtModalIsOpen);

            if (open === undefined || open === null) {
                return true;
            }

            return Boolean(open);
        }
    },

    watch: {
        ancestorModalOpen(open: boolean) {
            if (!open && this.isOpen) {
                this.close();
            }
        },

        anchor() {
            if (this.isOpen && !this.useSheetModal) {
                this.attachLayoutObservers();
                this.schedulePositionUpdate();
            }
        },

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

    mounted() {
        this.syncNarrowViewport();
        window.matchMedia(NARROW_VIEWPORT).addEventListener("change", this.syncNarrowViewport);
    },

    beforeUnmount() {
        this.unregisterFromAncestorModal();
        this.close();
        this.detachFloatingListeners();
        window.matchMedia(NARROW_VIEWPORT).removeEventListener("change", this.syncNarrowViewport);
    },

    methods: {
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

        unregisterFromAncestorModal() {
            if (this.unregisterFloatingPanelCloser) {
                this.unregisterFloatingPanelCloser();
                this.unregisterFloatingPanelCloser = null;
            }
        },

        openPanel() {
            this.cancelHoverClose();
            closeOtherFloatingPanels(this.floatingPanelId);

            if (!this.useSheetModal) {
                this.syncPlacementForPanel();
            }

            this.setOpen(true);
        },

        close() {
            this.cancelHoverClose();
            this.setOpen(false);
        },

        toggleOpenClose() {
            const opening = !this.isOpen;

            if (opening && !this.useSheetModal) {
                this.syncPlacementForPanel();
            }

            this.setOpen(opening);
        },

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

        cancelHoverClose() {
            if (this.hoverCloseTimer == null) {
                return;
            }

            window.clearTimeout(this.hoverCloseTimer);
            this.hoverCloseTimer = null;
        },

        onPanelMouseEnter() {
            if (this.openOnHover) {
                this.cancelHoverClose();
            }
        },

        onPanelMouseLeave() {
            if (this.openOnHover) {
                this.requestHoverClose();
            }
        },

        setOpen(next: boolean) {
            if (this.isControlled) {
                this.$emit("update:open", next);

                return;
            }

            this.localOpen = next;
        },

        onSheetModalUpdate(open: boolean) {
            if (!open) {
                this.close();
            }
        },

        syncNarrowViewport() {
            this.isNarrow = window.matchMedia(NARROW_VIEWPORT).matches;
        },

        cancelPositionFrame() {
            if (this.positionFrame == null) {
                return;
            }

            window.cancelAnimationFrame(this.positionFrame);
            this.positionFrame = null;
        },

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
        attachLayoutObservers() {
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

            while (ancestor) {
                this.layoutObserver.observe(ancestor);

                if (ancestor === document.body) {
                    break;
                }

                ancestor = ancestor.parentElement;
            }
        },

        detachLayoutObservers() {
            if (this.layoutObserver == null) {
                return;
            }

            this.layoutObserver.disconnect();
            this.layoutObserver = null;
        },

        detachFloatingListeners() {
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

        onPanelClick(event: MouseEvent) {
            this.$emit("panel-click", event);

            if (this.closeOnContentClick) {
                this.close();
            }
        },

        getPanelAnchorElement(): HTMLElement | null {
            return this.anchor ?? null;
        },

        /**
         * Pre-calculates placement before opening so the transition plays from the correct origin.
         */
        syncPlacementForPanel() {
            const trigger = this.getPanelAnchorElement();

            if (!trigger || typeof trigger.getBoundingClientRect !== "function") {
                return;
            }

            const rect = trigger.getBoundingClientRect();
            const estimatedPanelHeight = Math.min(this.maxHeightPx + 24, 304);
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            this.positionAbove = spaceAbove >= spaceBelow && spaceBelow < estimatedPanelHeight;
        },

        updatePosition() {
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

            this.positionAbove = spaceAbove >= spaceBelow && spaceBelow < estimatedPanelHeight;

            this.panelStyle = {
                position: "fixed",
                left: `${clampedLeft}px`,
                width: `${minWidth}px`,
                maxWidth: `calc(100vw - ${viewportPadding * 2}px)`,
                ...(this.positionAbove
                    ? { bottom: `${window.innerHeight - rect.top + gap}px` }
                    : { top: `${rect.bottom + gap}px` })
            };
        },

        handleClickOutside(event: MouseEvent) {
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

        handleKeydown(event: KeyboardEvent) {
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
