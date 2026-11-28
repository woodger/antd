import { render } from 'svelte/server';
import FormControlAdaptersFixtures from './FormControlAdaptersFixtures.svelte';

/** Renders the adapter's initial value props in the real package SSR tree. */
export function renderFormControlAdapters() {
  return render(FormControlAdaptersFixtures);
}
