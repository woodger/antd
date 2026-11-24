import '@woodger/antd/styles.css';
import { hydrate, mount } from 'svelte';
import TableSummaryFixture from './TableSummaryFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing Table summary fixture root');
}

if (new URLSearchParams(location.search).has('hydrate')) {
  // Даёт тесту заполнить и сфокусировать серверный итог до старта Svelte.
  target.addEventListener('hydrate-table-summary', () => {
    hydrate(TableSummaryFixture, { target, props: { editor: true }, recover: false });
    target.dataset.hydrated = 'true';
  }, { once: true });
  target.dataset.hydrationReady = 'true';
}
else {
  mount(TableSummaryFixture, { target });
}
