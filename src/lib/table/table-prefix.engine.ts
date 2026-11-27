import template from '../vendor/table-prefix.css.js';
import type { DesignTokenState } from '../theme/theme-context.types';
import { serializeThemeVariables, snapshotThemeVariables, tokenToCSSVariable }
  from '../theme/theme-css-variables.engine';

/** Table owner and private nested border are independent of total Checkbox/Pagination namespaces. */
export function getTablePrefixCss(prefix: string, rootPrefix: string) {
  if (prefix === 'ant-table' && rootPrefix === 'ant') {
    return undefined;
  }

  const scope = `:where([data-ant-table-prefix=${JSON.stringify(prefix)}]`
    + `[data-ant-table-root-prefix=${JSON.stringify(rootPrefix)}])`;
  const roots = new Set(['', '-wrapper', '-wrapper-rtl', '-filter-dropdown', '-medium',
    '-small', '-large', '-bordered', '-empty', '-no-header']);
  const namespace = rootPrefix.replaceAll('.', '');

  return template.replace(
    /\.ant-table([-\w]*)|\.ant-(pagination|checkbox|radio|descriptions)([-\w]*)|--ant-table-nested-border-top|"ant-table"|" ant-table"/g,
    (match, suffix: string | undefined, child: string | undefined, part: string | undefined) => {
      if (child !== undefined) {
        return `.${rootPrefix}-${child}${part}`;
      }
      if (match === '--ant-table-nested-border-top') {
        return `--${namespace}-table-nested-border-top`;
      }
      if (suffix === '-css-var') {
        return `.ant-table-css-var${scope}`;
      }
      if (suffix !== undefined) {
        return `.${prefix}${suffix}${roots.has(suffix) ? scope : ''}`;
      }

      return match === '"ant-table"' ? `"${prefix}"` : `" ${prefix}"`;
    }
  ).replace(/<\/style/gi, '<\\/style');
}

/** Restores the altered total tokens Table after its own CSS scope nested Spin. */
export function getTableSpinTheme(state: DesignTokenState, rootStyle?: string | null) {
  const declarations = (rootStyle ?? '').matchAll(/(?:^|;)\s*(--[\w-]+)\s*:/g);
  const overrides = new Set(Array.from(declarations, match => match[1]));
  for (const key of Object.keys(state.token.Spin ?? {})) {
    overrides.add(tokenToCSSVariable(key, state.prefix));
  }

  const prefix = tokenToCSSVariable('', state.prefix);
  const referenceStart = `var(${prefix}`;
  const names = new Set<string>();
  for (const value of Object.values(state.cssVar)) {
    if (typeof value !== 'string' || !value.startsWith(referenceStart)) {
      continue;
    }

    const prefixed = value.slice(4, -1);
    const canonical = `--ant-${prefixed.slice(prefix.length)}`;
    if (overrides.has(prefixed) || overrides.has(canonical)) {
      names.add(prefixed);
      names.add(canonical);
    }
  }

  if (!names.size) {
    return undefined;
  }

  const { snapshots, resets } = snapshotThemeVariables(names, 'table-base');
  return { root: snapshots, content: serializeThemeVariables(resets) };
}
