import template from './vendor/modal-prefix.css.js';

// Правило из закреплённого Modal: существующий prefix-шаблон исключает Skeleton.
const loadingTemplate = '.ant-modal .ant-modal-body .ant-modal-body-skeleton{width:100%;'
  + 'height:100%;'
  + 'display:flex;'
  + 'justify-content:center;'
  + 'align-items:center;'
  + 'margin:var(--ant-margin) auto;}';

/** Modal/Confirm разделяют local classes и общий Button prefix; token marker остаётся canonical. */
export function getModalPrefixCss(prefix: string, rootPrefix: string, iconPrefix = 'anticon') {
  if (prefix === 'ant-modal' && rootPrefix === 'ant' && iconPrefix === 'anticon') {
    return undefined;
  }

  const iconScope = iconPrefix === 'anticon'
    ? '' : `[data-ant-modal-icon-prefix=${JSON.stringify(iconPrefix)}]`;
  const scope = `:where([data-ant-modal-prefix=${JSON.stringify(prefix)}]`
    + `[data-ant-modal-root-prefix=${JSON.stringify(rootPrefix)}]${iconScope})`;
  const roots = new Set([
    '', '-root', '-wrap', '-wrap-rtl', '-centered', '-confirm', '-confirm-rtl',
    '-confirm-info', '-confirm-success', '-confirm-error', '-confirm-warning', '-confirm-confirm'
  ]);

  return (template + loadingTemplate).replace(
    /\.ant-modal([-\w]*)|\.ant-btn([-\w]*)|\.anticon(?![-\w])|--ant-modal-(xs|sm|md|lg|xl|xxl)-width|"ant-modal"|" ant-modal"/g,
    (
      match,
      suffix: string | undefined,
      button: string | undefined,
      breakpoint: string | undefined
    ) => {
      if (breakpoint !== undefined) {
        return `--${prefix}-${breakpoint}-width`;
      }
      if (button !== undefined) {
        return `.${rootPrefix}-btn${button}`;
      }
      if (match === '.anticon') {
        return `.${iconPrefix}`;
      }
      if (suffix === '-css-var') {
        return `.ant-modal-css-var${scope}`;
      }
      if (suffix !== undefined) {
        return `.${prefix}${suffix}${roots.has(suffix) ? scope : ''}`;
      }

      return match === '"ant-modal"' ? `"${prefix}"` : `" ${prefix}"`;
    }
  ).replace(/<\/style/gi, '<\\/style');
}
