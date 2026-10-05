<template>
    <div class="relative flex h-full w-full">
        <Transition name="fade">
            <div
                v-if="open && isMobileOrTablet"

                class="absolute inset-0 z-40 bg-black/50 md:hidden"
                aria-hidden="true"

                @click="closeNav"
            />
        </Transition>

        <Resizable
            class="transition-translate absolute top-0 left-0 z-50 box-border flex h-full flex-col overflow-hidden border-r-sidebar-border shadow-lg transition-transform duration-300 ease-out"
            :class="[
                open && isMobileOrTablet ? 'min-w-[80%] sm:min-w-[60%]' : '',
                variant === 'minimalist' ? 'bg-background' : 'bg-sidebar'
            ]"
            resize="right"
            :style="sidebarMotionStyle"
            :hover-border="!isMobileOrTablet"
            :disabled="isMobileOrTablet || !open"
            :width="isMobileOrTablet ? undefined : currentWidth"
            :min-width="minSidebarWidth"
            :max-width="maxSidebarWidth"

            @update:width="onSidebarWidth"
            @resize-start="isResizing = true"
            @resize-end="isResizing = false"
            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
            @touchcancel="onTouchCancel"
        >
            <nav class="box-border flex h-full min-h-0 w-full flex-col px-2 pt-2 select-none">
                <!-- Title and description -->
                <slot name="header" />

                <!-- Links -->
                <div
                    v-if="resolvedNav"

                    class="sidebar-links-scroll-hidden mb-8 min-h-0 flex-1 overflow-x-hidden overflow-y-auto pr-1 pb-2 pl-2"
                >
                    <SideBarLinks
                        :items="resolvedNav"

                        @link-click="onLinkClick"
                    />
                </div>

                <slot name="sidebar-body" />

                <div
                    v-if="$slots.footer"

                    class="w-full shrink-0"
                >
                    <slot name="footer" />
                </div>
            </nav>
        </Resizable>

        <div
            ref="mainContentScrollRef"

            class="box-border flex h-full min-h-0 w-full flex-1 flex-col overflow-y-auto"
            :class="{ 'transition-[margin-left] duration-300 ease-out': !isResizing }"
            :style="mainContentStyle"
        >
            <!-- Invisible top bar for the close button on the minimalist variant -->
            <div
                v-if="variant === 'minimalist'"

                class="sticky top-0 z-10 w-fit shrink-0 px-2 pt-2"
            >
                <Button
                    background-style="background-transparent"
                    hover-style="hover:bg-accent!"

                    @click="toggleOpenClose"
                >
                    <i class="fa-solid fa-bars" />
                </Button>

                <Keybind
                    v-if="toggleKeybind"

                    key-name="s"

                    @trigger="toggleOpenClose"
                />
            </div>

            <!-- Top bar with open/close button for the default variant -->
            <div
                v-if="variant !== 'minimalist'"

                class="sticky top-0 z-10 mb-6 flex shrink-0 border-b bg-background shadow-sm"
            >
                <div
                    class="flex p-2"
                    :class="{ 'justify-end': isMobileOrTablet }"
                >
                    <Button
                        variant="transparent"

                        @click="toggleOpenClose"
                    >
                        <i class="fa-solid fa-bars" />
                    </Button>

                    <Keybind
                        v-if="toggleKeybind"

                        key-name="s"

                        @trigger="toggleOpenClose"
                    />
                </div>

                <slot name="top-bar" />
            </div>

            <!-- Content -->
            <div
                :class="contentContainerClass"

                @touchstart="onContentTouchStart"
                @touchmove="onContentTouchMove"
                @touchend="onContentTouchEnd"
                @touchcancel="onContentTouchCancel"
            >
                <slot />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "../Button.vue";
import Keybind from "../internal/Keybind.vue";
import Resizable from "./Resizable.vue";
import SideBarLinks from "./SideBarLinks.vue";
import {
    closedSidebarPeekPx,
    nextHorizontalDrag,
    openSidebarDragPx,
    shouldCloseSidebarOnSwipeEnd,
    shouldOpenSidebarOnSwipeEnd,
    shouldRebaseTouchOrigin
} from "./sidebarSwipe";

