<template>
    <div class="relative flex h-full w-full">
        <Transition name="fade">
            <div
                v-if="open && $project.device.isMobile"

                class="absolute inset-0 z-40 bg-black/50 md:hidden"
                aria-hidden="true"

                @click="closeNav"
            />
        </Transition>

        <Resizable
            class="absolute top-0 left-0 z-50 box-border flex h-full flex-col overflow-hidden border-r-sidebar-border shadow-lg transition-transform duration-300 ease-out"
            :class="[
                open && $project.device.isMobile ? 'min-w-[80%] sm:min-w-[60%]' : '',
                variant === 'minimalist' ? 'bg-background' : 'bg-sidebar'
            ]"
            resize="right"
            :style="sidebarMotionStyle"
            :hover-border="!$project.device.isMobile"
            :disabled="$project.device.isMobile || !open"
            :width="$project.device.isMobile ? undefined : currentWidth"
            :min-width="minSidebarWidth"
            :max-width="maxSidebarWidth"

            @update:width="onSidebarWidth"
            @resize-start="isResizing = true"
            @resize-end="isResizing = false"
        >
            <nav class="box-border flex h-full min-h-0 w-full flex-col px-2 pt-2 select-none">
                <!-- Title and description -->
                <slot name="header" />

                <!-- Links -->
                <div
                    v-if="resolvedNav"

                    class="sidebar-links-scroll-hidden mb-8 min-h-0 flex-1 overflow-x-hidden overflow-y-auto pr-1 pb-2 pl-2"
                >
                    <SideBarLinks :items="resolvedNav" />
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
                    variant="transparent"

                    @click="toggleOpenClose"
                >
                    <i class="fa-solid fa-bars" />
                </Button>

                <Keybind
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
                    :class="{ 'justify-end': $project.device.isMobile }"
                >
                    <Button
                        variant="transparent"

                        @click="toggleOpenClose"
                    >
                        <i class="fa-solid fa-bars" />
                    </Button>

                    <Keybind
                        key-name="s"

                        @trigger="toggleOpenClose"
                    />
                </div>

                <slot name="top-bar" />
            </div>

            <!-- Content -->
            <div class="flex min-h-0 flex-1 flex-col">
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

export default defineComponent({
    name: "Sidebar",

    components: {
        Button,
        Keybind,
        Resizable,
        SideBarLinks
    },

    props: {
        title: {
            type: String,
            required: false
        },

        description: {
            type: String,
            required: false
        },

        sidebarWidth: {
            type: Number,
            default: 300
        },

        minSidebarWidth: {
            type: Number,
            default: 250
        },

        maxSidebarWidth: {
            type: Number,
            default: 350
        },

        navItems: {
            type: Array as PropType<any[]>,
            required: false
        },

        variant: {
            type: String as PropType<"minimalist" | "default">,
            default: "default"
        }
    },

    emits: ["click"],

    data() {
        return {
            open: true,
            currentWidth: this.sidebarWidth as number,
            isResizing: false
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
         * Open/close transform only. Width is owned by `Resizable`.
         */
        sidebarMotionStyle(): Record<string, string> {
            if (this.$project.device.isMobile) {
                return {
                    transform: this.open ? "translateX(0)" : "translateX(-100%)"
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
            if (this.$project.device.isMobile || !this.open) {
                return { marginLeft: "0px" };
            }

            return { marginLeft: this.currentWidth + "px" };
        }
    },

    watch: {
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

        scrollMainContentToTop() {
            this.$nextTick(() => {
                const el = this.$refs.mainContentScrollRef as HTMLElement | undefined;

                if (!el) {
                    return;
                }

                el.scrollTo({ top: 0, left: 0, behavior: "smooth" });
            });
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
