// Draw the local setting and ConfigProvider to the icon and the attributes of the native close button.
import type { ModalClosable, ModalClosableConfig, ModalConfig, ModalContent } from './modal.types';

/** Is distinguished by the lack of configuration, the disconnected button and the included button without an icon. */
function getCloseLayer(
  closable: ModalClosable | undefined,
  icon: ModalContent | undefined
): ModalClosableConfig | false | undefined {
  if (closable === false || (closable === undefined && (icon === null || icon === false))) {
    return false;
  }
  if (closable === undefined && icon === undefined) {
    return undefined;
  }

  const closeIcon = icon === null || typeof icon === 'boolean' ? undefined : icon;
  return typeof closable === 'object' ? { closeIcon, ...closable } : { closeIcon };
}

/** Forwards ARIA attributes and role to the button. undefined retains the inherited value. */
function getCloseAttributes(inherited?: ModalClosableConfig, local?: ModalClosableConfig) {
  const attributes: Record<string, unknown> = {};
  for (const source of [inherited, local]) {
    if (!source) {
      continue;
    }
    for (const [name, value] of Object.entries(source)) {
      if (value !== undefined && (name === 'role' || name.startsWith('aria-'))) {
        attributes[name] = value;
      }
    }
  }
  return attributes;
}

/** Local inclusion can return the button hidden by the provider. Attributes merge through fields. */
export function resolveModalClose(
  closable: ModalClosable | undefined,
  closeIcon: ModalContent | undefined,
  config?: ModalConfig
) {
  const local = getCloseLayer(closable, closeIcon);
  const inherited = getCloseLayer(config?.closable, config?.closeIcon);
  if (local === false || (local === undefined && inherited === false)) {
    return undefined;
  }

  const context = inherited || undefined;
  const icon = local?.closeIcon === undefined ? context?.closeIcon : local.closeIcon;
  return {
    icon: typeof icon === 'boolean' ? undefined : icon,
    disabled: local?.disabled ?? context?.disabled ?? false,
    attributes: getCloseAttributes(context, local)
  };
}
