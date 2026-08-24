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
</style>

<template>
    <div class="relative flex w-full h-full min-h-0">
        <Transition name="fade">
            <div
                v-if="open && $project.device.isMobile"
                class="absolute inset-0 bg-black/50 z-40 md:hidden"
                aria-hidden="true"
                @click="closeNav"
            />
        </Transition>

        <nav
            class="absolute top-0 left-0 z-50 h-full flex flex-col overflow-hidden transition-transform duration-300 ease-out box-border border-r border-sidebar-border shadow-lg"
            :class="[
                open && $project.device.isMobile ? 'min-w-[85%]' : '',
                variant === 'minimalist' ? 'bg-background' : 'bg-sidebar'
            ]"
            :style="sidebarStyle"
        >
            <div class="flex flex-col h-full min-h-0 pt-2 px-2 select-none box-border">
                <div
                    class="w-full shrink-0 bg-transparent hover:bg-sidebar-accent transition-all px-4 pb-2 pt-3 rounded-lg text-sidebar-foreground text-sm font-semibold"
                >
                    <h5>
                        {{ title }}
                    </h5>

                    <div class="text-xs">
                        <p class="text-muted-foreground! font-semibold!">
                            {{ description }}
                        </p>
                    </div>
                </div>

                <div
                    class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-6 pl-2 pr-1"
                    :class="{ 'sidebar-links-scroll-hidden': variant === 'minimalist' }"
                >
                    <div
                        v-for="(link, idx) in resolvedNav"
                        :key="idx"

                        class="w-full"
                    >
                        <!-- Section -->
                        <div
                            v-if="link.type === 'section'"

                            class="w-full text-muted-foreground text-xs font-semibold pl-4 mt-6 mb-1"
                        >
                            {{ link.label }}
                        </div>

                        <!-- Link -->
                        <div
                            v-if="link.type === 'link'"

                            class="w-full hover:bg-sidebar-accent transition-all px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
                            :class="[isActive(link.link) ? 'bg-sidebar-accent/50 text-sidebar-foreground' : 'bg-transparent text-sidebar-foreground/90']"

                            @mouseenter="hoverLink(link)"
                            @mouseleave="unhoverLink()"
                            @mouseup="onUp()"
                            @mousedown="onDown()"
                            @mouseout="onOut()"
                            @touchstart="onDown()"
                            @touchend="onUp()"
                            @click="link.link && navigateTo(link.link)"
                        >
                            <div class="flex items-center justify-between">
                                <span>{{ link.label }}</span>

                                <i
                                    class="fa-solid fa-chevron-right text-xs transition-all duration-100 ease-out"
                                    :class="[
                                        hoveredLink === link.link ? 'opacity-50 translate-y-0' : 'opacity-0 translate-y-4',
                                        isDown ? 'translate-x-1' : 'translate-x-0'
                                    ]"
                                />
                            </div>
                        </div>

                        <!-- Group -->
                        <div
                            v-if="link.type === 'group'"

                            class="w-full"
                        >
                            <!-- Group header -->
                            <div
                                class="w-full flex items-center justify-between border-b-2 cursor-pointer bg-transparent hover:bg-sidebar-accent px-4 py-2 rounded-lg text-sm font-medium"
                                :class="[isGroupOpen(link, idx) ? 'border-border text-sidebar-foreground' : 'border-transparent text-sidebar-foreground/90']"
                                @click="toggleGroup(link, idx)"
                            >
                                <span>{{ link.label }}</span>

                                <i
                                    :class="[
                                        'fa-solid transition-transform duration-300 text-xs',
                                        isGroupOpen(link, idx) ? 'fa-chevron-down rotate-180' : 'fa-chevron-down'
                                    ]"
                                />
                            </div>

                            <!-- Group content -->
                            <div
                                class="grid w-full transition-[grid-template-rows] duration-300 ease-out"
                                :class="isGroupOpen(link, idx) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
                            >
                                <div class="min-h-0 overflow-hidden">
                                    <div class="flex flex-col">
                                        <!-- Sublink -->
                                        <div 
                                            v-for="sublink in link.links" 
                                            :key="sublink.label"
                                            class="flex"
                                        >
                                            <div class="ml-4 mr-2 w-0.5 bg-sidebar-border" />
                                        
                                            <div
                                                :key="sublink.link"

                                                class="flex justify-between w-full hover:bg-sidebar-accent transition-all px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
                                                :class="[isActive(sublink.link) ? 'bg-sidebar-accent/50 text-sidebar-foreground' : 'bg-transparent text-sidebar-foreground/90']"

                                                @mouseenter="hoverLink(sublink)"
                                                @mouseleave="unhoverLink()"
                                                @mouseup="onUp()"
                                                @mousedown="onDown()"
                                                @mouseout="onOut()"
                                                @touchstart="onDown()"
                                                @touchend="onUp()"
                                                @click="navigateTo(sublink.link)"
                                            >
                                                <span>{{ sublink.label }}</span>

                                                <i
                                                    class="fa-solid fa-chevron-right text-xs transition-all duration-100 ease-out"
                                                    :class="[
                                                        hoveredLink === sublink.link ? 'opacity-50 translate-y-1' : 'opacity-0 translate-y-3',
                                                        isDown ? 'translate-x-1' : 'translate-x-0'
                                                    ]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <div 
            class="flex-1 w-full h-full min-h-0 box-border transition-[margin-left] duration-300 ease-out flex flex-col overflow-y-auto"
            :style="mainContentStyle"
        >
            <div
                v-if="variant === 'minimalist'"

                class="sticky top-0 z-10 shrink-0 w-fit px-2 pt-2"
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

            <div
                v-if="variant !== 'minimalist'"

                class="sticky top-0 z-10 shrink-0 bg-background mb-6 shadow-lg"
            >
                <div 
                    class="px-2 pt-2 w-full flex"
                    :class="{'justify-end': $project.device.isMobile}"
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

                <div class="separator mt-2" />
            </div>

            <div>
                <slot />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "../Button.vue";
