/** Compares observations of Select with the measurement of React with differences in the issuance of CSSOM and the dimensions of INPUT. */
import assert from 'node:assert/strict';

interface HorizontalMetrics {
  clientWidth: number | null;
  scrollWidth: number | null;
}

/** Retains the amount of overflow with different accounting of indentations of native INPUT. */
function inputLayout<Metrics extends HorizontalMetrics>(metrics: Metrics) {
  const { clientWidth, scrollWidth, ...layout } = metrics;
  if (clientWidth === null || scrollWidth === null) {
    return metrics;
  }

  return { ...layout, horizontalOverflow: scrollWidth - clientWidth };
}

/** Checks metrics and scrolling, including INPUT overflow. The outer rectangle is checked separately. */
export function verifySelectComponentMetrics<Metrics extends HorizontalMetrics>(
  actual: Metrics | undefined,
  source: Metrics | undefined,
  tag: string | undefined,
  label: string
) {
  if (tag !== 'INPUT' || !actual || !source) {
    assert.deepEqual(actual, source, label);
    return;
  }

  assert.deepEqual(inputLayout(actual), inputLayout(source), label);
}

/** Quotes the equivalent values of the calculated alignment inside the flex to a single record. */
export function comparableFlexAlignment(value: string, display: string | undefined) {
  if (display === 'flex' || display === 'inline-flex') {
    if (value === 'flow-start') return 'flex-start';
    if (value === 'flow-end') return 'flex-end';
  }

  return value;
}

/** Applies the rule of alignment to the picture of calculated styles, saving the original picture. */
export function comparableSelectComponentCSS(css: Record<string, string>) {
  const alignItems = comparableFlexAlignment(css.alignItems, css.display);
  return alignItems === css.alignItems ? css : { ...css, alignItems };
}
