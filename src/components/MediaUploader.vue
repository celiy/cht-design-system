<template>
    <div class="w-full flex flex-col gap-3">
        <label
            v-if="label"
            :for="id"
            class="text-foreground font-semibold text-sm"
        >
            {{ label }}
        </label>

        <input
            :id="id"
            ref="fileInputRef"
            class="hidden"
            type="file"
            :accept="acceptAttribute"
            :multiple="multiple"
            :disabled="disabled"
            @change="onInputChange"
        />

        <button
            type="button"
            class="w-full border border-dashed rounded p-4 transition-all text-left bg-card"
            :class="{
                'border-primary/70 bg-primary/10': isDragActive && !disabled,
                'border-border/70 hover:border-border': !isDragActive && !disabled,
                'opacity-60 cursor-not-allowed': disabled
            }"
            :disabled="disabled"
            @click="openFilePicker"
            @dragenter.prevent="onDragEnter"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onDrop"
        >
            <div class="flex items-start gap-3">
                <i class="fa-solid fa-cloud-arrow-up text-primary mt-0.5" />

                <div class="flex flex-col gap-1">
                    <span class="text-sm font-medium text-foreground">
                        Clique para selecionar ou arraste arquivos aqui
                    </span>

                    <span class="text-xs text-muted-foreground">
                        {{ rulesLabel }}
                    </span>
                </div>
            </div>
        </button>

        <div v-if="items.length > 0" class="w-full flex flex-wrap gap-3">
            <div
                v-for="item in items"
                :key="item.key"
                class="media-thumb"
            >
                <div class="relative w-[88px] h-[88px] rounded border border-border/60 bg-input/20 overflow-hidden">
                    <button
                        type="button"
                        class="absolute top-1 right-1 w-5 h-5 rounded-full bg-popover border border-border/80 text-muted-foreground hover:text-foreground text-[11px] leading-none z-10 cursor-pointer"
                        title="Remover"
                        aria-label="Remover"
                        :disabled="disabled"
                        @click="removeFile(item.key)"
                    >
                        <i class="fa-solid fa-xmark" />
                    </button>

                    <Image
                        v-if="item.previewUrl"

                        class="h-full w-full"
                        image-class="h-full w-full object-cover"
                        :src="item.previewUrl"
                        :alt="item.file.name"
                        :draggable="false"
                    />

                    <div
                        v-else
                        class="w-full h-full flex items-center justify-center relative"
                    >
                        <i :class="item.iconClass" class="text-4xl opacity-90" />

                        <span
                            v-if="item.isUnknownType"
                            class="absolute text-[10px] font-semibold uppercase bg-background/80 px-1 rounded"
                        >
                            {{ item.extensionLabel }}
                        </span>
                    </div>
                </div>

                <span
                    class="block mt-1 text-xs text-muted-foreground truncate"
                    :title="item.file.name"
                >
                    {{ item.file.name }}
                </span>
            </div>
        </div>

        <button
            type="button"
            class="w-full text-left p-2.5 rounded border border-border/70 bg-input/30 transition-all text-sm text-foreground"
            :class="{ 'opacity-60 cursor-not-allowed': disabled }"
            :disabled="disabled"
            @click="openFilePicker"
        >
            <span class="block truncate">
                {{ fileInputLabel }}
            </span>
        </button>

        <small   
            v-if="helperText"
            class="text-muted-foreground!"
        >
            {{ helperText }}
        </small>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Image from "./Image.vue";

type RejectedFileReason = "invalid-type" | "max-files";

interface RejectedFile {
    file: File;
    reason: RejectedFileReason;
}

interface MediaItem {
    key: string;
    file: File;
    previewUrl?: string;
    iconClass: string;
    isUnknownType: boolean;
    extensionLabel: string;
}

