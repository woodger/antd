// Сохраняет те же настройки футера на серверной стороне hydration fixture.
import { render } from 'svelte/server';
import ModalActionFixtures from './ModalActionFixtures.svelte';

/** Рендерит закрытую SSR-панель с пользовательским порядком кнопок. */
export function renderModalActions() {
  return render(ModalActionFixtures, { props: { kind: 'ordinary', profile: 'footer-render' } });
}
