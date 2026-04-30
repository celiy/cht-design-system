<template>
    <Modal
        variant="modal"
        :size="size"
        :isOpen="isOpen"
        :color="variant"

        @update:value="onModalOpenUpdate"
    >
        <template #header>
            <span class="flex gap-2 items-center">
                <i
                    :class="[
                        variant === 'warning' && 'fa-solid fa-triangle-exclamation text-warning',
                        variant === 'destructive' && 'fa-solid fa-circle-xmark text-destructive',
                        variant === 'success' && 'fa-solid fa-circle-check text-success',
                        (variant === 'primary' || !variant) && 'fa-solid fa-circle-question text-primary'
                    ]"
                />
                
                {{ title }}
            </span>
        </template>

        <template #description>
            {{ description }}
        </template>

        <template #body>
            {{ body }}
        </template>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button
                    v-if="cancelText"
                    variant="transparent"

                    @click="onCancel"
                >
                    {{ cancelText }}
                </Button>

                <Button
                    v-if="confirmText"
                    :variant="variant"

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

    emits: ["cancel", "confirm", "update:isOpen"],

    props: {
        variant: {
            type: String as PropType<"destructive" | "success" | "warning" | "primary">,
            default: "secondary",
            required: false
        },

        size: {
            type: String as PropType<"small" | "medium" | "large">,
            default: "small",
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

        body: {
            type: String,
            default: "",
            required: false
        },

        confirmText: {
            type: [String, Boolean] as PropType<string | boolean>,
            default: "Confirmar",
            required: false
        },
        
        cancelText: {
            type: [String, Boolean] as PropType<string | boolean>,
            default: "Cancelar",
            required: false
        },

        isOpen: {
            type: Boolean,
            default: false,
            required: false
        }
    },

    computed: {
        toneVariant(): "destructive" | "success" | "warning" | "secondary" | "primary" {
            const v = this.variant;

            if (v === "destructive" || v === "success" || v === "warning") {
                return v;
            }

            if (v === "primary") {
                return "primary";
            }

            return "primary";
        }
    },

    methods: {
        setOpen(next: boolean) {
            this.$emit("update:isOpen", next);
        },

        onModalOpenUpdate(next: boolean) {
            this.setOpen(next);
        },

        onConfirm() {
            this.setOpen(false);
            this.$emit("confirm");
        },

        onCancel() {
            this.setOpen(false);
            this.$emit("cancel");
        }
    }
});
</script>