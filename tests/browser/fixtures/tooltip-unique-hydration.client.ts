import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import Fixture from './TooltipUniqueFixtures.svelte';
import Delegates from './TooltipUniqueDelegateFixtures.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered Tooltip.UniqueProvider');
}

// The trigger exists until the hydration is started, so that the test can keep the focus on it.
target.addEventListener('hydrate-tooltip-unique', () => {
  const component = new URLSearchParams(location.search).has('delegates') ? Delegates : Fixture;
  hydrate(component, { target, props: { initialMode: 'default-open' }, recover: false });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
