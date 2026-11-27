<script lang="ts">
  // Воспроизводит данные исходных замеров и записывает наблюдаемые motion callbacks.
  import { untrack } from 'svelte';
  import {
    ConfigProvider, Menu,
    type MenuItemType, type MenuMode, type MenuMotion, type MenuMotionEvent
  } from '@woodger/antd';
  import source from './ant-design-menu-motion-reference.json';
  import optionsSource from './ant-design-menu-motion-options-reference.json';

  type Change = { openKeys?: string[]; inlineCollapsed?: boolean; enabled?: boolean; };
  type MotionOptions = typeof optionsSource.passes[number][number]['opts'];
  type Profile = {
    id: string;
    mode: string;
    defaultOpenKeys?: string[];
    initial?: Change;
    steps: readonly Change[];
    providerPrefix?: string;
    ownerPrefix?: string;
    direction?: string;
    width?: number;
    forceSubMenuRender?: boolean;
    enabled?: boolean;
    motion?: string;
    ownDefaults?: boolean;
    options?: MotionOptions;
  };

  let { initialProfile = 'inline' }: { initialProfile?: string; } = $props();
  const open = { openKeys: ['branch'] };
  const close = { openKeys: [] };
  const profiles: readonly Profile[] = [
    ...source.results.map(result => result.profile),
    ...optionsSource.passes[0].map(({ opts }) => ({
      id: opts.id, mode: opts.mode, forceSubMenuRender: opts.force, options: opts,
      initial: opts.open ? open : close, enabled: false, steps: [open, close]
    })),
    { id: 'cancel-prepare', mode: 'inline', motion: 'sample-motion', steps: [open, close] },
    { id: 'motion-disabled-active', mode: 'inline', motion: 'sample-motion',
      steps: [open, { enabled: false }] },
    { id: 'leave-focus', mode: 'vertical', steps: [open, close] },
    { id: 'reduced-motion', mode: 'vertical', steps: [open] }
  ];

  let profileId = $state(untrack(() => initialProfile));
  const profile = $derived(resolveProfile(profileId));
  const mode = $derived<MenuMode>(readMode(profile.mode));
  let openKeys = $state<string[]>(untrack(() => profile.initial?.openKeys ?? []));
  let collapsed = $state(untrack(() => profile.initial?.inlineCollapsed ?? false));
  let enabled = $state(untrack(() => profile.initial?.enabled ?? profile.enabled ?? true));
  let active = $state(true);
  let callbacks = $state<unknown[][]>([]);
  let openRequests = $state<string[][]>([]);
  let pendingPreparations = $state(0);
  const pending: Array<() => void> = [];

  const optionItems: MenuItemType[] = [
    { key: 'branch', label: 'Branch', class: 'motion-branch', children: [
      { key: 'leaf', label: 'Leaf' }
    ] }
  ];
  const items: MenuItemType[] = [
    { key: 'branch', label: 'Branch', class: 'motion-branch', children: [
      { key: 'leaf', label: 'Leaf' },
      { key: 'deep', label: 'Nested', class: 'motion-deep', children: [
        { key: 'deep-leaf', label: 'Deep leaf' }
      ] }
    ] },
    ...Array.from({ length: 5 }, (_, index) => ({ key: `extra-${index}`, label: `Extra ${index}` }))
  ];
  let menu = $state<ReturnType<typeof Menu>>();
  let hasRegisteredLeaf = $state(false);
  const motion = $derived(profile.options ? optionMotion(profile.options)
    : profile.motion ? createMotion(profile.id, profile.motion) : undefined);

  // Выбирает проверенный профиль при первом mount и при смене сценария.
  function resolveProfile(id: string) {
    const resolved = profiles.find(profile => profile.id === id);
    if (!resolved) throw new Error(`Unknown Menu motion profile ${id}`);
    return resolved;
  }

  // Разрешает строковое значение режима из сырого JSON.
  function readMode(value: string): MenuMode {
    if (value === 'inline' || value === 'horizontal' || value === 'vertical') {
      return value;
    }
    throw new Error(`Unknown Menu mode ${value}`);
  }

  // Замена сценария размонтирует предыдущий экземпляр слота.
  function select(event: Event & { currentTarget: HTMLSelectElement; }) {
    const next = resolveProfile(event.currentTarget.value);
    profileId = next.id;
    openKeys = next.initial?.openKeys ?? [];
    collapsed = next.initial?.inlineCollapsed ?? false;
    enabled = next.initial?.enabled ?? next.enabled ?? true;
    callbacks = [];
    openRequests = [];
    active = true;
  }

  // Передаёт только те значения владельца, которые менял исходный замер.
  function apply(change: Change) {
    if (change.openKeys !== undefined) openKeys = change.openKeys;
    if (change.inlineCollapsed !== undefined) collapsed = change.inlineCollapsed;
    if (change.enabled !== undefined) enabled = change.enabled;
  }

  // Записывает запросы Menu независимо от controlled openKeys владельца.
  function recordOpen(keys: string[]) {
    openRequests.push(keys);
  }

  // Hook при отмене prepare разрешается только по отдельному действию владельца.
  function release() {
    for (const resolve of pending.splice(0)) resolve();
    pendingPreparations = 0;
  }

  // Проверяет публичный ref на момент чтения, после передачи владения между списками.
  function readLeaf() {
    hasRegisteredLeaf = Boolean(menu?.findItem({ key: 'leaf' }));
  }

  // Отличает отсутствие поля от собственных false и true в motion props.
  function optionMotion(options: MotionOptions): MenuMotion {
    return {
      ...(options.visible === undefined ? {} : { visible: options.visible }),
      ...(options.forceMotion === undefined ? {} : { forceRender: options.forceMotion }),
      leavedClassName: 'consumer-hidden',
      removeOnLeave: true,
      eventProps: { className: 'event-owner', style: { color: 'rgb(12, 34, 56)' } },
      onVisibleChanged(visible) { callbacks.push(['visible', visible]); }
    };
  }

  // Возвращает motion props с теми же стилями и фазами, что и исходный fixture.
  function createMotion(id: string, kind: string): MenuMotion {
    const appear = hooks('Appear', id);
    const enter = hooks('Enter', id);
    const leave = hooks('Leave', id);
    return {
      motionName: kind === 'sample-motion' ? kind : 'probe-motion',
      motionAppear: kind !== 'no-appear',
      motionDeadline: kind === 'sample-motion' ? 280 : 250,
      onAppearPrepare: appear.prepare,
      onAppearStart: appear.start,
      onAppearActive: appear.active,
      onAppearEnd: appear.end,
      onEnterPrepare: enter.prepare,
      onEnterStart: enter.start,
      onEnterActive: enter.active,
      onEnterEnd: enter.end,
      onLeavePrepare: leave.prepare,
      onLeaveStart: leave.start,
      onLeaveActive: leave.active,
      onLeaveEnd: leave.end,
      onVisibleChanged(visible) { callbacks.push(['visible', visible]); }
    };
  }

  // Хранит ledger локального экземпляра и реальные значения DOM событий.
  function hooks(phase: 'Appear' | 'Enter' | 'Leave', id: string) {
    return {
      prepare(element: HTMLElement) {
        callbacks.push([`${phase}Prepare`, element.tagName]);
        if (phase === 'Enter' && id === 'cancel-prepare') {
          return new Promise<void>(resolve => {
            pending.push(resolve);
            pendingPreparations = pending.length;
          });
        }
      },
      start(element: HTMLElement) {
        callbacks.push([`${phase}Start`, element.tagName]);
        return { opacity: phase === 'Leave' ? 1 : 0 };
      },
      active(element: HTMLElement) {
        callbacks.push([`${phase}Active`, element.tagName]);
        return { opacity: phase === 'Leave' ? 0 : 1 };
      },
      end(element: HTMLElement, event: MenuMotionEvent) {
        callbacks.push([`${phase}End`, element.tagName, 'deadline' in event ? 'deadline' : event.type]);
      }
    };
  }
