import type { ComponentSize } from '@woodger/antd';

/** Raw benchmarks sign the usual middle size; it's a measurement tag, not a prop. */
export function referenceSizeLabel(size: ComponentSize) {
  return size === 'medium' ? 'middle' : size;
}

/** Reproduces the current size according to historical Source input data. */
export function currentReferenceSize(size: unknown): ComponentSize | undefined {
  if (size === 'small' || size === 'large') {
    return size;
  }
  if (size === 'medium' || size === 'middle') {
    return 'medium';
  }
  return undefined;
}
