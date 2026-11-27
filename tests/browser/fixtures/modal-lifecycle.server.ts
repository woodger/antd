// Renders with the same input props used for browser hydration.
import type { ComponentProps } from 'svelte';
import { render } from 'svelte/server';
import ModalLifecycleFixtures from './ModalLifecycleFixtures.svelte';

/** Returns SSR-marking without running browser lifecycle. */
export function renderModalLifecycle(props: ComponentProps<typeof ModalLifecycleFixtures>) {
  return render(ModalLifecycleFixtures, { props });
}
