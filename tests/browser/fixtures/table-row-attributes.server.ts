import { render } from 'svelte/server';
import Fixture from './TableRowAttributesFixture.svelte';

/** Forms the original lines with the editor before DOM listeners appear. */
export function renderRowAttributes(profileId: string) {
  return render(Fixture, { props: { profileId, editor: true } });
}
