/** Обновляет переменные темы и указанные свойства, сохраняя координаты DOM-контроллера. */
export function connectComponentTheme(
  node: HTMLElement,
  cssText: string | undefined,
  additionalProperties: readonly string[] = []
) {
  const source = node.ownerDocument.createElement('span').style;
  source.cssText = cssText ?? '';
  const names = Array.from(source)
    .filter(name => name.startsWith('--') || additionalProperties.includes(name));

  for (const name of names) {
    node.style.setProperty(name, source.getPropertyValue(name), source.getPropertyPriority(name));
  }

  // Освобождает только свойства этой записи при обновлении или снятии attachment.
  return () => {
    for (const name of names) node.style.removeProperty(name);
  };
}
