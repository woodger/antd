import { useConfig } from '../config-provider/config-context';
import { useDesignTokenContext } from '../theme/theme-context.svelte';
import { connectWave } from './wave.dom';
import type { WaveColorSource, WaveComponent } from './wave.types';

/** Attachment preserves DOM control and reads the current config/token in the delayed callback. */
export function useWave(
  component: WaveComponent,
  getDisabled: () => boolean,
  getColorSource: () => WaveColorSource | undefined = () => undefined
) {
  const config = useConfig();
  const context = useDesignTokenContext();

  return (node: HTMLElement) => {
    const runtime = connectWave(node, () => ({
      config: config.wave,
      info: {
        className: ['ant-wave', context.state.hashId].filter(Boolean).join(' '),
        token: context.state.token,
        hashId: context.state.hashId,
        component,
        colorSource: getColorSource()
      }
    }));
    $effect(() => runtime.listen(getDisabled(), config.wave?.triggerType));

    return () => runtime.destroy();
  };
}
