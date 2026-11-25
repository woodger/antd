<script lang="ts">
  // Наблюдает реальный DOM и порядок публичных callbacks без обращений к контроллерам Drawer.
  import { untrack } from 'svelte';
  import { ConfigProvider, Drawer, enUS, type DrawerContent, type DrawerProps } from '@woodger/antd';

  const paragraphs: Record<string, DrawerContent> = {
    zero: 0,
    empty: '',
    hidden: false,
    null: null,
    true: true,
    text: 'Text',
    array: ['Start ', [null, 0], false, ' end'],
    'empty-array': []
  };
  type Profile = 'content' | 'attrs' | 'events' | 'escape' | 'escape-managed' | 'mask'
    | 'nested-inline' | 'nested-portal';
  const profiles: Profile[] = [
    'content', 'attrs', 'events', 'escape', 'escape-managed', 'mask', 'nested-inline', 'nested-portal'
  ];
  interface Entry {
    scope: string;
    kind: string;
    type: string;
    target: string | null;
    current: string | null;
    key: string | null;
    prevented: boolean;
  }

  let { initialProfile = 'content', initialOpen = false }: {
    initialProfile?: Profile;
    initialOpen?: boolean;
  } = $props();
  let profile = $state<Profile>(untrack(() => initialProfile));
  let open = $state(untrack(() => initialOpen));
  let contentName = $state('zero');
  let next = $state(false);
  let forbidEscape = $state(false);
  let entries = $state<Entry[]>([]);
  const isNested = $derived(profile === 'nested-inline' || profile === 'nested-portal');
  const content = $derived(paragraphs[contentName]);
  const handlers = $derived(makeListeners(next ? 'next' : 'outer'));
  const childHandlers = makeListeners('inner');
  const attributes = $derived<DrawerProps>(profile === 'attrs' ? getAttributes(next) : {});

  /** Назначает событию читаемые DOM-имена, включая кнопку с вложенной svg. */
  function identify(node: EventTarget | null) {
    if (!(node instanceof Element)) return null;
    if (node.closest('[data-ant-drawer-close]')) return 'close';
    if (node.matches('[data-ant-drawer-section]')) return 'section';
    if (node.matches('[data-ant-drawer-mask]')) return 'mask';
    return node.id || node.localName;
  }

  /** Сохраняет currentTarget синхронно, пока событие ещё распространяется. */
  function record(scope: string, kind: string, event: Event) {
    entries.push({
      scope, kind, type: event.type, target: identify(event.target),
      current: identify(event.currentTarget), key: event instanceof KeyboardEvent ? event.key : null,
      prevented: event.defaultPrevented
    });
  }

  /** Обработчики различаются по scope и умеют отменить штатное действие Escape. */
  function makeListeners(scope: string): DrawerProps {
    return {
      onmouseenter: event => record(scope, 'enter', event),
      onmouseover: event => record(scope, 'over', event),
      onmouseleave: event => record(scope, 'leave', event),
      onfocusin: event => record(scope, 'focus', event),
      onclick: event => record(scope, 'click', event),
      onkeydown: event => {
        if (forbidEscape && event.key === 'Escape') event.preventDefault();
        record(scope, 'down', event);
      },
      onkeyup: event => record(scope, 'up', event),
      onClose: event => record(scope, 'request', event)
    };
  }

  /** Передаёт ложные, пустые и удаляемые атрибуты в открытый и портальный Drawer. */
  function getAttributes(updated: boolean): DrawerProps {
    return {
      id: 'product-dialog',
      role: 'alertdialog',
      'aria-label': 'Queue editor',
      'aria-labelledby': 'custom-name',
      'aria-describedby': updated ? undefined : 'custom-help',
      'aria-description': 'Queue status',
      'aria-modal': false,
      'aria-busy': !updated,
      'aria-live': 'polite',
      'aria-atomic': true,
      'aria-keyshortcuts': 'Control+Enter',
      'aria-details': updated ? 'custom-help' : undefined,
      'data-state': updated ? 'ready' : 'pending',
      'data-count': updated ? 1 : 0,
      'data-ready': updated,
      'data-empty': '',
      'data-cleared': updated ? undefined : 'present',
      'data-next': updated ? 'new' : null,
      maskClassName: 'mask-custom',
      classNames: { mask: 'mask-semantic' }
    };
  }

  /** Место портала для контрольного профиля находится вне DOM внешней секции. */
  function childHost() {
    return document.getElementById('drawer-child-host') ?? document.body;
  }
</script>

<section id="drawer-dom-fixture">
  <label>Drawer DOM profile
    <select bind:value={profile}>
      {#each profiles as name (name)}<option value={name}>{name}</option>{/each}
    </select>
  </label>
  <label>Drawer content
    <select bind:value={contentName}>
      {#each Object.keys(paragraphs) as name (name)}<option value={name}>{name}</option>{/each}
    </select>
  </label>
  <button id="dom-open" type="button" onclick={() => { open = true; }}>Open Drawer</button>
  <button id="dom-next" type="button" onclick={() => { next = true; }}>Update Drawer</button>
  <button id="dom-guard" type="button" onclick={() => { forbidEscape = true; }}>Cancel Escape</button>
  <button id="dom-unguard" type="button" onclick={() => { forbidEscape = false; }}>Allow Escape</button>
  <button id="dom-clear" type="button" onclick={() => { entries = []; }}>Clear log</button>
  <div id="custom-name">Queue</div>
  <div id="custom-help">Help</div>
  <div id="drawer-child-host"></div>
  <output id="dom-events">{JSON.stringify(entries)}</output>

  <ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
    <Drawer {...handlers} {...attributes}
      id={attributes.id ?? 'dom-root'}
      bind:open
      rootClassName="probe-drawer"
      mask={!isNested && profile !== 'escape-managed'}
      getContainer={profile === 'attrs' ? () => document.body : undefined}
      title={profile === 'content' ? content : 'Panel'}
      extra={profile === 'content' ? content : undefined}
      footer={profile === 'content' ? content : undefined}
      closable={profile !== 'content'}>
      <input id="editor" aria-label="Editor" />
      <button id="action" type="button">Action</button>
      {#if isNested}
        <Drawer {...childHandlers} open mask={false}
          getContainer={profile === 'nested-inline' ? false : childHost}
          rootStyle="position:fixed" rootClassName="probe-child" placement="left" title="Nested panel">
          <button id="child-action" type="button">Nested action</button>
        </Drawer>
      {/if}
    </Drawer>
  </ConfigProvider>
</section>
