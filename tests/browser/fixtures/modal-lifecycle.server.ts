// Рендерит те же входные props, которые использует browser hydrate.
import type { ComponentProps } from 'svelte';
import { render } from 'svelte/server';
import ModalLifecycleFixtures from './ModalLifecycleFixtures.svelte';

/** Возвращает SSR-разметку без запуска browser lifecycle. */
export function renderModalLifecycle(props: ComponentProps<typeof ModalLifecycleFixtures>) {
  return render(ModalLifecycleFixtures, { props });
}
