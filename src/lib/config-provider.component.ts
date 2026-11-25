import ConfigProvider from './ConfigProvider.svelte';
import { configureGlobal } from './config-provider-global';

export default Object.assign(ConfigProvider, { config: configureGlobal });
