# Modal

Modal сохраняет нативный dialog, `bind:open`, footer/children snippets и существующие
правила onOk/onCancel, confirmLoading, Escape и закрытия по фону.
`loading` заменяет body на активный Skeleton без title с четырьмя строками и скрывает
default/custom footer. Возврат к содержимому монтирует body и footer заново;
локальный draft дочернего компонента сбрасывается. Dialog, header, title и close
сохраняют DOM identity. Сам `loading` не блокирует закрытие; прежние правила
`confirmLoading` сохранены. Физический placeholder получает `${prefixCls}-body-skeleton`,
включая локальный prefix. Сохраняются нативное центрирование dialog, отдельные
accessibility wrappers Skeleton, max-width containment и имена CSS keyframes.
[Независимые Source-повторы](../../../tests/browser/fixtures/ant-design-modal-loading-source-manifest.json)
проверяют 2 owners, 10 действий, 12 состояний и lifecycle после удаления.
[Browser](../../../tests/browser/modal-loading.spec.ts) проверяет переходы и cleanup,
[SSR](../../../tests/package/modal-loading.ssr.test.ts) — закрытый Native shell без DOM и timers.
Title и children необязательны. Title принимает scalar либо Snippet; пустой/null/false
title убирает header, число 0 остаётся видимым. Без видимого заголовка задайте
aria-label или aria-labelledby. Явные ARIA-имена применяются к самому dialog;
aria-labelledby имеет приоритет, затем непустой aria-label, затем generated title id.
Смена title сохраняет dialog, draft, selection и focus.
[Raw content/ARIA случаи](../../../tests/browser/fixtures/ant-design-modal-content-reference.json)
фиксируют исходные исключения: React теряет title=0 и явные ARIA props. Native
показывает 0 и сохраняет имя, заданное владельцем.
Закрытие по фону настраивается через mask={{ closable: false }}; по умолчанию
разрешено. Прежний maskClosable удалён. Остальные настройки mask пока не перенесены.

`prefixCls` меняет namespace Modal и его частей; пустая строка наследует
ConfigProvider.prefixCls. Настройка доступна и в config контекстного подтверждения,
включая handle.update. Button использует независимый общий prefix; canonical
CSS variables, native dialog, IDs и открытое содержимое сохраняются.
[Raw сверка](../../../tests/browser/fixtures/ant-design-modal-prefix-reference.json)
фиксирует исходный дефект Confirm: local prefix оставляет лишний header, потому
что Source скрывает его через общий namespace. Отдельный public styles.header
counterpart скрывает этот header; Native сохраняет один заголовок подтверждения.
Там же отделены Source cache с потерей footer Button margin и public counterpart
с новым local prefix. Прежние disabled-loading правила и размер native SVG сохранены;
для них записан отдельный React-вариант через публичные button props.

