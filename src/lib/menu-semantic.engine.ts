// Collects semantic slots Menu. General styles are supplemented by declarations, and the local
// style of the nested slot replaces the style of the provider completely.
import { mergeComponentSemantics } from './semantic-style.engine';
import type { MenuClassNames, MenuConfig, MenuProps, MenuSemantic, MenuStyles } from './menu.types';

const subMenuSlots = ['item', 'itemTitle', 'list', 'itemIcon', 'itemContent'] as const;
const rootSlots = ['root', ...subMenuSlots] as const;

/** Callback with props current Menu and preserves missing slot. */
function resolve<T extends MenuClassNames | MenuStyles>(
  value: MenuSemantic<T> | undefined,
  info: { props: MenuProps; }
) {
  return typeof value === 'function' ? value(info) : value;
}

/** The abbreviated popup string sets its root class. */
function popupClass(popup: MenuClassNames['popup']) {
  return typeof popup === 'string' ? popup : popup?.root;
}

/** Combines the classes of one slot in the order provider → copies. */
function joinClasses(inherited?: string, local?: string) {
  return [inherited, local].filter(Boolean).join(' ') || undefined;
}

/** Solves styles and classes of root, groups, points and separate popups. */
export function menuSemantics(config: MenuConfig | undefined, props: MenuProps) {
  const info = { props };
  const inheritedClasses = resolve(config?.classNames, info);
  const localClasses = resolve(props.classNames, info);
  const inheritedStyles = resolve(config?.styles, info);
  const localStyles = resolve(props.styles, info);
  const root = mergeComponentSemantics(
    { classNames: inheritedClasses, styles: inheritedStyles, style: config?.style },
    { classNames: localClasses, styles: localStyles, style: props.style },
    rootSlots
  );
  const inheritedSubMenu = inheritedClasses?.subMenu;
  const localSubMenu = localClasses?.subMenu;
  const subMenu = Object.fromEntries(subMenuSlots.map(slot => [
    slot, joinClasses(inheritedSubMenu?.[slot], localSubMenu?.[slot])
  ]));
  const popup = joinClasses(popupClass(inheritedClasses?.popup), popupClass(localClasses?.popup));

  return {
    classes: { ...root.classes, subMenu, popup },
    styles: {
      ...root.styles,
      subMenu: { ...inheritedStyles?.subMenu, ...localStyles?.subMenu },
      popup: { ...inheritedStyles?.popup, ...localStyles?.popup }.root
    }
  };
}
