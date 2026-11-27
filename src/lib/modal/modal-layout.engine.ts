// Collects geometry Modal on tokens. Media queries work already at SSR, so the change of viewport
// does not change the owner of the dialog or its contents.
import { hashTokenString } from '../theme-hash.engine';
import type { AliasToken } from '../theme-token.types';
import type { GridBreakpoint } from '../grid/grid.types';
import type { ModalWidth } from './modal.types';
import type { InlineStyleLayer } from '../inline-style.engine';

const breakpoints = [
  ['sm', 'screenSMMin'], ['md', 'screenMDMin'], ['lg', 'screenLGMin'],
  ['xl', 'screenXLMin'], ['xxl', 'screenXXLMin'], ['xxxl', 'screenXXXLMin']
] as const;
const widthBreakpoints = ['xs', ...breakpoints.map(([breakpoint]) => breakpoint)] as const;
type LayoutTokens = Pick<
  AliasToken, typeof breakpoints[number][1] | 'screenSMMax' | 'margin' | 'marginXS'
>;

interface ModalLayout {
  width: string;
  height?: string;
  variables?: InlineStyleLayer;
  scope?: string;
  css?: string;
}

/** Numerical width remains in pixels. CSS-length comes already with units. */
function cssLength(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value;
}

/** The name belongs to the prefix Modal, including when transferred to getContainer. */
function widthVariable(prefix: string, breakpoint: GridBreakpoint) {
  return `--${prefix}-${breakpoint}-width`;
}

/** Intervals without a given width use fallback in media queries. */
function responsiveVariables(map: Exclude<ModalWidth, string | number>, prefix: string) {
  const variables: [string, string][] = [];
  for (const key of widthBreakpoints) {
    const value = map[key];
    // initial includes fallback var() and separates the dimensions of the nested panel from the external.
    variables.push([widthVariable(prefix, key), value == null ? 'initial' : cssLength(value)]);
  }

  return variables;
}

/** Layout scope shares themes with different breakpoint even at one prefixCls. */
export function getModalLayout(
  width: ModalWidth,
  height: number | string | undefined,
  centered: boolean | undefined,
  prefix: string,
  token: LayoutTokens
): ModalLayout {
  const cssHeight = height == null ? undefined : cssLength(height);
  if (typeof width === 'number' && centered === undefined) {
    return { width: cssLength(width), height: cssHeight };
  }

  const metrics = [token.margin, token.marginXS, token.screenSMMax,
    ...breakpoints.map(([, key]) => token[key])];
  const scope = `antd-modal-layout-${hashTokenString(JSON.stringify([prefix, metrics, centered]))}`;
  const rule = `[data-ant-modal-layout="${scope}"]`;
  const maxWidth = `calc(100vw - ${token.margin * 2}px)`;
  const desktop = `${rule}{--ant-svelte-modal-max-width:${maxWidth};`
    + `--ant-svelte-modal-top:100px}`;
  const compact = `--ant-svelte-modal-max-width:calc(100vw - 16px);`
    + `--ant-svelte-modal-top:${100 + token.marginXS}px`;
  const rules = [desktop, `@media(max-width:${token.screenSMMax}px){${rule}{${compact}}}`];

  if (typeof width !== 'object' || width === null) {
    return {
      width: width === null ? 'auto' : cssLength(width),
      height: cssHeight,
      scope,
      css: rules.join('')
    };
  }

  const variables = responsiveVariables(width, prefix);
  const fallback = centered ? 'fit-content' : 'auto';
  let chain = `var(${widthVariable(prefix, 'xs')},${fallback})`;
  rules.push(`${rule}{--ant-svelte-modal-width:${chain}}`);
  for (const [breakpoint, key] of breakpoints) {
    chain = `var(${widthVariable(prefix, breakpoint)},${chain})`;
    const setWidth = `--ant-svelte-modal-width:${chain}`;
    rules.push(`@media(min-width:${token[key]}px){${rule}{${setWidth}}}`);
  }

  return {
    width: 'var(--ant-svelte-modal-width)',
    height: cssHeight,
    variables,
    scope,
    css: rules.join('')
  };
}
