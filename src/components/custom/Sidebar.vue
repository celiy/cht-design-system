<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>

<template>
    <div class="flex w-full min-h-screen">
        <Transition name="fade">
            <div
                v-if="open && isMobile"
                class="fixed inset-0 bg-black/50 z-40 md:hidden"
                aria-hidden="true"
                @click="closeNav"
            />
        </Transition>

        <nav 
            :class="[
                'fixed top-0 left-0 z-50 h-screen bg-sidebar overflow-x-hidden overflow-y-auto transition-[width] duration-300 ease-out box-border border-r border-sidebar-border',
                open && isMobile ? 'w-[85%] max-w-[320px]' : ''
            ]"
            :style="sidebarStyle"
        >
            <div class="flex flex-col pt-4 px-2 select-none">
                <div
                    class="w-full bg-transparent hover:bg-sidebar-accent transition-all px-4 py-2 rounded-lg text-sidebar-primary-foreground text-sm font-semibold"
                >
                    <h5>
                        Titulo
                    </h5>

                    <div class="text-xs">
                        <p class="text-muted-foreground! font-semibold!">
                            Descrição do titulo
                        </p>
                    </div>
                </div>

                <div 
                    v-for="(link, idx) in resolvedNav"
                    :key="idx"
                    class="w-full"
                >
                    <div
                        v-if="link.type === 'section'"
        
                        class="w-full text-muted-foreground text-xs font-semibold pl-4 mt-6 mb-1"
                    >
                        {{ link.label }}
                    </div>

                    <div
                        v-if="link.type === 'link'"
        
                        class="w-full bg-transparent hover:bg-sidebar-accent transition-all px-4 py-2 rounded-lg text-sidebar-primary-foreground text-sm font-medium cursor-pointer"

                        @click="link.link && navigateTo(link.link)"
                    >
                        {{ link.label }}
                    </div>

                    <div
                        v-if="link.type === 'group'"

                        class="w-full"
                    >
                        <div
                            class="w-full flex items-center justify-between cursor-pointer bg-transparent hover:bg-sidebar-accent transition-all px-4 py-2 rounded-lg text-sidebar-primary-foreground text-sm font-medium"
                            
                            @click="link.open = !link.open"
                        >
                            <span>{{ link.label }}</span>

                            <i
                                :class="[
                                    'fa-solid transition-transform duration-300 text-xs',
                                    link.open ? 'fa-chevron-down rotate-180' : 'fa-chevron-down'
                                ]"
                            />
                        </div>

                        <transition name="fade">
                            <div
                                v-show="link.open"
                                class="pl-4 flex flex-col"
                            >
                                <div
                                    v-for="sublink in link.links"
                                    :key="sublink.label"

                                    class="w-full bg-transparent hover:bg-sidebar-accent transition-all px-4 py-2 rounded-lg text-sidebar-primary-foreground text-sm font-medium cursor-pointer"
                                    
                                    @click="navigateTo(sublink.link)"
                                >
                                    {{ sublink.label }}
                                </div>
                            </div>
                        </transition>
                    </div>
                </div>
            </div>
        </nav>

        <div 
            class="flex-1 w-full min-h-screen box-border transition-[margin-left] duration-300 ease-out flex flex-col"
            :style="mainContentStyle"
        >
            <div class="sticky top-0 z-10 shrink-0 bg-background mb-6">
                <div 
                    class="px-2 pt-2 w-full flex"
                    :class="{'justify-end': isMobile}"
                >
                    <Button 
                        variant="transparent" 
                        @click="toggleOpenClose"
                    >
                        <i class="fa-solid fa-bars" />
                    </Button>
                </div>

                <div class="separator mt-2" />
            </div>

            <div class="container flex-1">
                <slot />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "../Button.vue";

/** Fallback quando `navItems` não é passado (storybook / uso isolado). */
const DEFAULT_NAV_LINKS = [
    {
        type: "section" as const,
        label: "Dashboard"
    },
    {
        type: "link" as const,
        label: "Dev design",
        link: "/devDesign"
    },
    {
        type: "link" as const,
        label: "Dev form",
        link: "/devForm"
    },

    {
        type: "section" as const,
        label: "Groups section"
    },
    {
        type: "group" as const,
        label: "Group example",
        open: false,
        links: [
            {
                label: "Teste",
                link: "/test"
            },
            {
                label: "New",
                link: "/new"
            }
        ]
    },

    {
        type: "section" as const,
        label: "End section"
    },
    {
        type: "link" as const,
        label: "Example",
        link: "/exit"
    }
];

export default defineComponent({
    name: "Sidebar",

    emits: ["click"],

    components: {
        Button
    },

    props: {
        proptype: {
            type: String as PropType<"normal" | "not-normal">,
            default: "normal",
            required: false
        },

        sidebarWidth: {
            type: Number,
            default: 250
        },

        /**
         * Navegação da sidebar. Se vazio ou omitido, usa `DEFAULT_NAV_LINKS`.
         * O `cht-base` passa itens por contexto (dev vs cliente).
         */
        navItems: {
            type: Array as PropType<unknown[]>,
            required: false
        }
    },

    data() {
        return {
            open: true,
            isMobile: false
        };
    },

    computed: {
        resolvedNav(): typeof DEFAULT_NAV_LINKS {
            const items = this.navItems;

            if (items && Array.isArray(items) && items.length > 0) {
                return items as unknown as typeof DEFAULT_NAV_LINKS;
            }

            return DEFAULT_NAV_LINKS;
        },

        sidebarStyle(): { width?: string } {
            if (!this.open) {
                return { width: '0px' };
            }
            
            if (this.isMobile) {
                return {};
            }

            return { width: this.sidebarWidth + 'px' };
        },

        mainContentStyle(): { marginLeft: string } {
            if (this.isMobile || !this.open) {
                return { marginLeft: '0px' };
            }

            return { marginLeft: this.sidebarWidth + 'px' };
        }
    },

    mounted() {
        this.isMobile = window.matchMedia('(max-width: 767px)').matches;

        window.matchMedia('(max-width: 767px)').addEventListener('change', (e) => {
            this.isMobile = e.matches;
        });
    },

    methods: {
        toggleOpenClose() {
            this.open = !this.open;
        },

        openNav() {
            this.open = true;
        },

        closeNav() {
            this.open = false;
        },

        navigateTo(link: string) {
            (this as any).$router?.push(link);
        }
    }
});
</script>