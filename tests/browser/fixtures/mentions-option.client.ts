// Подключает публичный Mentions и стили собранного пакета.
import '@woodger/antd/styles.css';
import { mount } from 'svelte';
import Fixture from './MentionsOptionFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing Mentions option fixture root');
}

const profile = new URLSearchParams(location.search).get('mentions-option') ?? 'absent';
mount(Fixture, { target, props: { profile } });
