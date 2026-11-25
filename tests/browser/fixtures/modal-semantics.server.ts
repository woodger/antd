// Использует тот же component fixture для проверки SSR и строгой гидратации.
import { render } from 'svelte/server';
import ModalSemanticFixtures from './ModalSemanticFixtures.svelte';

/** Рендерит исходный HTML под выбранным семантическим профилем. */
export function renderModalSemantics(id: string) {
  return render(ModalSemanticFixtures, { props: { id } });
}
