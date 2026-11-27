import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import Fixture from './TableSorterFixture.svelte';
import TooltipFixture from './TableSorterTooltipFixture.svelte';
import TitleFixture from './TableColumnTitleFixture.svelte';
import HeadingFixture from './TableHeadingContentFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered Table sorter');
}

// Scenario sets the focus on the server button until handlers are connected.
target.addEventListener('hydrate-table-sorter', () => {
  const query = new URLSearchParams(location.search);
  if (query.has('column-title')) {
    hydrate(TitleFixture, { target, props: { profileId: 'interactive' }, recover: false });
  }
  else if (query.has('heading-content')) {
    hydrate(HeadingFixture, { target, props: { profileId: 'live' }, recover: false });
  }
  else if (query.has('sorter-tooltip')) {
    hydrate(TooltipFixture, { target, props: { profileId: 'controlled' }, recover: false });
  }
  else {
    hydrate(Fixture, { target, props: { profileId: 'controlled' }, recover: false });
  }
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
