// Loads the built public package into a page with no other notifications.
import '@woodger/antd/styles.css';
import { mount } from 'svelte';
import NotificationApiFixtures from './NotificationApiFixtures.svelte';

const target = document.getElementById('app');
if (!target) {
  throw new Error('Missing Notification fixture root');
}
const kind = new URLSearchParams(location.search).get('kind') ?? 'semantics';
mount(NotificationApiFixtures, { target, props: { kind } });
