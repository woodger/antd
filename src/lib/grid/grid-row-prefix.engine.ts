import template from '../vendor/grid-row-prefix.css.js';

/** Row layout/reset selectors are restricted by the owner, canonical Grid marker is retained. */
export function getGridRowPrefixCss(prefix: string) {
  if (prefix === 'ant-row') {
    return undefined;
  }

  const scope = `:where([data-ant-grid-row-prefix=${JSON.stringify(prefix)}])`;

  return template.replace(
    /\.ant-row([-\w]*)|"ant-row"|" ant-row"/g,
    (match, suffix: string | undefined) => {
      if (suffix !== undefined) {
        return `.${prefix}${suffix}${scope}`;
      }
      return match === '"ant-row"' ? `"${prefix}"` : `" ${prefix}"`;
    }
  ).replace(/<\/style/gi, '<\\/style');
}
