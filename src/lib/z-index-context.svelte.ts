// Inherit a numerical layer of wood components, including after the transfer of DOM to the portal.
// Root Surfaces take a layer of its own CSS tokens.
import { getContext, setContext } from 'svelte';
import { getInlineStyleDeclarations, type InlineStyleLayer } from './inline-style.engine';
import { useDesignTokenContext } from './theme-context.svelte';

type ReadZIndex = () => number | undefined;
type LayerKind = 'container' | 'popup' | 'preview';
const key = Symbol('ant-z-index');

export interface ZIndexLayer {
  readonly zIndex: number | undefined;
  readonly contextZIndex: number;
  readonly parentZIndex: number | undefined;
  readonly style: string | undefined;
}

/** Solves the surface layer and the level for descendants with the original Ant Design displacements. */
export function useZIndex(kind: LayerKind, readLocal?: ReadZIndex): ZIndexLayer {
  const readParent = getContext<ReadZIndex | undefined>(key);
  const theme = useDesignTokenContext();
  const parentZIndex = $derived(readParent?.());
  const localZIndex = $derived(readLocal?.());
  const contextZIndex = $derived.by(() => {
    if (localZIndex !== undefined) {
      return localZIndex;
    }

    if (kind === 'container') {
      // The zero-parent source container starts from the basic token.
      return (parentZIndex || theme.state.token.zIndexPopupBase) + 100;
    }

    const offset = kind === 'preview' ? 1 : 50;
    return (parentZIndex ?? 0) + offset;
  });
  const zIndex = $derived(localZIndex ?? (parentZIndex === undefined ? undefined : contextZIndex));

  return {
    /** Root surface without an obvious layer uses its own CSS. */
    get zIndex() { return zIndex; },
    /** Descendants receive a numerical base, including in the root of CSS. */
    get contextZIndex() { return contextZIndex; },
    /** Allows you to transfer the level of the owner through Dropdown without its own layer. */
    get parentZIndex() { return parentZIndex; },
    /** Forms an inline layer for merging with semantic panel styles. */
    get style() { return zIndex === undefined ? undefined : `z-index:${zIndex}`; }
  };
}

/** Gives descendants the current value even when changing the owner and theme. */
export function provideZIndex(read: ReadZIndex) {
  setContext(key, read);
}

/** Extracts an integer from CSS, taking into account the order of declarations and the priority of important. */
export function getInlineZIndex(style: InlineStyleLayer): number | undefined {
  let value: string | undefined;
  let important = false;

  for (const declaration of getInlineStyleDeclarations([style])) {
    if (declaration.property !== 'z-index' || (important && !declaration.priority)) {
      continue;
    }

    value = declaration.value;
    important = declaration.priority === 'important';
  }

  if (value === undefined || !/^[+-]?\d+$/.test(value)) {
    return undefined;
  }

  const zIndex = Number(value);
  return Number.isFinite(zIndex) ? zIndex : undefined;
}
