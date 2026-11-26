// Загружает собранный публичный пакет в страницу без других уведомлений.
import '@woodger/antd/styles.css';
import { mount } from 'svelte';
import NotificationApiFixtures from './NotificationApiFixtures.svelte';

const target = document.getElementById('app');
if (!target) {
  throw new Error('Missing Notification fixture root');
}
const kind = new URLSearchParams(location.search).get('kind') ?? 'semantics';
mount(NotificationApiFixtures, { target, props: { kind } });
