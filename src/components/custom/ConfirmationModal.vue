<template>
    <Modal 
        :isOpen="isOpen" 
        :variant="variant" 
    >
        <template #header> {{ title }} </template>

        <template #body> {{ description }} </template>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button 
                    variant="secondary" 
                    @click="onCancel"
                > 
                    {{ cancelText }} 
                </Button>

                <Button 
                    variant="primary" 
                    @click="onConfirm"
                > 
                    {{ confirmText }} 
                </Button>
            </div>
        </template>
    </Modal>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Modal from "../Modal.vue";
import Button from "../Button.vue";

export default defineComponent({
    name: "ConfirmationModal",

    components: {
        Modal,
        Button
    },

    emits: ["cancel", "confirm"],

    props: {
        variant: {
            type: String as PropType<"destructive" | "success" | "warning" | "normal">,
            default: "normal",
            required: false
        },

        title: {
            type: String,
            default: "",
            required: false
        },

        description: {
            type: String,
            default: "",
            required: false
        },

        confirmText: {
            type: String,
            default: "Confirm",
            required: false
        },
        
        cancelText: {
            type: String,
            default: "Cancel",
            required: false
        },

        isOpen: {
            type: Boolean,
            default: false,
            required: false
        }
    },

    data() {
        return {
    
        };
    },

    mounted() {

    },

    watch: {

    },

    methods: {
        onConfirm() {
            this.$emit("confirm");
        },

        onCancel() {
            this.$emit("cancel");
        }
    }, 
    
    computed: {
    
    }
});
</script>