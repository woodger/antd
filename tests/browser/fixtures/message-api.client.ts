// Монтирует кандидата из свежей сборки пакета, используя тот же viewport и данные, что UMD.
import '@woodger/antd/styles.css';
import { mount } from 'svelte';
import MessageApiFixtures from './MessageApiFixtures.svelte';

const target = document.getElementById('app');
if (!target) {
  throw new Error('Missing message fixture root');
}
const kind = new URLSearchParams(location.search).get('kind') ?? 'context-family';
mount(MessageApiFixtures, { target, props: { kind } });
