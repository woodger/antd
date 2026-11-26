import { render } from 'svelte/server';
import Fixture from './ButtonLoadingMotionFixture.svelte';

/** Возвращает Button с уже видимым штатным значком для гидратации. */
export function renderLoadingButton() {
  return render(Fixture, { props: { profile: 'initial' } });
}
