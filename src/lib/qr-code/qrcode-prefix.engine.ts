import template from '../vendor/qrcode-prefix.css.js';

/** Root/borderless and CSS-variable defaults are isolated from neighboring QRCode. */
export function getQRCodePrefixCss(prefix: string) {
  if (prefix === 'ant-qrcode') {
    return undefined;
  }

  return template
    .replace(/\.ant-qrcode([-\w]*)/g, (_, suffix: string) => suffix === '-css-var'
      // Legacy theme.css preserves adaptive color-mix. The fallback module leaves it in place.
      ? ':where(.ant-qrcode-css-var[data-ant-qrcode-prefix])'
      : `.${prefix}${suffix}${!suffix || suffix === '-borderless'
        ? ':where([data-ant-qrcode-prefix])' : ''}`)
    .replace(/"ant-qrcode"/g, () => `"${prefix}"`)
    .replace(/" ant-qrcode"/g, () => `" ${prefix}"`)
    .replace(/<\/style/gi, '<\\/style');
}
