/** Updates the theme variables and specified properties, saving the coordinates of DOM-controller. */
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

  // Relieves only the properties of this entry when you update or withdraw attachment.
  return () => {
    for (const name of names) node.style.removeProperty(name);
  };
}
