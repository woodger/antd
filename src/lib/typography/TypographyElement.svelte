<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useConfig } from '../config-provider/config-context';
  import { useComponentTheme } from '../theme/theme-component.svelte';
  import { getTypographyPrefixCss } from './typography-prefix.engine';
  import { useRuntimeStyles } from '../theme/theme-context.svelte';
  import ThemeScopeStyle from '../theme/ThemeScopeStyle.svelte';
  import type { TypographySlots } from './typography.types';

  let {
    component = 'article',
    prefixCls,
    direction,
    class: className,
    rootClassName,
    classNames = {},
    styles = {},
    style,
    children,
    nativeElement = $bindable(),
    attributes = {},
    clamp,
    controlClamp = false
  }: {
    component?: keyof HTMLElementTagNameMap;
    prefixCls: string;
    direction: 'ltr' | 'rtl';
    class?: string;
    rootClassName?: string;
    classNames?: TypographySlots;
    styles?: TypographySlots;
    style?: string;
    children?: Snippet;
    nativeElement?: HTMLElement;
    attributes?: Record<string, unknown>;
    clamp?: number;
    controlClamp?: boolean;
  } = $props();
  const config = useConfig();
  const componentTheme = useComponentTheme('Typography');
  const runtimeStyles = useRuntimeStyles();
  const hasCustomPrefix = $derived(prefixCls !== 'ant-typography');
  let prefixCss = $derived(runtimeStyles && getTypographyPrefixCss(prefixCls));
</script>

{#snippet content()}{@render children?.()}{/snippet}
{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`typography-prefix:${prefixCls}`} />{/if}{#if controlClamp}
  <svelte:element this={component} {...attributes} bind:this={nativeElement}
    data-ant-typography-prefix={hasCustomPrefix ? prefixCls : undefined}
    class={[prefixCls, componentTheme.className,
      direction === 'rtl' && `${prefixCls}-rtl`, className, rootClassName,
      'ant-typography-css-var', config.theme.compact && 'ant-typography-compact', classNames.root]}
    style={[componentTheme.style, styles.root, style].filter(Boolean).join(';')}
    style:-webkit-line-clamp={clamp ?? null}>
    {@render content()}
  </svelte:element>
{:else}
  <svelte:element this={component} {...attributes} bind:this={nativeElement}
  data-ant-typography-prefix={hasCustomPrefix ? prefixCls : undefined}
  class={[prefixCls, componentTheme.className,
    direction === 'rtl' && `${prefixCls}-rtl`, className, rootClassName,
    'ant-typography-css-var', config.theme.compact && 'ant-typography-compact', classNames.root]}
  style={[componentTheme.style, styles.root, style].filter(Boolean).join(';')}>
    {@render content()}
  </svelte:element>
{/if}
