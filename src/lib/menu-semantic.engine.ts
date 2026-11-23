// Собирает semantic slots Menu. Общие стили дополняются по декларациям,
// а локальный стиль вложенного slot заменяет стиль провайдера полностью.
import { mergeComponentSemantics } from './semantic-style.engine';
import type { MenuClassNames, MenuConfig, MenuProps, MenuSemantic, MenuStyles } from './menu.types';

const subMenuSlots = ['item', 'itemTitle', 'list', 'itemIcon', 'itemContent'] as const;
const rootSlots = ['root', ...subMenuSlots] as const;

/** Вычисляет callback с props текущего Menu и сохраняет пропущенный slot. */
function resolve<T extends MenuClassNames | MenuStyles>(
  value: MenuSemantic<T> | undefined,
  info: { props: MenuProps; }
) {
  return typeof value === 'function' ? value(info) : value;
}

/** Сокращённая строка popup задаёт класс его корня. */
function popupClass(popup: MenuClassNames['popup']) {
  return typeof popup === 'string' ? popup : popup?.root;
}

/** Объединяет классы одного slot в порядке провайдер → экземпляр. */
function joinClasses(inherited?: string, local?: string) {
  return [inherited, local].filter(Boolean).join(' ') || undefined;
}

/** Разрешает стили и классы корня, групп, пунктов и отдельных popup. */
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
