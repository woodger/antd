import { render } from 'svelte/server';
import Fixture from './TooltipUniqueFixtures.svelte';

/** Сериализует триггеры и defaultOpen до привязки общего popup. */
export function renderTooltipUnique() {
  return render(Fixture, { props: { initialMode: 'default-open' } });
}
