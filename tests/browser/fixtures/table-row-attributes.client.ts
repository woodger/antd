import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import Fixture from './TableRowAttributesFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered row attributes');
}

const profileId = new URLSearchParams(location.search).get('profile') ?? 'grouped';
// Откладывает гидратацию до ввода текста в серверном редакторе.
target.addEventListener('hydrate-table-row-attributes', () => {
  hydrate(Fixture, { target, props: { profileId, editor: true }, recover: false });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
