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

interface DropdownMenuScope {
  context?: DropdownMenuContext;
  defaultSelectable?: boolean;
  registerPopup?: DropdownMenuContext['registerPopup'];
}

const key = Symbol('ant-dropdown-menu');

/** Передаёт настройки ближайшему Menu внутри панели. */
export function provideDropdownMenu(context: DropdownMenuContext, defaultSelectable?: boolean) {
  setContext<DropdownMenuScope>(key, { context, defaultSelectable });
}

/** Изолирует Menu. Регистрацию внешних подменю можно передать без управления выбором. */
export function takeDropdownMenu(retainPopupRegistration = false) {
  const scope = getContext<DropdownMenuScope | undefined>(key);
  if (scope) {
    const registerPopup = retainPopupRegistration ? scope.context?.registerPopup : undefined;
    setContext<DropdownMenuScope | undefined>(key, registerPopup ? { registerPopup } : undefined);
  }
  return scope;
}
