import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import TableVirtualFixture from './TableVirtualFixture.svelte';
import TableCustomBodyFixture from './TableCustomBodyFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered virtual table');
}

// Редактирование поля до запуска клиента позволяет проверить DOM identity и caret.
target.addEventListener('hydrate-table-virtual', () => {
  if (new URLSearchParams(location.search).has('custom-body')) {
    hydrate(TableCustomBodyFixture, { target, props: { profileId: 'dom' }, recover: false });
  }
  else {
    hydrate(TableVirtualFixture, {
      target, props: { profileId: 'fixed', editor: true, captioned: true }, recover: false
    });
  }
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
