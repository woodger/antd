<script lang="ts">
  import { useConfig } from '../config-provider/config-context';
  import { useLayout } from './layout-context';
  import { useComponentTheme } from '../theme/theme-component.svelte';
  import { getLayoutSectionPrefixCss } from './layout-prefix.engine';
  import { useRuntimeStyles } from '../theme/theme-context.svelte';
  import ThemeScopeStyle from '../theme/ThemeScopeStyle.svelte';
  import type { LayoutSectionProps } from './layout.types';
  let {
    tag,
    part,
    children,
    prefixCls,
    class: className = '',
    rootClassName = '',
    style,
    nativeElement = $bindable(),
    ...rest
  }: LayoutSectionProps & {
    tag: 'header' | 'footer' | 'main';
    part: 'header' | 'footer' | 'content';
  } = $props();
  const config = useConfig();
  // Sections inherit Layout variables, including its style. A standalone section defines its own scope.
  const layout = useLayout();
  let componentPrefix = $derived(config.getPrefixCls(`layout-${part}`, prefixCls));
  const runtimeStyles = useRuntimeStyles();
  const needsSectionScope = $derived(componentPrefix !== `ant-layout-${part}` || !layout);
  let prefixCss = $derived(
    runtimeStyles && getLayoutSectionPrefixCss(componentPrefix, part, !layout)
  );
  const componentTheme = useComponentTheme('Layout');
</script>

{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`layout-${part}-prefix:${componentPrefix}`} />{/if}<svelte:element this={tag} {...rest} bind:this={nativeElement} dir={config.direction}
  data-ant-layout-part={part}
  data-ant-layout-prefix={needsSectionScope ? part : undefined}
  data-ant-layout-standalone={!layout ? '' : undefined}
  class={['ant-layout-css-var', componentPrefix, componentTheme.className, className, rootClassName]}
  style={[!layout && componentTheme.style, style].filter(Boolean).join(';')}>
  {@render children?.()}
</svelte:element>
