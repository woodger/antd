import { render } from 'svelte/server';
import FormUploadFieldsFixtures from './FormUploadFieldsFixtures.svelte';

/** Renders the named Upload fields for strict hydration of their labels and refs. */
export function renderFormUploadFields() {
  return render(FormUploadFieldsFixtures);
}
