import { render } from 'svelte/server';
import Fixture from './AppCustomRootFixture.svelte';

/** Возвращает App и пользовательский корень до подключения обработчиков. */
export function renderCustomApp() {
  return render(Fixture);
}
