import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import TableVirtualFixture from './TableVirtualFixture.svelte';
import TableCustomBodyFixture from './TableCustomBodyFixture.svelte';
import TableElementComponentsFixture from './TableElementComponentsFixture.svelte';
import TableLoadingFixture from './TableLoadingFixture.svelte';
import TableConfigFixture from './TableConfigFixture.svelte';
import TableCellUpdateFixture from './TableCellUpdateFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered virtual table');
}

// Редактирование поля до запуска клиента позволяет проверить DOM identity и caret.
target.addEventListener('hydrate-table-virtual', () => {
  const query = new URLSearchParams(location.search);
  if (query.has('custom-elements')) {
    hydrate(TableElementComponentsFixture, {
      target, props: { profileId: 'virtual', editor: true, stringTag: query.has('string-tag') },
      recover: false
    });
  }
  else if (query.has('custom-body')) {
    hydrate(TableCustomBodyFixture, { target, props: { profileId: 'dom' }, recover: false });
  }
  else if (query.has('table-loading')) {
    hydrate(TableLoadingFixture, {
      target, props: { profileId: 'object-editor', initiallyIdle: true }, recover: false
    });
  }
  else if (query.has('table-config')) {
    hydrate(TableConfigFixture, {
      target, props: { profileId: 'inherit', editor: true }, recover: false
    });
  }
  else if (query.has('table-cell-update')) {
    hydrate(TableCellUpdateFixture, {
      target, props: { profile: 'virtual', editor: true }, recover: false
    });
  }
  else {
    hydrate(TableVirtualFixture, {
      target, props: { profileId: 'fixed', editor: true, captioned: true }, recover: false
    });
  }
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
