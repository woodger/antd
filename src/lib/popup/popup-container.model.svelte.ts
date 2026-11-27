import { untrack } from 'svelte';
import { connectPopupPortal } from './popup-portal.dom';

interface PopupContainerOptions {
  open: boolean;
  rendered?: boolean;
  reference?: Element;
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement | ShadowRoot;
  themeStyle?: string;
  preserveVariables?: readonly string[];
}

/** Callback identity doesn't change the portal until the function returns the same DOM-container. */
export function createPopupContainer(getOptions: () => PopupContainerOptions) {
  let visited = false;
  let rendered = true;
  let container = $state<HTMLElement | ShadowRoot>();
  let connection = $state.raw<ReturnType<typeof connectPopupPortal>>();

  $effect.pre(() => {
    const options = getOptions();
    visited ||= options.open;
    // Cleanup Svelte reads the previous runes; DOM-flag is changed until the conditional branch is removed.
    rendered = options.rendered !== false;
    // rc-trigger passes the actual DOM trigger, including SVG, despite the upstream HTMLElement type.
    container = visited && options.reference && options.getPopupContainer
      ? options.getPopupContainer(options.reference as HTMLElement)
        ?? options.reference.ownerDocument.body
      : undefined;
  });

  $effect(() => {
    void getOptions().themeStyle;
    const current = connection;
    // Component-theme attachments must finish updating your own variables.
    if (current) queueMicrotask(() => current.syncTheme());
  });

  return (node: HTMLElement) => {
    const target = container;
    if (!target) {
      return;
    }

    return untrack(() => {
      const reference = getOptions().reference!;
      const origin = node.parentElement ?? reference as HTMLElement;
      const marker = node.ownerDocument.createComment('popup-container');
      node.before(marker);
      const current = connectPopupPortal(node, {
        getPopupContainer: () => target,
        reference: reference as HTMLElement,
        origin,
        marker,
        autoLock: false,
        get restoreOnDestroy() { return rendered && node.isConnected; },
        get preserveVariables() {
          const style = node.ownerDocument.createElement('span').style;
          style.cssText = getOptions().themeStyle ?? '';
          // The coordinates and CSS-derived arrow variables belong to the surface itself.
          return [
            '--arrow-x',
            '--arrow-y',
            '--ant-tooltip-valid-offset-x',
            '--ant-tooltip-arrow-offset-x',
            '--ant-tooltip-arrow-background-color',
            '--ant-tooltip-overlay-color',
            ...(getOptions().preserveVariables ?? []),
            ...Array.from(style).filter(name => name.startsWith('--'))
          ];
        }
      });
      connection = current;
      return () => {
        current();
        marker.remove();
        if (connection === current) connection = undefined;
      };
    });
  };
}