import Keybind from "../internal/Keybind.vue";

export default defineComponent({
    name: "Sidebar",

    emits: ["click"],

    components: {
        Button,
        Keybind
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

        navItems: {
            type: Array as PropType<any[]>,
            required: false
       
        },

        variant: {
            type: String as PropType<"minimalist" | "default">,
            default: "default"
        }
    },

    data() {
        return {
            open: true,
            hoveredLink: null as string | null,
            isDown: false,
            openGroups: {} as Record<string, boolean>
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
        },

        /**
         * Calculates the sidebar style.
         * @returns {Record<string, string>} The sidebar style.
         */
        sidebarStyle(): Record<string, string> {
            if (this.$project.device.isMobile) {
                return {
                    transform: this.open ? 'translateX(0)' : 'translateX(-100%)'
                };
            }

            const w = `${this.sidebarWidth}px`;

            return {
                width: w,
                transform: this.open ? 'translateX(0)' : 'translateX(calc(-100% - 1px))'
            };
        },

        /**
         * Calculates the main content style.
         * @returns {{ marginLeft: string }} The main content style.
         */
        mainContentStyle(): { marginLeft: string } {
            if (this.$project.device.isMobile || !this.open) {
                return { marginLeft: '0px' };
            }

            return { marginLeft: this.sidebarWidth + 'px' };
        }
    },

    methods: {
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
         * Navigates to a link.
         * @param {string | null} link The link to navigate to.
         */
        navigateTo(link: string | null) {
            (this as any).$router?.push(link);
        },

        /**
         * Checks if a link is active.
         * @param {string | null} link The link to check.
         * @returns {boolean} True if the link is active, false otherwise.
         */
        isActive(link: string | null) {
            return (this as any).$route.path === link;
        },

        /**
         * Stable key for a nav group open-state entry.
         *
         * @param link Nav group item
         * @param idx Index in the nav list
         * @returns Key used in `openGroups`
         */
        groupKey(link: any, idx: number): string {
            return String(link.label ?? idx);
        },

        /**
         * Whether a group is expanded.
         * Uses local state; falls back to `link.open` from the nav config.
         *
         * @param link Nav group item
         * @param idx Index in the nav list
         * @returns True when the group content should show
         */
        isGroupOpen(link: any, idx: number): boolean {
            if (link.links) {
                for (const sublink of link.links) {
                    if (this.isActive(sublink.link)) {
                        return true;
                    }
                }
            }

            const key = this.groupKey(link, idx);

            if (Object.prototype.hasOwnProperty.call(this.openGroups, key)) {
                return this.openGroups[key] ?? false;
            }

            return Boolean(link.open);
        },

        /**
         * Toggles a group's expanded state in local reactive state.
         *
         * @param link Nav group item
         * @param idx Index in the nav list
         */
        toggleGroup(link: any, idx: number) {
            const key = this.groupKey(link, idx);

            this.openGroups = {
                ...this.openGroups,
                [key]: !this.isGroupOpen(link, idx)
            };
        },

        /**
         * Hovers a link.
         * @param {any} link The link to hover.
         */
        hoverLink(link: any) {
            this.hoveredLink = link.link;
        },

        /**
         * Unhovers a link.
         */
        unhoverLink() {
            this.hoveredLink = null;
        },

        /**
         * On up.
         */
        onUp() {
            this.isDown = false;
        },

        /**
         * On down.
         */
        onDown() {
            this.isDown = true;
        },

        /**
         * On out.
         */
        onOut() {
            this.isDown = false;
        }
    }
});
</script>