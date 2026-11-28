<script lang="ts">
  import { createAffixRuntime } from './affix.dom';
  import { connectFeedbackFocus } from '../feedback.dom';
  import { useComponentTheme } from '../theme/theme-component.svelte';
  import { useConfig } from '../config-provider/config-context';
  import { getAffixPrefixCss } from './affix-prefix.engine';
  import { useRuntimeStyles } from '../theme/theme-context.svelte';
  import ThemeScopeStyle from '../theme/ThemeScopeStyle.svelte';
  import type { AffixPosition, AffixProps, AffixUpdatePosition } from './affix.types';
  let {
    prefixCls,
    children,
    offsetTop,
    offsetBottom,
    target,
    onChange,
    class: className = '',
    rootClassName = '',
    style,
    nativeElement = $bindable(),
    ...rest
  }: AffixProps = $props();
  const componentTheme = useComponentTheme('Affix');
  const config = useConfig();
  let prefix = $derived(config.getPrefixCls('affix', prefixCls));
  const runtimeStyles = useRuntimeStyles();
  const hasCustomPrefix = $derived(prefix !== 'ant-affix');
  let prefixCss = $derived(runtimeStyles && getAffixPrefixCss(prefix));
  let wrapperStyle = $derived(config.affix?.style
    ? [config.affix.style, style].filter(Boolean).join(';') : style);
  let content = $state<HTMLDivElement>();
  let position = $state<AffixPosition>();
  let runtime = $state.raw<ReturnType<typeof createAffixRuntime>>();
  export const updatePosition: AffixUpdatePosition = Object.assign(
    () => runtime?.updatePosition(),
    { cancel: () => runtime?.cancel() }
  );
  $effect(() => {
    const host = nativeElement;
    const node = content;
    if (!host || !node) {
      return;
    }
    const controller = createAffixRuntime(host, node, next => {
      position = next;
    }, () => onChange);
    runtime = controller;
    return () => {
      controller.destroy();
      runtime = undefined;
    };
  });
  $effect(() => {
    const getTarget = target ?? config.getTargetContainer ?? (() => window);
    getTarget();
    runtime?.configure({ target: getTarget, offsetTop, offsetBottom });
  });
  $effect(() => {
    if (nativeElement) {
      return connectFeedbackFocus(nativeElement);
    }
  });
</script>

{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`affix-prefix:${prefix}`} />{/if}<div {...rest} bind:this={nativeElement} class={[className, config.affix?.class]} style={wrapperStyle}>
  {#if position}<div aria-hidden="true" style={`width:${position.width}px;`
    + `height:${position.height}px`}></div>{/if}
  <div bind:this={content} data-ant-affix-prefix={position && hasCustomPrefix ? prefix : undefined}
    class={position
    ? [prefix, componentTheme.className, 'ant-affix-css-var', rootClassName] : undefined} style={position
      ? [componentTheme.style, `position:fixed;${position
        .edge}:${position
          .offset}px;width:${position
            .width}px;height:${position
              .height}px`].filter(Boolean).join(';')
      : undefined}>
    {@render children?.()}
  </div>
</div>
