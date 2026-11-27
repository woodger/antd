/** A local componentCls leaves Popconfirm's CSS variables, marker, and outer Popover intact. */
export function getOverlayPrefixCss(
  kind: 'tooltip' | 'popover' | 'popconfirm',
  prefix: string,
  template: string
) {
  const original = `ant-${kind}`;
  if (prefix === original) {
    return undefined;
  }

  const componentSelector = new RegExp(`\\.${original}(?!-css-var\\b)`, 'g');

  return template
    .replace(componentSelector, () => `.${prefix}`)
    .replace(/<\/style/gi, '<\\/style');
}
