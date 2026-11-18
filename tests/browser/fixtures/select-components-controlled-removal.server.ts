import { render } from 'svelte/server';
import Owner from './SelectComponentsControlledRemovalCase.svelte';
import type { ControlledRemovalSample, ControlledRemovalCapture } from '../select-components-controlled-removal-cases';
export function renderControlledRemoval(sample: ControlledRemovalSample) {
  const capture: ControlledRemovalCapture = {};
  const rendered = render(Owner, { props: { sample, capture } });
  return { body: rendered.body, head: rendered.head, owner: capture.read!() };
}
