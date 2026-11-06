<template>
    <NativeElement
        :tag="isLink ? 'a' : 'button'"
        class="w-fit cursor-pointer font-semibold transition-all select-none disabled:cursor-not-allowed disabled:opacity-60"
        :class="[
            hoverClass,
            backgroundClass,
            borderClass,
            shapeClass,
            buttonClass,
            {
                'shadow-sm': !variant.startsWith('transparent'),
                'cursor-wait opacity-60': loading,
                'cht-button inline-block no-underline': isLink,
                'cursor-not-allowed opacity-60': isLink && disabled
            }
        ]"
        :disabled="isLink ? undefined : disabled"
        :form="isLink ? undefined : form"
        :type="isLink ? undefined : type"
        :href="isLink && !disabled ? href : undefined"
        :target="isLink ? target : undefined"
        :rel="linkRel"
        :aria-disabled="isLink && disabled ? 'true' : undefined"
        :style="
            shape === 'rounded'
                ? {
                      width: circleButtonSize,
                      height: circleButtonSize,
                      minWidth: circleButtonSize,
                      minHeight: circleButtonSize
                  }
                : undefined
        "

        @mousedown="handleMouseDown"
        @mouseup="handleMouseUp"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @touchstart="handleMouseDown"
        @touchend="handleMouseUp"
        @touchleave="handleMouseUp"
        @click="handleClick"
        @keydown="handleKeydown"
    >
        <div
            class="flex h-full w-full items-center overflow-hidden text-ellipsis whitespace-nowrap transition duration-75"
            :class="[
                {
                    'translate-y-[0.08rem]': isPressed,
                    'items-center justify-center': shape === 'rounded',
                    'flex items-center gap-2': leftIcon || rightIcon || loading,
                    'justify-start': contentPosition === 'start',
                    'justify-center': contentPosition === 'center',
                    'justify-end': contentPosition === 'end'
                },
                labelClass
            ]"
        >
            <span
                v-if="leftIcon"

                :class="`fa-solid ${leftIcon}`"
            />

            <span
                v-if="loading"

                :class="`fa-solid fa-spinner fa-spin`"
            />

            <span v-if="label">
                {{ label }}
            </span>

            <slot v-else />

            <span
                v-if="rightIcon"

                :class="`fa-solid ${rightIcon}`"
            />
        </div>
    </NativeElement>
</template>

<script lang="ts">
import { defineComponent, h, type FunctionalComponent, type PropType } from "vue";
import type { ButtonVariants } from "@shared/constants/ButtonTypes";

export const ButtonProps = {
    /**
     * The label of the button
     */
    label: {
        type: String,
        required: false
    },

    /**
     * The button class of the button
     */
    buttonClass: {
        type: String,
        required: false
    },

    /**
     * The label class of the button
     */
    labelClass: {
        type: String,
        required: false
    },

    /**
     * The shape of the button
     */
    shape: {
        type: String as PropType<"rounded" | "square">,
        default: "square",
        required: false
    },

    /**
     * The content position of the button
     */
    contentPosition: {
        type: String as PropType<"start" | "center" | "end" | "none">,
        default: "center",
        required: false
    },

    /**
     * The type of the button
     */
    type: {
        type: String as PropType<"button" | "reset" | "submit">,
        default: "button",
        required: false
    },

    /**
     * The size of the button
     */
    size: {
        type: String as PropType<"small" | "medium" | "large">,
        default: "medium",
        required: false
    },

    /**
     * The variant of the button
     */
    variant: {
        type: String as PropType<ButtonVariants>,
        default: "default",
        required: false
    },

    /**
     * Whether the button is disabled
     */
    disabled: {
        type: Boolean,
        default: false,
        required: false
    },

    /**
     * Whether the button uses hover effect
     */
    hoverEffect: {
        type: Boolean,
        default: true,
        required: false
    },

    /**
     * The left icon of the button
     */
    leftIcon: {
        type: String,
        required: false
    },

    /**
     * The right icon of the button
     */
    rightIcon: {
        type: String,
        required: false
    },

    /**
     * Renders the button as a link (`<a>`) that navigates to this URL.
     */
    href: {
        type: String,
        required: false
    },

    /**
     * Where the link opens. Only used with `href`; `_blank` also adds `rel="noopener noreferrer"`.
     */
    target: {
        type: String as PropType<"_self" | "_blank" | "_parent" | "_top">,
        required: false
    },

    /**
     * Associates the button with a form element (`id` of `<form>`).
     */
    form: {
        type: String,
        required: false
    },

    /**
     * Whether the button is in a loading state
     */
    loading: {
        type: Boolean,
        default: false,
        required: false
    },

    /**
     * The hover style of the button
     */
    hoverStyle: {
        type: String,
        required: false
    },

    /**
     * The background style of the button
     */
    backgroundStyle: {
        type: String,
        required: false
    },

    /**
     * The border style of the button
     */
    borderStyle: {
        type: String,
        required: false
    },

    /**
     * The radius style of the button
     */
    radiusStyle: {
        type: String,
        required: false
    }
} as const;

