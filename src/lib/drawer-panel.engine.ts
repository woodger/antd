// Allows content settings, buttons and semantic slots. Attributes and styles go to the node that
// owns them, even when Drawer is transferred through the portal.
import type {
  DrawerClosable, DrawerClosableConfig, DrawerCloseIcon, DrawerConfig, DrawerContent, DrawerProps,
  DrawerSemantic, DrawerSemanticSlots
} from './drawer.types';

const shellSlots = ['root', 'mask', 'wrapper', 'section', 'dragger'] as const;
const panelSlots = ['header', 'title', 'extra', 'body', 'footer', 'close'] as const;

/** Decides whether the area of Drawer is needed. Numerical zero retains the area and is displayed as text. */
export function hasDrawerContent(value: DrawerContent | undefined) {
  return value != null && value !== false && value !== '';
}

/** Spreads ARIA and data to their DOM-owners without the transfer of service props. */
export function getDrawerAttributes(props: DrawerProps) {
  const dialog: Record<string, unknown> = {};
  const wrapper: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(props)) {
    if (name === 'role' || name.startsWith('aria-')) {
      dialog[name] = value;
    }
    else if (name.startsWith('data-')) {
      wrapper[name] = value;
    }
  }

  return { dialog, wrapper };
}

/** Distinguished by the explicit disconnection of the button from the absence of a layer of settings. */
function getCloseOptions(
  closable?: DrawerClosable,
  icon?: DrawerCloseIcon
): DrawerClosableConfig | false | undefined {
  if (closable === false || (closable == null && (icon === false || icon === null))) {
    return false;
  }
  if (closable == null && icon === undefined) {
    return undefined;
  }

  const closeIcon = typeof icon === 'boolean' ? undefined : icon ?? undefined;
  return { closeIcon, ...(typeof closable === 'object' ? closable : undefined) };
}

/** The button belongs to ARIA and role, the behavior parameters remain in Drawer. */
function getCloseAttributes(inherited?: DrawerClosableConfig, local?: DrawerClosableConfig) {
  const attributes: Record<string, unknown> = {};

  for (const options of [inherited, local]) {
    if (!options) {
      continue;
    }
    for (const [name, value] of Object.entries(options)) {
      if (value !== undefined && (name === 'role' || name.startsWith('aria-'))) {
        attributes[name] = value;
      }
    }
  }

  return attributes;
}

/** Position is taken from the nearest closable, the other fields are inherited separately. */
export function resolveDrawerClose(props: DrawerProps, config?: DrawerConfig) {
  const local = getCloseOptions(props.closable, props.closeIcon);
  const inherited = getCloseOptions(config?.closable, config?.closeIcon);
  if (local === false || (local === undefined && inherited === false)) {
    return undefined;
  }

  const placementOptions = props.closable ?? config?.closable;
  let placement: 'start' | 'end' | undefined;
  if (placementOptions !== false) {
    placement = typeof placementOptions === 'object' && placementOptions?.placement === 'end'
      ? 'end' : 'start';
  }

  const fallback = inherited === false ? undefined : inherited;
  // Null preserves the header for the included closable, but removes the button itself.
  const icon = local?.closeIcon === undefined ? fallback?.closeIcon : local.closeIcon;
  return {
    placement,
    icon,
    disabled: local?.disabled ?? fallback?.disabled ?? false,
    attributes: getCloseAttributes(fallback, local)
  };
}

/** Passes the content callback the same props accepted by the Ant Design panel. */
export function getDrawerPanelSemanticProps(
  props: DrawerProps,
  prefix: string,
  config?: DrawerConfig
): DrawerProps {
  const {
    rootClassName: _rootClassName,
    class: _class,
    style: _style,
    open: _open,
    defaultSize: _defaultSize,
    mask: _mask,
    focusable: _focusable,
    zIndex: _zIndex,
    push: _push,
    resizable: _resizable,
    getContainer: _getContainer,
    destroyOnHidden: _destroyOnHidden,
    afterOpenChange: _afterOpenChange,
    panelRef: _panelRef,
    ...panel
  } = props;

  return { ...panel, prefixCls: prefix, closable: panel.closable ?? config?.closable };
}

/** Calculates the transferred object or callback from props of the corresponding stage. */
function resolveSemantic(value: DrawerSemantic | undefined, props: DrawerProps) {
  return typeof value === 'function' ? value({ props }) : value;
}

/** Accumulates classes and applies the usual CSS-order layers of the provider and the owner. */
export function resolveDrawerSemantics(
  props: DrawerProps,
  config: DrawerConfig | undefined,
  part: 'shell' | 'panel'
) {
  const providerClasses = resolveSemantic(config?.classNames, props);
  const localClasses = resolveSemantic(props.classNames, props);
  const providerStyles = resolveSemantic(config?.styles, props);
  const localStyles = resolveSemantic(props.styles, props);
  const classes: DrawerSemanticSlots = {};
  const styles: DrawerSemanticSlots = {};
  const slots = part === 'shell' ? shellSlots : panelSlots;

  for (const slot of slots) {
    classes[slot] = [providerClasses?.[slot], localClasses?.[slot]].filter(Boolean).join(' ');
    styles[slot] = [
      providerStyles?.[slot],
      slot === 'section' ? config?.style : undefined,
      localStyles?.[slot]
    ].filter(Boolean).join(';') || undefined;
  }

  return { classes, styles };
}
