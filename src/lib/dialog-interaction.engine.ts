// Разрешает маску и фокус Drawer и Modal. Локальные поля следуют настройкам компонента,
// переданным ConfigProvider, с отдельным fallback для closable.
import type { DrawerFocusableConfig, DrawerMask, DrawerMaskConfig } from './drawer.types';

/** Boolean меняет только видимость маски. */
export function normalizeDialogMask(value: DrawerMask | undefined): DrawerMaskConfig {
  return typeof value === 'boolean' ? { enabled: value } : value ?? {};
}

/** Наследует свойства маски по отдельности и сохраняет явное closable=false. */
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

/** Применяет настройки фокуса поверх начального режима, выбранного по маске. */
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
