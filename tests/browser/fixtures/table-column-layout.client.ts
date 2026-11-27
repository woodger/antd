import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import DefaultsFixture from './TableColumnDefaultsFixture.svelte';
import Fixture from './TableColumnLayoutFixture.svelte';
import LocaleFixture from './TableLocaleFixture.svelte';
import PaginationFixture from './TablePaginationFixture.svelte';
import SemanticFixture from './TableSemanticFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered column layout');
}

const query = new URLSearchParams(location.search);
const profileId = query.get('profile') ?? 'fixed-rtl';
// The stand leaves server DOM nodes available until strict hydration begins.
target.addEventListener('hydrate-table-column-layout', () => {
  if (query.has('table-locale')) {
    hydrate(LocaleFixture, { target, props: { profileId: 'body-snippet' }, recover: false });
  }
  else if (query.has('pagination')) {
    hydrate(PaginationFixture, { target, props: { profileId: 'live' }, recover: false });
  }
  else if (query.has('semantic')) {
    hydrate(SemanticFixture, { target, props: { profileId: 'reactive' }, recover: false });
  }
  else if (query.has('defaults')) {
    hydrate(DefaultsFixture, { target, props: { profileId: 'groups', editor: true }, recover: false });
  }
  else {
    hydrate(Fixture, { target, props: { profileId, editor: true }, recover: false });
  }
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
