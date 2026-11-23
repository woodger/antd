import '@woodger/antd/styles.css';
import { mount } from 'svelte';
import Case from './DatePickerPeriodModeCase.svelte';
const target = document.getElementById('root');
if (!target) {
  throw Error('Period mode fixture root missing');
}
mount(Case, { target });
