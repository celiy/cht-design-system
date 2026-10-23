<template>
    <div
        v-for="(link, idx) in items"
        :key="idx"

        class="w-full"
    >
        <!-- Section -->
        <div
            v-if="link.type === 'section'"

            class="mt-6 mb-1 w-full pl-4 text-xs font-semibold text-muted-foreground"
        >
            {{ link.label }}
        </div>

        <!-- Link -->
        <RouterLink
            v-if="link.type === 'link'"

            class="w-full cursor-pointer no-underline! hover:brightness-100!"
            :to="link.link"
            active-class=""
            exact-active-class=""

            @click="onLinkClick(link)"
            @mouseenter="hoverLink(link)"
            @mouseleave="unhoverLink()"
            @mouseup="onUp()"
            @mousedown="onDown()"
            @mouseout="onOut()"
            @touchstart="onDown()"
            @touchend="onUp()"
        >
            <Chip
                :label="link.label"
                :label-icon="link.leftIcon"
                :variant="isActive(link.link) ? 'primary' : 'transparent'"
            >
                <template
                    v-if="
                        !$project.device.isMobile &&
                        !$project.device.isTablet &&
                        !isActive(link.link)
                    "
                    #right-side
                >
                    <i
                        class="fa-solid fa-chevron-right mr-4 inline-flex items-center text-xs leading-none transition-all duration-100 ease-out"
                        :class="[
                            isActive(link.link) ? 'text-primary!' : 'text-sidebar-foreground/80!',
                            hoveredLink === link.link && !isActive(link.link)
                                ? 'translate-y-0 opacity-100'
                                : 'translate-y-3 opacity-0',
                            isDown ? 'translate-x-1' : 'translate-x-0'
                        ]"
                    />
                </template>
            </Chip>
        </RouterLink>

        <!-- Group -->
        <div
            v-if="link.type === 'group'"

            class="w-full"
        >
            <!-- Group header -->
            <div
                class="flex w-full cursor-pointer items-center justify-between rounded bg-transparent px-4 py-2 text-sm font-medium text-sidebar-foreground/80 transition-all hover:bg-accent hover:text-sidebar-foreground"
                :class="[isGroupOpen(link, idx) ? 'border-b-2-border' : 'border-b-2-transparent']"

                @click="toggleGroup(link, idx)"
            >
                <span class="flex min-w-0 items-center gap-2">
                    <i
                        v-if="link.leftIcon"

                        class="fa-solid shrink-0 text-xs"
                        :class="link.leftIcon"
                    />

                    <span class="min-w-0 truncate">
                        {{ link.label }}
                    </span>
                </span>

                <i
                    :class="[
                        'fa-solid text-xs transition-transform duration-300',
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
                    <div
                        ref="groupLists"

                        class="relative flex flex-col"
                        :data-group-key="groupKey(link, idx)"
                    >
                        <!-- Sublink -->
                        <div
                            v-for="(sublink, idx) in link.links"
                            :key="sublink.label"

                            class="flex"
                        >
                            <div class="relative mr-2 ml-4 w-0.5 shrink-0 self-stretch">
                                <div
                                    class="absolute inset-0 z-0"
                                    :class="[
                                        idx === link.links.length - 1 ? 'rounded-full' : '',
                                        {
                                            'bg-linear-to-b from-sidebar-border to-transparent':
                                                $project.style.customTheme === 'hodiernus' &&
                                                idx === link.links.length - 1,
                                            'bg-sidebar-border':
                                                $project.style.customTheme !== 'hodiernus' ||
                                                idx !== link.links.length - 1 ||
                                                ($project.style.customTheme === 'hodiernus' &&
                                                    idx !== link.links.length - 1)
                                        }
                                    ]"
                                />
                            </div>

                            <RouterLink
                                :key="sublink.link"

                                class="w-full cursor-pointer no-underline! hover:brightness-100!"
                                :to="sublink.link"
                                active-class=""
                                exact-active-class=""

                                @click="onLinkClick(sublink)"
                                @mouseenter="hoverLink(sublink)"
                                @mouseleave="unhoverLink()"
                                @mouseup="onUp()"
                                @mousedown="onDown()"
                                @mouseout="onOut()"
                                @touchstart="onDown()"
                                @touchend="onUp()"
                            >
                                <Chip
                                    :label="sublink.label"
                                    :label-icon="sublink.leftIcon"
                                    :variant="isActive(sublink.link) ? 'primary' : 'transparent'"
                                >
                                    <template
                                        v-if="
                                            !$project.device.isMobile &&
                                            !$project.device.isTablet &&
                                            !isActive(sublink.link)
                                        "
                                        #right-side
                                    >
                                        <i
                                            class="fa-solid fa-chevron-right mr-4 inline-flex items-center text-xs leading-none transition-all duration-100 ease-out"
                                            :class="[
                                                isActive(sublink.link)
                                                    ? 'text-primary!'
                                                    : 'text-sidebar-foreground/80!',
                                                hoveredLink === sublink.link &&
                                                !isActive(sublink.link)
                                                    ? 'translate-y-0 opacity-100'
                                                    : 'translate-y-3 opacity-0',
                                                isDown ? 'translate-x-1' : 'translate-x-0'
                                            ]"
                                        />
                                    </template>
                                </Chip>
                            </RouterLink>
                        </div>

                        <!-- Active indicator, moves to the most recently clicked active sublink -->
                        <div
                            class="pointer-events-none absolute top-0 left-4 z-10 w-0.5 origin-center rounded-full bg-primary"
                            :style="barStyle(link, idx)"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Button from "../Button.vue";
