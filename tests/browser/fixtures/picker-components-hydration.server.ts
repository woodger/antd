import { render } from 'svelte/server';
import PickerComponentsFixtures, { editorHydrationProfile } from './PickerComponentsFixtures.svelte';

/** Сериализует маскированный диапазон с обоими редакторами textarea. */
export function renderEditorFixture() {
  return render(PickerComponentsFixtures, { props: { profile: editorHydrationProfile } });
}
