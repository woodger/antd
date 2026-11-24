import { render } from 'svelte/server';
import AutoCompleteEditorHeightFixtures from './AutoCompleteEditorHeightFixtures.svelte';

/** Рендерит непустой пользовательский редактор до загрузки клиента. */
export function renderAutoCompleteEditorHeight() {
  return render(AutoCompleteEditorHeightFixtures, {
    idPrefix: 'auto-complete-editor-height',
    props: { initial: 'initial-value' }
  });
}
