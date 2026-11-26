// Передаёт непосредственному Popover тему подтверждения и обработчик корня панели.
import { getContext, setContext } from 'svelte';
import type { PopconfirmProps } from './popconfirm.types';

const popconfirmThemeKey = Symbol('ant-popconfirm-theme');
type PopconfirmPopupContext = Readonly<Pick<PopconfirmProps, 'onPopupClick'>>;

/** Передаёт обработчик через getter, чтобы панель видела текущий prop владельца. */
export function providePopconfirmTheme(popup: PopconfirmPopupContext) {
  setContext(popconfirmThemeKey, popup);
}

/** Отделяет вложенные панели от темы и событий внешнего подтверждения. */
export function consumePopconfirmTheme() {
  const popup = getContext<PopconfirmPopupContext | undefined>(popconfirmThemeKey);
  setContext(popconfirmThemeKey, undefined);
  return popup;
}
