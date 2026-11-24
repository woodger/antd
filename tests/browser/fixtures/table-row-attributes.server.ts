import { render } from 'svelte/server';
import Fixture from './TableRowAttributesFixture.svelte';

/** Формирует исходные строки с редактором до того, как появятся DOM listeners. */
export function renderRowAttributes(profileId: string) {
  return render(Fixture, { props: { profileId, editor: true } });
}
