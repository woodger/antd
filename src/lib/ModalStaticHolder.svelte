<script lang="ts">
  // Держит контекст темы в скрытом корне. Панель открывается в своём portal.
  import ConfigProvider from './ConfigProvider.svelte';
  import ModalConfirmation from './ModalConfirmation.svelte';
  import { provideConfig, useConfig, type ConfigContext } from './config-context';
  import type { ModalStaticOwner } from './modal-static.model.svelte.js';

  let { owner }: { owner: ModalStaticOwner; } = $props();
  const parent = useConfig();
  const base: ConfigContext = Object.create(parent, {
    locale: { get: () => owner.locale }
  });
  provideConfig(base);

  /** Используется при отсутствии контейнера у подтверждения и holderRender. */
  function defaultContainer() {
    return owner.document.body;
  }
</script>

{#snippet content()}
  <ModalConfirmation confirmation={owner.confirmation} runtime={owner.runtime} />
{/snippet}

<ConfigProvider
  prefixCls={owner.settings.prefixCls}
  iconPrefixCls={owner.settings.iconPrefixCls}
  theme={owner.settings.theme}
  getPopupContainer={defaultContainer}
>
  {#if owner.holderRender}
    {@render owner.holderRender(content)}
  {:else}
    {@render content()}
  {/if}
</ConfigProvider>
