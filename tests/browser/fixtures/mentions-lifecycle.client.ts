// Uses only a public package and fixes the moment of strict hydration in the browser.
import '@woodger/antd/styles.css';
import './mentions-lifecycle.css';
import { hydrate, mount } from 'svelte';
import Fixture from './MentionsLifecycleFixture.svelte';
import reference from './ant-design-mentions-lifecycle-reference.json';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing Mentions lifecycle fixture');
}

const query = new URLSearchParams(location.search);
const name = query.get('mentions-lifecycle') ?? 'named';
const sample = reference.cases.find(item => item.profile.id === name);
if (!sample) {
  throw new Error('Unknown Mentions lifecycle profile ' + name);
}

const { profile } = sample;
if (query.has('ssr')) {
  target.addEventListener('hydrate-mentions-lifecycle', () => {
    hydrate(Fixture, { target, props: { profile }, recover: false });
    target.dataset.hydrated = 'true';
  }, { once: true });
  target.dataset.hydrationReady = 'true';
}
else {
  mount(Fixture, { target, props: { profile } });
}
