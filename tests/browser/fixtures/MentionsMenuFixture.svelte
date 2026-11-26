<script lang="ts">
  import {
    ConfigProvider, Mentions,
    type MentionsOption, type MentionsPopupMenu, type MentionsPopupRenderInfo
  } from '@woodger/antd';
  import './mentions-menu.css';

  let { profile }: { profile: string; } = $props();
  const standard = [
    { value: 'alpha', label: 'Alpha', key: 'a' },
    { value: 'beta', label: 'Beta', key: 'b' }
  ];
  const many = Array.from({ length: 12 }, (_, index) => ({
    value: `user${index}`, label: `User ${index}`, key: `u${index}`
  }));
  const alternate = [{ ...standard[0], value: 'new-alpha', label: 'New Alpha' }];
  const custom = [{ ...standard[1], value: 'visible', label: 'Only in menu' }];
  const hover = [
    { ...standard[0], value: 'visible', label: 'First in menu' },
    { ...standard[1], value: 'shown', label: 'Second in menu' }
  ];
  const cached = [{ key: 'remote', value: 'remote', label: 'From cache' }];
  const originalGroup = [
    { value: 'alpha', label: 'Alpha', key: 'alpha-key' },
    { value: 'blocked', label: 'Blocked', key: 'blocked-key', disabled: true },
    { value: 'beta', label: 'Beta', key: 'beta-key' }
  ];
  const alternativeGroup = [
    { ...originalGroup[0], value: 'other', label: 'Other Alpha' },
    { ...originalGroup[2], value: 'chosen', label: 'Other Beta' }
  ];
  const copies = $derived(profile.startsWith('copies-'));
  const focusedMenu = $derived(profile.startsWith('focus'));
  const scrolling = $derived(profile.startsWith('scroll-'));
  const menuOptions = $derived(copies || focusedMenu ? originalGroup : scrolling ? many : standard);
  const loading = $derived(profile.startsWith('loading-'));
  const motion = $derived(profile === 'motion');
  let replace = $state(false);
  let showPrimary = $state(true);
  let renamed = $state(false);
  let events = $state<unknown[][]>([]);
  let overrides = $derived.by<Partial<MentionsPopupRenderInfo> | undefined>(() => {
    if (profile === 'prefix') return { prefixCls: 'caller-menu' };
    if (profile === 'empty-menu') return { options: [] };
    if (profile === 'scroll-suppressed') return { opened: false };
    if (profile === 'hover-enter') return { options: hover };
    if (profile.startsWith('override-')) return { options: custom };
    if (loading) return { options: cached };
    if (replace) return { options: alternate, prefixCls: 'caller-menu' };
  });

  /** Сохраняет данные контекста без сериализации Svelte snippets. */
  function summarizeMenu(info: MentionsPopupRenderInfo | undefined) {
    if (!info) {
      return '';
    }

    const { prefixCls, opened, options } = info;
    return JSON.stringify({
      prefixCls, opened,
      options: options.map(({ key, value, label, disabled }) => [
        key, value, typeof label === 'function' ? 'loading-node' : label, Boolean(disabled)
      ])
    });
  }

  /** Записывает фактические данные выбора отдельно от изменений текста. */
  function select(option: MentionsOption, prefix: string) {
    events.push(['select', option.value, option.label, option.key, prefix]);
  }
</script>

{#snippet renderPopup(menu: MentionsPopupMenu, info: MentionsPopupRenderInfo)}
  <span hidden data-menu-context>{summarizeMenu(info)}</span>
  {#if copies}
    {#if showPrimary}
      <section data-menu-copy="primary">{@render menu()}</section>
    {/if}
    <section data-menu-copy="secondary">{@render menu({ options: alternativeGroup })}</section>
  {:else}
    {@render menu(overrides)}
  {/if}
{/snippet}

<ConfigProvider theme={{
  token: { motion },
  components: scrolling ? { Mentions: { dropdownHeight: 80 } } : undefined
}}>
  <Mentions
    aria-label="Menu editor"
    id={copies ? renamed ? 'other-menu-owner' : 'menu-owner' : undefined}
    options={menuOptions}
    {loading}
    popupRender={renderPopup}
    notFoundContent="No options"
    transitionName={motion ? 'mention-menu-motion' : undefined}
    onChange={value => events.push(['change', value])}
    onBlur={copies || focusedMenu ? () => events.push(['blur']) : undefined}
    onSelect={select}
  />
</ConfigProvider>
{#if profile === 'live'}
  <button type="button" onclick={() => replace = true}>Update menu options</button>
{/if}
{#if copies}
  <button type="button" onclick={() => showPrimary = !showPrimary}>Toggle primary menu</button>
  <button type="button" onclick={() => renamed = true}>Rename menu owner</button>
  <button type="button">Outside menu</button>
{/if}
<output id="menu-events">{JSON.stringify(events)}</output>
