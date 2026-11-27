import template from './vendor/splitter-prefix.css.js';

/** Class prefix and global namespace preview are independent; root rules are isolated by both. */
export function getSplitterPrefixCss(prefix: string, rootPrefix = 'ant') {
  if (prefix === 'ant-splitter' && rootPrefix === 'ant') {
    return undefined;
  }

  const namespace = rootPrefix.replace(/\./g, '');
  const scope = `:where([data-ant-splitter-prefix=${JSON.stringify(prefix)}][data-ant-splitter-vars=${JSON.stringify(namespace)}])`;

  return template.replace(
    /\.ant-splitter([-\w]*)|--ant-splitter-bar-preview-offset|"ant-splitter"|" ant-splitter"/g,
    (match, suffix: string | undefined, offset: number) => {
      if (suffix !== undefined) {
        if (suffix === '-css-var') {
          return `.ant-splitter-css-var${scope}`;
        }
        // :has checks the nested Splitter with the same class, regardless of its namespace.
        const root = ['', '-horizontal', '-vertical', '-rtl'].includes(suffix)
          && template.slice(offset - 5, offset) !== ':has(';
        return `.${prefix}${suffix}${root ? scope : ''}`;
      }
      if (match === '--ant-splitter-bar-preview-offset') {
        return `--${namespace}-splitter-bar-preview-offset`;
      }
      return match === '"ant-splitter"' ? `"${prefix}"` : `" ${prefix}"`;
    }
  ).replace(/<\/style/gi, '<\\/style');
}
