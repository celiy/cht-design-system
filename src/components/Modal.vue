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

<template>
    <div
        v-show="modalOpen"

        id="modal"
        class="fixed z-999 left-0 top-0 w-full h-full"
    >
        <Transition name="fade-modal">
            <div
                v-show="modalOpen"

                class="absolute inset-0 bg-black/50"
                aria-hidden="true"

                @click="close"
            />
        </Transition>

        <div
            class="absolute inset-0 flex pointer-events-none"
            :class="shellAlignClass"
        >
            <Transition :name="panelTransitionName">
                <div
                    v-show="modalOpen"

                    ref="modalRef"

                    class="relative bg-card p-0 shadow-2xl pointer-events-auto box-border"
                    :class="[
                        panelSurfaceClass,
                        variant === 'drawer' ? 'flex flex-col min-h-0' : ''
                    ]"

                    :style="drawerDragStyle"

                    @pointerdown="onDrawerPointerDown"
                >
                    <div
                        v-if="variant === 'drawer' && side === 'bottom'"

                        class="flex shrink-0 justify-center pt-3 pb-1 select-none touch-manipulation"
                        aria-hidden="true"
                    >
                        <span class="h-1.5 w-10 rounded-full bg-muted-foreground/40" />
                    </div>

                    <div
                        class="rounded-t-lg px-4 pt-4 text-foreground font-bold shrink-0"
                        :class="{
                        'cursor-grab active:cursor-grabbing': variant === 'drawer'
                        }"
                    >
                        <div class="flex items-center justify-between">
                        <slot name="header" />

                        <Button
                            variant="transparent"

                            @click="close"
                        >
                            <i class="fa-solid fa-x text-xs" />
                        </Button>
                        </div>
                    </div>

                    <div
                        v-if="$slots.description"

                        class="text-muted-foreground leading-5 px-4 pb-4 shrink-0"
                    >
                        <slot name="description" />
                    </div>

                    <div
                        v-if="$slots.body"

                        class="text-foreground leading-5 px-4 pb-4 overflow-auto"
                        :class="{
                        'mt-2': !$slots.description,
                        'max-h-[60vh]': variant === 'modal' && size !== 'large',
                        'max-h-[80vh]': variant === 'modal' && size === 'large',
                        'flex-1 min-h-0': variant === 'drawer'
                        }"
                    >
                        <slot name="body" />
                    </div>

                    <div
                        v-if="$slots.footer"

                        class="bg-muted/50 text-foreground p-4 border-t shrink-0 rounded-b-lg"
                        :class="{
                            'mt-auto': variant === 'drawer'
                        }"
                    >
                        <slot name="footer" />
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "./Button.vue";

const DRAWER_MOVE_LISTENER_OPTS: AddEventListenerOptions = { passive: false, capture: true };
const DRAWER_UP_LISTENER_OPTS: AddEventListenerOptions = { capture: true };

