<template>
    <div
        class="relative overflow-hidden"
        :style="rootStyle"
    >
        <Skeleton
            v-if="showSkeleton"

            class="absolute inset-0 h-full w-full"

            type="card"
        />

        <img
            v-if="src"
            ref="imgEl"

            class="max-w-full"

            :class="[imageClass, imgStateClass, imgLayoutClass]"
            :src="src"
            :alt="alt"
            :draggable="isDraggable"

            @load="onLoad"
            @error="onError"
            @click="onImageClick"
        />

        <Modal
            variant="preview"
            :is-open="modalOpen"

            @update:value="modalOpen = $event"
        >
            <template #body>
                <img
                    class="max-h-[90vh] max-w-[90vw] object-contain"

                    :src="src"
                    :alt="alt"
                    :draggable="isDraggable"
                />
            </template>
        </Modal>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Modal from "./Modal.vue";
import Skeleton from "./Skeleton.vue";

export default defineComponent({
    name: "Image",

    components: {
        Modal,
        Skeleton
    },

    props: {
        src: {
            type: String,
            required: false
        },

        alt: {
            type: String,
            required: false
        },

        openModal: {
            type: Boolean,
            default: false,
            required: false
        },

        draggable: {
            type: Boolean,
            default: true,
            required: false
        },

        imageClass: {
            type: String,
            required: false
        },

        /**
         * CSS aspect ratio used as placeholder while the file loads (`16/9`, `1`, …).
         * If omitted, uses 16/9 until `load`, then the intrinsic ratio.
         */
        aspectRatio: {
            type: [String, Number] as PropType<string | number>,
            required: false
        }
    },

    emits: ["click", "load", "error", "update:loading"],

    data() {
        return {
            modalOpen: false,
            hasLoaded: false,
            hasError: false
        };
    },

    computed: {
        isDraggable(): boolean {
            return this.draggable === true;
        },

        showSkeleton(): boolean {
            return Boolean(this.src) && !this.hasLoaded && !this.hasError;
        },

        displayAspect(): string | undefined {
            if (this.aspectRatio === undefined || this.aspectRatio === "") {
                return undefined;
            }

            return String(this.aspectRatio);
        },

        rootStyle(): Record<string, string> {
            if (!this.displayAspect) {
                return {};
            }

            return { aspectRatio: this.displayAspect };
        },

        imgLayoutClass(): string {
            if (this.displayAspect) {
                return "absolute inset-0 size-full";
            }

            return "relative block";
        },

        imgStateClass(): Record<string, boolean> {
            return {
                "cursor-pointer": this.openModal,
                "opacity-0": this.showSkeleton
            };
        }
    },

    watch: {
        src: {
            handler() {
                this.hasLoaded = false;
                this.hasError = false;
                this.$emit("update:loading", Boolean(this.src));
                this.$nextTick(() => {
                    this.syncFromImgElement();
                });
            },

            immediate: true
        },

        showSkeleton(isLoading: boolean) {
            this.$emit("update:loading", isLoading);
        }
    },

    mounted() {
        this.syncFromImgElement();
    },

    methods: {
        imgElement(): HTMLImageElement | undefined {
            return this.$refs.imgEl as HTMLImageElement | undefined;
        },

        syncFromImgElement() {
            const el = this.imgElement();

            if (!el || !this.src) {
                return;
            }

            if (el.complete && el.naturalWidth > 0) {
                this.applyLoaded(el);
            }
        },

        applyLoaded(el: HTMLImageElement) {
            if (this.hasLoaded) {
                return;
            }

            this.hasLoaded = true;
            this.hasError = false;
            this.$emit("load");
        },

        onLoad(event: Event) {
            const el = event.target;

            if (!(el instanceof HTMLImageElement)) {
                return;
            }

            this.applyLoaded(el);
        },

        onError() {
            this.hasError = true;
            this.hasLoaded = false;
            this.$emit("error");
        },

        onImageClick(event: MouseEvent) {
            this.$emit("click", event);

            if (this.openModal) {
                this.modalOpen = true;
            }
        }
    }
});
</script>
