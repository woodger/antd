import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import SelectSurfaceHydrationCase from './SelectSurfaceHydrationCase.svelte';
import { selectSurfaceHydrationSamples } from './select-surface-hydration-cases';

export function renderSelectSurfaceHydration(id: string) {
  if (typeof window !== 'undefined' || typeof document !== 'undefined') {
    throw Error('Select surface hydration must start with DOM-free SSR');
  }
  const sample = selectSurfaceHydrationSamples.find(sample => sample.id === id);
  if (!sample) throw Error(`Unknown Select surface hydration sample: ${id}`);
  const capture: NonNullable<ComponentProps<typeof SelectSurfaceHydrationCase>['capture']> = {};
  const rendered = render(
    SelectSurfaceHydrationCase,
    { props: { sample, capture }, idPrefix: 'select-surface-hydration' }
  );
  return { head: rendered.head, domFree: true, state: capture.read!(),
    body: `<section data-select-surface-hydration><div data-select-surface-hydration-target>${rendered.body}</div><input aria-label="Surface outside draft" style="position:fixed;left:16px;bottom:16px" /></section>` };
}
