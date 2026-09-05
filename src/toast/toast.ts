import { reactive } from "vue";

export type ToastType = "success" | "info" | "error" | "warning";

export type ToastEventPayload = string | Record<string, unknown>;

export type ToastCloseHandler = (payload: ToastEventPayload, item: ToastItem) => void;

export type ToastItem = {
    id: number;
    type: ToastType;
    message: string;
    closeButton: string | false;
    event?: ToastEventPayload;
    /** Total auto-dismiss duration in ms; omitted when the toast is persistent. */
    timeoutMs?: number;
};

export type ToastShowOptions = {
    timeout?: number;
    closeButton?: boolean | string;
    event?: ToastEventPayload;
};

export type ToastApi = {
    success: (message: string, options?: ToastShowOptions) => number;
    info: (message: string, options?: ToastShowOptions) => number;
    error: (message: string, options?: ToastShowOptions) => number;
    warning: (message: string, options?: ToastShowOptions) => number;
    dismiss: (id: number) => void;
    close: (id: number) => void;
    pause: (id: number) => void;
    resume: (id: number) => void;
    pauseAll: () => void;
    resumeAll: () => void;
    on: (handler: ToastCloseHandler) => () => void;
    off: (handler: ToastCloseHandler) => void;
    clear: () => void;
};

type ToastTimer = {
    handle: ReturnType<typeof setTimeout> | null;
    remainingMs: number;
    totalMs: number;
    startedAt: number;
};

const items = reactive<ToastItem[]>([]);
const timers = new Map<number, ToastTimer>();
const closeListeners = new Set<ToastCloseHandler>();
const progressTick = reactive({ n: 0 });

let nextId = 1;
let defaultTimeout = 4000;
let allPaused = false;
let progressInterval: ReturnType<typeof setInterval> | null = null;

function startProgressTicker() {
    if (progressInterval !== null) {
        return;
    }

    progressInterval = setInterval(() => {
        if (timers.size === 0) {
            if (progressInterval !== null) {
                clearInterval(progressInterval);
                progressInterval = null;
            }

            return;
        }

        progressTick.n += 1;
    }, 50);
}

function stopProgressTicker() {
    if (progressInterval === null) {
        return;
    }

    clearInterval(progressInterval);
    progressInterval = null;
}

function remainingMsFor(id: number) {
    const timer = timers.get(id);

    if (timer === undefined) {
        return 0;
    }

    if (timer.handle === null) {
        return timer.remainingMs;
    }

    return Math.max(0, timer.remainingMs - (Date.now() - timer.startedAt));
}

export function getToastProgress(id: number) {
    void progressTick.n;

    const timer = timers.get(id);

    if (timer === undefined || timer.totalMs <= 0) {
        return 0;
    }

    const remaining = remainingMsFor(id);

    return Math.min(1, Math.max(0, 1 - remaining / timer.totalMs));
}

function clearTimer(id: number) {
    const timer = timers.get(id);

    if (timer === undefined) {
        return;
    }

    if (timer.handle !== null) {
        clearTimeout(timer.handle);
    }

    timers.delete(id);

    if (timers.size === 0) {
        stopProgressTicker();
    }
}

function emitClose(item: ToastItem) {
    if (item.event === undefined) {
        return;
    }

    for (const handler of closeListeners) {
        handler(item.event, item);
    }
}

function close(id: number) {
    const item = items.find((entry) => {
        return entry.id === id;
    });

    if (item !== undefined) {
        emitClose(item);
    }

    dismiss(id);
}

function on(handler: ToastCloseHandler) {
    closeListeners.add(handler);

    return () => {
        closeListeners.delete(handler);
    };
}

function off(handler: ToastCloseHandler) {
    closeListeners.delete(handler);
}

function dismiss(id: number) {
    clearTimer(id);

    const index = items.findIndex((item) => {
        return item.id === id;
    });

    if (index !== -1) {
        items.splice(index, 1);
    }
}

function pause(id: number) {
    const timer = timers.get(id);

    if (timer === undefined || timer.handle === null) {
        return;
    }

    clearTimeout(timer.handle);
    timer.handle = null;
    timer.remainingMs = Math.max(0, timer.remainingMs - (Date.now() - timer.startedAt));
}

function pauseAll() {
    allPaused = true;

    for (const id of [...timers.keys()]) {
        pause(id);
    }
}

function resume(id: number) {
    const timer = timers.get(id);

    if (timer === undefined || timer.handle !== null) {
        return;
    }

    if (timer.remainingMs <= 0) {
        dismiss(id);
        return;
    }

    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => {
        dismiss(id);
    }, timer.remainingMs);
}

function resumeAll() {
    allPaused = false;

    for (const item of items) {
        resume(item.id);
    }
}

function resolveCloseButton(options?: ToastShowOptions) {
    const value = options?.closeButton ?? true;

    if (value === false) {
        return false as const;
    }

    if (value === true) {
        return "Fechar";
    }

    return value;
}

function show(message: string, type: ToastType, options?: ToastShowOptions) {
    const id = nextId++;

    const timeout = options?.timeout ?? defaultTimeout;

    items.push({
        id,
        type,
        message,
        closeButton: resolveCloseButton(options),
        event: options?.event,
        timeoutMs: timeout > 0 ? timeout : undefined
    });

    if (timeout > 0) {
        timers.set(id, {
            handle: setTimeout(() => {
                dismiss(id);
            }, timeout),
            remainingMs: timeout,
            totalMs: timeout,
            startedAt: Date.now()
        });
        startProgressTicker();

        if (allPaused) {
            pause(id);
        }
    }

    return id;
}

export function setToastDefaultTimeout(ms: number) {
    defaultTimeout = ms;
}

export function useToastItems() {
    return items;
}

export const toast: ToastApi = {
    success(message, options) {
        return show(message, "success", options);
    },

    info(message, options) {
        return show(message, "info", options);
    },

    error(message, options) {
        return show(message, "error", options);
    },

    warning(message, options) {
        return show(message, "warning", options);
    },

    dismiss,
    close,
    pause,
    resume,
    pauseAll,
    resumeAll,
    on,
    off,

    clear() {
        for (const id of [...timers.keys()]) {
            clearTimer(id);
        }

        stopProgressTicker();
        items.splice(0, items.length);
    }
};
