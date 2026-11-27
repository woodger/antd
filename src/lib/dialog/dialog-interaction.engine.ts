// Resolves Drawer and Modal masks and focus. Local fields inherit ConfigProvider component
// settings, with a separate fallback for closable.
import type { DrawerFocusableConfig, DrawerMask, DrawerMaskConfig } from '../drawer/drawer.types';

/** A boolean changes only mask visibility. */
export function normalizeDialogMask(value: DrawerMask | undefined): DrawerMaskConfig {
  return typeof value === 'boolean' ? { enabled: value } : value ?? {};
}

/** Inherits mask properties individually and preserves explicit closable=false. */
export function resolveDialogMask(mask: DrawerMask | undefined, provider: DrawerMask | undefined) {
  const own = normalizeDialogMask(mask);
  const inherited = normalizeDialogMask(provider);
  const merged = { ...inherited, ...own };

  return {
    enabled: merged.enabled !== false,
    closable: own.closable ?? inherited.closable ?? true,
    blur: Boolean(merged.blur)
  };
}

/** Applies focus settings over the initial mode chosen from the mask. */
export function resolveDialogFocusable(
  focusable: DrawerFocusableConfig | undefined,
  provider: DrawerFocusableConfig | undefined,
  defaultTrap: boolean
) {
  const { trap = defaultTrap, focusTriggerAfterClose: restoreFocus = true } = {
    ...provider,
    ...focusable
  };

  return { trap, restoreFocus };
}
