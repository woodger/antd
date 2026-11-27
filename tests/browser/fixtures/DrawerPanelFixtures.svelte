<script lang="ts">
  // Задаёт те же входы, что отдельный React-прогон, и выставляет binding для наблюдения из теста.
  import { untrack, type Snippet } from 'svelte';
  import {
    ConfigProvider, Drawer, enUS, type DrawerConfig, type DrawerProps,
    type DrawerSemantic, type DrawerSemanticSlots
  } from '@woodger/antd';

  interface Profile {
    bare?: boolean;
    local?: DrawerProps;
    provider?: DrawerConfig;
    nestedProvider?: DrawerConfig;
    direction?: 'rtl';
    prefix?: string;
    semantic?: boolean;
    motion?: boolean;
    renderer?: 'wrap' | 'replace';
  }

  const providerClose = {
    placement: 'end' as const,
    disabled: true,
    'aria-label': 'Provider close',
    'data-close-owner': 'provider'
  };
  const provider = { closeIcon: 'provider icon', closable: providerClose };
  const localClose = {
    placement: 'end' as const,
    disabled: false,
    closeIcon: 'local',
    'aria-label': 'Local close',
    'data-close-owner': 'local'
  };
  const motionStyles = {
    wrapper: 'transform:scale(.9)',
    mask: 'opacity:.35'
  };
  const profiles: Record<string, Profile | undefined> = {
    default: {},
    'close-only': { bare: true },
    'header-absent': { bare: true, local: { closable: false, closeIcon: 'ignored' } },
    'icon-false': { local: { closeIcon: false } },
    'icon-null': { local: { closeIcon: null } },
    'icon-zero': { local: { closeIcon: 0 } },
    'icon-empty': { local: { closeIcon: '' } },
    'explicit-close': { local: { closable: true, closeIcon: false } },
    'nested-icon-false': { local: { closable: { closeIcon: false } } },
    'nested-icon-null': { bare: true, local: { closable: { closeIcon: null } } },
    'local-icon': { local: { closeIcon: 'snippet' } },
    'nested-icon': { local: { closeIcon: 'ignored', closable: { closeIcon: 'nested' } } },
    provider: { provider },
    'provider-boolean': { provider, local: { closable: true } },
    'provider-local': { provider, direction: 'rtl', prefix: 'probe', local: { closable: localClose } },
    'provider-placement': { provider, local: { closable: { disabled: false } } },
    'provider-false-with-icon': { bare: true, provider: { closable: false }, local: { closeIcon: 'local' } },
    'provider-replaced': { provider, nestedProvider: {} },
    semantic: {
      provider, semantic: true,
      local: { placement: 'right', closable: { placement: 'end', disabled: false }, resizable: true }
    },
    'motion-style': { motion: true, local: { styles: motionStyles } },
    loading: { local: { loading: true } },
    wrapping: { renderer: 'wrap' },
    replacing: { renderer: 'replace' },
    destroyed: { renderer: 'wrap', local: { destroyOnHidden: true } },
    forced: { renderer: 'wrap', local: { forceRender: true, destroyOnHidden: true, loading: true } }
  };
  const slots = [
    'root', 'mask', 'wrapper', 'section', 'header', 'title', 'extra', 'body', 'footer', 'dragger', 'close'
  ] as const;
  const providerClasses: DrawerSemantic = semanticLayer('provider', 'class');
  const providerStyles: DrawerSemantic = semanticLayer('provider', 'style');
  const localClasses: DrawerSemantic = semanticLayer('local', 'class');
  const localStyles: DrawerSemantic = semanticLayer('local', 'style');

  let { initialProfile = 'default', initialOpen = false }: {
    initialProfile?: string;
    initialOpen?: boolean;
  } = $props();
  let profile = $state.raw(untrack(() => getProfile(initialProfile)));
  let activeProfile = $state(untrack(() => initialProfile));
  let local = $state.raw<DrawerProps>(untrack(() => profile.local ?? {}));
  let renderer = $state<Profile['renderer']>(untrack(() => profile.renderer));
  let open = $state(untrack(() => initialOpen));
  let panelRef = $state<HTMLDivElement>();
  let requests = $state<string[]>([]);
  let visibilityEvents = $state<boolean[]>([]);
  const inherited = $derived<DrawerConfig | undefined>(profile.semantic ? {
    ...profile.provider,
    class: 'provider-panel',
    style: '--provider-panel:yes',
    classNames: providerClasses,
    styles: providerStyles
  } : profile.provider);

  /** Находит набор параметров по имени из browser/SSR теста. */
  function getProfile(name: string): Profile {
    const current = profiles[name];
    if (!current) throw new Error(`Unknown Drawer panel profile ${name}`);
    return current;
  }

  /** Настраивает Drawer до открытия, когда controls самой фикстуры доступны. */
  function selectProfile(name: string) {
    const current = getProfile(name);
    activeProfile = name;
    profile = current;
    local = current.local ?? {};
    renderer = current.renderer;
    open = false;
    requests = [];
    visibilityEvents = [];
  }

  /** Помечает фактически полученные props и проверяет CSS-приоритет для каждого слота. */
  function semanticLayer(name: string, kind: 'class' | 'style') {
    return ({ props }: { props: DrawerProps; }) => {
      const part = typeof props.mask === 'boolean' ? 'outer' : 'inner';
      const side = props.placement ?? 'right';
      const status = props.loading ? 'busy' : 'ready';
      const placement = typeof props.closable === 'object' ? props.closable.placement : undefined;
      const value = [part, side, status, placement ?? 'none'].join('-');
      const decorations: DrawerSemanticSlots = {};

      for (const slot of slots) {
        decorations[slot] = kind === 'style'
          ? `--${name}-${slot}:${value};`
            + `--study-shared:${name}`
          : `${name}-${slot} ${name}-${value}`;
      }

      return decorations;
    };
  }

  /** Отличает актуальный section от очищенного или устаревшего binding. */
  function refState(element: HTMLDivElement | undefined) {
    if (!element) return 'empty';
    return element.isConnected && element.hasAttribute('data-ant-drawer-section') ? 'section' : 'other';
  }
