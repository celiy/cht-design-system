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
        /**
         * The variant of the confirmationmodal
         */
        variant: {
            type: String as PropType<"destructive" | "success" | "warning" | "info">,
            default: "info",
            required: false
        },

        /**
         * The title of the confirmationmodal
         */
        title: {
            type: String,
            default: "",
            required: false
        },

        /**
         * The description of the confirmationmodal
         */
        description: {
            type: String,
            default: "",
            required: false
        },

        /**
         * The confirm text of the confirmationmodal
         */
        confirmText: {
            type: [String, Boolean] as PropType<string | boolean>,
            default: "Confirmar",
            required: false
        },

        /**
         * Whether the confirmationmodal is cancel text
         */
        cancelText: {
            type: [String, Boolean] as PropType<string | boolean>,
            default: "Cancelar",
            required: false
        },

        /**
         * Whether the confirmationmodal open
         */
        isOpen: {
            type: Boolean,
            default: false,
            required: false
        }
    },

    emits: ["cancel", "confirm", "update:isOpen"],

    computed: {
        /**
         * Gets the icon
         * @returns {string} The icon
         */
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
        /**
         * Sets the open state
         * @param {boolean} next The next state
         * @returns {void}
         */
        setOpen(next: boolean) {
            this.$emit("update:isOpen", next);
        },

        /**
         * Handles the modal open update
         * @param {boolean} next The next state
         * @returns {void}
         */
        onModalOpenUpdate(next: boolean) {
            this.setOpen(next);
        },

        /**
         * Handles the confirm
         * @param {Event} event The event
         * @returns {void}
         */
        onConfirm(event?: Event) {
            event?.stopImmediatePropagation();
            this.$emit("confirm");
            this.setOpen(false);
        },

        /**
         * Handles the cancel
         * @param {Event} event The event
         * @returns {void}
         */
        onCancel(event?: Event) {
            event?.stopImmediatePropagation();
            this.$emit("cancel");
            this.setOpen(false);
        }
    }
});
</script>
