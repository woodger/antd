<script lang="ts">
  import {
    ConfigProvider,
    Image,
    ImagePreviewGroup,
    type ImageConfig,
    type ImagePopupSlots,
    type ImagePreviewConfig
  } from '@woodger/antd';

  const photo = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22%3E%3C/svg%3E';
  const broken = 'data:image/svg+xml,invalid';
  const popupKeys = ['root', 'mask', 'body', 'footer', 'actions', 'close'] as const;
  const providerPopup = popupClasses('provider');
  const ownerStyles = popupStyles('single');
  let active = $state<'single' | 'group' | 'null-close' | undefined>('single');
  let updated = $state(false);
  let requests = $state<boolean[]>([]);
  let transformReceiver = $state<boolean>();
  let openReceiver = $state<boolean>();

  const singlePreview: ImagePreviewConfig = {
    get open() { return active === 'single'; },
    mask: { blur: false },
    zIndex: 1450,
    onTransform() {
      transformReceiver = this === singlePreview;
    },
    onOpenChange(open) {
      openReceiver = this === singlePreview;
      requests = [...requests, open];
      if (!open) {
        active = undefined;
      }
    }
  };

  /** Distinguishes the classes contributed at each layer. */
  function popupClasses(owner: string): ImagePopupSlots {
    return Object.fromEntries(popupKeys.map(key => [key, `${owner}-popup-${key}`]));
  }

  /** Marks provider-only declarations so replacement of a popup slot is visible. */
  function popupStyles(owner: string): ImagePopupSlots {
    const extra = owner === 'provider' ? ';--provider-slot:yes' : '';
    return Object.fromEntries(popupKeys.map(key => [key, `--rank:${owner}-popup-${key}${extra}`]));
  }

  let config = $derived<ImageConfig>({
    class: 'provider-base',
    style: '--rank:provider-base;--provider-base:yes',
    fallback: `${photo}#fallback`,
    classNames: ({ props }) => {
      const group = 'items' in props && props.items;
      return {
        root: 'provider-root',
        image: 'provider-image',
        cover: 'provider-cover',
        popup: {
          ...providerPopup,
          root: `provider-popup-root ${group ? 'provider-group-input' : 'provider-single-input'}`,
          mask: updated ? 'provider-updated-mask' : providerPopup.mask
        },
        placeholder: { progress: { root: 'provider-progress' } }
      };
    },
    styles: {
      root: '--rank:provider-root;--provider-slot:yes',
      image: '--rank:provider-image',
      cover: '--rank:provider-cover',
      popup: popupStyles('provider'),
      placeholder: { progress: { root: '--rank:provider-progress;--provider-progress-only:yes' } }
    },
    preview: {
      mask: { enabled: !updated, blur: true, closable: updated },
      closeIcon: providerClose
    }
  });
</script>

{#snippet providerClose()}<span>Provider close</span>{/snippet}

<section id="image-semantics-fixture">
  <ConfigProvider image={config}>
    <section id="single">
      <Image src={photo} alt="Single" class="single-base" style="--rank:single-base"
        preview={singlePreview}
        classNames={({ props }) => ({
          root: 'single-root', image: 'single-image', cover: 'single-cover',
          popup: {
            ...popupClasses('single'),
            root: `single-popup-root ${props.preview?.mask === true ? 'single-effective-mask' : ''}`
          }
        })}
        styles={({ props }) => ({
          root: '--rank:single-root',
          image: '--rank:single-image',
          cover: props.alt === 'Single' ? '--rank:single-cover' : undefined,
          popup: {
            ...ownerStyles,
            root: '--rank:single-popup-root;z-index:1777',
            body: props.preview?.mask === false ? '--rank:mask-off' : ownerStyles.body
          }
        })} />
    </section>

    <ImagePreviewGroup items={[{ src: photo, alt: 'Group' }]} preview={{ open: active === 'group' }}
      classNames={({ props }) => ({ popup: {
        ...popupClasses('group'),
        root: `group-popup-root ${'preview' in props ? '' : 'group-no-preview-input'}`
      } })}
      styles={{ popup: { body: '--rank:group-popup-body', root: '--rank:group-popup-root;z-index:1778' } }} />
    <ImagePreviewGroup items={[photo]} preview={{ open: active === 'null-close', closeIcon: null }}
      classNames={{ popup: { root: 'null-close-observation' } }} />

    <section id="progress">
      <Image src={photo} alt="Progress" preview={false} style="--rank:single-base"
        placeholder={{ progress: { percent: 21 } }}
        classNames={{ root: 'single-root', placeholder: { progress: { root: 'single-progress' } } }}
        styles={{ root: '--rank:single-root', placeholder: { progress: { root: '--rank:single-progress' } } }} />
    </section>
    <ConfigProvider>
      <section id="inherited"><Image src={photo} alt="Inherited" preview={false} /></section>
    </ConfigProvider>
    <ConfigProvider image={{}}>
      <section id="reset"><Image src={photo} alt="Reset" preview={false} /></section>
    </ConfigProvider>
    <ConfigProvider image={{ class: 'nested-base' }}>
      <section id="replaced"><Image src={photo} alt="Replaced" preview={false} /></section>
    </ConfigProvider>
    <section id="fallback"><Image src={broken} alt="Inherited fallback" preview={false} /></section>
    <section id="local-fallback">
      <Image src={broken} fallback={`${photo}#local`} alt="Local fallback" preview={false} />
    </section>
  </ConfigProvider>

  <button type="button" id="open-group-image" onclick={() => active = 'group'}>Group viewer</button>
  <button type="button" id="open-image-without-close" onclick={() => active = 'null-close'}>
    Viewer without close button
  </button>
  <button type="button" id="update-image-config" onclick={() => updated = true}>
    Update image provider
  </button>
  <output aria-label="Image open requests">{JSON.stringify(requests)}</output>
  <output aria-label="Transform callback receiver">{String(transformReceiver)}</output>
  <output aria-label="Open callback receiver">{String(openReceiver)}</output>
</section>
