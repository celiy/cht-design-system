<style scoped>
.context-menu-enter-active,
.context-menu-leave-active {
    transition:
        opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.context-menu-enter-from,
.context-menu-leave-to {
    opacity: 0;
    transform: scale(0.98);
}

.context-menu-root {
    -webkit-touch-callout: none;
}
</style>

<template>
    <div
        ref="rootRef"

        class="context-menu-root contents"

        @contextmenu="onContextMenu"
        @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
        @click.capture="onClickCapture"
    >
        <slot />

        <Teleport to="body">
            <Transition name="context-menu">
                <div
                    v-if="isOpen"
                    ref="panelRef"

                    class="fixed z-50 min-w-40 border border-border rounded bg-popover shadow-md overflow-y-auto"
                    :style="panelStyle"

                    @click.stop
                    @contextmenu.prevent
                >
                    <OptionsList
                        :options="options"

                        @select="onSelect"
                    />
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import OptionsList, { type OptionItem } from "../internal/OptionsList.vue";

const LONG_PRESS_MS = 500;
const MOVE_CANCEL_PX = 10;
const VIEWPORT_PAD = 8;

export default defineComponent({
    name: "ContextMenu",

    emits: ["click:value"],

    components: {
        OptionsList
    },

    props: {
        options: {
            type: Array as PropType<OptionItem[]>,
            required: true
        },

        closeOnSelect: {
            type: Boolean,
            default: true
        },

        disabled: {
            type: Boolean,
            default: false
        },

        maxHeightPx: {
            type: Number,
            default: 280
        }
    },

    data() {
        return {
            isOpen: false,
            anchorX: 0,
            anchorY: 0,
            panelStyle: {} as Record<string, string>,
            longPressTimer: null as number | null,
            touchX: 0,
            touchY: 0,
            ignoreNextClick: false
        };
    },

    watch: {
        isOpen(open: boolean) {
            if (open) {
                this.$nextTick(() => this.updatePosition());
                window.addEventListener("scroll", this.updatePosition, true);
                window.addEventListener("resize", this.updatePosition);
                document.addEventListener("pointerdown", this.handlePointerOutside);
                document.addEventListener("keydown", this.handleKeydown);
                document.addEventListener("contextmenu", this.handleDocumentContextMenu);
            } else {
                this.detachListeners();
            }
        }
    },

    beforeUnmount() {
        this.clearLongPress();
        this.detachListeners();
    },

    methods: {
        /**
         * Opens the menu at the cursor on right-click.
         */
        onContextMenu(event: MouseEvent) {
            if (this.disabled) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            this.openAt(event.clientX, event.clientY);
        },

        onTouchStart(event: TouchEvent) {
            if (this.disabled) {
                return;
            }

            const touch = event.touches[0];

            if (!touch) {
                return;
            }

            this.touchX = touch.clientX;
            this.touchY = touch.clientY;
            this.clearLongPress();
            event.stopPropagation();
            this.longPressTimer = window.setTimeout(() => {
                this.longPressTimer = null;
                this.ignoreNextClick = true;
                this.openAt(this.touchX, this.touchY);
            }, LONG_PRESS_MS);
        },

        onTouchMove(event: TouchEvent) {
            const touch = event.touches[0];

            if (!touch) {
                return;
            }

            const dx = touch.clientX - this.touchX;
            const dy = touch.clientY - this.touchY;

            if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) {
                this.clearLongPress();
            }
        },

        onTouchEnd() {
            this.clearLongPress();
        },

        onClickCapture(event: MouseEvent) {
            if (!this.ignoreNextClick) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            this.ignoreNextClick = false;
        },

        openAt(x: number, y: number) {
            this.anchorX = x;
            this.anchorY = y;
            this.isOpen = true;
        },

        close() {
            this.isOpen = false;
        },

        onSelect(value: string) {
            this.$emit("click:value", value);

            if (this.closeOnSelect) {
                this.close();
            }
        },

        /**
         * Keeps the panel inside the viewport, flipping up if there is no room below the cursor.
         */
        updatePosition() {
            if (!this.isOpen) {
                return;
            }

            const panel = this.$refs.panelRef as HTMLElement | undefined;
            const width = panel?.offsetWidth ?? 160;
            const height = panel?.offsetHeight ?? 120;
            let left = this.anchorX;
            let top = this.anchorY;

            if (left + width > window.innerWidth - VIEWPORT_PAD) {
                left = window.innerWidth - width - VIEWPORT_PAD;
            }

            if (top + height > window.innerHeight - VIEWPORT_PAD) {
                top = this.anchorY - height;
            }

            left = Math.max(VIEWPORT_PAD, left);
            top = Math.max(VIEWPORT_PAD, top);

            this.panelStyle = {
                left: `${left}px`,
                top: `${top}px`,
                maxHeight: `${this.maxHeightPx}px`
            };
        },

        handlePointerOutside(event: PointerEvent) {
            if (event.button === 2) {
                return;
            }

            const panel = this.$refs.panelRef as HTMLElement | undefined;
            const target = event.target as Node;

            if (panel?.contains(target)) {
                return;
            }

            this.close();
        },

        handleDocumentContextMenu(event: MouseEvent) {
            const root = this.$refs.rootRef as HTMLElement | undefined;
            const panel = this.$refs.panelRef as HTMLElement | undefined;
            const target = event.target as Node;

            if (panel?.contains(target) || root?.contains(target)) {
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
        },

        clearLongPress() {
            if (this.longPressTimer == null) {
                return;
            }

            window.clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        },

        detachListeners() {
            window.removeEventListener("scroll", this.updatePosition, true);
            window.removeEventListener("resize", this.updatePosition);
            document.removeEventListener("pointerdown", this.handlePointerOutside);
            document.removeEventListener("keydown", this.handleKeydown);
            document.removeEventListener("contextmenu", this.handleDocumentContextMenu);
        }
    }
});
</script>
