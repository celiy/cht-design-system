<template>
    <Modal
        variant="blank"
        size="extra-small"
        :is-open="isOpen"
        :color="variant"
        :keep-open="true"

        @update:value="onModalOpenUpdate"
    >
        <template #body>
            <div class="flex w-full flex-col items-center justify-center gap-2 p-4">
                <ItemIcon
                    class="w-fit"
                    :variant="variant"
                    :icon="icon"
                    type="card"
                />

                <p v-if="title">
                    <b>{{ title }}</b>
                </p>

                <p
                    v-if="description"

                    class="text-center text-muted-foreground!"
                >
                    {{ description }}
                </p>
            </div>

            <slot name="body" />
        </template>

        <template
            v-if="$slots.footer || cancelText || confirmText"
            #footer
        >
            <div class="flex gap-2">
                <Button
                    v-if="cancelText"

                    class="w-full"

                    @click="onCancel"
                >
                    {{ cancelText }}
                </Button>

                <Button
                    v-if="confirmText"

                    class="w-full"
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
import ItemIcon from "../ItemIcon.vue";

export default defineComponent({
    name: "ConfirmationModal",

    components: {
        Modal,
        Button,
        ItemIcon
    },

    props: {
        variant: {
            type: String as PropType<"destructive" | "success" | "warning" | "info">,
            default: "info",
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

    emits: ["cancel", "confirm", "update:isOpen"],

    computed: {
        icon() {
            switch (this.variant) {
                case "success":
                    return "fa-circle-check";
                case "warning":
                    return "fa-triangle-exclamation";
                case "destructive":
                    return "fa-trash";
                case "info":
                    return "fa-circle-info";
                default:
                    return "fa-circle-question";
            }
        }
    },

    methods: {
        setOpen(next: boolean) {
            this.$emit("update:isOpen", next);
        },

        onModalOpenUpdate(next: boolean) {
            this.setOpen(next);
        },

        onConfirm(event?: Event) {
            event?.stopImmediatePropagation();
            this.$emit("confirm");
            this.setOpen(false);
        },

        onCancel(event?: Event) {
            event?.stopImmediatePropagation();
            this.$emit("cancel");
            this.setOpen(false);
        }
    }
});
</script>
