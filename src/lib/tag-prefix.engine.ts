import template from './vendor/tag-prefix.css.js';

/** Changes componentCls; marker, icons and original names CSS variables remain shared. */
export function getTagPrefixCss(prefix: string) {
  if (prefix === 'ant-tag') {
    return undefined;
  }

  // Runtime stylesheet follows scoped styles; equal specificity preserves native font.
  const nativeFont = '\n.ant-tag:where(.ant-tag-css-var) [data-ant-tag-close]{font:inherit;'
    + 'letter-spacing:inherit;}';
  return `${template}${nativeFont}`
    .replace(/\.ant-tag(?!-css-var\b)/g, () => `.${prefix}`)
    .replace(/"ant-tag"/g, () => `"${prefix}"`)
    .replace(/" ant-tag"/g, () => `" ${prefix}"`)
    .replace(/<\/style/gi, '<\\/style');
}