`theme.components.Modal` настраивает header/content/footer background, title color,
font size/line height, внутренние отступы и wireframe. Поддерживаются aliases,
component algorithms, CSS lengths и custom prefix; Button/Input внутри сохраняют
собственные tokens. Source close wrapper задаёт размер иконки; legacy-размер сохранён.
Тема обновляется без потери модальности, DOM, draft, selection и focus, включая
getContainer. Нативное центрирование и резерв места title под close сохранены.
[Сверка с официальным UMD](../theme-context.md#проверки-диалогов-и-уведомлений) не означает
поддержку полного render/config API. Контекстные подтверждения описаны ниже.

GetContainer принимает DOM-узел, DocumentFragment (включая ShadowRoot), CSS-селектор,
функцию без аргументов либо false. Локальное undefined использует
ConfigProvider.getPopupContainer; Modal вызывает глобальный getter без trigger,
как Ant Design 6.6.8. False оставляет DOM на месте и отключает global fallback.
Без обеих настроек сохраняется прежнее native-размещение.

```svelte
<script lang="ts">
  import { Modal } from '@woodger/antd';
  let open = $state(false);
</script>

<button type="button" onclick={() => open = true}>Открыть редактор</button>
<div id="modal-container"></div>
<Modal bind:open title="Редактор" getContainer="#modal-container">
  <input name="description" aria-label="Описание" />
</Modal>
```

Getter вызывается только после browser mount, в том числе у закрытого Modal.
Первый перенос готового контейнера сохраняет SSR DOM. Смена функции с тем же
контейнером сохраняет содержимое, draft, выделение и фокус; смена самого
контейнера пересоздаёт dialog и содержимое, как React portal. Перенос во время
закрытия Drawer отменяет motion старой панели и её pending destruction;
новый dialog остаётся закрытым до следующего открытия. Default/custom prefix
не меняют этот lifecycle и не зацикливают перенос. Отсутствующий
selector или пустой результат getter используют body. Для отключённого DOM-узла
и DocumentFragment открытие ждёт вставки в document. Стили ShadowRoot подключает
потребитель. Нативная модальность, fullscreen-размещение, inert, scroll lock и
возврат фокуса сохраняются в любом контейнере. Прежний SSR shell и eagerly mounted
children при loading=false сохранены; полное API Modal, semantic styles и render hooks ещё требуют переноса.

Эталонные зависимости — @rc-component/dialog 1.10.0 и portal 2.1.3;
лицензии сохранены в [LICENSE.rc-dialog](../../../src/lib/vendor/LICENSE.rc-dialog) и
[LICENSE.rc-portal](../../../src/lib/vendor/LICENSE.rc-portal).
Сверка Modal/Drawer использует 36 снимков официального UMD,
[browser-проверки](../../../tests/browser/dialog-container.spec.ts) и
[проверки взаимодействия](../../../tests/browser/dialog-container-interaction.spec.ts),
фикстура — `?fixture=dialog-container`.

## Контекстные подтверждения Modal

`createModal()` и единственный `ModalHolder` заменяют React `Modal.useModal()`.
Holder размещается под нужным ConfigProvider: открытые подтверждения наследуют его
тему, локаль, RTL и контейнер, включая последующие изменения контекста.

```svelte
<script lang="ts">
  import { Button, ModalHolder, createModal } from '@woodger/antd';
  const modal = createModal();

  async function confirm() {
    const accepted = await modal.confirm({ title: 'Продолжить?', content: 'Подтвердите действие.' });
    if (accepted) {
      // Выполнить подтверждённое действие.
    }
  }
</script>

<Button onclick={confirm}>Продолжить</Button>
<ModalHolder {modal} />
```

Методы info/success/error/warning/confirm возвращают handle с destroy(),
update(object | previous => patch) и await результата true/false. Confirm показывает
OK и Cancel; остальные типы — только OK. По умолчанию ширина 416px, close скрыт,
Escape разрешён, закрытие по фону запрещено. Нативное центрирование сохранено.
Title/content и подписи кнопок принимают scalar/Snippet; icon — Snippet/null/false,
footer — Snippet/null. Опции okCancel, closable, keyboard, mask.closable,
getContainer и class применяются отдельно к каждому подтверждению.

Callback onOk/onCancel без аргумента закрывает окно после синхронного результата.
Callback с аргументом close оставляет закрытие владельцу. Возвращённый Promise
включает loading соответствующей кнопки: fulfillment закрывает окно, rejection
оставляет его для повторного действия. Повторное нажатие во время ожидания
не запускает callback заново. Escape/close/mask закрывают сразу с вызовом onCancel;
они доступны и при ожидающем onOk. Destroy не вызывает onCancel. AfterClose
вызывается после фактического закрытия native dialog, один раз; уничтожение
ещё не смонтированного подтверждения завершает его сразу.

Destroy и удаление holder завершают ожидающие handles с false; поздние async
результаты не возвращают окно. Удаление holder не вызывает onCancel/afterClose,
освобождает модальность и возвращает фокус, если владелец не перевёл его сам.
После повторного подключения holder очередь пуста, новые вызовы работают;
вызовы между отсоединением и подключением завершаются с false.
В SSR фабрика не обращается к DOM, а holder выводит закрытые dialog shells.

[13 исходных сценариев](../../../tests/browser/fixtures/ant-design-modal-controller-reference.json)
сняты с официального UMD. Source destroy оставляет await незавершённым; это
исключение записано и не воспроизводится. Асинхронный rejection использует
поведение исходного await-режима, без unhandled rejection. Прежние Native
подписи кнопок из locale.okText/cancelText сохранены. Глобальные static methods,
полные button/focusable/semantic/render options пока не перенесены. Проверки:
[модель](../../../src/lib/modal.model.test.ts),
[браузер](../../../tests/browser/modal-controller.spec.ts),
[SSR и декларации](../../../tests/package/modal-controller.ssr.test.ts).

