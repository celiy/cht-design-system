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

            class="flex w-full cursor-pointer items-center justify-between rounded px-4 py-2 text-sm! font-medium! text-inherit! no-underline! transition-all hover:bg-accent! hover:brightness-100!"
            :class="[isActive(link.link) ? 'bg-primary/10' : 'bg-transparent']"
            :to="link.link"
            active-class=""
            exact-active-class=""

            @mouseenter="hoverLink(link)"
            @mouseleave="unhoverLink()"
            @mouseup="onUp()"
            @mousedown="onDown()"
            @mouseout="onOut()"
            @touchstart="onDown()"
            @touchend="onUp()"
        >
            <span
                class="flex min-w-0 items-center gap-2"
                :class="isActive(link.link) ? 'text-primary!' : 'text-sidebar-foreground/90!'"
            >
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
                class="fa-solid fa-chevron-right inline-flex items-center text-xs leading-none transition-all duration-100 ease-out"
                :class="[
                    isActive(link.link) ? 'text-primary!' : 'text-sidebar-foreground/90!',
                    hoveredLink === link.link
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-3 opacity-0',
                    isDown ? 'translate-x-1' : 'translate-x-0'
                ]"
            />
        </RouterLink>

        <!-- Group -->
        <div
            v-if="link.type === 'group'"

            class="w-full"
        >
            <!-- Group header -->
            <div
                class="border-b-2-border flex w-full cursor-pointer items-center justify-between rounded bg-transparent px-4 py-2 text-sm font-medium hover:bg-accent! hover:brightness-100!"
                :class="[
                    isGroupOpen(link, idx)
                        ? 'text-sidebar-foreground'
                        : 'border-b-2-transparent text-sidebar-foreground/90'
                ]"

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
                    <div class="flex flex-col">
                        <!-- Sublink -->
                        <div
                            v-for="(sublink, idx) in link.links"
                            :key="sublink.label"

                            class="flex"
                        >
                            <div class="relative mr-2 ml-4 w-0.5 shrink-0 self-stretch">
                                <div
                                    class="absolute inset-0 z-0 bg-sidebar-border"
                                    :class="[idx === link.links.length - 1 ? 'rounded-full' : '']"
                                />

                                <div
                                    class="absolute inset-0 z-10 my-auto h-full origin-center rounded-full bg-primary transition-transform duration-300 ease-out"
                                    :class="isActive(sublink.link) ? 'scale-y-100' : 'scale-y-0'"
                                />
                            </div>

                            <RouterLink
                                :key="sublink.link"

                                class="flex w-full cursor-pointer items-center justify-between rounded px-4 py-2 text-sm font-medium no-underline! transition-all hover:bg-accent! hover:brightness-100!"
                                :class="[
                                    isActive(sublink.link)
                                        ? 'bg-primary/10 text-primary! hover:bg-primary/20'
                                        : 'bg-transparent text-sidebar-foreground/90!'
                                ]"
                                :to="sublink.link"

                                @mouseenter="hoverLink(sublink)"
                                @mouseleave="unhoverLink()"
                                @mouseup="onUp()"
                                @mousedown="onDown()"
                                @mouseout="onOut()"
                                @touchstart="onDown()"
                                @touchend="onUp()"
                            >
                                <span class="flex min-w-0 items-center gap-2">
                                    <i
                                        v-if="sublink.leftIcon"

                                        class="fa-solid shrink-0 text-xs"
                                        :class="sublink.leftIcon"
                                    />

                                    <span class="min-w-0 truncate">
                                        {{ sublink.label }}
                                    </span>
                                </span>

                                <i
                                    class="fa-solid fa-chevron-right inline-flex items-center text-xs leading-none transition-all duration-100 ease-out"
                                    :class="[
                                        isActive(sublink.link)
                                            ? 'text-primary!'
                                            : 'text-sidebar-foreground/90!',
                                        hoveredLink === sublink.link
                                            ? 'translate-y-0 opacity-100'
                                            : 'translate-y-3 opacity-0',
                                        isDown ? 'translate-x-1' : 'translate-x-0'
                                    ]"
                                />
                            </RouterLink>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "SideBarLinks",

    props: {
        items: {
            type: Array as PropType<any[]>,
            default: () => []
        }
    },

    data() {
        return {
            hoveredLink: null as string | null,
            isDown: false,
            openGroups: {} as Record<string, boolean>
        };
    },

    methods: {
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

            if (url.searchParams.get("cadastrar") === "true") {
                return String(route.query.cadastrar) === "true";
            }

            return true;
        },

        groupKey(link: any, idx: number): string {
            return String(link.label ?? idx);
        },

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

        toggleGroup(link: any, idx: number) {
            const key = this.groupKey(link, idx);

            this.openGroups = {
                ...this.openGroups,
                [key]: !this.isGroupOpen(link, idx)
            };
        },

        hoverLink(link: any) {
            this.hoveredLink = link.link;
        },

        unhoverLink() {
            this.hoveredLink = null;
        },

        onUp() {
            this.isDown = false;
        },

        onDown() {
            this.isDown = true;
        },

        onOut() {
            this.isDown = false;
        }
    }
});
</script>
