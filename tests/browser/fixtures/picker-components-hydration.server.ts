import { render } from 'svelte/server';
import PickerComponentsFixtures, { editorHydrationProfile } from './PickerComponentsFixtures.svelte';

/** Сериализует маскированный диапазон с обоими редакторами textarea. */
export function renderEditorFixture(nativeSlot = false) {
  const profile = { ...editorHydrationProfile, nativeSlot };
  return render(PickerComponentsFixtures, { props: { profile } });
}
