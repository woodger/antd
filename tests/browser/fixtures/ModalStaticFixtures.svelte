<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import {
    App, ConfigProvider, Modal, type ModalConfirmHandle, type ModalInstance,
    type ModalStaticConfig, type ModalStaticHandle
  } from '@woodger/antd';
  import reference from './ant-design-modal-static-reference.json';
  import ModalStaticLaunch from './ModalStaticLaunch.svelte';

  interface Profile {
    method: 'confirm' | 'info' | 'warning' | 'success' | 'error';
    prefix?: string;
    holder?: boolean;
    inline?: boolean;
    container?: string;
    multiple?: boolean;
  }

  let { id }: { id: string; } = $props();
  const raw = untrack(() => reference.cases.find(entry => entry.profile.id === id)?.profile);
  const profile: Profile | undefined = raw && isMethod(raw.method)
    ? { ...raw, method: raw.method } : undefined;
  const motionless = { token: { motion: false } };
  const scopedLocale = { locale: 'en', Modal: { okText: 'Scoped OK', cancelText: 'Scoped Cancel' } };
  const firstLocale = { locale: 'en', Modal: { okText: 'First OK' } };
  const secondLocale = { locale: 'en', Modal: { cancelText: 'Second Cancel' } };
  let useSecondLocale = $state(true);
  let events = $state<(string | boolean)[][]>([]);
  let handles = $state.raw<(ModalStaticHandle | ModalConfirmHandle)[]>([]);
  let immediate = $state<number>();
  let panelRef = $state('empty');
  let active: ModalStaticHandle | undefined;
  let finishAction: (() => void) | undefined;

  /** Проверяет имя метода в исходном JSON перед индексированием Modal. */
  function isMethod(value: string): value is Profile['method'] {
    return value === 'confirm' || value === 'info' || value === 'warning'
      || value === 'success' || value === 'error';
  }

  /** Запоминает наблюдаемый порядок, в том числе момент уничтожения контекстного окна. */
  function track(...event: (string | boolean)[]) {
    events.push(event);
  }

  /** Описывает публичную форму обоих handles. */
  function handleShape(handle: ModalStaticHandle | ModalConfirmHandle) {
    const thenType = 'then' in handle ? typeof handle.then : 'undefined';
    // oxlint-disable-next-line unicorn/no-thenable -- Снимок хранит строковый результат typeof.
    return { keys: Object.keys(handle).sort(), then: thenType };
  }

  /** Соответствует отдельному App и глобальному вызову из измерений UMD. */
  function launch(modal: ModalInstance) {
    if (!profile) {
      return;
    }

    ConfigProvider.config({
      prefixCls: profile.prefix,
      holderRender: profile.holder ? firstHolder : undefined,
      theme: motionless
    });
    active = Modal[profile.method](referenceOptions('Primary', primary));
    const current: (ModalStaticHandle | ModalConfirmHandle)[] = [active];
    if (profile.multiple) {
      current.push(Modal.warning(referenceOptions('Second', second)));
      const handle = modal.confirm(referenceOptions('Context', context));
      void handle.then(result => { track('Context', 'result', result); });
      current.push(handle);
    }
    handles = current;
  }

  /** Именует события конкретного окна в сценарии с общей очередью. */
  function referenceOptions(title: string, content: Snippet): ModalStaticConfig {
    return {
      title,
      content,
      rootClassName: 'static-probe',
      getContainer: profile?.inline ? false : profile?.container,
      onOk: () => track(title, 'onOk'),
      onCancel: () => track(title, 'onCancel'),
      afterClose: () => track(title, 'afterClose'),
      afterOpenChange: open => track(title, 'visible', open)
    };
  }

  /** Ставит работу в очередь и измеряет DOM до выполнения отложенного рендера. */
  function launchLifecycle() {
    const providerTiming = id === 'provider-timing';
    ConfigProvider.config({
      prefixCls: providerTiming ? 'early' : undefined,
      iconPrefixCls: providerTiming ? 'early-icons' : undefined,
      holderRender: providerTiming ? firstHolder : undefined,
      theme: motionless
    });
    const options: ModalStaticConfig = {
      title: 'Initial', content: 'User body', rootClassName: 'lifecycle-root', closable: true,
      onOk: () => track('ok'),
      onCancel: close => track('initial-cancel', typeof close),
      afterClose: () => track('initial-close'),
      afterOpenChange: open => track('initial-visible', open)
    };
    if (id === 'async' || id === 'stale-async') {
      options.onOk = () => {
        track('ok');
        return new Promise<void>(done => { finishAction = done; });
      };
    }
    if (id === 'detached') {
      const target = document.createElement('section');
      options.getContainer = target;
      options.panelRef = panel => {
        panelRef = panel ? (panel.isConnected ? 'connected' : 'detached') : 'empty';
      };
    }

    const handle = Modal.confirm(options);
    active = handle;
    immediate = document.querySelectorAll('dialog.lifecycle-root').length;
    if (id === 'coalesced' || id === 'abandon') {
      handle.update({ title: 'Intermediate' });
      handle.update({ title: 'Final' });
      if (id === 'abandon') {
        Modal.destroyAll();
        handle.destroy();
      }
    }
    if (providerTiming) {
      ConfigProvider.config({
        prefixCls: 'late', iconPrefixCls: 'late-icons', holderRender: secondHolder
      });
    }
  }

  /** Обновляет поля и локальный контекст в том же порядке, что в сценариях источника. */
  function updateLifecycle() {
    if (id === 'escape-updated' || id === 'cancel-updated') {
      active?.update({
        title: 'Updated', type: 'info', direction: 'rtl', okCancel: id === 'cancel-updated',
        onCancel: () => track('new-cancel'),
        afterClose: () => track('new-close'),
        afterOpenChange: show => track('new-visible', show)
      });
    }
    else if (id === 'replace') {
      active?.update(previous => ({
        close: previous.close, open: previous.open, type: 'info', title: 'Replacement',
        rootClassName: previous.rootClassName, afterOpenChange: previous.afterOpenChange
      }));
    }
    else {
      if (id === 'provider-timing') {
        ConfigProvider.config({ prefixCls: 'new', iconPrefixCls: 'new-icons' });
      }
      else {
        useSecondLocale = false;
      }
      active?.update({ title: 'Refreshed' });
    }
  }
