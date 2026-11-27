<script lang="ts">
  // Публичный стенд настроек Dropdown и передачи ref тому же DOM-узлу, что видит владелец.
  import { untrack } from 'svelte';
  import { ConfigProvider, Dropdown, type DropdownConfig, type DropdownProps } from '@woodger/antd';
  import appearance from './ant-design-dropdown-appearance-reference.json' with { type: 'json' };
  import providers from './ant-design-dropdown-provider-reference.json' with { type: 'json' };

  let { initial, startOpen }: { initial?: string; startOpen?: boolean; } = $props();
  const sample = untrack(() => initial ?? new URLSearchParams(location.search).get('sample'));
  const profile = appearance.passes[0].find(({ profile }) => profile.id === sample)?.profile;
  const provider = providers.passes[0].some(({ profile }) => profile === sample);
  if (!profile && !provider) throw new Error('Missing Dropdown appearance sample');

  const theme = { token: { motion: false } };
  const local = sample === 'local';
  const nested = provider && sample !== 'provider' && !local;
  const reset: DropdownConfig = {};
  let mounted = $state(true);
  let revision = $state(0);
  let providerPrefix = $state('ant');
  let prefix = $state(profile?.prefixCls ?? (sample === 'replace' ? 'local-dd' : undefined));
  let svg = $state(Boolean(profile?.svg));
  let callerClass = $state('owned');
  let ref = $state<Element>();
  let triggerNode = $state<Element>();
  let open = $state(untrack(() => startOpen ?? (provider || Boolean(profile?.initial))));
  let events = $state.raw<boolean[]>([]);
  const semanticInputs = new Map<string, object>();
  let serializedInputs = $state('{}');
  const outer = $derived(provider ? configuration(revision ? 'outer-next' : 'outer')
    : { class: 'provider-popup' });
  const inner = $derived(sample === 'replace' ? configuration(revision ? 'inner-next' : 'inner')
    : sample === 'reset' ? reset : undefined);
  const menu = {
    id: 'commands',
    items: [{ key: 'first', label: provider ? 'First command' : 'First' }],
    classNames: { item: 'discarded-menu-item' },
    styles: { item: 'color: #0000bb' }
  };
  const classNames: DropdownProps['classNames'] = local ? input => {
    record('local:classes', input);
    return { root: 'local-root', item: 'local-item' };
  } : provider ? undefined : { root: 'popup-only' };
  const styles: DropdownProps['styles'] = local ? input => {
    record('local:styles', input);
    return { root: 'padding: 7px;'
      + ' border-width: 0', item: 'color: #880011' };
  } : undefined;

  // Считывает входы callback без влияния на реактивность провайдера или самого Dropdown.
  function record(kind: string, { props }: { props: DropdownProps; }) {
    semanticInputs.set(kind, {
      open: props.open ?? null,
      prefix: props.prefixCls ?? null,
      arrow: props.arrow ?? null,
      placement: props.placement ?? null,
      enterDelay: props.mouseEnterDelay ?? null,
      leaveDelay: props.mouseLeaveDelay ?? null,
      overflow: props.autoAdjustOverflow ?? null
    });
  }

  // Три слоя задают разные цвета и границы, чтобы конфликт проверялся по computed CSS.
  function configuration(label: string): DropdownConfig {
    return {
      class: `${label}-config`,
      style: 'color: #bb00aa;'
        + ' background-color: #f1f4f1;'
        + ' border-width: 3px;'
        + ' border-style: solid',
      classNames: input => {
        record(`${label}:classes`, input);
        return { root: `${label}-root`, item: `${label}-item`, itemContent: `${label}-title` };
      },
      styles: input => {
        record(`${label}:styles`, input);
        return {
          root: 'color: #004477;'
            + ' padding: 3px',
          item: 'border-top-width: 2px;'
            + ' border-top-style: solid;'
            + ' color: #118833',
          itemContent: 'font-weight: 650'
        };
      }
    };
  }
</script>

{#snippet dropdown()}
  {#if mounted}
    <Dropdown {menu} prefixCls={prefix} trigger={['click']} class="dropdown-class"
      open={provider || profile?.controlled ? open : undefined}
      defaultOpen={profile?.controlled ? undefined : startOpen}
      mouseEnterDelay={provider ? 0.1 : undefined}
      rootClassName={provider ? 'provider-study' : revision ? 'revised-root' : profile?.rootClassName}
      openClassName={revision ? 'revised-open owned' : profile?.openClassName}
      {classNames} {styles} bind:ref onOpenChange={next => { events = [...events, next]; }}>
      {#if svg}<svg id="trigger" tabindex="0" role="button" aria-label="Commands"
        class={callerClass} width="100" height="35" bind:this={triggerNode}>
        <rect width="100%" height="100%" />
      </svg>{:else}<button id="trigger" type="button" class={callerClass}
        bind:this={triggerNode}>Commands</button>{/if}
    </Dropdown>
  {/if}
{/snippet}

<section id="dropdown-appearance-fixture">
  <ConfigProvider {theme} prefixCls={providerPrefix} direction={profile?.rtl ? 'rtl' : 'ltr'}
    dropdown={outer}>
    {#if nested}<ConfigProvider dropdown={inner}>{@render dropdown()}</ConfigProvider>
    {:else}{@render dropdown()}{/if}
  </ConfigProvider>
  <button id="class-update" onclick={() => revision++}>Change classes</button>
  <button id="update" onclick={() => revision++}>Update provider</button>
  <button id="prefix-update" onclick={() => { prefix = 'other-menu'; }}>Change local prefix</button>
  <button id="provider-update" onclick={() => { providerPrefix = 'custom'; }}>Change provider prefix</button>
  <button id="owner-open" onclick={() => { open = true; }}>Open through owner</button>
  <button id="owner-close" onclick={() => { open = false; }}>Close through owner</button>
  <button id="replace" onclick={() => { svg = false; }}>Replace trigger</button>
  <button id="trigger-reclass" onclick={() => { callerClass = 'caller-next'; }}>Change trigger class</button>
  <button id="unmount" onclick={() => { mounted = false; }}>Unmount Dropdown</button>
  <button id="inspect" onclick={() => { serializedInputs = JSON.stringify(Object.fromEntries(semanticInputs)); }}>
    Read callback inputs
  </button>
  <output id="trigger-reference" data-alias={Boolean(ref) && ref === triggerNode}>{ref?.tagName ?? 'none'}</output>
  <output id="appearance-events">{JSON.stringify(events)}</output>
  <output id="semantic-inputs">{serializedInputs}</output>
</section>
