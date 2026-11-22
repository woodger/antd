import '@woodger/antd-svelte/styles.css';
import { mount } from 'svelte';
import Case from './DatePickerMaskPublicContractCase.svelte';

const params = new URLSearchParams(location.search);
const owner = params.get('owner') ?? 'date';
const scenario = params.get('scenario') ?? 'mouse';
if (owner !== 'date' && owner !== 'datetime' && owner !== 'range'
  && owner !== 'time' && owner !== 'time-range') {
  throw Error('Unknown public contract owner');
}
if (scenario !== 'mouse' && scenario !== 'reject-open' && scenario !== 'plain-switch'
  && scenario !== 'cancel-key' && scenario !== 'reject-typed') {
  throw Error('Unknown public contract scenario');
}
const target = document.getElementById('root');
if (!target) {
  throw Error('Public contract root missing');
}
mount(Case, { target, props: { owner, scenario } });
