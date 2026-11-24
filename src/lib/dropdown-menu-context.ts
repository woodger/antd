// Связывает Menu с владельцем панели Dropdown. Пункты и подменю используют один MenuContext.
import { getContext, setContext } from 'svelte';

export interface DropdownMenuView {
  readonly element: HTMLUListElement;
  focus: (edge?: 'first' | 'last') => void;
  isEnabled: (key: string) => boolean;
  readonly focusKey: string | null;
}

export interface DropdownMenuContext {
  readonly prefixCls: string;
  readonly menuPrefix: string;
  readonly activeKey: string | undefined;
  readonly visible: boolean;
  readonly sourceTheme: boolean;
  readonly themeStyle: string | undefined;
  canActivate: (event: MouseEvent | KeyboardEvent) => boolean;
  isFocused: (element: HTMLUListElement | undefined) => boolean;
  command: () => void;
  keydown: (event: KeyboardEvent, element: HTMLUListElement) => void;
  focusRow: (row: HTMLElement, options?: FocusOptions) => void;
  registerMenu: (view: DropdownMenuView) => () => void;
  registerPopup: (popup: HTMLElement) => () => void;
}

const key = Symbol('ant-dropdown-menu');

/** Передаёт настройки ближайшему Menu внутри панели. */
export function provideDropdownMenu(context: DropdownMenuContext) {
  setContext(key, context);
}

/** Изолирует вложенные Menu. Соседние списки получают контекст общей панели. */
export function takeDropdownMenu() {
  const context = getContext<DropdownMenuContext | undefined>(key);
  if (context) setContext(key, undefined);
  return context;
}
