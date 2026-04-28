<template>
    <div 
        ref="rootRef" 
        class="relative inline-block w-full"
        :class="variant === 'default' ? 'shadow-md' : ''"
    >
        <div
            class="w-full flex"
            :class="positionAbove ? 'flex-col-reverse' : 'flex-col'"
        >
            <div
                ref="triggerRef"
                class="cursor-pointer select-none"
                :class="{
                    'rounded-lg': !contentFlush,
                    'rounded-t-lg border-b-0': contentFlush && !positionAbove,
                    'rounded-b-lg border-t-0': contentFlush && positionAbove,

                    'bg-card border': variant === 'default',
                    'border-b rounded-b-none! rounded-none!': variant === 'bordered'
                }"

                @mouseenter="handleMouseEnter"
                @mouseleave="handleMouseLeave"
                @click="toggleOpenClose"
            >
                <span class="flex items-center justify-between text-foreground p-3">
                    <span :class="{ 'underline' : inside }">{{ header }}</span>

                    <div class="flex gap-1">
                        <i
                            v-if="pinnable"
                            v-tooltip="'Fixar para não fechar'"
                            class="fa-solid fa-thumbtack inline-flex items-center justify-center text-xs"
                            :class="{
                                'text-foreground': isPinned,
                                'text-muted-foreground': !isPinned,
                            }"

                            @click.stop="pin"
                        />

                        <i
                            class="fa-solid fa-chevron-down ml-2 text-sm text-muted-foreground transition-transform duration-300 ease-out"
                            :class="{ 'rotate-180' : contentFlush }"
                        />
                    </div>
                </span>
            </div>

            <div
                ref="contentGridRef"
                class="grid w-full transition-[grid-template-rows] duration-300 ease-out"
                :class="isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
                @transitionend.self="onContentGridTransitionEnd"
            >
                <div class="min-h-0 overflow-hidden">
                    <div
                        ref="contentPanelRef"
                        class="shadow-lg p-3 text-foreground leading-5"
                        :class="{
                            'rounded-b-lg border-t-0': !positionAbove,
                            'rounded-t-lg border-b-0': positionAbove,

                            'bg-card border': variant === 'default',
                            'border-b rounded-b-none! rounded-none!': variant === 'bordered'
                        }"
                    >
                        <slot />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "Accordion",

    props: {
        header: {
            type: String,
            required: false
        },

        variant: {
            type: String as PropType<"default" | "bordered">,
            default: "default",
            required: false
        },

        pinnable: {
            type: Boolean,
            default: false,
            required: false
        }
    },

    data() {
        return {
            isOpen: false,
            positionAbove: false,
            maxHeightPx: 280,
            contentFlush: false,
            inside: false,
            isPinned: false
        };
    },

    watch: {
        isOpen(open) {
            if (open) {
                this.$nextTick(() => this.updateContentPlacement());
                window.addEventListener("scroll", this.updateContentPlacement, true);
                window.addEventListener("resize", this.updateContentPlacement);
                document.addEventListener("click", this.handleClickOutside);
            } else {
                window.removeEventListener("scroll", this.updateContentPlacement, true);
                window.removeEventListener("resize", this.updateContentPlacement);
                document.removeEventListener("click", this.handleClickOutside);
            }
        }
    },

    beforeUnmount() {
        document.removeEventListener("click", this.handleClickOutside);
        window.removeEventListener("scroll", this.updateContentPlacement, true);
        window.removeEventListener("resize", this.updateContentPlacement);
    },

    methods: {
        pin() {
            this.isPinned = !this.isPinned;
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

        applyContentPositionFromTrigger() {
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

        updateContentPlacement() {
            if (!this.isOpen) {
                return;
            }

            this.applyContentPositionFromTrigger();
        },

        onContentGridTransitionEnd(e: TransitionEvent) {
            if (e.propertyName !== "grid-template-rows") {
                return;
            }

            if (!this.isOpen) {
                this.contentFlush = false;
            }
        },

        toggleOpenClose() {
            if (!this.isOpen) {
                this.applyContentPositionFromTrigger();
                this.contentFlush = true;
                this.isOpen = true;
                this.$nextTick(() => this.updateContentPlacement());

                return;
            }

            this.isOpen = false;
        },

        handleClickOutside(event: MouseEvent) {
            const root = this.$refs.rootRef as HTMLElement | undefined;
            const contentPanel = this.$refs.contentPanelRef as HTMLElement | undefined;
            const target = event.target as Node;
            const targetEl = event.target instanceof Element ? event.target : (event.target as Node).parentElement;

            /* Teleported Dropdown panels are not inside rootRef */
            if (targetEl?.closest?.("[data-dropdown-floating-panel]")) {
                return;
            }

            if (root?.contains(target) || contentPanel?.contains(target)) {
                return;
            }

            if (this.isPinned) {
                return;
            }

            this.close();
        },

        handleMouseEnter() {
            this.inside = true;
        },

        handleMouseLeave() {
            this.inside = false;
        },

        open() {
            this.applyContentPositionFromTrigger();
            this.contentFlush = true;
            this.isOpen = true;
            this.$nextTick(() => this.updateContentPlacement());
        },

        close() {
            this.isOpen = false;
        }
    }
});
</script>
