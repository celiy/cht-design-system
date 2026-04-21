<style scoped>
.fade-modal-enter-active, .fade-modal-leave-active {
  transition: opacity 0.3s cubic-bezier(.4,0,.2,1);
}
.fade-modal-enter-from, .fade-modal-leave-to {
  opacity: 0;
}
.fade-modal-enter-to, .fade-modal-leave-from {
  opacity: 1;
}
</style>

<template>
    <transition name="fade-modal">
        <div 
            v-show="modalOpen"
            ref="rootRef"

            id="modal" 
            class="fixed z-999 left-0 top-0 w-full h-full bg-black/50 flex"
            :class="{
                'items-center justify-center': variant === 'modal',
                'justify-end': side === 'right'
            }"
        >
            <div
                class="relative bg-card p-0 border"
                ref="modalRef"

                :class="{
                    'lg:w-[30%] md:w-[50%] sm:w-[70%] w-[90%]': size === 'small' && variant === 'modal',
                    'lg:w-[50%] md:w-[70%] sm:w-[80%] w-[92%]': size === 'medium' && variant === 'modal',
                    'lg:w-[60%] md:w-[80%] sm:w-[85%] w-[94%]': size === 'large' && variant === 'modal',
                    'rounded-lg border': variant === 'modal',

                    'lg:w-[30%] md:w-[50%] sm:w-[80%] w-[90%]': variant === 'drawer' && size === 'small',
                    'lg:w-[30%] md:w-[55%] sm:w-[85%] w-[90%]': variant === 'drawer' && size === 'medium',
                    'lg:w-[30%] md:w-[60%] sm:w-[85%] w-[90%]': variant === 'drawer' && size === 'large',
                    'rounded-r-lg border-r': variant === 'drawer' && side === 'left',
                    'rounded-l-lg border-l': variant === 'drawer' && side === 'right',
                }"
                :style="variant === 'drawer' ? 'display: flex; flex-direction: column;' : ''"
            >
                <div class="rounded-t-lg px-4 pt-4 text-foreground font-bold">
                    <div class="flex items-center justify-between">
                        <slot name="header"></slot>

                        <Button
                            variant="transparent"

                            @click="close"
                        >
                            <i class="fa-solid fa-x text-xs"/>
                        </Button>
                    </div>
                </div>

                <div 
                    v-if="$slots.description" 

                    class="text-muted-foreground leading-5 px-4 pb-4"
                >
                    <slot name="description"></slot>
                </div>

                <div 
                    v-if="$slots.body" 
                    
                    class="text-foreground leading-5 px-4 pb-4 overflow-auto"
                    :class="{
                        'mt-2': !$slots.description,
                        'max-h-[60vh]': variant === 'modal' && size !== 'large',
                        'max-h-[80vh]': variant === 'modal' && size === 'large',
                        'flex-1': variant === 'drawer'
                    }"
                >
                    <slot name="body"></slot>
                </div>

                <div 
                    v-if="$slots.footer" 

                    class="bg-muted/50 text-foreground p-4 border-t border-border"
                    :class="{
                        'mt-auto': variant === 'drawer'
                    }"
                >
                    <slot name="footer"></slot>
                </div>
            </div>
        </div>
    </transition>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "./Button.vue";

export default defineComponent({
    name: 'Modal',

    emits: ['update:value'],

    components: {
        Button
    },

    props: {
        variant: {
            type: String as PropType<"modal" | "drawer">,
            default: "modal",
            required: false
        },

        side: {
            type: String as PropType<"left" | "right">,
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
            modalOpen: false
        };
    },

    mounted() {
        
    },

    watch: {
        modalOpen: {
            handler(newVal) {
                if (newVal) {
                    this.$nextTick(() => {
                        setTimeout(() => {
                            if (this.modalOpen) {
                                document.addEventListener("click", this.handleClickOutside);
                            }
                        }, 0);
                    });
                } else {
                    document.removeEventListener("click", this.handleClickOutside);
                }

                this.$emit("update:value", newVal);
            },
            immediate: true
        },

        isOpen: {
            handler(newVal) {
                this.modalOpen = newVal;
            },
            immediate: true
        },
    },

    beforeUnmount() {
        document.removeEventListener("click", this.handleClickOutside);
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

        handleClickOutside(event: MouseEvent) {
            const modal = this.$refs.modalRef as HTMLElement | undefined;

            if (modal && !modal.contains(event.target as Node)) {
                this.close();
            }
        },
    }
});
</script>