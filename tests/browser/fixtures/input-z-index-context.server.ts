import { render } from 'svelte/server';
import Fixture from './InputZIndexContextFixture.svelte';

/** Рендерит серверный trigger и исходный слой диалога перед подключением клавиатуры. */
export function renderInputZIndexContext() {
  return render(Fixture, { props: { profileId: 'keyboard' } });
}
