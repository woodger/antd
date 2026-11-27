import template from './vendor/badge-ribbon-prefix.css.js';

/** Upstream Ribbon geometry follows the shared prefix independently of local prefixCls. */
export function getBadgeRibbonPrefixCss(rootPrefix: string) {
  if (rootPrefix === 'ant') {
    return undefined;
  }

  return template
    .replace(/\.ant-ribbon(?!-(?:wrapper-)?css-var\b)|"ant-ribbon"|" ant-ribbon"/g, match => {
      if (match.startsWith('.')) {
        return `.${rootPrefix}-ribbon`;
      }
      return match === '"ant-ribbon"' ? `"${rootPrefix}-ribbon"` : `" ${rootPrefix}-ribbon"`;
    })
    .replace(/<\/style/gi, '<\\/style');
}