import { defineComponent, type PropType } from "vue";
import Chip from "../Chip.vue";

type SidebarBar = {
    top: number;
    height: number;
    visible: boolean;
    animate: boolean;
};

export default defineComponent({
    name: "SideBarLinks",

    components: {
        Button,
        Chip
    },

    props: {
        /**
         * The items of the sidebarlinks
         */
        items: {
            type: Array as PropType<any[]>,
            default: () => []
        }
    },

    emits: ["link-click", "link-button-click"],

    data() {
        return {
            hoveredLink: null as string | null,
            isDown: false,
            openGroups: {} as Record<string, boolean>,
            lastClickedLink: null as string | null,
            bars: {} as Record<string, SidebarBar>,
            resizeObserver: null as ResizeObserver | null
        };
    },

    watch: {
        "$route.fullPath"() {
            this.$nextTick(() => this.refreshBars());
        },

        items: {
            handler() {
                this.$nextTick(() => {
                    this.observeLists();
                    this.refreshBars();
                });
            },
            deep: true
        }
    },

    /**
     * Mounts the component
     * @returns {void}
     */
    mounted() {
        this.resizeObserver = new ResizeObserver(() => this.refreshBars());
        this.observeLists();
        this.refreshBars();
    },

    /**
     * Unmounts the component
     * @returns {void}
     */
    beforeUnmount() {
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
    },

    methods: {
        /**
         * Checks if the link is active
         * @param {string | null} link The link
         * @returns {boolean} True if the link is active
         */
        isActive(link: string | null) {
            if (!link) {
                return false;
            }

            const url = new URL(link, "http://local.invalid");
            const route = (
                this as unknown as {
                    $route: { path: string; hash: string; query: Record<string, unknown> };
                }
            ).$route;

            if (url.pathname !== route.path) {
                return false;
            }

            if (url.hash) {
                return route.hash === url.hash;
            }

            return true;
        },

        /**
         * Gets the group key
         * @param {any} link The link
         * @param {number} idx The index
         * @returns {string} The group key
         */
        groupKey(link: any, idx: number): string {
            return String(link.label ?? idx);
        },

        /**
         * Checks if the group is open
         * @param {any} link The link
         * @param {number} idx The index
         * @returns {boolean} True if the group is open
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

            return Boolean(link.openByDefault ?? link.open);
        },

        /**
         * Toggles the group
         * @param {any} link The link
         * @param {number} idx The index
         * @returns {void}
         */
        toggleGroup(link: any, idx: number) {
            const key = this.groupKey(link, idx);

            this.openGroups = {
                ...this.openGroups,
                [key]: !this.isGroupOpen(link, idx)
            };
        },

        /**
         * Hovers the link
         * @param {any} link The link
         * @returns {void}
         */
        hoverLink(link: any) {
            this.hoveredLink = link.link;
        },

        /**
         * Unhovers the link
         * @returns {void}
         */
        unhoverLink() {
            this.hoveredLink = null;
        },

        /**
         * Handles the up event
         * @returns {void}
         */
        onUp() {
            this.isDown = false;
        },

        /**
         * Handles the down event
         * @returns {void}
         */
        onDown() {
            this.isDown = true;
        },

        /**
         * Handles the out event
         * @returns {void}
         */
        onOut() {
            this.isDown = false;
        },

        /**
         * Handles the link click
         * @param {any} link The link
         * @returns {void}
         */
        onLinkClick(link: any) {
            this.lastClickedLink = link.link;
            this.$nextTick(() => this.refreshBars());
            this.$emit("link-click", link);
        },

        /**
         * Gets the sublink list element of each group, by group key
         * @returns {Record<string, HTMLElement>} The lists
         */
        groupListElements(): Record<string, HTMLElement> {
            const lists: Record<string, HTMLElement> = {};

            for (const list of (this.$refs.groupLists as HTMLElement[] | undefined) ?? []) {
                lists[list.dataset.groupKey ?? ""] = list;
            }

            return lists;
        },

        /**
         * Observes the group lists, so the bars follow size changes. Runs on mount and
         * when the items change, never on every render, because observing fires the callback
         * @returns {void}
         */
        observeLists() {
            this.resizeObserver?.disconnect();

            for (const list of Object.values(this.groupListElements())) {
                this.resizeObserver?.observe(list);
            }
        },

        /**
         * Gets the index of the sublink the bar should sit on: the most recently clicked
         * active one, otherwise the first active one
         * @param {any} group The group
         * @returns {number} The sublink index, or -1 when none is active
         */
        barTarget(group: any): number {
            let first = -1;

            for (const [index, sublink] of (group.links ?? []).entries()) {
                if (!this.isActive(sublink.link)) {
                    continue;
                }

                if (sublink.link === this.lastClickedLink) {
                    return index;
                }

                if (first < 0) {
                    first = index;
                }
            }

            return first;
        },

        /**
         * Measures the target row of every group and moves its bar there
         * @returns {void}
         */
        refreshBars() {
            const next: Record<string, SidebarBar> = {};
            const lists = this.groupListElements();

            for (const [idx, link] of this.items.entries()) {
                if (link.type !== "group") {
                    continue;
                }

                const key = this.groupKey(link, idx);
                const previous = this.bars[key] ?? {
                    top: 0,
                    height: 0,
                    visible: false,
                    animate: false
                };
                const row = lists[key]?.children[this.barTarget(link)] as HTMLElement | undefined;

                next[key] = row
                    ? {
                          top: row.offsetTop,
                          height: row.offsetHeight,
                          visible: true,
                          animate: previous.visible
                      }
                    : { ...previous, visible: false };
            }

            this.bars = next;
        },

        /**
         * Gets the style of the group bar. Moving animates only while it is already visible,
         * so it scales in place when it first appears
         * @param {any} link The group
         * @param {number} idx The group index
         * @returns {Record<string, string>} The style
         */
        barStyle(link: any, idx: number): Record<string, string> {
            const bar = this.bars[this.groupKey(link, idx)];
            const move = bar?.animate ? "200ms" : "0ms";

            return {
                height: `${bar?.height ?? 0}px`,
                translate: `0 ${bar?.top ?? 0}px`,
                scale: `1 ${bar?.visible ? 1 : 0}`,
                transition: `translate ${move} ease-out, height ${move} ease-out, scale 200ms ease-out`
            };
        }
    }
});
</script>
