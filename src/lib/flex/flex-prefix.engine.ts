import template from '../vendor/flex-prefix.css.js';

/** All Flex selectors belong to the root; CSS variables and marker retain names. */
export function getFlexPrefixCss(prefix: string) {
  if (prefix === 'ant-flex') {
    return undefined;
  }

  return template
    .replace(/\.ant-flex(?!-css-var\b)([-\w]*)/g, (_, suffix: string) =>
      `.${prefix}${suffix}:where([data-ant-flex-prefix])`)
    .replace(/<\/style/gi, '<\\/style');
}
