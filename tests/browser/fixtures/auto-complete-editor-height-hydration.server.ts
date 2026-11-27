import { render } from 'svelte/server';
import AutoCompleteEditorHeightFixtures from './AutoCompleteEditorHeightFixtures.svelte';

/** Rendering a non-empty user editor until the client is downloaded. */
export function renderAutoCompleteEditorHeight() {
  return render(AutoCompleteEditorHeightFixtures, {
    idPrefix: 'auto-complete-editor-height',
    props: { initial: 'initial-value' }
  });
}
