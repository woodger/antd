import { render } from 'svelte/server';
import Fixture from './ButtonHydrationFixture.svelte';

/** Возвращает разметку Button до подключения обработчиков. */
export function renderButton(profile: 'button' | 'link') {
  return render(Fixture, { props: { profile } });
}
