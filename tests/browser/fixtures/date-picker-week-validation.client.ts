import 'antd-svelte/styles.css';
import { mount } from 'svelte';
import Case from './DatePickerWeekValidationCase.svelte';
const target = document.getElementById('root');
const kind = new URLSearchParams(location.search).get('kind');
const picker = new URLSearchParams(location.search).get('picker') ?? 'week';
if (!target || kind !== 'single' && kind !== 'range') throw Error('Week validation owner required');
if (picker !== 'date' && picker !== 'week') throw Error('Date or week validation picker required');
mount(Case, { target, props: { kind, picker } });
