<script lang="ts">
  // Управляет публичными параметрами и измеряет lifecycle пользовательской панели.
  import { untrack, type Snippet } from 'svelte';
  import {
    ConfigProvider, Dropdown, Form, FormItem, Input, Menu, createForm, type DropdownMenuProps
  } from '@woodger/antd';
  import {
    dropdownContentCases, dropdownMotionCases, dropdownReplacementCases, dropdownToggleCases
  } from '../dropdown-lifecycle-reference';

  let { initial, startOpen = false }: { initial?: string; startOpen?: boolean; } = $props();
  const sample = untrack(() => initial ?? new URLSearchParams(location.search).get('sample'));
  const content = dropdownContentCases.find(entry => entry.profile.id === sample)?.profile;
  const motion = dropdownMotionCases.find(entry => `motion-${entry.profile.id}` === sample)?.profile;
  const replacement = dropdownReplacementCases.find(entry => entry.profile.id === sample)?.profile;
  const toggle = dropdownToggleCases.find(entry => entry.profile.sample === sample)?.profile;
  const editorForm = sample === 'form-editor'
    ? createForm({ initialValues: { choice: 'Outside' } }) : undefined;
  if (!content && !motion && !replacement && !editorForm && !toggle) {
    throw new Error('Missing Dropdown lifecycle sample');
  }

  let revision = $state(0);
  let mode = $state(content?.mode ?? 'wrap');
  let mounted = $state(true);
  let swappedRenderer = $state(false);
  let reduced = $state(false);
  let lifecycleOwner = $state.raw(toggle?.initial);
  let portal = $state<HTMLDivElement>();
  const recorded: unknown[][] = [];
  let events = $state.raw<unknown[][]>([]);
  const menuConfig = replacement
    ? { classNames: { root: 'provider-root', item: 'provider-item' } } : undefined;
  const menu = getMenu();
  const theme = $derived(motion && !reduced ? undefined : { token: { motion: false } });
  const lifecycleOptions = $derived(lifecycleOwner ? {
    open: lifecycleOwner.open, forceRender: lifecycleOwner.force, destroyOnHidden: lifecycleOwner.destroy
  } : {
    forceRender: content?.force ?? motion?.forceRender,
    destroyOnHidden: content?.destroy ?? motion?.destroyOnHidden
  });
  const renderer = $derived.by(() => {
    if (toggle) return toggleEditor;
    if (editorForm) return formEditor;
    if (motion) return undefined;
    return swappedRenderer ? nextRenderer : renderPopup;
  });

  // Каждая панель получает только те команды и callbacks, которые есть в исходном профиле.
  function getMenu(): DropdownMenuProps | undefined {
    if (editorForm || toggle || content?.noMenu) return undefined;
    if (replacement) {
      return replacement.siblings ? {
        id: 'origin', items: [{ key: 'main', label: 'Original command' }]
      } : undefined;
    }
    if (motion) {
      return { id: 'original-menu', items: [{ key: 'first', label: 'First command' }] };
    }

    return {
      id: 'original-menu', items: [{ key: 'command', label: commandLabel,
        onClick: info => recordEvent('item', info.key) }],
      onClick: info => recordEvent('menu', info.key)
    };
  }

  // Переключает заданные владельцем флаги без взаимодействия с trigger или панелью.
  function changeLifecycle(patch: Partial<NonNullable<typeof lifecycleOwner>>) {
    if (lifecycleOwner) lifecycleOwner = { ...lifecycleOwner, ...patch };
  }

  function getContainer() {
    if (!portal) throw new Error('Missing Dropdown portal');
    return portal;
  }

  // Cleanup Svelte читает предыдущий снимок состояния. Журнал сохраняет общий порядок событий.
  function recordEvent(...event: unknown[]) {
    recorded.push(event);
    events = [...recorded];
  }

  // Смена режима повторяет lifecycle эффекта Body при неизменном DOM редактора.
  function reportBody() {
    $effect(() => {
      const current = mode;
      recordEvent('mount', current);
      return () => { recordEvent('unmount', current); };
    });
  }

  // Задаёт defaultValue теми же DOM-свойствами, что и контрольный редактор React.
  function initializeDraft(input: HTMLInputElement) {
    input.value = 'Initial';
    input.defaultValue = 'Initial';
  }
</script>

