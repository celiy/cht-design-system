<template>
    <div>
        <img 
            :class="[imageClass, openModal ? 'cursor-pointer' : '']"
       
            :src="src"
            :alt="alt"
            :draggable="isDraggable"

            @click="modalOpen = true"
        />

        <Modal
            variant="preview"
            :isOpen="modalOpen"
            
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
import { defineComponent } from "vue";
import Modal from "./Modal.vue";

export default defineComponent({
    name: "Image",

    components: {
        Modal
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
            required: false
        },

        draggable: {
            type: Boolean || String,
            default: true,
            required: false
        },

        imageClass: {
            type: String,
            required: false
        }
    },

    data() {
        return {
            modalOpen: false
        };
    },

    computed: {
        isDraggable() {
            if (typeof(this.draggable) === "boolean") {
                return this.draggable
            }

            if (this.draggable === "true") {
                return true;
            }

            return false;
        }
    }
});
</script>