export default defineComponent({
    name: "Modal",

    emits: ["update:value"],

    components: {
        Button
    },

    props: {
        variant: {
            type: String as PropType<"modal" | "drawer">,
            default: "modal",
            required: false
        },

        color: {
            type: String as PropType<"destructive" | "success" | "warning" | "primary">,
            default: "secondary",
            required: false
        },

        side: {
            type: String as PropType<"left" | "right" | "bottom">,
            default: "left",
            required: false
        },

        size: {
            type: String as PropType<"small" | "medium" | "large">,
            default: "medium",
            required: false
        },

        isOpen: {
            type: Boolean,
            default: false,
            required: true
        }
    },

    data() {
        return {
            modalOpen: false,

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
        shellAlignClass(): string {
            if (this.variant === "modal") {
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

        panelTransitionName(): string {
            if (this.variant === "modal") {
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

        panelSurfaceClass(): Record<string, boolean> {
            const c: Record<string, boolean> = {
                "lg:w-[35%] md:w-[50%] sm:w-[70%] w-[90%]": this.size === "small" && this.variant === "modal",
                "lg:w-[50%] md:w-[70%] sm:w-[80%] w-[94%]": this.size === "medium" && this.variant === "modal",
                "lg:w-[70%] md:w-[80%] sm:w-[86%] w-[98%]": this.size === "large" && this.variant === "modal",
                "rounded-lg border": this.variant === "modal",

                "border-warning/50! border-2!": this.color === "warning",
                "border-destructive/50! border-2!": this.color === "destructive",
                "border-success/50! border-2!": this.color === "success",

                "lg:w-[30%] md:w-[50%] sm:w-[80%] w-[90%]": this.variant === "drawer" && this.side !== "bottom" && this.size === "small",
                "lg:w-[30%] md:w-[55%] sm:w-[85%] w-[90%]": this.variant === "drawer" && this.side !== "bottom" && this.size === "medium",
                "lg:w-[30%] md:w-[60%] sm:w-[85%] w-[90%]": this.variant === "drawer" && this.side !== "bottom" && this.size === "large",

                "h-full self-stretch max-h-full": this.variant === "drawer" && (this.side === "left" || this.side === "right"),

                "w-full self-stretch max-h-[42vh] sm:max-h-[50vh] md:max-h-[58vh]": this.variant === "drawer" && this.side === "bottom" && this.size === "small",
                "w-full self-stretch max-h-[58vh] sm:max-h-[68vh] md:max-h-[72vh]": this.variant === "drawer" && this.side === "bottom" && this.size === "medium",
                "w-full self-stretch max-h-[78vh] sm:max-h-[85vh] md:max-h-[88vh]": this.variant === "drawer" && this.side === "bottom" && this.size === "large",

                "rounded-r-lg border-r": this.variant === "drawer" && this.side === "left",
                "rounded-l-lg border-l":this.variant === "drawer" && this.side === "right",
                "rounded-t-lg border-t border-x": this.variant === "drawer" && this.side === "bottom"
            };

            return c;
        },

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

                    this.$nextTick(() => {
                        setTimeout(() => {
                            if (this.modalOpen) {
                                document.addEventListener("click", this.handleClickOutside);
                            }
                        }, 0);
                    });
                } else {
                    document.removeEventListener("click", this.handleClickOutside);
                    this.resetDrawerDrag();
                    this.teardownDrawerPointerListeners();
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
        document.removeEventListener("click", this.handleClickOutside);
        this.teardownDrawerPointerListeners();
    },

    methods: {
        open() {
            this.modalOpen = true;
        },

        close() {
            this.modalOpen = false;
        },

        toggleOpenClose() {
            this.modalOpen = !this.modalOpen;
        },

        resetDrawerDrag() {
            this.drawerPointerDown = false;
            this.drawerDragCommitted = false;
            this.drawerDragX = 0;
            this.drawerDragY = 0;
            this.drawerCapturedPointerId = null;
        },

        teardownDrawerPointerListeners() {
            window.removeEventListener("pointermove", this.onDrawerPointerMove, DRAWER_MOVE_LISTENER_OPTS);
            window.removeEventListener("pointerup", this.onDrawerPointerUp, DRAWER_UP_LISTENER_OPTS);
            window.removeEventListener("pointercancel", this.onDrawerPointerUp, DRAWER_UP_LISTENER_OPTS);
        },

        drawerCloseThreshold(): number {
            if (this.side === "bottom") {
                return Math.max(56, window.innerHeight * 0.12);
            }

            return Math.max(56, window.innerWidth * 0.12);
        },

        onDrawerPointerDown(event: PointerEvent) {
            if (this.variant !== "drawer" || !this.modalOpen) {
                return;
            }

            if (event.pointerType === "mouse" && event.button !== 0) {
                return;
            }

            const target = event.target as HTMLElement | null;

            if (target?.closest("button, a, input, textarea, select, label, [role=\"slider\"]")) {
                return;
            }

            this.drawerPointerDown = true;
            this.drawerDragCommitted = false;
            this.drawerDragStartX = event.clientX;
            this.drawerDragStartY = event.clientY;
            this.drawerDragX = 0;
            this.drawerDragY = 0;

            window.addEventListener("pointermove", this.onDrawerPointerMove, DRAWER_MOVE_LISTENER_OPTS);
            window.addEventListener("pointerup", this.onDrawerPointerUp, DRAWER_UP_LISTENER_OPTS);
            window.addEventListener("pointercancel", this.onDrawerPointerUp, DRAWER_UP_LISTENER_OPTS);

            this.drawerCapturedPointerId = event.pointerId;

            const panel = this.$refs.modalRef as HTMLElement | undefined;

            try {
                panel?.setPointerCapture(event.pointerId);
            } catch {
                /* ignore */
            }
        },

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

        handleClickOutside(event: MouseEvent) {
            const modal = this.$refs.modalRef as HTMLElement | undefined;

            if (modal && !modal.contains(event.target as Node)) {
                this.close();
            }
        }
    }
});
</script>
