import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import Fixture from './TooltipUniqueFixtures.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered Tooltip.UniqueProvider');
}

// Триггер существует до запуска гидратации, чтобы тест мог сохранить на нём фокус.
target.addEventListener('hydrate-tooltip-unique', () => {
  hydrate(Fixture, { target, props: { initialMode: 'default-open' }, recover: false });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
