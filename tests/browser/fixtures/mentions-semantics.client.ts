import '@woodger/antd/styles.css';
import { hydrate, mount } from 'svelte';
import Fixture from './MentionsSemanticFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing Mentions semantic fixture');
}
const query = new URLSearchParams(location.search);
const profile = query.get('mentions-semantics') ?? 'live';
if (query.has('ssr')) {
  // Тест устанавливает фокус на редакторе из серверной разметки.
  target.addEventListener('hydrate-mentions-semantics', () => {
    hydrate(Fixture, { target, props: { profile }, recover: false });
    target.dataset.hydrated = 'true';
  }, { once: true });
  target.dataset.hydrationReady = 'true';
}
else {
  mount(Fixture, { target, props: { profile } });
}
