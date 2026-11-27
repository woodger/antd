import { theme as staticTheme } from './theme.engine';
import { useToken } from './theme-context.svelte';

/** Source theme API; useToken reads current ConfigProvider through Svelte context. */
export const theme = { ...staticTheme, useToken };
