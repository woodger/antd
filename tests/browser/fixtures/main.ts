import '@woodger/antd/styles.css';
import { mount } from 'svelte';
import FixtureApp from './FixtureApp.svelte';

mount(FixtureApp, { target: document.getElementById('app')! });
