// Mounts batch Mentions to check parameters popupRender.
import '@woodger/antd/styles.css';
import { mount } from 'svelte';
import Fixture from './MentionsMenuFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing Mentions menu fixture root');
}

const profile = new URLSearchParams(location.search).get('mentions-menu') ?? 'plain';
mount(Fixture, { target, props: { profile } });
