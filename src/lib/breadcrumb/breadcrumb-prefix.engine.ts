import template from '../vendor/breadcrumb-prefix.css.js';

/** The canonical token marker and anticon are preserved. Root and reset selectors are scoped to the owner. */
export function getBreadcrumbPrefixCss(prefix: string) {
  if (prefix === 'ant-breadcrumb') {
    return undefined;
  }

  const scope = `:where([data-ant-breadcrumb-prefix=${JSON.stringify(prefix)}])`;

  return template.replace(
    /\.ant-breadcrumb([-\w]*)|"ant-breadcrumb"|" ant-breadcrumb"/g,
    (match, suffix: string | undefined) => {
      if (suffix !== undefined) {
        return suffix === '-css-var' ? `.ant-breadcrumb-css-var${scope}` : `.${prefix}${suffix}`;
      }
      return match === '"ant-breadcrumb"' ? `"${prefix}"` : `" ${prefix}"`;
    }
  ).replace(/<\/style/gi, '<\\/style');
}
