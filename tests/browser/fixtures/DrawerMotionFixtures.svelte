<script lang="ts">
  // Records public callbacks on the same DOM nodes, which measures React probe.
  import { untrack } from 'svelte';
  import { Drawer, type DrawerMotionConfig, type DrawerPlacement } from '@woodger/antd';

  type Surface = 'panel' | 'mask';
  const phases = ['Appear', 'Enter', 'Leave'] as const;
  const profiles = [
    'initial', 'factory', 'prepare-only', 'disabled-phases', 'hold-end', 'async-prepare',
    'late-mask', 'immediate', 'css-end', 'reduced', 'cutoff', 'interrupt', 'mixed',
    'mask-remove', 'mask-force', 'mask-keep', 'mask-class'
  ];
  const retention: Record<string, DrawerMotionConfig> = {
    'mask-remove': {},
    'mask-force': { forceRender: true },
    'mask-keep': { removeOnLeave: false },
    'mask-class': { removeOnLeave: false, leavedClassName: 'mask-after-leave' }
  };
  type Entry = (string | boolean | null)[];
  interface Lifecycle {
    panel: Entry[];
    mask: Entry[];
    afterOpen: boolean[];
    panelVisible: boolean[];
    maskSettledAtClose?: boolean;
  }

  let { initialProfile = 'initial', initialOpen = false }: {
    initialProfile?: string;
    initialOpen?: boolean;
  } = $props();
  let profile = $state(untrack(() => initialProfile));
  let open = $state(untrack(() => initialOpen));
  let masked = $state(untrack(() => !retention[initialProfile]));
  let placement = $state<DrawerPlacement>('right');
  let insideClose = $state<{ stillMounted: boolean; open: boolean; }>();
  let events = $state<Lifecycle>({ panel: [], mask: [], afterOpen: [], panelVisible: [] });
  const positions: DrawerPlacement[] = [];
  let releasePreparation: (() => void) | undefined;
  let cutoff = $state(motionFor('panel', 'hold-end'));
  const panel = $derived(profile === 'cutoff' ? cutoff : motionFor('panel', profile));
  const mask = $derived(profile === 'mixed' ? undefined : motionFor('mask', profile));
  const forced = $derived(profile === 'factory' || profile === 'immediate');

  /** Distinguishes the configuration of the panel and masks and records the actual arguments of the phases. */
  function motionFor(surface: Surface, name: string): DrawerMotionConfig {
    if (retention[name] || name === 'mixed') {
      return {
        ...retention[name],
        onVisibleChanged: value => { events.mask.push(['visible', value]); }
      };
    }
    const target = surface === 'panel' ? 'data-ant-drawer-section' : 'data-ant-drawer-mask';
    const motion: DrawerMotionConfig = {
      motionName: name === 'prepare-only' ? undefined : `own-${surface}`,
      motionDeadline: surface === 'panel' ? 95 : name === 'late-mask' ? 450 : 40,
      motionLeaveImmediately: name === 'immediate',
      onVisibleChanged: (value) => {
        if (surface === 'panel') events.panelVisible.push(value);
        else events.mask.push(['visible', value]);
      }
    };
    if (name === 'disabled-phases') {
      motion.motionAppear = false;
      motion.motionEnter = false;
      motion.motionLeave = false;
    }
    if (name === 'css-end') {
      motion.motionName = {
        appear: `api-${surface}-appear`, appearActive: `api-${surface}-active`,
        leave: `api-${surface}-leave`, leaveActive: `api-${surface}-active`
      };
      motion.motionDeadline = undefined;
    }
    for (const phase of phases) {
      motion[`on${phase}Prepare`] = node => {
        events[surface].push([phase, 'prepare', node.hasAttribute(target)]);
        if (surface === 'panel' && phase === 'Appear' &&
          (name === 'async-prepare' || name === 'interrupt')) {
          return new Promise<void>(resolve => { releasePreparation = resolve; });
        }
      };
      motion[`on${phase}Start`] = (node, event) => {
        events[surface].push([phase, 'start', node.hasAttribute(target), event === null]);
        return { '--probe-from': phase };
      };
      motion[`on${phase}Active`] = (node, event) => {
        const visual = surface === 'panel' ? node.parentElement : node;
        const from = visual?.style.getPropertyValue('--probe-from') ?? null;
        events[surface].push([phase, 'active', node.hasAttribute(target), event === null, from]);
        return { '--probe-active': phase };
      };
      motion[`on${phase}End`] = (node, event) => {
        const kind = 'deadline' in event ? 'deadline' : event.type;
        events[surface].push([phase, 'end', node.hasAttribute(target), kind]);
        if (name === 'hold-end' && surface === 'panel' && phase !== 'Leave' && kind === 'deadline') {
          return false;
        }
      };
    }

    return motion;
  }

  /** The factory receives accommodation directly from Drawer. */
  function motionAt(value: DrawerPlacement) {
    if (!positions.includes(value)) positions.push(value);
    return panel;
  }

  /** Changes the profile to the opening action and resets the magazine of the old copy. */
  function selectProfile(next: string) {
    profile = next;
    open = false;
    masked = !retention[next];
    placement = 'right';
    releasePreparation = undefined;
    cutoff = motionFor('panel', 'hold-end');
    insideClose = undefined;
    events = { panel: [], mask: [], afterOpen: [], panelVisible: [] };
    positions.length = 0;
  }

  /** Changing placement is included in the normal opening of the factory profile. */
  function show() {
    if (profile === 'factory') placement = 'left';
    open = true;
  }

  /** Verifies the Availability of DOM inside the actual closure notice. */
  function settled(visible: boolean) {
    events.afterOpen.push(visible);
    if (!visible) {
      const dialog = document.querySelector<HTMLDialogElement>('#motion-root');
      insideClose = {
        open: Boolean(dialog?.open),
        stillMounted: Boolean(dialog?.querySelector('#inside'))
      };
      if (profile === 'late-mask') {
        events.maskSettledAtClose = events.mask.some(entry =>
          entry[0] === 'visible' && entry[1] === false);
      }
    }
  }