</script>

<style>
  :global(.probe-motion-appear-active),
  :global(.probe-motion-enter-active),
  :global(.probe-motion-leave-active) {
    transition: opacity .12s linear;
  }
  :global(.sample-motion-enter-active),
  :global(.sample-motion-leave-active) {
    transition: opacity .2s linear;
  }
</style>

<div data-testid="menu-motion-fixture">
  <label>Menu motion profile <select value={profileId} onchange={select}>
    {#each profiles as item (item.id)}<option value={item.id}>{item.id}</option>{/each}
  </select></label>
  {#each profile.steps as step, index (index)}
    <button type="button" onclick={() => apply(step)}>Step {index + 1}</button>
  {/each}
  <button type="button" onclick={release}>Resolve prepare</button>
  <button type="button" onclick={readLeaf}>Read leaf ref</button>
  <button type="button" onclick={() => { active = false; }}>Unmount Menu</button>
  <output aria-label="Menu motion callbacks">{JSON.stringify(callbacks)}</output>
  <output aria-label="Menu open requests">{JSON.stringify(openRequests)}</output>
  <output aria-label="Menu pending preparations">{pendingPreparations}</output>
  <output aria-label="Menu leaf registered">{String(hasRegisteredLeaf)}</output>
  <div style={`position:absolute;`
    + `top:80px;`
    + `left:120px;`
    + `width:${profile.width ?? 320}px`}>
    {#if active}
      {#key profileId}
        <ConfigProvider prefixCls={profile.providerPrefix}
          direction={profile.direction === 'rtl' ? 'rtl' : 'ltr'}
          theme={{ token: { motion: enabled } }}>
          <Menu items={profile.options ? optionItems : items} {mode} {openKeys}
            inlineCollapsed={collapsed}
            aria-label="Motion Menu" bind:this={menu}
            prefixCls={profile.ownerPrefix} forceSubMenuRender={profile.forceSubMenuRender}
            {motion} defaultMotions={profile.ownDefaults
              ? { vertical: { motionName: 'ignored-by-wrapper' } } : undefined}
            tooltip={false} onOpenChange={recordOpen} />
        </ConfigProvider>
      {/key}
    {/if}
  </div>
</div>
