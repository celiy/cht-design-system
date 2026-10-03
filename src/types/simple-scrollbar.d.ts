/**
 * Module types for simple-scrollbar, including unbind helpers missing from the package d.ts.
 */
declare module "simple-scrollbar" {
    const SimpleScrollbar: {
        initEl(element: Element): void;
        initAll(): void;
        unbindEl(element: Element): void;
        unbindAll(): void;
    };

    export default SimpleScrollbar;
}
