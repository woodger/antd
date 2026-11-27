// Mounts public Mentions together with the styles of the assembled package.
import '@woodger/antd/styles.css';
import { mount } from 'svelte';
import Fixture from './MentionsKeyboardFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing Mentions keyboard fixture root');
}

const profile = new URLSearchParams(location.search).get('mentions-keyboard') ?? 'closed';
mount(Fixture, { target, props: { profile } });
