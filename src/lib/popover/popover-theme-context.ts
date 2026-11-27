// Passes the confirmation theme and panel root handler to its Popover.
import { getContext, setContext } from 'svelte';
import type { PopconfirmProps } from '../popconfirm/popconfirm.types';

const popconfirmThemeKey = Symbol('ant-popconfirm-theme');
type PopconfirmPopupContext = Readonly<Pick<PopconfirmProps, 'onPopupClick'>>;

/** Passes the handler through a getter so the panel can read the owner's current prop. */
export function providePopconfirmTheme(popup: PopconfirmPopupContext) {
  setContext(popconfirmThemeKey, popup);
}

/** Separates nested panels from external confirmation theme and events. */
export function consumePopconfirmTheme() {
  const popup = getContext<PopconfirmPopupContext | undefined>(popconfirmThemeKey);
  setContext(popconfirmThemeKey, undefined);
  return popup;
}
