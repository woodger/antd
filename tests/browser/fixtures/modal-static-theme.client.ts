// Подключает только стили пакета. Цвета сравниваются без CSS потребителя.
import '@woodger/antd/styles.css';
import { mount } from 'svelte';
import ModalStaticTheme from './ModalStaticTheme.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing modal theme fixture root');
}
const profile = new URLSearchParams(location.search).get('profile') ?? 'dark';
mount(ModalStaticTheme, { target, props: { profile } });
