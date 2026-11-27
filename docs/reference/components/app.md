# App

App combines MessageHolder, NotificationHolder, and ModalHolder. A child component
gets their APIs through `App.useApp()` or the separate `useApp()` during initialization.
The call requires the nearest App. SSR requests have separate contexts without
a global queue.

```svelte
<!-- Application.svelte -->
<script lang="ts">
  import { App, ConfigProvider } from '@woodger/antd';
  import Actions from './Actions.svelte';
</script>

<ConfigProvider theme={{ cssVar: {} }}>
  <App message={{ maxCount: 3 }} notification={{ placement: 'bottomRight' }}>
    <Actions />
  </App>
</ConfigProvider>
```

```svelte
<!-- Actions.svelte -->
<script lang="ts">
  import { App, Button } from '@woodger/antd';
  const { message, notification, modal } = App.useApp();

  async function confirm() {
    if (await modal.confirm({ title: 'Продолжить?' })) {
      message.success('Готово');
      notification.info({ title: 'Операция завершена' });
    }
  }
</script>

<Button onclick={confirm}>Продолжить</Button>
```

The nearest ConfigProvider sets theme, locale, and RTL for the holders. Message and
notification settings merge field by field with the nearest App. A local undefined
overrides the parent field and restores the relevant holder default. Top and
bottom change surface placement. Duration, pauseOnHover, maxCount, and
notification.placement apply to future calls. Changing defaults keeps current
entries and timers. A new maxCount applies when the next entry is added, and
existing notifications keep their placements.

Parent, nested, and sibling queues are independent. The APIs stay stable for
the life of App. React's notification API gets a new object when its configuration
changes. The registry records this difference in context handling.

The default root is a div with upstream Ant Design typography. Component accepts
an HTML tag, a Svelte component, or false. False renders children and holders as a
fragment and exposes `nativeElement` as `undefined`. Changing the root remounts
the child DOM tree and clears the holders. The same APIs work after reconnection.
`bind:nativeElement` exposes the current HTML root and clears when it is removed.

Local prefixCls sets the root classes. Its fallback is ConfigProvider.prefixCls
plus app. ConfigProvider.app inherits the class and style record as a whole.
Local class, rootClassName, and style extend it, with local style taking precedence.
Ordinary HTML attributes pass through to the root.

A custom root receives children with all holders, string class and style, dir,
HTML attributes, and its own typed props. `AppRootProps` describes the shared
parameters. To forward the DOM ref, declare `nativeElement` with `$bindable()`
and use `bind:this` on the root element. The root can call `App.useApp()`.
Hydration and prefix updates preserve nodes, focus, and drafts.
[Ant Design 6.6.8 comparison](../../../tests/browser/app/app-custom-root.spec.ts)

SSR leaves dialogs and popovers closed and timers inactive. Removing App closes
its surfaces, clears inert and scroll locking, and settles pending Modal handles
with false. `App.message` also accepts `rtl`, `getContainer`, `stack`,
`transitionName`, `classNames`, and `styles` for the shared instance surface.
[Message](message.md)

`App.notification` accepts `getContainer`, `rtl`, `stack`, `showProgress`,
`closeIcon`, `classNames`, `styles`, and `onAllRemoved`. [Notification](notification.md)

Checks cover all nine root examples, including global-prefix.
[Upstream App snapshots](../../../tests/browser/fixtures/ant-design-app-reference.json) · [Browser](../../../tests/browser/app/app.spec.ts) ·
[SSR and types](../../../tests/package/app/app.ssr.test.ts) · [Default updates](../../../src/lib/notice/notice-config.test.ts)
