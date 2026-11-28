import ConfigProvider from './ConfigProvider.svelte';
import { useConfig as useConfigContext } from './config-context';
import { configureGlobal } from './config-provider-global';

/** Reads the nearest configured size and disabled state during component initialization. */
function useConfig() {
  const context = useConfigContext();

  return {
    get componentDisabled() { return context.configuredComponentDisabled; },
    get componentSize() { return context.explicitComponentSize; }
  };
}

export default Object.assign(ConfigProvider, { config: configureGlobal, useConfig });