export default defineComponent({
    name: "MediaUploader",

    components: {
        Image
    },

    props: {
        /**
         * The id of the media uploader
         */
        id: {
            type: String,
            required: true
        },

        /**
         * The label of the media uploader
         */
        label: {
            type: String,
            required: false
        },

        /**
         * Whether the media uploader is helper text
         */
        helperText: {
            type: String,
            required: false
        },

        /**
         * Whether the media uploader is disabled
         */
        disabled: {
            type: Boolean,
            default: false,
            required: false
        },

        /**
         * Whether the media uploader is multiple
         */
        multiple: {
            type: Boolean,
            default: true,
            required: false
        },

        /**
         * The max files of the media uploader
         */
        maxFiles: {
            type: Number,
            required: false
        },

        /**
         * The accept of the media uploader
         */
        accept: {
            type: [String, Array] as PropType<string | string[]>,
            required: false
        },

        /**
         * The value of the media uploader
         */
        value: {
            type: Array as PropType<File[]>,
            required: false,
            default: () => []
        },

        /**
         * The model value of the media uploader
         */
        modelValue: {
            type: Array as PropType<File[] | undefined>,
            required: false,
            default: undefined
        }
    },

    emits: ["update:value", "update:modelValue", "invalid"],

    data() {
        return {
            internalFiles: [] as File[],
            isDragActive: false,
            previewUrls: {} as Record<string, string>
        };
    },

    computed: {
        /**
         * Gets the active value
         * @returns {unknown} The active value
         */
        activeValue(): File[] {
            return this.modelValue !== undefined ? this.modelValue : this.value;
        },

        /**
         * Gets the max files limit
         * @returns {unknown} The max files limit
         */
        maxFilesLimit(): number {
            if (!this.multiple) {
                return 1;
            }

            if (!this.maxFiles || this.maxFiles < 1) {
                return Number.POSITIVE_INFINITY;
            }

            return this.maxFiles;
        },

        /**
         * Gets the accept tokens
         * @returns {unknown} The accept tokens
         */
        acceptTokens(): string[] {
            if (!this.accept) {
                return [];
            }

            const raw = Array.isArray(this.accept) ? this.accept.join(",") : this.accept;

            return raw
                .split(",")
                .map(token => token.trim().toLowerCase())
                .filter(Boolean);
        },

        /**
         * Gets the accept attribute
         * @returns {unknown} The accept attribute
         */
        acceptAttribute(): string | undefined {
            if (!this.acceptTokens.length) {
                return undefined;
            }

            return this.acceptTokens.join(",");
        },

        /**
         * Gets the file input label
         * @returns {unknown} The file input label
         */
        fileInputLabel(): string {
            if (!this.internalFiles.length) {
                return "Nenhum arquivo selecionado";
            }

            if (this.internalFiles.length === 1) {
                return this.internalFiles[0]?.name ?? "Nenhum arquivo selecionado";
            }

            return `${this.internalFiles.length} arquivos selecionados`;
        },

        /**
         * Gets the rules label
         * @returns {unknown} The rules label
         */
        rulesLabel(): string {
            const rules: string[] = [];

            rules.push(this.multiple ? "Múltiplos arquivos permitidos" : "Apenas 1 arquivo");

            if (Number.isFinite(this.maxFilesLimit)) {
                rules.push(`Limite: ${this.maxFilesLimit}`);
            }

            if (this.acceptTokens.length) {
                rules.push(`Tipos: ${this.acceptTokens.join(", ")}`);
            }

            return rules.join(" - ");
        },

        /**
         * Gets the items
         * @returns {unknown} The items
         */
        items(): MediaItem[] {
            return this.internalFiles.map(file => {
                const key = this.fileKey(file);
                const extension = this.fileExtension(file);
                const isImage = this.fileIsImage(file);
                const knownIcon = this.fileIconClass(file);

                return {
                    key,
                    file,
                    previewUrl: isImage ? this.previewUrls[key] : undefined,
                    iconClass: knownIcon,
                    isUnknownType: knownIcon.includes("fa-file "),
                    extensionLabel: extension || "file"
                };
            });
        }
    },

    watch: {
        activeValue: {
            handler(files: File[] | undefined) {
                this.syncFromExternal(files ?? []);
            },
            immediate: true
        }
    },

    /**
     * Unmounts the component
     * @returns {void}
     */
    beforeUnmount() {
        for (const url of Object.values(this.previewUrls)) {
            URL.revokeObjectURL(url);
        }
    },

    methods: {
        /**
         * File key
         * @param {File} file The file
         * @returns {void}
         */
        fileKey(file: File): string {
            return [file.name, file.size, file.type, file.lastModified].join("__");
        },

        /**
         * File extension
         * @param {File} file The file
         * @returns {void}
         */
        fileExtension(file: File): string {
            const split = file.name.split(".");
            if (split.length < 2) {
                return "";
            }

            const extension = split[split.length - 1];
            return extension ? extension.toLowerCase() : "";
        },

        /**
         * File is image
         * @param {File} file The file
         * @returns {void}
         */
        fileIsImage(file: File): boolean {
            return file.type.toLowerCase().startsWith("image/");
        },

        /**
         * File icon class
         * @param {File} file The file
         * @returns {void}
         */
        fileIconClass(file: File): string {
            const mime = file.type.toLowerCase();
            const ext = this.fileExtension(file);

            if (mime === "application/pdf" || ext === "pdf") {
                return "fa-solid fa-file-pdf text-red-400";
            }

            if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "m4a"].includes(ext)) {
                return "fa-solid fa-file-audio text-purple-400";
            }

            if (mime.startsWith("video/") || ["mp4", "mkv", "avi", "mov", "webm"].includes(ext)) {
                return "fa-solid fa-file-video text-blue-400";
            }

            if (
                mime.includes("word") ||
                ["doc", "docx", "odt", "rtf"].includes(ext)
            ) {
                return "fa-solid fa-file-word text-blue-500";
            }

            if (
                mime.includes("excel") ||
                mime.includes("spreadsheet") ||
                ["xls", "xlsx", "csv", "ods"].includes(ext)
            ) {
                return "fa-solid fa-file-excel text-green-500";
            }

            if (
                mime.includes("powerpoint") ||
                mime.includes("presentation") ||
                ["ppt", "pptx", "odp"].includes(ext)
            ) {
                return "fa-solid fa-file-powerpoint text-orange-400";
            }

            if (
                mime.startsWith("text/") ||
                ["txt", "md", "json", "xml", "yml", "yaml"].includes(ext)
            ) {
                return "fa-solid fa-file-lines text-muted-foreground";
            }

            if (
                mime.includes("zip") ||
                mime.includes("compressed") ||
                ["zip", "rar", "7z", "tar", "gz"].includes(ext)
            ) {
                return "fa-solid fa-file-zipper text-yellow-400";
            }

            return "fa-solid fa-file text-muted-foreground";
        },

        /**
         * Sync from external
         * @param {File[]} files The files
         * @returns {void}
         */
        syncFromExternal(files: File[]) {
            const normalized = this.normalizeFiles(files);
            this.replaceFiles(normalized, false);
        },

        /**
         * Normalize files
         * @param {File[]} files The files
         * @returns {void}
         */
        normalizeFiles(files: File[]): File[] {
            const list = Array.isArray(files) ? files.filter(Boolean) : [];

            if (!this.multiple && list.length > 1) {
                return list[0] ? [list[0]] : [];
            }

            if (Number.isFinite(this.maxFilesLimit) && list.length > this.maxFilesLimit) {
                return list.slice(0, this.maxFilesLimit);
            }

            return list;
        },

        /**
         * Replace files
         * @param {File[]} nextFiles The next files
         * @param {boolean} emitChanges The emit changes
         * @returns {void}
         */
        replaceFiles(nextFiles: File[], emitChanges: boolean) {
            const previousKeys = new Set(this.internalFiles.map(file => this.fileKey(file)));
            const nextKeys = new Set(nextFiles.map(file => this.fileKey(file)));

            for (const key of previousKeys) {
                if (!nextKeys.has(key) && this.previewUrls[key]) {
                    URL.revokeObjectURL(this.previewUrls[key]);
                    delete this.previewUrls[key];
                }
            }

            for (const file of nextFiles) {
                const key = this.fileKey(file);
                if (this.fileIsImage(file) && !this.previewUrls[key]) {
                    this.previewUrls[key] = URL.createObjectURL(file);
                }
            }

            this.internalFiles = nextFiles;

            if (emitChanges) {
                this.$emit("update:value", [...this.internalFiles]);
                this.$emit("update:modelValue", [...this.internalFiles]);
            }
        },

        /**
         * Gets the is accepted type
         * @param {File} file The file
         * @returns {void}
         */
        isAcceptedType(file: File): boolean {
            if (!this.acceptTokens.length) {
                return true;
            }

            const mime = (file.type || "").toLowerCase();
            const extension = this.fileExtension(file);

            for (const token of this.acceptTokens) {
                if (token.startsWith(".")) {
                    if (extension === token.slice(1)) {
                        return true;
                    }
                    continue;
                }

                if (token.endsWith("/*")) {
                    const group = token.replace("/*", "");
                    if (mime.startsWith(`${group}/`)) {
                        return true;
                    }
                    continue;
                }

                if (mime === token) {
                    return true;
                }
            }

            return false;
        },

        /**
         * Append files
         * @param {File[]} candidateFiles The candidate files
         * @returns {void}
         */
        appendFiles(candidateFiles: File[]) {
            if (this.disabled) {
                return;
            }

            const rejected: RejectedFile[] = [];
            const valid: File[] = [];

            for (const file of candidateFiles) {
                if (!this.isAcceptedType(file)) {
                    rejected.push({ file, reason: "invalid-type" });
                    continue;
                }

                valid.push(file);
            }

            let next = this.multiple ? [...this.internalFiles, ...valid] : valid.slice(0, 1);
            const limit = this.maxFilesLimit;

            if (Number.isFinite(limit) && next.length > limit) {
                const overflow = next.slice(limit);
                next = next.slice(0, limit);

                for (const file of overflow) {
                    rejected.push({ file, reason: "max-files" });
                }
            }

            this.replaceFiles(next, true);

            if (rejected.length > 0) {
                this.$emit("invalid", rejected);
            }
        },

        /**
         * Open file picker
         * @returns {void}
         */
        openFilePicker() {
            if (this.disabled) {
                return;
            }

            const input = this.$refs.fileInputRef as HTMLInputElement | undefined;
            input?.click();
        },

        /**
         * Handles the input change
         * @param {Event} event The event
         * @returns {void}
         */
        onInputChange(event: Event) {
            const target = event.target as HTMLInputElement;
            const files = Array.from(target.files ?? []);

            if (files.length) {
                this.appendFiles(files);
            }

            target.value = "";
        },

        /**
         * Handles the drag enter
         * @returns {void}
         */
        onDragEnter() {
            if (this.disabled) {
                return;
            }

            this.isDragActive = true;
        },

        /**
         * Handles the drag over
         * @returns {void}
         */
        onDragOver() {
            if (this.disabled) {
                return;
            }

            this.isDragActive = true;
        },

        /**
         * Handles the drag leave
         * @returns {void}
         */
        onDragLeave() {
            this.isDragActive = false;
        },

        /**
         * Handles the drop
         * @param {DragEvent} event The event
         * @returns {void}
         */
        onDrop(event: DragEvent) {
            this.isDragActive = false;

            if (this.disabled) {
                return;
            }

            const files = Array.from(event.dataTransfer?.files ?? []);
            if (!files.length) {
                return;
            }

            this.appendFiles(files);
        },

        /**
         * Remove file
         * @param {string} key The key
         * @returns {void}
         */
        removeFile(key: string) {
            if (this.disabled) {
                return;
            }

            const next = this.internalFiles.filter(file => this.fileKey(file) !== key);
            this.replaceFiles(next, true);
        }
    }
});
</script>

<style scoped>
.media-thumb {
    width: 88px;
}
</style>
