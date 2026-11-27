// Resolves the close button settings used by Alert during SSR and client rendering.
import type { AlertConfig, AlertProps } from './alert.types';
import { pickCloseButtonAttributes } from './close-button-attributes';

/** Uses local callbacks and resolves icon fallback independently of button attributes. */
export function resolveAlertClose(props: AlertProps, config?: AlertConfig) {
  const { closable } = props;
  const inheritedClosable = config?.closable;
  const localOptions = typeof closable === 'object' ? closable : undefined;
  const inheritedOptions = typeof inheritedClosable === 'object' ? inheritedClosable : undefined;

  const enabled = typeof closable === 'boolean'
    ? closable
    : Boolean(localOptions ?? inheritedClosable);
  const attributeOptions = closable == null ? inheritedOptions : localOptions;

  const localIcon = localOptions?.closeIcon;
  const iconWithFallback = localIcon || inheritedOptions?.closeIcon || undefined;
  // An explicit empty string leaves the local icon slot empty.
  const icon = localIcon === '' ? '' : iconWithFallback;

  return {
    enabled,
    icon,
    disabled: localOptions?.disabled,
    onClose: localOptions?.onClose,
    afterClose: localOptions?.afterClose,
    attributes: pickCloseButtonAttributes(attributeOptions)
  };
}
