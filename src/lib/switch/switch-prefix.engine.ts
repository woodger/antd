import template from '../vendor/switch-prefix.css.js';

const rootStates = new Set(['', '-small', '-checked', '-disabled', '-loading', '-rtl']);

/** Switch classes are changed regardless of canonical component token variables. */
export function getSwitchPrefixCss(prefix: string) {
  if (prefix === 'ant-switch') {
    return undefined;
  }

  const scope = `:where([data-ant-switch-prefix=${JSON.stringify(prefix)}])`;

  return template.replace(
    /\.ant-switch([-\w]*)/g,
    (_match, suffix: string) => `.${prefix}${suffix}${rootStates.has(suffix) ? scope : ''}`
  ).replace(/<\/style/gi, '<\\/style');
}
