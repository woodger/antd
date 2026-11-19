import 'antd-svelte/styles.css';
import { mount } from 'svelte';
import Case from './DatePickerQuarterValidationCase.svelte';
const target = document.getElementById('root');
const kind = new URLSearchParams(location.search).get('kind');
if (!target || kind !== 'single' && kind !== 'range') {
  throw Error('Quarter validation owner required');
}
mount(Case, { target, props: { kind } });
