import { render } from 'svelte/server';
import PickerComponentsFixtures, { editorHydrationProfile } from './PickerComponentsFixtures.svelte';

/** Serializes a masked range with both textarea editors. */
export function renderEditorFixture(nativeSlot = false) {
  const profile = { ...editorHydrationProfile, nativeSlot };
  return render(PickerComponentsFixtures, { props: { profile } });
}
