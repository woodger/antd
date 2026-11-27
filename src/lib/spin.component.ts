import Spin from './Spin.svelte';
import { setDefaultSpinIndicator } from './spin-indicator';

/** Svelte component facade retains the original static Spin method. */
export default Object.assign(Spin, { setDefaultIndicator: setDefaultSpinIndicator });
