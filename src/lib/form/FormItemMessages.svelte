<script lang="ts">
  // Renders the connected list after the editor and holds the measured spacing until exit.
  import { onDestroy, type Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import { useForm } from './form-context';
  import { buildFormErrorList } from './form-error-list.engine';
  import { useDelayedFormMessages, useFormErrorList } from './form-error-list-state.svelte';
  import FormMessageMotion from './FormMessageMotion.svelte';

  let {
    prefix, scope, messages, extraId, help, extra, item, itemClass, itemStyle,
    margin = $bindable(0), withHelp = $bindable()
  }: {
    prefix: string;
    scope?: string;
    messages: {
      readonly errors: readonly string[];
      readonly warnings: readonly string[];
      readonly descriptionId?: string;
    };
    extraId?: string;
    help?: Snippet;
    extra?: Snippet;
    item?: HTMLDivElement;
    itemClass: ClassValue;
    itemStyle?: string;
    margin?: number;
    withHelp?: boolean;
  } = $props();

  const form = useForm();
  // The item's help class and the connected list have separate clear windows.
  const itemErrors = useDelayedFormMessages(() => messages.errors, false);
  const itemWarnings = useDelayedFormMessages(() => messages.warnings, false);
  const listErrors = useDelayedFormMessages(itemErrors, false);
  const listWarnings = useDelayedFormMessages(itemWarnings, false);
  const list = useFormErrorList(
    () => ({ errors: listErrors(), warnings: listWarnings() }),
    releaseMargin
  );
  const visibleHelp = $derived(Boolean(itemErrors().length || itemWarnings().length));
  const hasMessages = $derived(Boolean(messages.errors.length || messages.warnings.length));
  const role = $derived(messages.errors.length ? 'alert' : 'status');
  const accessibleEntries = $derived.by(() => {
    const current = buildFormErrorList(messages);
    const statusByKey = new Map(current.map(({ key, status }) => [key, status]));
    return statusByKey;
  });
  let extraHeight = $state(0);
  let helpElement = $state<HTMLDivElement>();
  let helpHeight = $state(0);
  const reservedHelp = $derived(list.rendered ? helpHeight : 0);
  const minHeight = $derived(margin || reservedHelp
    ? margin + (extra ? extraHeight : 0) + reservedHelp : undefined);

  $effect.pre(() => {
    if (!help) {
      helpHeight = 0;
    }
    else if (hasMessages && helpElement) {
      // Blur can replace fallback help while a pointer is still down on the next control.
      helpHeight = helpElement.clientHeight;
    }
  });

  $effect(() => { withHelp = visibleHelp; });

  $effect(() => {
    if (!item || !visibleHelp) {
      return;
    }

    // Local styles and the prefix can change the computed margin of the live item.
    void itemStyle;
    void itemClass;
    void scope;
    const computed = item.ownerDocument.defaultView?.getComputedStyle(item).marginBottom;
    margin = computed ? Number.parseInt(computed, 10) || 0 : 0;
  });

  /** A field that was shown again while leaving still needs its current spacing. */
  function releaseMargin(shown: boolean) {
    if (!shown && !visibleHelp) margin = 0;
  }

  onDestroy(() => {
    withHelp = undefined;
    margin = 0;
  });
</script>

{#if list.rendered || help && !hasMessages || extra}
  <div
    class={`${prefix}-item-additional`}
    data-ant-form-prefix={scope}
    style:min-height={minHeight === undefined ? undefined : `${minHeight}px`}
  >
    {#if list.rendered}
      <FormMessageMotion
        kind="holder"
        {prefix}
        {scope}
        id={hasMessages ? messages.descriptionId : undefined}
        role={hasMessages ? role : undefined}
        ariaHidden={!hasMessages}
        visible={list.visible}
        onFinish={list.finishHolder}
        class={[`${prefix}-item-explain`, `${prefix}-item-explain-connected`, form?.classNames?.help]}
        style={form?.styles?.help}
      >
        {#each list.entries as entry (entry.key)}
          <FormMessageMotion
            kind="message"
            {prefix}
            {scope}
            visible={entry.visible}
            ariaHidden={!entry.visible || accessibleEntries.get(entry.key) !== entry.status}
            onFinish={(shown) => list.finishMessage(entry.key, shown)}
            class={[
              entry.status && `${prefix}-item-explain-${entry.status}`, form?.classNames?.helpItem
            ]}
            style={form?.styles?.helpItem}
          >{entry.content}</FormMessageMotion>
        {/each}
      </FormMessageMotion>
    {/if}
    {#if help && !hasMessages}
      <div id={messages.descriptionId} data-ant-form-prefix={scope} bind:this={helpElement}
        class={[`${prefix}-item-extra`, form?.classNames?.help]} style={form?.styles?.help}
      >{@render help()}</div>
    {/if}
    {#if extra}
      <div id={extraId} data-ant-form-prefix={scope} bind:clientHeight={extraHeight}
        class={[`${prefix}-item-extra`, form?.classNames?.extra]} style={form?.styles?.extra}
      >{@render extra()}</div>
    {/if}
  </div>
{/if}
