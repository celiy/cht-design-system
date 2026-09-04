<template>
    <div class="w-full">
        <div class="flex flex-col gap-2 w-full">
            <section
                v-for="(message, index) in messages"
                :key="index"

                class="flex w-full max-h-[75vh]"
                :class="messageHasStatus(message) ? 'justify-end' : 'justify-start'"
            >
                <div
                    class="max-w-6/7 sm:max-w-3/4 md:max-w-2/3"
                    :class="[
                        messageHasStatus(message) ? 'bg-primary' : 'bg-secondary',
                        bubbleRadiusClass(index),
                        message.text || (message.images?.length || 0) > 1 ? 'p-3' : '',
                        message.text! && message.images ? '' : ''
                    ]"
                    
                >
                    <ContextMenu
                        :options="messageActionOptions()"

                        @click:value="onMessageAction($event, message)"
                    >
                        <div 
                            v-if="message.images"
                            class="grid gap-1"
                            :class="[
                                message.text ? 'mb-2' : '',
                                (message.images?.length || 0) > 1 ? 'grid-cols-2' : ''
                            ]"
                        >
                            <div
                                v-for="index in maxImages(message.images?.length)"
                                :class="(message.images?.length || 0) > 1 ? 'aspect-square min-w-0 overflow-hidden rounded' : ''"
                            >  
                                <template v-if="message.images?.length <= 4">
                                    <ContextMenu
                                        v-if="index <= 4 && message.images[index - 1]"
                                        :options="imageCopyOptions()"

                                        @click:value="onMessageAction($event, message, message.images[index - 1])"
                                    >
                                        <Image
                                            class="h-full w-full hover:brightness-120 transition-all cursor-pointer"
                                            :imageClass="(message.images?.length || 0) > 1 ? 'size-full object-cover' : ''"
                                            :src="message.images[index - 1]"

                                            @click="openGallery(message.images, index - 1)"
                                        />
                                    </ContextMenu>
                                </template>

                                <template v-else>
                                    <ContextMenu
                                        v-if="index <= 3 && message.images[index - 1]"
                                        :options="imageCopyOptions()"

                                        @click:value="onMessageAction($event, message, message.images[index - 1])"
                                    >
                                        <Image
                                            class="h-full w-full hover:brightness-120 transition-all cursor-pointer"
                                            imageClass="size-full object-cover"
                                            :src="message.images[index - 1]"

                                            @click="openGallery(message.images, index - 1)"
                                        />
                                    </ContextMenu>

                                    <ContextMenu
                                        v-if="index === 4 && message.images[3]"
                                        :options="imageCopyOptions()"

                                        @click:value="onMessageAction($event, message, message.images[3])"
                                    >
                                        <button
                                            type="button"
                                            class="relative h-full w-full text-foreground cursor-pointer rounded hover:brightness-150 transition-all overflow-hidden"
                                            v-tooltip="{ content: 'Ver mais', placement: 'center' }"

                                            @click="openGallery(message.images, 3)"
                                        >
                                            <img
                                                :src="message.images[3]"
                                                alt=""
                                                class="absolute inset-0 w-full h-full object-cover rounded"
                                                style="filter: blur(4px);"
                                                draggable="false"
                                            />
                                            
                                            <span
                                                class="absolute inset-0 bg-card opacity-80 pointer-events-none rounded"
                                            />

                                            <span class="relative z-10">
                                                +{{ message.images.length - 3 }}
                                            </span>
                                        </button>
                                    </ContextMenu>
                                </template>               
                            </div>
                        </div>

                        <ContextMenu
                            v-if="message.text && !message.date && !message.reactions && !message.edited && !messageHasStatus(message)"
                            :options="textCopyOptions()"

                            @click:value="onMessageAction($event, message)"
                        >
                            <small class="font-medium! wrap-break-word">
                                <template
                                    v-for="(part, partIdx) in messageTextParts(message.text)"
                                    :key="partIdx"
                                >
                                    <a
                                        v-if="part.href"
                                        class="text-contrast underline underline-offset-2 hover:opacity-80"
                                        :href="part.href"
                                        target="_blank"
                                        rel="noopener noreferrer"

                                        @click.stop
                                    >{{ part.text }}</a>
                                    <template v-else>{{ part.text }}</template>
                                </template>
                            </small>
                        </ContextMenu>
                        
                        <span 
                            v-else-if="message.date || message.reactions || message.edited || messageHasStatus(message)"
                            class="flex flex-col gap-1"
                        >
                            <ContextMenu
                                v-if="message.text"
                                :options="textCopyOptions()"

                                @click:value="onMessageAction($event, message)"
                            >
                                <small class="font-medium! wrap-break-word">
                                    <template
                                        v-for="(part, partIdx) in messageTextParts(message.text)"
                                        :key="partIdx"
                                    >
                                        <a
                                            v-if="part.href"
                                            class="text-contrast underline underline-offset-2 hover:opacity-80"
                                            :href="part.href"
                                            target="_blank"
                                            rel="noopener noreferrer"

                                            @click.stop
                                        >
                                            {{ part.text }}
                                        </a>

                                        <template v-else>{{ part.text }}</template>
                                    </template>
                                </small>
                            </ContextMenu>

                            <div 
                                class="flex gap-1 items-center"
                                :class="{
                                    'justify-between': message.reactions,
                                    'justify-end': !message.reactions
                                }"
                            >
                                <div 
                                    v-if="message.reactions"
                                    class="flex select-none bg-card/50 font-medium rounded-full px-2 gap-2"
                                >
                                    <template v-if="message.reactions && message.reactions.length > 0">
                                        <span
                                            v-for="reaction in message.reactions.slice(0, 3)"
                                            :key="reaction.reaction"
                                            class="py-1 text-xs hover:brightness-150 transition-all cursor-pointer"
                                        >
                                            {{ reaction.reaction }}
                                            <span v-if="reaction.amount > 1" class="text-muted-foreground">x{{ reaction.amount }}</span>
                                        </span>
                                        
                                        <span
                                            v-if="message.reactions.length > 3"
                                            class="py-1 text-xs hover:brightness-150 transition-all cursor-pointer relative text-muted-foreground"
                                            v-tooltip="{ 
                                                content: message.reactions.slice(3).map(
                                                    r => `${r.reaction}${r.amount > 1 ? ' x' + r.amount : ''}`
                                                ).join(' - '), placement: 'bottom' 
                                            }"
                                        >
                                            +{{ message.reactions.length - 3 }}
                                        </span>
                                    </template>
                        
                                </div>

                                <div class="flex gap-1">
                                    <span 
                                        v-if="message.edited"
                                        class="text-xs text-muted-foreground font-medium select-none"
                                        v-tooltip="{ content: `Editado em ${message.editedAt ? formatDate(message.editedAt) : ''}`, placement: 'bottom' }"
                                    >
                                        Editado
                                    </span>

                                    <span 
                                        v-if="message.date"
                                        class="text-xs text-muted-foreground font-medium"
                                        :class="{
                                            'p-3': message.images?.length === 1 && !message.text,
                                            'pt-3': (message.images?.length || 0) > 1 && !message.text
                                        }"
                                    >
                                        {{ formatDate(message.date) }}
                                    </span>

                                    <span
                                        v-if="messageStatus(message)"
                                        class="text-xs font-medium flex items-center select-none"
                                        v-tooltip="{ content: messageStatusLabel(message), placement: 'bottom' }"
                                    >
                                        <i :class="messageStatusIconClass(message)" />
                                    </span>
                                </div>
                            </div>
                        </span>
                    </ContextMenu>
                </div>
            </section>
        </div>

        <Modal
            variant="preview"
            :isOpen="galleryOpen"

            @update:value="galleryOpen = $event"
        >
            <template #body>
                <Carousel
                    v-if="galleryOpen"

                    class="w-[min(90vw,56rem)]"
                    :showArrows="!$project.device.isMobile"
                    :startIndex="galleryStartIndex"
                    :edge-click="$project.device.isMobile"
                    steps-viewer="advanced"

                    @click:outside="galleryOpen = false"
                >
                    <template
                        v-for="(src, idx) in galleryImages"
                        :key="idx"

                        #[`item-${idx}`]
                    >
                        <img
                            class="max-h-[90vh] max-w-[90vw] object-contain"

                            :src="src"
                            alt=""
                            draggable="false"
                        />
                    </template>
                </Carousel>
            </template>
        </Modal>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Image from "../Image.vue";
