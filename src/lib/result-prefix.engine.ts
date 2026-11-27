import template from './vendor/result-prefix.css.js';

const rootStates = new Set(['', '-rtl', '-success', '-error', '-info', '-warning']);

/** General variables/marker; reset and status rules are limited to their Result root. */
export function getResultPrefixCss(prefix: string) {
  if (prefix === 'ant-result') {
    return undefined;
  }

  return template
    .replace(/\.ant-result([-\w]*)/g, (_, suffix: string) => suffix === '-css-var'
      ? '.ant-result-css-var:where([data-ant-result-prefix])'
      : `.${prefix}${suffix}${rootStates.has(suffix) ? ':where([data-ant-result-prefix])' : ''}`)
    .replace(/"ant-result"/g, () => `"${prefix}"`)
    .replace(/" ant-result"/g, () => `" ${prefix}"`)
    .replace(/<\/style/gi, '<\\/style');
}
