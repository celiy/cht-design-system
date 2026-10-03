<template>
    <div
        ref="rootRef"

        class="relative inline-block w-full"
    >
        <div
            class="flex w-full flex-col"
            :class="[backgroundClass, borderClass, shellClass]"
        >
            <!-- Header -->
            <div
                class="cursor-pointer select-none transition-all"
                :class="{
                    'rounded-none': variant === 'bordered',
                    'translate-y-[0.1rem]': isPressed
                }"

                @mouseenter="handleMouseEnter"
                @mouseleave="handleHeaderLeave"
                @mousedown="handlePressStart"
                @mouseup="handlePressEnd"
                @touchstart="handlePressStart"
                @touchend="handlePressEnd"
                @touchleave="handlePressEnd"
                @click="toggleOpenClose"
            >
                <span
                    class="flex items-center justify-between text-foreground p-3 transition-all"
                >
                    <!-- Header text -->
                    <span 
                        class="text-base" 
                        :class="{ 'underline' : inside }"
                    >
                        {{ header }}
                    </span>

                    <div class="flex gap-1">
                        <!-- Pin button -->
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

                        <!-- Chevron down icon -->
                        <i
                            class="fa-solid fa-chevron-down ml-2 text-sm text-muted-foreground transition-transform duration-300 ease-out"
                            :class="{ 'rotate-180' : isOpen }"
                        />
                    </div>
                </span>
            </div>

            <!-- Content -->
            <div
                class="grid w-full transition-[grid-template-rows] duration-300 ease-out"
                :class="isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            >
                <div class="min-h-0 overflow-hidden">
                    <div
                        ref="contentPanelRef"

                        class="p-3"
                        :class="{
                            'rounded-none': variant === 'bordered'
                        }"
                    >
                        <slot />
                    </div>
                </div>
            </div>

            <!-- Border at the bottom -->
            <div
                v-if="variant === 'bordered'"

                class="h-px w-full bg-border"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
    name: "Accordion",

    props: {
        /**
         * The header of the accordion
         */
        header: {
            type: String,
            required: false
        },

        /**
         * The variant of the accordion
         */
        variant: {
            type: String as PropType<"default" | "bordered">,
            default: "default",
            required: false
        },

        /**
         * Whether the accordion is pinnable
         */
        pinnable: {
            type: Boolean,
            default: false,
            required: false
        },

        /**
         * The background style of the accordion
         */
        backgroundStyle: {
            type: String,
            required: false
        },

        /**
         * The border style of the accordion
         */
        borderStyle: {
            type: String,
            required: false
        }
    },

    data() {
        return {
            isOpen: false,
            inside: false,
            isPinned: false,
            isPressed: false
        };
    },

    computed: {
        /**
         * Gets the background class
         * @returns {string} The background class
         */
        backgroundClass() {
            if (this.backgroundStyle) {
                return this.backgroundStyle;
            }

            return {
                "bg-card": this.variant === "default"
            };
        },

        /**
         * Gets the border class
         * @returns {string} The border class
         */
        borderClass() {
            if (this.borderStyle) {
                return this.borderStyle;
            }

            return {
                border: this.variant === "default"
            };
        },

        /**
         * Gets the shell class
         * @returns {string} The shell class
         */
        shellClass() {
            return {
                "overflow-hidden rounded shadow-md": this.variant === "default"
            };
        }
    },

    watch: {
        /**
         * Handles the open change
         * @param {boolean} open The open
         * @returns {void}
         */
        isOpen(open) {
            if (open) {
                document.addEventListener("click", this.handleClickOutside);
            } else {
                document.removeEventListener("click", this.handleClickOutside);
            }
        }
    },

    /**
     * Unmounts the component
     * @returns {void}
     */
    beforeUnmount() {
        document.removeEventListener("click", this.handleClickOutside);
    },

    methods: {
        /**
         * Pins the accordion
         * @returns {void}
         */
        pin() {
            this.isPinned = !this.isPinned;
        },

        /**
         * Toggles the open close
         * @returns {void}
         */
        toggleOpenClose() {
            this.isOpen = !this.isOpen;
        },

        /**
         * Handles the click outside
         * @param {MouseEvent} event The event
         * @returns {void}
         */
        handleClickOutside(event: MouseEvent) {
            const root = this.$refs.rootRef as HTMLElement | undefined;
            const contentPanel = this.$refs.contentPanelRef as HTMLElement | undefined;
            const target = event.target as Node;
            const targetEl = event.target instanceof Element ? event.target : (event.target as Node).parentElement;

            // Teleported Dropdown panels are not inside rootRef
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

        /**
         * Handles the mouse enter
         * @returns {void}
         */
        handleMouseEnter() {
            this.inside = true;
        },

        /**
         * Handles the mouse leave
         * @returns {void}
         */
        handleMouseLeave() {
            this.inside = false;
        },

        /**
         * Handles the header leave
         * @returns {void}
         */
        handleHeaderLeave() {
            this.inside = false;
            this.handlePressEnd();
        },

        /**
         * Handles the press start
         * @returns {void}
         */
        handlePressStart() {
            this.isPressed = true;
        },

        /**
         * Handles the press end
         * @returns {void}
         */
        handlePressEnd() {
            this.isPressed = false;
        },

        /**
         * Opens the accordion
         * @returns {void}
         */
        open() {
            this.isOpen = true;
        },

        /**
         * Closes the accordion
         * @returns {void}
         */
        close() {
            this.isOpen = false;
        }
    }
});
</script>
