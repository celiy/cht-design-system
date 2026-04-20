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

<template>
    <div
        ref="rootRef"

        class="relative inline-block w-full"
    >
        <div
            ref="triggerRef"
            class="w-full"
        >
            <div
                class="w-full gap-2"

                @mouseenter="openOnHover ? open() : undefined"
                @mouseleave="openOnHover ? close() : undefined"
            >
                <label
                    v-if="label"

                    class="text-foreground font-semibold text-sm mb-2 block"
                    :for="id"
                >
                    {{ label }}
                </label>

                <Button
                    v-if="!$slots.button"

                    v-bind="buttonAtributes"
                    class="w-full"
                    :hoverEffect="false"

                    @click="toggleOpenClose"
                >
                    <div class="flex items-center justify-between w-full gap-2">
                        <div class="flex-1 min-w-0 text-left">
                            <slot
                                name="triggerLabel"
                                :isOpen="isOpen"
                            >
                                <span>{{ header }}</span>
                            </slot>
                        </div>

                        <i
                            v-if="!hideDropdownArrow"

                            class="fa-solid transition-all fa-chevron-down ml-2 text-xs"
                            :class="{ 'rotate-180' : isOpen }"
                        />
                    </div>
                </Button>

                <slot
                    name="button"

                    :isOpen="isOpen"
                    :toggle="toggleOpenClose"
                    :open="open"
                    :close="close"
                />

                <span
                    v-if="helperText"

                    class="mt-2 block text-sm text-muted-foreground"
                >
                    {{ helperText }}
                </span>
            </div>
        </div>

        <Teleport to="body">
            <Transition :name="panelTransitionName">
                <div
                    v-if="isOpen"
                    ref="panelRef"

                    data-dropdown-floating-panel

                    class="absolute left-0 w-max min-w-32 border border-border rounded-lg bg-popover shadow-lg z-50 overflow-y-auto"
                    :class="[
                        panelClass,
                        positionAbove ? 'bottom-full mb-1 dropdown-origin-bottom' : 'top-full mt-1 dropdown-origin-top'
                    ]"

                    :style="{ maxHeight: maxHeightPx + 'px', ...panelStyle }"

                    @click.stop="onPanelClick"
                >
                    <slot
                        :isOpen="isOpen"
                        :close="close"
                    />
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "../Button.vue";

export default defineComponent({
    name: "FloatingPanel",

    emits: ["open", "close", "panel-click"],

    components: {
        Button
    },

    props: {
        /**
         * Identifier forwarded to the label's `for` attribute.
         */
        id: {
            type: String,
            required: false
        },

        /**
         * Label rendered above the trigger.
         */
        label: {
            type: String,
            required: false
        },

        /**
         * Secondary text rendered below the trigger.
         */
        helperText: {
            type: String,
            required: false
        },

        /**
         * Default text shown inside the built-in Button trigger.
         */
        header: {
            type: String,
            required: false
        },

        /**
         * When true, hides the built-in chevron on the default trigger.
         */
        hideDropdownArrow: {
            type: Boolean,
            default: false
        },

        /**
         * Opens the panel on mouse enter and closes on mouse leave instead of on click.
         */
        openOnHover: {
            type: Boolean,
            default: false
        },

        /**
         * Attributes forwarded to the built-in Button trigger.
         */
        buttonAtributes: {
            type: Object,
            required: false
        },

        /**
         * Variant forwarded to the built-in Button trigger when `buttonAtributes.variant` is absent.
         */
        buttonVariant: {
            type: String,
            default: "secondary",
            required: false
        },

        /**
         * Maximum panel height in pixels.
         */
        maxHeightPx: {
            type: Number,
            default: 280
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
        }
    },

    data() {
        return {
            isOpen: false,
            positionAbove: false,
            panelStyle: {} as Record<string, string>
        };
    },

    watch: {
        isOpen(open: boolean) {
            if (open) {
                this.$nextTick(() => this.updatePosition());
                window.addEventListener("scroll", this.updatePosition, true);
                window.addEventListener("resize", this.updatePosition);
                document.addEventListener("click", this.handleClickOutside);

                this.$emit("open");
            } else {
                window.removeEventListener("scroll", this.updatePosition, true);
                window.removeEventListener("resize", this.updatePosition);
                document.removeEventListener("click", this.handleClickOutside);

                this.$emit("close");
            }
        }
    },

    beforeUnmount() {
        document.removeEventListener("click", this.handleClickOutside);
        window.removeEventListener("scroll", this.updatePosition, true);
        window.removeEventListener("resize", this.updatePosition);
    },

    methods: {
        open() {
            this.syncPlacementForPanel();
            this.isOpen = true;
        },

        close() {
            this.isOpen = false;
        },

        toggleOpenClose() {
            const opening = !this.isOpen;

            if (opening) {
                this.syncPlacementForPanel();
            }

            this.isOpen = opening;
        },

        onPanelClick(event: MouseEvent) {
            this.$emit("panel-click", event);

            if (this.closeOnContentClick) {
                this.close();
            }
        },

        getTriggerElement(): HTMLElement | null {
            const triggerRef = this.$refs.triggerRef as HTMLElement | { $el?: HTMLElement } | undefined;

            if (!triggerRef) {
                return null;
            }

            return (triggerRef as { $el?: HTMLElement }).$el != null
                ? (triggerRef as { $el: HTMLElement }).$el
                : (triggerRef as HTMLElement);
        },

        /**
         * Pre-calculates placement before opening so the transition plays from the correct origin.
         */
        syncPlacementForPanel() {
            const trigger = this.getTriggerElement();

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
            const trigger = this.getTriggerElement();
            const panel = this.$refs.panelRef as HTMLElement | undefined;

            if (!trigger || typeof trigger.getBoundingClientRect !== "function" || !this.isOpen) {
                return;
            }

            const rect = trigger.getBoundingClientRect();
            const gap = 4;
            const viewportPadding = 8;
            const estimatedPanelHeight = panel?.offsetHeight ?? Math.min(this.maxHeightPx + 24, 304);
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const minPanelWidth = Math.max(rect.width, 128);
            const panelWidth = Math.max(panel?.offsetWidth ?? minPanelWidth, minPanelWidth);
            const maxLeft = Math.max(viewportPadding, window.innerWidth - panelWidth - viewportPadding);
            const clampedLeft = Math.min(Math.max(rect.left, viewportPadding), maxLeft);

            this.positionAbove = spaceAbove >= spaceBelow && spaceBelow < estimatedPanelHeight;

            this.panelStyle = {
                position: "fixed",
                left: `${clampedLeft}px`,
                minWidth: `${rect.width}px`,
                maxWidth: `calc(100vw - ${viewportPadding * 2}px)`,
                ...(this.positionAbove
                    ? { bottom: `${window.innerHeight - rect.top + gap}px` }
                    : { top: `${rect.bottom + gap}px` }
                )
            };
        },

        handleClickOutside(event: MouseEvent) {
            const root = this.$refs.rootRef as HTMLElement | undefined;
            const panel = this.$refs.panelRef as HTMLElement | undefined;
            const target = event.target as Node;

            if (root?.contains(target) || panel?.contains(target)) {
                return;
            }

            this.close();
        }
    },

    computed: {
        panelTransitionName(): "dropdown-up" | "dropdown-down" {
            return this.positionAbove ? "dropdown-up" : "dropdown-down";
        }
    }
});
</script>
