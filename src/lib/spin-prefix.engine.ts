import template from './vendor/spin-prefix.css.js';

const rootStates = new Set(['', '-rtl', '-spinning', '-fullscreen', '-sm', '-lg']);

/** Replacing only BEM classes; section is also a child node, not root state. */
export function getSpinPrefixCss(prefix: string) {
  if (prefix === 'ant-spin') {
    return undefined;
  }

  return template
    .replace(/\.ant-spin([-\w]*)/g, (_, suffix: string) => suffix === '-css-var'
      ? '.ant-spin-css-var:where([data-ant-spin-prefix])'
      : `.${prefix}${suffix}${rootStates.has(suffix) ? ':where([data-ant-spin-prefix])' : ''}`)
    .replace(/"ant-spin"/g, () => `"${prefix}"`)
    .replace(/" ant-spin"/g, () => `" ${prefix}"`)
    .replace(/<\/style/gi, '<\\/style');
}
