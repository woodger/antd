<script lang="ts">
  import RenderContent from '../RenderContent.svelte';
  import ThemeScopeStyle from '../theme/ThemeScopeStyle.svelte';
  import { useComponentTheme } from '../theme/theme-component.svelte';
  import { useFormPrefix } from './form-prefix-context';
  import { useFormList } from './form-list-context';
  import { getFormPrefixScope } from './form-prefix.engine';
  import { useDesignTokenContext, useRuntimeStyles } from '../theme/theme-context.svelte';
  import { useDelayedFormMessages, useFormErrorList } from './form-error-list-state.svelte';
  import { formErrorMotion } from './form-error-list.dom';
  import { getFormErrorListPrefixCss } from './form-error-list-prefix.engine';
  import type { FormErrorListProps } from './form-error-list.types';
  import { useForm } from './form-context';
  import { useConfig } from '../config-provider/config-context';

  let {
    fieldId,
    help,
    helpStatus,
    errors = [],
    warnings = [],
    class: className,
    onVisibleChanged
  }: FormErrorListProps = $props();
  const ownerPrefix = useFormPrefix();
  const list = useFormList();
  const form = useForm();
  const config = useConfig();
  const designTokens = useDesignTokenContext();
  const componentTheme = useComponentTheme('Form');
  // The existing native contract gives the List prefix precedence over an intermediate FormItem.
  let prefix = $derived(list?.prefixCls ?? ownerPrefix?.prefixCls ?? config.getPrefixCls('form'));
  const runtimeStyles = useRuntimeStyles();
  let prefixCss = $derived(
    runtimeStyles && getFormErrorListPrefixCss(prefix, Boolean(getFormPrefixScope(
      prefix, config.getPrefixCls(), designTokens.state.token
    )))
  );
  const delayedErrors = useDelayedFormMessages(() => errors, true);
  const delayedWarnings = useDelayedFormMessages(() => warnings, true);
  const messages = useFormErrorList(
    () => ({ help, helpStatus, errors: delayedErrors(), warnings: delayedWarnings() }),
    (shown) => onVisibleChanged?.(shown)
  );
</script>

{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope="form-error-list-prefix" />{/if}{#if messages.rendered}
  <div
    id={fieldId ? `${fieldId}_help` : undefined}
    class={[
      `${prefix}-item-explain`, componentTheme.className && 'ant-form-css-var',
      componentTheme.className, form?.classNames?.help, className
    ]}
    style={[componentTheme.style, form?.styles?.help].filter(Boolean).join(';') || undefined}
    data-ant-form-error-list
    data-visible={messages.visible}
    use:formErrorMotion={{ visible: messages.visible, kind: 'holder', onFinish: messages.finishHolder }}
  >
    {#each messages.entries as entry (entry.key)}
      <div
        class={[entry.status && `${prefix}-item-explain-${entry.status}`, form?.classNames?.helpItem]}
        style={form?.styles?.helpItem}
        data-ant-form-error-message
        data-visible={entry.visible}
        use:formErrorMotion={{
          visible: entry.visible,
          kind: 'message',
          onFinish: (shown) => messages.finishMessage(entry.key, shown)
        }}
      ><RenderContent value={entry.content} /></div>
    {/each}
  </div>
{/if}
