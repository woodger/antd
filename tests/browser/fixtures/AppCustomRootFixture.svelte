<script lang="ts">
  import { App, ConfigProvider, type AppComponentProps, type AppInstance } from '@woodger/antd';
  import AppConsumer from './AppConsumer.svelte';
  import AppCustomRoot from './AppCustomRoot.svelte';
  import AppCustomRootWithoutRef from './AppCustomRootWithoutRef.svelte';

  let revised = $state(false);
  let replaced = $state(false);
  let nativeElement = $state<HTMLElement>();
  let firstApi = $state.raw<AppInstance>();
  let currentApi = $state.raw<AppInstance>();
  const props: AppComponentProps<{ label: string; }> = {
    component: AppCustomRoot,
    label: 'Custom App',
    class: 'local-app',
    rootClassName: 'root-class',
    message: { duration: 0, getContainer: getNoticeContainer },
    notification: { duration: false, getContainer: getNoticeContainer }
  };
  const theme = {
    hashed: false,
    cssVar: {},
    components: { App: { fontSize: 20, fontFamily: 'monospace', lineHeight: 2 } }
  };

  /** Container is requested by holders after mounting. */
  function getNoticeContainer() {
    return document.getElementById('app-notice-container');
  }

  /** Fixes API of the first tree and compares it to API after re-creating holders. */
  function connect(api: AppInstance) {
    firstApi ??= api;
    currentApi = api;
  }
</script>

<button type="button" onclick={() => revised = true}>Revise App</button>
<button type="button" onclick={() => replaced = true}>Replace App root</button>
<output id="custom-app-ref">{nativeElement?.id ?? 'none'}</output>
<output id="custom-app-api">{Boolean(currentApi && currentApi === firstApi)}</output>
<div id="app-notice-container"></div>
<ConfigProvider
  {theme}
  prefixCls="brand"
  direction={revised ? 'ltr' : 'rtl'}
  app={{ class: 'context-app', style: 'padding-top:5px;'
    + 'color:#abcdef' }}
>
  <App
    {...props}
    component={replaced ? AppCustomRootWithoutRef : AppCustomRoot}
    prefixCls={revised ? 'revised-app' : 'local-prefix-app'}
    style={revised ? 'padding-top:11px' : 'padding-top:7px'}
    data-root-owner="app"
    bind:nativeElement
  >
    <label>Draft <input id="draft" /></label>
    <AppConsumer onApi={connect} />
  </App>
</ConfigProvider>