/**
 * Renders a native element by tag name. `<component is="button">` would resolve to this
 * globally registered Button and recurse forever, while `h("button")` always builds the element.
 */
const NativeElement: FunctionalComponent<{ tag: string }> = (props, { slots }) =>
    h(props.tag, null, slots.default?.());

NativeElement.props = ["tag"];

export default defineComponent({
    name: "Button",

    components: {
        NativeElement
    },

    props: {
        ...ButtonProps
    },

    emits: ["click", "keydown"],

    data() {
        return {
            isPressed: false,
            hovered: false
        };
    },

    computed: {
        /**
         * Whether the button renders as a link
         * @returns {boolean} True when `href` is set
         */
        isLink(): boolean {
            return Boolean(this.href);
        },

        /**
         * Gets the rel of the link
         * @returns {string | undefined} The rel, only for links that open in a new tab
         */
        linkRel(): string | undefined {
            return this.isLink && this.target === "_blank" ? "noopener noreferrer" : undefined;
        },

        /**
         * Gets the circle button size
         * @returns {unknown} The circle button size
         */
        circleButtonSize(): string {
            if (this.shape !== "rounded") {
                return "";
            }

            const sizeMap: Record<"extra-small" | "small" | "medium" | "large", number> = {
                "extra-small": 30,
                small: 34,
                medium: 38,
                large: 44
            };

            const base = sizeMap[this.size as "extra-small" | "small" | "medium" | "large"] ?? 34;

            return `${base}px`;
        },

        /**
         * Gets the hover class
         * @returns {unknown} The hover class
         */
        hoverClass() {
            if (this.hoverStyle) {
                return this.hoverStyle;
            }

            if (this.backgroundStyle) {
                return "hover:brightness-120";
            }

            if (this.disabled) {
                return "hover:brightness-80";
            }

            if (!this.hoverEffect) {
                return "";
            }

            if (this.$project.device.isMobile) {
                return "";
            }

            return {
                "hover-ring":
                    this.hovered && (this.variant === "default" || this.variant === "secondary"),
                "bg-secondary/40": this.hovered && this.variant === "transparent-secondary",
                "bg-secondary! text-secondary-foreground!":
                    this.hovered && this.variant === "outline-secondary",

                "hover-ring-primary": this.hovered && this.variant === "primary",
                "bg-primary/40": this.hovered && this.variant === "transparent-primary",
                "bg-primary! text-primary-foreground!":
                    this.hovered && this.variant === "outline-primary",

                "hover-ring-destructive": this.hovered && this.variant === "destructive",
                "bg-destructive/40":
                    this.hovered &&
                    (this.variant === "transparent-destructive" || this.variant === "destructive"),
                "bg-destructive! text-destructive-foreground!":
                    this.hovered && this.variant === "outline-destructive",

                "hover-ring-success": this.hovered && this.variant === "success",
                "bg-success/40": this.hovered && this.variant === "transparent-success",
                "bg-success! text-success-foreground!":
                    this.hovered && this.variant === "outline-success",

                "hover-ring-info": this.hovered && this.variant === "info",
                "bg-info/40": this.hovered && this.variant === "transparent-info",
                "bg-info! text-info-foreground!": this.hovered && this.variant === "outline-info",

                "hover-ring-warning": this.hovered && this.variant === "warning",
                "bg-warning/40": this.hovered && this.variant === "transparent-warning",
                "bg-warning! text-warning-foreground!":
                    this.hovered && this.variant === "outline-warning",

                "hover:shadow-md": !this.disabled,

                "hover:bg-input/50": this.variant === "default",

                "hover:bg-accent": this.variant === "transparent",

                "bg-accent!":
                    this.hovered && (this.variant === "outline" || this.variant === "bordered")
            };
        },

        /**
         * Gets the background class
         * @returns {unknown} The background class
         */
        backgroundClass() {
            if (this.backgroundStyle) {
                return this.backgroundStyle;
            }

            return {
                "bg-primary/95 text-primary-foreground": this.variant === "primary",
                "text-primary":
                    this.variant === "transparent-primary" || this.variant === "outline-primary",

                "bg-destructive/25 text-destructive": this.variant === "destructive",
                "text-destructive":
                    this.variant === "transparent-destructive" ||
                    this.variant === "outline-destructive",

                "bg-success/95 text-success-foreground": this.variant === "success",
                "text-success":
                    this.variant === "transparent-success" || this.variant === "outline-success",

                "bg-info/95 text-info-foreground": this.variant === "info",
                "text-info": this.variant === "transparent-info" || this.variant === "outline-info",

                "bg-warning/95 text-warning-foreground": this.variant === "warning",
                "text-warning":
                    this.variant === "transparent-warning" || this.variant === "outline-warning",

                "bg-secondary text-secondary-foreground": this.variant === "secondary",
                "text-foreground":
                    this.variant === "transparent-secondary" ||
                    this.variant === "bordered" ||
                    this.variant === "outline",

                "bg-input/30 text-foreground/90": this.variant === "default",

                "bg-transparent text-secondary-foreground shadow-none!":
                    this.variant === "transparent"
            };
        },

        /**
         * Gets the border class
         * @returns {unknown} The border class
         */
        borderClass() {
            if (this.borderStyle) {
                return this.borderStyle;
            }

            if (this.backgroundStyle) {
                return "";
            }

            return {
                "border-primary": this.variant === "primary" || this.variant === "outline-primary",
                "border-success": this.variant === "success" || this.variant === "outline-success",
                "border-info": this.variant === "info" || this.variant === "outline-info",
                "border-warning": this.variant === "warning" || this.variant === "outline-warning",
                "border-destructive": this.variant === "outline-destructive",
                "border ":
                    this.variant === "secondary" ||
                    this.variant === "outline-secondary" ||
                    this.variant === "default" ||
                    this.variant === "outline" ||
                    this.variant === "bordered",
                "border-transparent": this.variant === "transparent",
                "reveal-highlight": this.variant === "bordered"
            };
        },

        /**
         * Gets the shape class
         * @returns {unknown} The shape class
         */
        shapeClass() {
            if (this.radiusStyle) {
                return this.radiusStyle;
            }

            const padding =
                this.shape !== "rounded" &&
                (this.leftIcon || this.rightIcon) &&
                !this.label &&
                !this.$slots.default
                    ? {
                          "p-1.5 text-xs": this.size === "small",
                          "p-2 text-sm": this.size === "medium",
                          "p-2.5 text-base": this.size === "large"
                      }
                    : {
                          "p-1 px-2.5 text-xs": this.size === "small" && this.shape !== "rounded",
                          "p-1.5 px-2.5 text-sm":
                              this.size === "medium" && this.shape !== "rounded",
                          "p-2 px-3.5 text-base": this.size === "large" && this.shape !== "rounded"
                      };

            return {
                ...padding,
                rounded: this.shape === "square",
                "flex aspect-square items-center justify-center justify-items-center rounded-full p-0":
                    this.shape === "rounded"
            };
        }
    },

    methods: {
        /**
         * Handles the click
         * @param {MouseEvent} event The event
         * @returns {void}
         */
        handleClick(event: MouseEvent) {
            this.$emit("click", event);
        },

        /**
         * Handles the keydown
         * @param {KeyboardEvent} event The event
         * @returns {void}
         */
        handleKeydown(event: KeyboardEvent) {
            this.$emit("keydown", event);
        },

        /**
         * Handles the mouse down
         * @returns {void}
         */
        handleMouseDown() {
            this.isPressed = true;
        },

        /**
         * Handles the mouse up
         * @returns {void}
         */
        handleMouseUp() {
            this.isPressed = false;
        },

        /**
         * Handles the mouse enter
         * @returns {void}
         */
        handleMouseEnter() {
            this.hovered = true;
        },

        /**
         * Handles the mouse leave
         * @returns {void}
         */
        handleMouseLeave() {
            this.isPressed = false;
            this.hovered = false;
        }
    }
});
</script>
