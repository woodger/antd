<script lang="ts">
  import { onDestroy } from 'svelte';
  import { useConfig } from '../config-provider/config-context';
  import { useComponentTheme } from '../theme/theme-component.svelte';
  import { provideLayout } from './layout-context';
  import { createLayoutState } from './layout.model.svelte.js';
  import { getLayoutPrefixCss } from './layout-prefix.engine';
  import { useRuntimeStyles } from '../theme/theme-context.svelte';
  import ThemeScopeStyle from '../theme/ThemeScopeStyle.svelte';
  import type { LayoutProps } from './layout.types';

  let {
    children,
    prefixCls,
    hasSider,
    class: className = '',
    rootClassName = '',
    style,
    nativeElement = $bindable(),
    ...rest
  }: LayoutProps = $props();
  const config = useConfig();
  let componentPrefix = $derived(config.getPrefixCls('layout', prefixCls));
  const runtimeStyles = useRuntimeStyles();
  const hasCustomPrefix = $derived(componentPrefix !== 'ant-layout');
  let prefixCss = $derived(runtimeStyles && getLayoutPrefixCss(componentPrefix, 'layout'));
  const componentTheme = useComponentTheme('Layout');
  const model = createLayoutState();
  provideLayout(model);
  onDestroy(() => model.destroy());
</script>

{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`layout-prefix:${componentPrefix}`} />{/if}<div {...rest} bind:this={nativeElement} dir={config.direction} data-ant-layout-root=""
  data-ant-layout-prefix={hasCustomPrefix ? 'layout' : undefined}
  data-ant-has-sider={hasSider === false ? 'false' : undefined}
  class={[
      componentPrefix, 'ant-layout-css-var',
      componentTheme.className,
      (hasSider ?? model.hasSider) && `${componentPrefix}-has-sider`,
      config.direction === 'rtl' && `${componentPrefix}-rtl`,
      config.layout?.class,
      className,
      rootClassName
    ]} style={[componentTheme.style, config.layout?.style, style].filter(Boolean).join(';')}>
  {@render children?.()}
</div>