</script>

{#snippet primary()}<span data-static-content="Primary">Content</span>{/snippet}
{#snippet second()}<span data-static-content="Second">Content</span>{/snippet}
{#snippet context()}<span data-static-content="Context">Content</span>{/snippet}

{#snippet firstHolder(content: Snippet)}
  <ConfigProvider
    prefixCls={id === 'global-holder' ? 'holder' : undefined}
    direction="rtl"
    modal={{ okButtonProps: { title: id === 'global-holder' ? 'Holder OK' : 'First holder' } }}
  >
    {@render content()}
  </ConfigProvider>
{/snippet}

{#snippet secondHolder(content: Snippet)}
  <ConfigProvider direction="ltr" modal={{ okButtonProps: { title: 'Second holder' } }}>
    {@render content()}
  </ConfigProvider>
{/snippet}

{#if profile}
  <ConfigProvider prefixCls="scope" direction="rtl" locale={scopedLocale} theme={motionless}>
    <App component={false}><ModalStaticLaunch {launch} /></App>
  </ConfigProvider>
{:else}
  {#if id === 'locale-stack'}
    <ConfigProvider locale={firstLocale}><span>First</span></ConfigProvider>
    {#if useSecondLocale}
      <ConfigProvider locale={secondLocale}><span>Second</span></ConfigProvider>
    {/if}
  {/if}
  <button type="button" id="static-opener" onclick={launchLifecycle}>Open static</button>
{/if}

<div id="static-target"></div>
<output id="static-events">{JSON.stringify(events)}</output>
<output id="static-handles">{JSON.stringify(handles.map(handleShape))}</output>
<output id="static-immediate">{immediate}</output>
<output id="static-ref">{panelRef}</output>
<button type="button" id="static-destroy" onclick={() => active?.destroy()}>Destroy</button>
<button type="button" id="static-destroy-all" onclick={Modal.destroyAll}>Destroy all</button>
<button type="button" id="static-update" onclick={updateLifecycle}>Update</button>
<button type="button" id="static-hide" onclick={() => active?.update({ open: false })}>Hide</button>
<button type="button" id="static-reopen"
  onclick={() => active?.update({ open: true, title: 'Reopened' })}>Reopen</button>
<button type="button" id="static-release" onclick={() => finishAction?.()}>Release</button>
<button type="button" id="static-update-object"
  onclick={() => active?.update({ okText: 'Applied object' })}>Update object</button>
<button type="button" id="static-update-function" onclick={() => active?.update(previous => {
  track('update', Boolean(previous.open), typeof previous.close);
  return { ...previous, title: 'Applied function' };
})}>Update function</button>