import Modal from "../Modal.vue";
import Carousel from "../Carousel.vue";
import ContextMenu from "../custom/ContextMenu.vue";
import type { OptionItem } from "../internal/OptionsList.vue";

type TextPart = {
    text: string;
    href?: string;
};

const URL_IN_TEXT = /https?:\/\/[^\s<]+|www\.[^\s<]+/gi;

type MessageType = {
    text?: string;
    images?: string[];
    reactions?: Array<{ reaction: string; amount: number }>;
    sent?: boolean;
    read?: boolean;
    pending?: boolean;
    failed?: boolean;
    edited?: boolean;
    date?: Date;
    editedAt?: Date;
};

type MessageStatus = "sent" | "read" | "pending" | "failed";

const messageStatusIcons: Record<MessageStatus, string> = {
    sent: "fa-check",
    read: "fa-check-double",
    pending: "fa-clock",
    failed: "fa-xmark"
};

const messageStatusColors: Record<MessageStatus, string> = {
    sent: "text-muted-foreground",
    read: "text-foreground",
    pending: "text-muted-foreground",
    failed: "text-destructive"
};

const messageStatusLabels: Record<MessageStatus, string> = {
    sent: "Enviado",
    read: "Lido",
    pending: "Pendente",
    failed: "Falhou"
};

