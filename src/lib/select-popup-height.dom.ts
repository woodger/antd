export const selectPopupHeightInsetVariable = '--ant-native-select-popup-height-inset';

/** rc-select ограничивает внутренний список; Native listbox также содержит padding popup. */
export function selectPopupMaxHeight(height: number) {
  if (height < 0) return `max-height:${height}px`;
  return `max-height:calc(${height}px + var(${selectPopupHeightInsetVariable}, 2 * var(--ant-padding-xxs, 0px)))`;
}

/** Существующий popup frame loop учитывает смену темы и пользовательского padding. */
export function syncSelectPopupHeight(popup: HTMLElement) {
  const style = popup.ownerDocument.defaultView!.getComputedStyle(popup);
  const inset = style.boxSizing === 'border-box'
    ? parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
      + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth) : 0;
  const value = `${inset}px`;
  if (popup.style.getPropertyValue(selectPopupHeightInsetVariable) !== value)
    popup.style.setProperty(selectPopupHeightInsetVariable, value);
}
