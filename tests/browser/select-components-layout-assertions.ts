/** Сравнивает наблюдения Select с замером React при различиях в выдаче CSSOM и размеров INPUT. */
import assert from 'node:assert/strict';

interface HorizontalMetrics {
  clientWidth: number | null;
  scrollWidth: number | null;
}

/** Сохраняет величину переполнения при разном учёте отступов нативного INPUT. */
function inputLayout<Metrics extends HorizontalMetrics>(metrics: Metrics) {
  const { clientWidth, scrollWidth, ...layout } = metrics;
  if (clientWidth === null || scrollWidth === null) {
    return metrics;
  }

  return { ...layout, horizontalOverflow: scrollWidth - clientWidth };
}

/** Сверяет метрики и прокрутку, включая переполнение INPUT. Внешний прямоугольник сверяется отдельно. */
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

/** Приводит эквивалентные значения вычисленного выравнивания внутри flex к одной записи. */
export function comparableFlexAlignment(value: string, display: string | undefined) {
  if (display === 'flex' || display === 'inline-flex') {
    if (value === 'flow-start') return 'flex-start';
    if (value === 'flow-end') return 'flex-end';
  }

  return value;
}

/** Применяет правило выравнивания к снимку вычисленных стилей, сохраняя исходный снимок. */
export function comparableSelectComponentCSS(css: Record<string, string>) {
  const alignItems = comparableFlexAlignment(css.alignItems, css.display);
  return alignItems === css.alignItems ? css : { ...css, alignItems };
}