export default defineComponent({
    name: "Sidebar",

    components: {
        Button,
        Keybind,
        Resizable,
        SideBarLinks
    },

    props: {
        /**
         * The title of the sidebar
         */
        title: {
            type: String,
            required: false
        },

        /**
         * The description of the sidebar
         */
        description: {
            type: String,
            required: false
        },

        /**
         * The sidebar width of the sidebar
         */
        sidebarWidth: {
            type: Number,
            default: 300
        },

        /**
         * The min sidebar width of the sidebar
         */
        minSidebarWidth: {
            type: Number,
            default: 250
        },

        /**
         * The max sidebar width of the sidebar
         */
        maxSidebarWidth: {
            type: Number,
            default: 350
        },

        /**
         * The nav items of the sidebar
         */
        navItems: {
            type: Array as PropType<any[]>,
            required: false
        },

        /**
         * The variant of the sidebar
         */
        variant: {
            type: String as PropType<"minimalist" | "default">,
            default: "default"
        },

        /**
         * The class of the content container
         */
        contentContainerClass: {
            type: String,
            default: "flex min-h-0 flex-1 flex-col",
            required: false
        },

        /**
         * The start open state of the sidebar
         */
        startOpen: {
            type: Boolean,
            default: true
        },

        /**
         * When false, the `s` keybind is not registered. Use this when nesting
         * a Sidebar inside another (docs demos).
         */
        toggleKeybind: {
            type: Boolean,
            default: true
        }
    },

    emits: ["click"],

    data() {
        return {
            open: this.startOpen,
            currentWidth: this.sidebarWidth as number,
            isResizing: false,
            touchStartX: 0,
            touchStartY: 0,
            touchLastX: 0,
            touchLastY: 0,
            XSwipeOffset: 0,
            YSwipeOffset: 0,
            XDrag: true,
            isSwiping: false
        };
    },

    computed: {
        /**
         * Resolves the navigation items.
         * @returns {any[]} The resolved navigation items.
         */
        resolvedNav() {
            const items = this.navItems;

            if (items && Array.isArray(items) && items.length > 0) {
                return items;
            }

            return [];
        },

        /**
         * The absolute value of the Y swipe offset
         * @returns {number} The absolute value of the Y swipe offset
         */
        absoluteYSwipeOffset() {
            return Math.abs(this.YSwipeOffset);
        },

        /**
         * Open/close transform only. Width is owned by `Resizable`.
         */
        sidebarMotionStyle(): Record<string, string> {
            if (this.isMobileOrTablet) {
                if (this.open) {
                    const dragPx = openSidebarDragPx(this.XDrag, this.XSwipeOffset);

                    return {
                        transform: `translateX(${dragPx}px)`
                    };
                }

                const peekPx = closedSidebarPeekPx(this.XDrag, this.XSwipeOffset);

                if (peekPx > 0) {
                    console.log(peekPx);
                    return {
                        transform: `translateX(min(-100px, calc(-100% + ${peekPx}px)))`
                    };
                }

                return {
                    transform: "translateX(-100%)"
                };
            }

            return {
                transform: this.open ? "translateX(0)" : "translateX(calc(-100% - 1px))"
            };
        },

        /**
         * Calculates the main content style.
         * @returns {{ marginLeft: string }} The main content style.
         */
        mainContentStyle(): { marginLeft: string } {
            if (this.isMobileOrTablet || !this.open) {
                return { marginLeft: "0px" };
            }

            return { marginLeft: this.currentWidth + "px" };
        },

        /**
         * Checks if the device is mobile or tablet
         * @returns {boolean} True if the device is mobile or tablet, false otherwise
         */
        isMobileOrTablet() {
            return this.$project.device.isMobile || this.$project.device.isTablet;
        }
    },

    watch: {
        /**
         * Sidebar width
         * @param {number} value The value
         * @returns {void}
         */
        sidebarWidth(value: number) {
            this.currentWidth = value;
        },

        "$route.path"() {
            this.scrollMainContentToTop();
        }
    },

    methods: {
        /**
         * Applies a desktop width coming from `Resizable`.
         */
        onSidebarWidth(width: number) {
            this.currentWidth = width;
        },

        /**
         * Toggles the open/close state of the sidebar.
         */
        toggleOpenClose() {
            this.open = !this.open;
        },

        /**
         * Opens the sidebar.
         */
        openNav() {
            this.open = true;
        },

        /**
         * Closes the sidebar.
         */
        closeNav() {
            this.open = false;
        },

        /**
         * Scrolls the main content to the top
         * @returns {void}
         */
        scrollMainContentToTop() {
            this.$nextTick(() => {
                const el = this.$refs.mainContentScrollRef as HTMLElement | undefined;

                if (!el) {
                    return;
                }

                el.scrollTo({ top: 0, left: 0, behavior: "smooth" });
            });
        },

        /**
         * Handles the link click
         * @returns {void}
         */
        async onLinkClick() {
            if (this.isMobileOrTablet) {
                await new Promise((resolve) => setTimeout(resolve, 50));

                this.closeNav();
            }
        },

        resetSwipe() {
            this.isSwiping = false;
            this.XSwipeOffset = 0;
            this.YSwipeOffset = 0;
            this.XDrag = true;
        },

        beginSwipe(e: TouchEvent) {
            const touch = e.touches[0];

            if (!touch) {
                return;
            }

            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.touchLastX = touch.clientX;
            this.touchLastY = touch.clientY;
            this.isSwiping = true;
            this.XSwipeOffset = 0;
            this.YSwipeOffset = 0;
            this.XDrag = true;
        },

        applyTouchMove(e: TouchEvent) {
            if (!this.isSwiping) {
                return;
            }

            const touch = e.touches[0];

            if (!touch) {
                return;
            }

            if (
                shouldRebaseTouchOrigin(
                    this.touchLastX,
                    this.touchLastY,
                    touch.clientX,
                    touch.clientY
                )
            ) {
                this.touchStartX = touch.clientX;
                this.touchStartY = touch.clientY;
                this.touchLastX = touch.clientX;
                this.touchLastY = touch.clientY;
                this.XSwipeOffset = 0;
                this.YSwipeOffset = 0;
                return;
            }

            this.touchLastX = touch.clientX;
            this.touchLastY = touch.clientY;
            this.XSwipeOffset = touch.clientX - this.touchStartX;
            this.YSwipeOffset = touch.clientY - this.touchStartY;
            this.XDrag = nextHorizontalDrag(this.XDrag, this.absoluteYSwipeOffset);
        },

        /**
         * Handles the touch start
         * @param {TouchEvent} e The event
         * @returns {void}
         */
        onTouchStart(e: TouchEvent) {
            if (!this.isMobileOrTablet || !this.open) {
                return;
            }

            this.beginSwipe(e);
        },

        /**
         * Handles the touch move
         * @param {TouchEvent} e The event
         * @returns {void}
         */
        onTouchMove(e: TouchEvent) {
            this.applyTouchMove(e);
        },

        /**
         * Handles the touch end
         * @returns {void}
         */
        onTouchEnd() {
            if (this.isSwiping && shouldCloseSidebarOnSwipeEnd(this.XDrag, this.XSwipeOffset)) {
                this.closeNav();
            }

            this.resetSwipe();
        },

        onTouchCancel() {
            this.resetSwipe();
        },

        onContentTouchStart(e: TouchEvent) {
            if (!this.isMobileOrTablet || this.open) {
                return;
            }

            this.beginSwipe(e);
        },

        onContentTouchMove(e: TouchEvent) {
            this.applyTouchMove(e);
        },

        onContentTouchEnd() {
            if (this.isSwiping && shouldOpenSidebarOnSwipeEnd(this.XDrag, this.XSwipeOffset)) {
                this.openNav();
            }

            this.resetSwipe();
        },

        onContentTouchCancel() {
            this.resetSwipe();
        }
    }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.sidebar-links-scroll-hidden {
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.sidebar-links-scroll-hidden::-webkit-scrollbar {
    display: none;
}

nav a {
    color: inherit;
    text-decoration: none;
}
</style>
