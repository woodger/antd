import template from './vendor/tree-select-popup-motion.css.js';

/** Select owns the shared slide/move CSS; keep it scoped to this TreeSelect popup. */
export function treeSelectMotionCss(selectPrefix: string, rootPrefix: string) {
  if (selectPrefix === 'ant-select' && rootPrefix === 'ant') return undefined;

  const owner = `:where([data-ant-select-prefix=${JSON.stringify(selectPrefix)}]`
    + `[data-ant-select-root-prefix=${JSON.stringify(rootPrefix)}][data-ant-tree-select-motion])`;
  return template.replace(/\.ant-select-dropdown([-\w]*)|\.ant-(slide|move)-/g,
    (_match, suffix: string | undefined, kind: string | undefined) => suffix !== undefined
      ? `.${selectPrefix}-dropdown${suffix}${owner}` : `.${rootPrefix}-${kind}-`
  ).replace(/<\/style/gi, '<\\/style');
}
