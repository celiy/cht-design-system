<template>
    <div 
        class="relative w-full overflow-hidden"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
    >
        <Modal
            size="large"
            :isOpen="modalOpen"
            @update:value="(value) => {modalOpen = value}"
        >
            <template #header> 
                {{ modalImage.alt || 'Imagem' }}
            </template>

            <template #body>
                <div class="flex min-h-0 w-full flex-1 items-center justify-center">
                    <img
                        :src="modalImage.src"
                        :alt="modalImage.alt"
                        class="max-h-full max-w-full object-contain select-none"
                        draggable="false"
                    />
                </div>
            </template>
        </Modal>

        <div 
            class="flex"
            :class="{ 'transition-transform duration-500 ease-in-out': !isSwiping }"
            :style="{ transform: `translateX(calc(-${pos * 100}% + ${swipeOffset}px))` }"
        >
            <div 
                v-for="(item, index) in images" 
                :key="index"

                class="w-full shrink-0 flex justify-center items-center p-4"
            >
                <img 
                    :src="item.src" 
                    :alt="item.alt"
                    class="max-h-[50vh] rounded-lg select-none cursor-pointer"
                    draggable="false"
                    
                    @click="openModal(item)"
                />
            </div>
        </div>

        <Button 
            type="button" 
            variant="outline"
            class="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 z-10"
            size="medium"
            shape="rounded"
            :hoverEffect="false"

            @click="prev"
        >
            <i class="fa-solid fa-arrow-left" />
        </Button>

        <Button 
            type="button"
            variant="outline"
            class="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 z-10"
            size="medium"
            shape="rounded"
            :hoverEffect="false"
            
            @click="next"
        >
            <i class="fa-solid fa-arrow-right" />
        </Button>

        <div 
            class="w-full absolute bottom-6 flex justify-center"

            @mouseenter="() => hoverSelector = true"
            @mouseleave="() => hoverSelector = false"
        >
            <div class="flex justify-center gap-1.5 bg-black/20 w-fit p-1 rounded-lg">
                <div 
                    v-for="index in images.length"

                    class="h-2 rounded-full cursor-pointer transition-all"
                    :class="{
                        'w-2 bg-foreground/40 hover:bg-foreground/60': index !== pos + 1 && !hoverSelector,
                        'w-4 bg-foreground/50 hover:bg-foreground/60': index !== pos + 1 && hoverSelector,
                        'w-4 bg-foreground/60 hover:bg-foreground/80': index === pos + 1 && !hoverSelector,
                        'w-8 bg-foreground/90 hover:bg-foreground/80': index === pos + 1 && hoverSelector,
                        'h-4': hoverSelector
                    }"

                    @click="goTo(index - 1)"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "./Button.vue";
import Modal from "./Modal.vue";

export default defineComponent({
    name: "Carousel",

    components: { Button, Modal },

    props: {
        images: {
            type: Array as PropType<{ src: string, alt: string }[]>,
            required: true
        }
    },

    data() {
        return {
            pos: 0,
            hoverSelector: false,
            touchStartX: 0,
            swipeOffset: 0,
            isSwiping: false,
            modalOpen: false,
            modalImage: { src: '', alt: '' }
        };
    },

    methods: {
        prev() {
            this.pos = this.pos > 0 ? this.pos - 1 : this.images.length - 1;
        },

        next() {
            this.pos = this.pos < this.images.length - 1 ? this.pos + 1 : 0;
        },

        goTo(to: number) {
            this.pos = to;
        },

        onTouchStart(e: TouchEvent) {
            const touch = e.touches[0];
            
            if (!touch) {
                return;
            }

            this.touchStartX = touch.clientX;
            this.isSwiping = true;
            this.swipeOffset = 0;
        },

        onTouchMove(e: TouchEvent) {
            const touch = e.touches[0];

            if (!touch) {
                return;
            }

            this.swipeOffset = touch.clientX - this.touchStartX;
        },

        onTouchEnd() {
            this.isSwiping = false;
            const threshold = 50;

            if (this.swipeOffset < -threshold) {
                this.next();
            } else if (this.swipeOffset > threshold) {
                this.prev();
            }

            this.swipeOffset = 0;
        },

        openModal(image: { src: string, alt: string }) {
            this.modalImage = { src: image.src, alt: image.alt };
            this.modalOpen = true;
        },
    },
});
</script>
