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
        /**
         * Whether the image is src
         */
        src: {
            type: String,
            required: false
        },

        /**
         * Whether the image is alt
         */
        alt: {
            type: String,
            required: false
        },

        /**
         * Whether the image is open modal
         */
        openModal: {
            type: Boolean,
            default: false,
            required: false
        },

        /**
         * Whether the image is draggable
         */
        draggable: {
            type: Boolean,
            default: true,
            required: false
        },

        /**
         * The image class of the image
         */
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
        /**
         * Checks if draggable
         * @returns {boolean} True if is draggable
         */
        isDraggable(): boolean {
            return this.draggable === true;
        },

        /**
         * Gets the show skeleton
         * @returns {unknown} The show skeleton
         */
        showSkeleton(): boolean {
            return Boolean(this.src) && !this.hasLoaded && !this.hasError;
        },

        /**
         * Gets the display aspect
         * @returns {unknown} The display aspect
         */
        displayAspect(): string | undefined {
            if (this.aspectRatio === undefined || this.aspectRatio === "") {
                return undefined;
            }

            return String(this.aspectRatio);
        },

        /**
         * Gets the root style
         * @returns {unknown} The root style
         */
        rootStyle(): Record<string, string> {
            if (!this.displayAspect) {
                return {};
            }

            return { aspectRatio: this.displayAspect };
        },

        /**
         * Gets the img layout class
         * @returns {unknown} The img layout class
         */
        imgLayoutClass(): string {
            if (this.displayAspect) {
                return "absolute inset-0 size-full";
            }

            return "relative block";
        },

        /**
         * Gets the img state class
         * @returns {unknown} The img state class
         */
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

        /**
         * Show skeleton
         * @param {boolean} isLoading The is loading
         * @returns {void}
         */
        showSkeleton(isLoading: boolean) {
            this.$emit("update:loading", isLoading);
        }
    },

    /**
     * Mounts the component
     * @returns {void}
     */
    mounted() {
        this.syncFromImgElement();
    },

    methods: {
        /**
         * Img element
         * @returns {void}
         */
        imgElement(): HTMLImageElement | undefined {
            return this.$refs.imgEl as HTMLImageElement | undefined;
        },

        /**
         * Sync from img element
         * @returns {void}
         */
        syncFromImgElement() {
            const el = this.imgElement();

            if (!el || !this.src) {
                return;
            }

            if (el.complete && el.naturalWidth > 0) {
                this.applyLoaded(el);
            }
        },

        /**
         * Apply loaded
         * @param {HTMLImageElement} _el The _el
         * @returns {void}
         */
        applyLoaded(_el: HTMLImageElement) {
            if (this.hasLoaded) {
                return;
            }

            this.hasLoaded = true;
            this.hasError = false;
            this.$emit("load");
        },

        /**
         * Handles the load
         * @param {Event} event The event
         * @returns {void}
         */
        onLoad(event: Event) {
            const el = event.target;

            if (!(el instanceof HTMLImageElement)) {
                return;
            }

            this.applyLoaded(el);
        },

        /**
         * Handles the error
         * @returns {void}
         */
        onError() {
            this.hasError = true;
            this.hasLoaded = false;
            this.$emit("error");
        },

        /**
         * Handles the image click
         * @param {MouseEvent} event The event
         * @returns {void}
         */
        onImageClick(event: MouseEvent) {
            this.$emit("click", event);

            if (this.openModal) {
                this.modalOpen = true;
            }
        }
    }
});
</script>
