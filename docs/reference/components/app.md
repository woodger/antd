# App

App объединяет MessageHolder, NotificationHolder и ModalHolder. Дочерний компонент
получает их API через `App.useApp()` либо отдельный `useApp()` при инициализации.
Вызов требует ближайшего App; глобальная очередь между SSR-запросами не создаётся.

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

Ближайший ConfigProvider задаёт тему, локаль и RTL holders. Настройки message и
notification объединяются по полям с ближайшим App; локальное undefined тоже
перекрывает родительское поле и возвращает default соответствующего holder.
Top/bottom меняют расположение поверхности; duration/pauseOnHover/maxCount и
notification.placement применяются к следующим вызовам. Изменение defaults не
перезапускает таймеры и не удаляет существующие записи. Новый maxCount применяется
при следующем добавлении; прежние placements уведомлений сохраняются.
Родительская, вложенная и соседняя очереди независимы. API остаются стабильными
на протяжении жизни App. В React notification API получает новый объект после
изменения config; это отличие механизма контекста записано в реестре.

По умолчанию root — div с исходной типографикой Ant Design. Component принимает
HTML-тег, Svelte-компонент или false. False выводит children и holders фрагментом,
в этом режиме `nativeElement` равен `undefined`. Смена корня пересоздаёт дочернее
DOM-дерево и очищает holders. Те же API
работают после повторного подключения. Bind:nativeElement даёт текущий HTML-root
и очищается при его удалении. Local prefixCls задаёт root-классы, иначе используется
ConfigProvider.prefixCls + app. ConfigProvider.app
наследует record class/style целиком; локальные class/rootClassName/style дополняют
его, style имеет приоритет. Обычные HTML attrs передаются корню.

Пользовательский корень получает children со всеми holders, строковые class и
style, dir, HTML-атрибуты и собственные типизированные props. `AppRootProps`
описывает общие параметры. Для передачи DOM-ref объявите `nativeElement` через
`$bindable()` и используйте `bind:this` на элементе корня. Корень может вызывать
`App.useApp()`. Гидратация и обновление префикса сохраняют узлы, фокус и черновик.
[Сверка с Ant Design 6.6.8](../../../tests/browser/app-custom-root.spec.ts).

В SSR App не открывает dialog/popover и не запускает таймеры. Удаление App
закрывает поверхности, снимает inert/scroll lock и завершает ожидающие Modal
handles с false. `App.message` дополнительно принимает `rtl`, `getContainer`,
`stack`, `transitionName`, `classNames` и `styles`. Эти настройки управляют
поверхностью общего экземпляра. [Message](message.md)

`App.notification` принимает `getContainer`, `rtl`, `stack`, `showProgress`,
`closeIcon`, `classNames`, `styles` и `onAllRemoved`. [Notification](notification.md)

Основа сверки — [исходные снимки App](../../../tests/browser/fixtures/ant-design-app-reference.json).
Все девять root-примеров, включая global-prefix, проверяются. Проверки:
[браузер](../../../tests/browser/app.spec.ts), [SSR и типы](../../../tests/package/app/app.ssr.test.ts),
[обновление defaults](../../../src/lib/notice/notice-config.test.ts).