{#snippet commandLabel()}<span id="command">Menu command</span>{/snippet}

{#snippet alternateMenu()}
  <Menu id="replacement" items={[{ key: 'alternate', label: 'Replacement command' }]}
    selectable={replacement?.selectable} multiple={replacement?.multiple}
    onClick={info => recordEvent('replacement-click', info.key)}
    onSelect={info => recordEvent('replacement-select', info.selectedKeys)} />
{/snippet}

{#snippet renderPopup(origin?: Snippet)}
  {#if replacement}
    {#if replacement.siblings}<section id="wrapper" tabindex="-1">
      {@render origin?.()}{@render alternateMenu()}
    </section>{:else}{@render alternateMenu()}{/if}
  {:else if mode === 'text'}<span>Popup text</span>
  {:else if mode === 'zero'}{0}
  {:else if mode !== 'empty'}
    <section id="custom-body" {@attach reportBody}>
      <input id="draft" aria-label="Editor" {@attach initializeDraft} />
      <button id="inside" onclick={() => recordEvent('inside-click')}>Extra action</button>
      <p>Revision {revision}</p>
      {#if mode === 'wrap'}{@render origin?.()}{/if}
    </section>
  {/if}
{/snippet}

{#snippet nextRenderer()}
  <p id="next-body">Replacement renderer</p>
  <Menu id="next-menu" items={[{ key: 'next', label: 'Next command' }]} />
{/snippet}

{#snippet formEditor()}
  <div id="panel"><Input id="editor" aria-label="Popup editor" defaultValue="Inside" /></div>
{/snippet}

{#snippet toggleEditor()}
  <input id="editor" aria-label="Popup editor" {@attach initializeDraft} />
{/snippet}

{#snippet dropdown()}
  <Dropdown {...lifecycleOptions} {menu} defaultOpen={startOpen} trigger={['click']}
    popupRender={renderer}
    autoFocus={content?.autoFocus || Boolean(replacement)}
    placement={motion?.placement} transitionName={motion?.transitionName}
    prefixCls={replacement ? 'owner-dropdown' : undefined}
    getPopupContainer={content?.portal ? getContainer : undefined}
    classNames={{ root: 'subject-popup', item: replacement ? 'dropdown-item' : undefined }}
    onOpenChange={(open, info) => recordEvent('open', open, info.source)}>
    <button id="trigger" type="button" class:near-bottom={motion?.nearBottom}>Commands</button>
  </Dropdown>
{/snippet}

<div id="dropdown-lifecycle-fixture" class:motion-case={motion}>
  {#if mounted}<ConfigProvider {theme} menu={menuConfig}>
    {#if editorForm}
      <Form form={editorForm}>
        <FormItem name="choice" validateStatus="error" hasFeedback>
          {@render dropdown()}
        </FormItem>
      </Form>
      <output id="parent-choice">{editorForm.values.choice}</output>
    {:else}{@render dropdown()}{/if}
  </ConfigProvider>{/if}
  <div id="portal" bind:this={portal}></div>
  <button id="revision" hidden onclick={() => { revision++; }}>Change content</button>
  <button id="replace" hidden onclick={() => { mode = 'replace'; }}>Remove original</button>
  <button id="restore" hidden onclick={() => { mode = 'wrap'; }}>Restore original</button>
  <button id="swap-renderer" hidden onclick={() => { swappedRenderer = true; }}>Swap renderer</button>
  <button id="disable-motion" hidden onclick={() => { reduced = true; }}>Disable motion</button>
  <button id="dispose" hidden onclick={() => { mounted = false; }}>Unmount</button>
  {#each toggle?.actions ?? [] as patch, index (index)}
    <button id={'lifecycle-toggle-' + index} hidden onclick={() => changeLifecycle(patch)}>
      Apply lifecycle flags
    </button>
  {/each}
  <output id="lifecycle-events" hidden>{JSON.stringify(events)}</output>
</div>
<button id="outside">Outside</button>

<style>
  #dropdown-lifecycle-fixture { margin: 100px 10%; }
  #dropdown-lifecycle-fixture.motion-case #trigger {
    position: absolute; left: 400px; top: 300px; width: 150px; height: 35px;
  }
  #dropdown-lifecycle-fixture.motion-case #trigger.near-bottom { top: 650px; }
  :global(.subject-popup.case-fade-enter-active),
  :global(.subject-popup.case-fade-appear-active) { animation: case-in 320ms both; }
  :global(.subject-popup.case-fade-leave-active) { animation: case-out 480ms both; }
  @keyframes -global-case-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes -global-case-out { from { opacity: 1; } to { opacity: 0; } }
</style>
