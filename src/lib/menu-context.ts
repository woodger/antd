import { getContext, setContext } from 'svelte';
import type { MenuEntry } from './menu.engine';
import type { menuSemantics } from './menu-semantic.engine';
import type { MenuMode, MenuProps, MenuTheme } from './menu.types';
import type { DropdownMenuContext } from './dropdown-menu-context';

export interface MenuBranchHover {
  schedule: (entering: boolean) => void;
  notify: (event: MouseEvent, entering: boolean, surface: HTMLElement) => void;
}

export interface MenuContext {
  readonly dropdown?: DropdownMenuContext;
  readonly registerPopup?: DropdownMenuContext['registerPopup'];
  readonly prefixCls: string;
  readonly rootPrefixCls: string;
  readonly rootClassName: string;
  readonly semantics: ReturnType<typeof menuSemantics>;
  readonly expandIcon: MenuProps['expandIcon'];
  readonly itemIcon: MenuProps['itemIcon'];
  readonly itemRole?: MenuProps['_itemRole'];
  readonly tooltip: MenuProps['tooltip'];
  readonly tooltipCollapsed: boolean;
  readonly popupRender: MenuProps['popupRender'];
  readonly builtinPlacements: MenuProps['builtinPlacements'];
  readonly motion: MenuProps['motion'];
  readonly motionReady: boolean;
  readonly motionEnabled: boolean;
  readonly locked: boolean;
  /** The outgoing surface gives DOM-ID a new copy of the same lines. */
  readonly exiting: boolean;
  readonly componentTheme: {
    readonly className: string | undefined;
    readonly style: string | undefined;
    readonly inheritedStyle: string | undefined;
  };
  readonly mode: MenuMode;
  readonly theme: MenuTheme;
  readonly collapsed: boolean;
  readonly disabled: boolean;
  readonly direction: 'ltr' | 'rtl';
  readonly inlineIndent: number;
  readonly selected: readonly string[];
  readonly open: readonly string[];
  readonly active: string | null;
  readonly focusKey?: string | null;
  readonly forceRender: boolean;
  readonly trigger: 'hover' | 'click';
  readonly openDelay: number;
  readonly closeDelay: number;
  readonly nativeElement: HTMLUListElement | undefined;
  readonly getPopupContainer: MenuProps['getPopupContainer'];
  id: (key: string) => string;
  register: (key: string, element: HTMLElement) => () => void;
  registerHover: (key: string, handler: MenuBranchHover) => () => void;
  hover: (entry: MenuEntry, open: boolean) => void;
  notifyPopupHover: (entry: MenuEntry, event: MouseEvent, entering: boolean,
    surface: HTMLElement) => void;
  keydown: NonNullable<MenuProps['onkeydown']>;
  activate: (key: string | null) => void;
  click: (entry: MenuEntry, event: MouseEvent | KeyboardEvent) => void;
  titleClick: (entry: MenuEntry, event: MouseEvent) => void;
  setOpen: (entry: MenuEntry, open: boolean) => void;
  keyboard: (entry: MenuEntry | null, event: KeyboardEvent) => void;
  focusItem: (key: string) => void;
}

const key = Symbol('ant-menu');
export function provideMenu(context: MenuContext) {
  setContext(key, context);
}
export function useMenu(): MenuContext {
  return getContext(key);
}