export default defineComponent({
    name: "Chat",

    components: {
        Image,
        Modal,
        Carousel,
        ContextMenu
    },

    props: {
        messages: {
            type: Array as PropType<MessageType[]>,
            required: true
        }
    },

    data() {
        return {
            galleryOpen: false,
            galleryImages: [] as string[],
            galleryStartIndex: 0
        };
    },

    methods: {
        messageActionOptions(): OptionItem[] {
            return [
                {
                    label: "Responder",
                    icon: "fa-reply",
                    value: "reply"
                },
                {
                    label: "Encaminhar",
                    icon: "fa-share",
                    value: "forward"
                },
                {
                    separator: true
                },
                {
                    label: "Excluir",
                    icon: "fa-trash",
                    value: "delete",
                    variant: "destructive"
                }
            ];
        },

        textCopyOptions(): OptionItem[] {
            return [
                {
                    label: "Copiar texto",
                    icon: "fa-copy",
                    value: "copy-text"
                },
                ...this.messageActionOptions()
            ];
        },

        imageCopyOptions(): OptionItem[] {
            return [
                {
                    label: "Copiar imagem",
                    icon: "fa-copy",
                    value: "copy-image"
                },
                ...this.messageActionOptions()
            ];
        },

        /**
         * Copy uses the right-clicked text or a single image; other actions are visual only.
         */
        onMessageAction(value: string, message: MessageType, imageSrc?: string) {
            if (value === "copy-text" && message.text) {
                void this.copyText(message.text);

                return;
            }

            if (value === "copy-image" && imageSrc) {
                void this.copyImage(imageSrc);
            }
        },

        async copyText(text: string) {
            await navigator.clipboard.writeText(text);
        },

        /**
         * Copies one image file to the clipboard.
         */
        async copyImage(url: string) {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const mime = blob.type || "image/png";

                await navigator.clipboard.write([
                    new ClipboardItem({
                        [mime]: blob
                    })
                ]);
            } catch {
                await navigator.clipboard.writeText(url);
            }
        },

        messageHasStatus(message: MessageType) {
            return this.messageStatus(message) != null;
        },

        /**
         * Resolves a single status when several flags are set: failed, pending, read, then sent.
         */
        messageStatus(message: MessageType): MessageStatus | null {
            if (message.failed) {
                return "failed";
            }

            if (message.pending) {
                return "pending";
            }

            if (message.read) {
                return "read";
            }

            if (message.sent) {
                return "sent";
            }

            return null;
        },

        messageStatusLabel(message: MessageType): string {
            const status = this.messageStatus(message);

            return status ? messageStatusLabels[status] : "";
        },

        messageStatusIconClass(message: MessageType): string {
            const status = this.messageStatus(message);

            if (!status) {
                return "";
            }

            return `fa-solid ${messageStatusIcons[status]} ${messageStatusColors[status]} text-[0.7rem]`;
        },

        /**
         * Splits message text into plain runs and URL links.
         */
        messageTextParts(text?: string): TextPart[] {
            if (!text) {
                return [];
            }

            const parts: TextPart[] = [];
            const matcher = new RegExp(URL_IN_TEXT.source, URL_IN_TEXT.flags);
            let lastIndex = 0;
            let match = matcher.exec(text);

            while (match) {
                if (match.index > lastIndex) {
                    parts.push({ text: text.slice(lastIndex, match.index) });
                }

                let raw = match[0];
                const trailing = raw.match(/[),.;!?]+$/)?.[0] ?? "";

                if (trailing) {
                    raw = raw.slice(0, -trailing.length);
                }

                const href = raw.toLowerCase().startsWith("www.") ? `https://${raw}` : raw;

                parts.push({ text: raw, href });

                if (trailing) {
                    parts.push({ text: trailing });
                }

                lastIndex = match.index + match[0].length;
                match = matcher.exec(text);
            }

            if (lastIndex < text.length) {
                parts.push({ text: text.slice(lastIndex) });
            }

            return parts;
        },

        maxImages(length: number) {
            if (length <= 4) {
                return length;
            }

            if (length > 4) {
                return 4;
            }
        },

        /**
         * Opens a preview modal with a carousel of every image in the message.
         */
        openGallery(images?: string[], startIndex = 0) {
            if (!images?.length) {
                return;
            }

            this.galleryImages = images;
            this.galleryStartIndex = Math.min(Math.max(startIndex, 0), images.length - 1);
            this.galleryOpen = true;
        },

        /**
         * Consecutive same-side bubbles share a group: lone = lg all around;
         * first = lg top / md bottom; middle = md; last = md top / lg bottom.
         */
        bubbleRadiusClass(index: number): string {
            const message = this.messages[index];

            if (!message) {
                return "rounded";
            }

            const side = this.messageHasStatus(message);
            const prev = this.messages[index - 1];
            const next = this.messages[index + 1];
            const prevSame = prev != null && this.messageHasStatus(prev) === side;
            const nextSame = next != null && this.messageHasStatus(next) === side;

            // Lone bubble
            if (!prevSame && !nextSame) {
                return "rounded-xl mb-4";
            }

            // First bubble
            if (!prevSame && nextSame) {
                return "rounded-t-xl rounded-b-md";
            }

            // Middle bubble
            if (prevSame && nextSame) {
                return "rounded-md";
            }

            // Last bubble
            return "rounded-t-md rounded-b-xl mb-4";
        },

        /**
         * Formats a date to a readable format.
         * If the date is today, it will return the time.
         * If the date is yesterday, it will return "Ontem".
         * If the date is more than 2 days ago, it will return the date.
         * @param date 
         */
        formatDate(date: Date) {
            const today = new Date();
            const todayString = today.toDateString();

            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            const yesterdayString = yesterday.toDateString();

            if (date.toDateString() === todayString) {
                // Return time as hh:mm
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            if (date.toDateString() === yesterdayString) {
                return "Ontem";
            }

            // Return date as dd/mm/yyyy hh:mm
            const d = date.getDate().toString().padStart(2, '0');
            const m = (date.getMonth() + 1).toString().padStart(2, '0');
            const y = date.getFullYear();
            const h = date.getHours().toString().padStart(2, '0');
            const min = date.getMinutes().toString().padStart(2, '0');
            return `${d}/${m}/${y} ${h}:${min}`;
        },
    }
});
</script>
