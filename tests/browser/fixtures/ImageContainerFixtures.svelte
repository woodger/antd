<script lang="ts">
  // Drives controlled preview changes and records the actual container at each presentation.
  import { untrack } from 'svelte';
  import { ConfigProvider, Image, ImagePreviewGroup, Modal } from '@woodger/antd';
  import type { ImagePreviewConfig, ImageSemantic } from '@woodger/antd';
  import reference from './ant-design-image-container-reference.json';

  const photo = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2280%22%3E%3C/svg%3E';
  const classNames = { popup: { root: 'image-container-viewer' } };
  const popupStyles = { popup: { root: `
    --preview-rank: local;
    pointer-events: auto;
  ` } };
  const extra = ['retarget', 'group-retarget', 'theme', 'shadow', 'detached', 'fragment', 'nested'];
  let { initialCase = '' }: { initialCase?: string; } = $props();
  let name = $state(untrack(() => initialCase));
  let sample = $derived(reference.cases.find(item => item.name === name));
  let open = $state(untrack(() => initialCase !== ''));
  let modalOpen = $state(false);
  let alternate = $state(false);
  let dark = $state(true);
  let late = $state(false);
  let revision = $state(0);
  let selected = $state<HTMLDivElement>();
  let shadow = $state.raw<ShadowRoot>();
  let staged = $state.raw<Element | DocumentFragment>();
  let stagingHost = $state<HTMLDivElement>();
  let calls = $state.raw<[string, number][]>([]);
  let requested = $state<boolean[]>([]);
  let afterOpen = $state<boolean[]>([]);
  let shownAt = $state<string[]>([]);

  const provider = containerGetter('provider', 'provided');
  const group = $derived(sample?.group || name === 'group-retarget' || name === 'shadow');
  const hasProvider = $derived(sample?.provider || name === 'retarget' || name === 'group-retarget');
  const getContainer = $derived.by((): ImagePreviewConfig['getContainer'] => {
    if (name === 'retarget' || name === 'group-retarget') {
      void revision;
      return containerGetter('local', alternate ? 'selected' : 'provided');
    }
    if (name === 'theme') return '#image-container-selected';
    if (name === 'shadow') return shadow;
    if (name === 'detached' || name === 'fragment') return staged;

    const choice = sample?.choice;
    if (choice === false) return false;
    if (choice === 'element') return selected;
    if (choice === 'callback') return containerGetter('local', 'selected');
    if (typeof choice === 'string') return `#image-container-${choice.slice(1)}`;
  });
  const singleClassNames: ImageSemantic = ({ props }) => {
    const target = props.preview?.getContainer;
    const expected = getContainer ?? (hasProvider ? provider : undefined);
    return { ...classNames, root: target === expected ? 'image-resolved-container' : undefined };
  };
  const preview = $derived<ImagePreviewConfig>({
    open,
    getContainer,
    focusTrap: name !== 'nested',
    onOpenChange: next => {
      requested.push(next);
      open = next;
    },
    afterOpenChange: next => {
      afterOpen.push(next);
      if (next) {
        const root = document.querySelector('.image-container-viewer[open]');
        const host = root?.closest<HTMLElement>('[data-image-container]');
        shownAt.push(host?.dataset.imageContainer ?? 'body');
      }
    }
  });

  function containerGetter(kind: string, host: string) {
    return (...args: unknown[]) => {
      untrack(() => { calls = [...calls, [kind, args.length]]; });
      return document.getElementById(`image-container-${host}`) ?? document.body;
    };
  }

  function clearEvents() {
    requested = [];
    afterOpen = [];
    shownAt = [];
  }

  function selectCase(next: string) {
    const preset = reference.cases.find(item => item.name === next);
    open = preset !== undefined && preset.open !== false;
    alternate = false;
    dark = true;
    late = false;
    revision = 0;
    calls = [];
    clearEvents();

    staged = undefined;
    if (next === 'detached') {
      staged = document.createElement('div');
    }
    else if (next === 'fragment') {
      staged = document.createDocumentFragment();
    }
    name = next;
  }
</script>

<section id="image-container-fixture">
  <label>Image container case
    <select value={name} onchange={event => selectCase(event.currentTarget.value)}>
      <option value="">Choose a case</option>
      {#each reference.cases as item}<option value={item.name}>{item.name}</option>{/each}
      {#each extra as item}<option value={item}>{item}</option>{/each}
    </select>
  </label>
  <button type="button" onclick={() => {
    late = true;
    open = true;
  }}>Open case viewer</button>
  <button type="button" onclick={() => { open = false; }}>Close case viewer</button>
  <button type="button" onclick={() => { alternate = true; }}>Move case viewer</button>
  <button type="button" onclick={() => revision++}>Renew case getter</button>
  <button type="button" onclick={clearEvents}>Clear case events</button>
  <button type="button" onclick={() => { dark = false; }}>Switch owner theme</button>
  <button type="button" onclick={() => selectCase('')}>Unmount case viewer</button>
  <button type="button" onclick={() => {
    if (staged) stagingHost?.append(staged);
  }}>Insert case target</button>
  <button type="button" onclick={() => { modalOpen = true; }}>Open viewer host</button>
  <output aria-label="Image container calls">{JSON.stringify(calls)}</output>
  <output aria-label="Image requested visibility">{JSON.stringify(requested)}</output>
  <output aria-label="Image after visibility">{JSON.stringify(afterOpen)}</output>
  <output aria-label="Image shown at">{JSON.stringify(shownAt)}</output>
  <div id="image-container-provided" data-image-container="provided"></div>
  <div id="image-container-selected" data-image-container="selected" bind:this={selected}></div>
  <div data-image-container="staged" bind:this={stagingHost}></div>
  <div id="image-container-shadow" {@attach host => { shadow = host.attachShadow({ mode: 'open' }); }}></div>

  {#if name}{#key name}
    <ConfigProvider getPopupContainer={hasProvider ? provider : undefined}
      csp={name === 'shadow' ? { nonce: 'image-container' } : undefined}
      theme={{ mode: dark ? 'dark' : 'light', token: {
        motion: false, colorBgMask: dark ? '#1c2640' : '#d1e0ff'
      }, components: {
        Image: { previewOperationSize: dark ? 24 : 30 }
      } }}>
      <section data-image-container="source-owner" style="--image-owner-theme: active">
        {#if name === 'nested'}
          <Modal bind:open={modalOpen} title="Viewer host" footer={null}>
            <Image src={photo} alt="Container sample" {preview} {classNames} />
          </Modal>
        {:else if group}
          <ImagePreviewGroup preview={sample?.groupDisabled ? false : preview} {classNames}>
            <Image src={photo} alt="Container sample" />
            <Image src={`${photo}#second`} alt="Next container image" />
          </ImagePreviewGroup>
        {:else}
          <Image src={photo} alt="Container sample" {preview} classNames={singleClassNames}
            styles={name === 'theme' ? popupStyles : undefined} />
        {/if}
        {#if late && open}<div id="image-container-late" data-image-container="late"></div>{/if}
      </section>
    </ConfigProvider>
  {/key}{/if}
</section>