</script>

<style>
  @keyframes drawer-api-test {
    from {
      opacity: .9;
    }
    to {
      opacity: 1;
    }
  }
  :global(.api-panel-active > [data-ant-drawer-section]) { animation: drawer-api-test .12s; }
  :global(.api-mask-active) { animation: drawer-api-test .04s; }
</style>

<section id="drawer-motion-api-fixture">
  <label>Drawer motion profile
    <select value={profile} onchange={event => selectProfile(event.currentTarget.value)}>
      {#each profiles as name (name)}<option value={name}>{name}</option>{/each}
    </select>
  </label>
  <button id="motion-show" type="button" onclick={show}>Open Drawer</button>
  <button id="motion-hide" type="button" onclick={() => { open = false; }}>Hide Drawer</button>
  <button id="motion-release" type="button" onclick={() => releasePreparation?.()}>Finish prepare</button>
  <button id="motion-cutoff" type="button" onclick={() => { cutoff.motionAppear = false; }}>
    Finish appear
  </button>
  <button id="motion-mask-on" type="button" onclick={() => { masked = true; }}>Enable mask</button>
  <button id="motion-mask-off" type="button" onclick={() => { masked = false; }}>Disable mask</button>
  <output id="motion-events">{JSON.stringify({ ...events, positions })}</output>
  <output id="motion-close">{JSON.stringify(insideClose)}</output>

  {#key profile}
    <Drawer bind:open {placement}
      id="motion-root" title="Motion API" mask={masked}
      forceRender={forced} destroyOnHidden={profile === 'interrupt'}
      motion={profile === 'factory' ? motionAt : panel} maskMotion={mask}
      rootStyle={profile === 'mixed' ? '--ant-motion-duration-slow:1s' : undefined}
      afterOpenChange={settled}>
      <button id="inside" type="button">Content</button>
    </Drawer>
  {/key}
</section>
