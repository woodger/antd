// Монтирует публичный пример статического вызова в пустой документ.
import '@woodger/antd/styles.css';
import { mount } from 'svelte';
import ModalStaticFixtures from './ModalStaticFixtures.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing modal static fixture root');
}
const params = new URLSearchParams(location.search);
mount(ModalStaticFixtures, { target, props: { id: params.get('id') ?? 'confirm' } });