</script>

{#snippet customIcon()}<span data-close-icon>custom</span>{/snippet}
{#snippet extra()}<button id="extra-action" type="button">Extra</button>{/snippet}
{#snippet footer()}<button id="footer-action" type="button">Footer</button>{/snippet}
{#snippet render(section: Snippet)}
  <section id="render-host">
    {#if renderer === 'wrap'}{@render section()}
    {:else}<button id="replacement" type="button">Replacement</button>{/if}
  </section>
{/snippet}
{#snippet drawer()}
  <Drawer
    {...local}
    bind:open
    bind:panelRef
    id="study-root"
    class="legacy-drawer-root"
    style="--legacy-drawer-shell:yes"
    rootClassName="drawer-study"
    rootStyle={profile.semantic ? '--study-shared:root-style' : undefined}
    classNames={profile.semantic ? localClasses : undefined}
    styles={profile.semantic ? localStyles : local.styles}
    title={profile.bare ? undefined : 'Drawer study'}
    extra={profile.bare ? undefined : extra}
    footer={profile.bare ? undefined : footer}
    aria-label={renderer === 'replace' ? 'Replacement drawer' : undefined}
    closeIcon={local.closeIcon === 'snippet' ? customIcon : local.closeIcon}
    drawerRender={renderer ? render : undefined}
    onClose={event => { requests.push(event.type); }}
    afterOpenChange={value => { visibilityEvents.push(value); }}
  >
    <input id="body-input" defaultValue="initial" aria-label="Study body" />
  </Drawer>
{/snippet}

<section id="drawer-panel-fixture">
  <label>Drawer panel profile
    <select value={activeProfile} onchange={event => selectProfile(event.currentTarget.value)}>
      {#each Object.keys(profiles) as name (name)}<option value={name}>{name}</option>{/each}
    </select>
  </label>
  <button type="button" data-step="open" onclick={() => { open = true; }}>Open</button>
  <button type="button" data-step="hide" onclick={() => { open = false; }}>Hide</button>
  <button type="button" data-step="bottom" onclick={() => { local = { ...local, placement: 'bottom' }; }}>Bottom</button>
  <button type="button" data-step="busy" onclick={() => { local = { ...local, loading: true }; }}>Busy</button>
  <button type="button" data-step="ready" onclick={() => { local = { ...local, loading: false }; }}>Ready</button>
  <button type="button" data-step="remove-renderer" onclick={() => { renderer = undefined; }}>Default section</button>
  <button type="button" data-step="clear-motion-style"
    onclick={() => { local = { ...local, styles: undefined }; }}>Clear motion CSS</button>
  <button type="button" data-step="set-motion-style"
    onclick={() => { local = { ...local, styles: motionStyles }; }}>Set motion CSS</button>
  <output id="panel-ref-state">{refState(panelRef)}</output>
  <output id="panel-requests">{JSON.stringify(requests)}</output>
  <output id="panel-visibility">{JSON.stringify(visibilityEvents)}</output>
  <ConfigProvider drawer={inherited} locale={enUS} prefixCls={profile.prefix}
    direction={profile.direction}
    theme={{ token: { motion: profile.motion ?? false, motionDurationSlow: '1.5s' } }}>
    {#if profile.nestedProvider}<ConfigProvider drawer={profile.nestedProvider}>
      {@render drawer()}
    </ConfigProvider>{:else}{@render drawer()}{/if}
  </ConfigProvider>
</section>
