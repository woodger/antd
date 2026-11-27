/** Estimation of Ant Tree wrapper; the actual heights of the list are specified by DOM-measurement. */
export function treeItemHeight(token: {
  paddingXS: number;
  controlHeightSM: number;
  Tree?: { titleHeight?: number; };
}): number {
  return token.paddingXS / 2 + (token.Tree?.titleHeight || token.controlHeightSM);
}
