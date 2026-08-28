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
                {{ title }}
            </span>

            <slot name="header" />
        </template>

        <template #description>
            {{ description }}

            <slot name="description" />
        </template>

        <template #body>
            <p>{{ body }}</p>

            <slot name="body" />
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

            <slot name="footer" />
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