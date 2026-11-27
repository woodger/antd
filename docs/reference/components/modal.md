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
[Browser](../../../tests/browser/modal/modal-loading.spec.ts) проверяет переходы и cleanup,
[SSR](../../../tests/package/modal/modal-loading.ssr.test.ts) — закрытый Native shell без DOM и timers.
Title и children необязательны. Title принимает scalar либо Snippet; пустой/null/false
title убирает header, число 0 остаётся видимым. Без видимого заголовка задайте
aria-label или aria-labelledby. Явные ARIA-имена применяются к самому dialog;
aria-labelledby имеет приоритет, затем непустой aria-label, затем generated title id.
Смена title сохраняет dialog, draft, selection и focus.
[Raw content/ARIA случаи](../../../tests/browser/fixtures/ant-design-modal-content-reference.json)
фиксируют исходные исключения: React теряет title=0 и явные ARIA props. Native
показывает 0 и сохраняет имя, заданное владельцем.

На границе Modal сбрасываются статус и индикатор проверки внешнего `Form.Item`.
Локальный `Form.Item` и явный `status` поля задают оформление внутри окна.
[Сверка с Ant Design 6.6.8](../../../tests/browser/dialog/dialog-form-style.spec.ts).

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

`zIndex` задаёт числовой слой Modal, включая 0. Слой наследуют вложенные
диалоги и popup. [Уровни вложенных панелей](../theme-context.md#уровни-вложенных-панелей)

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
При смене `open` контейнер разрешается после обновления DOM. Селектор и getter
видят узел, который монтируется вместе с открытием окна.
[Сверка с Ant Design 6.6.8](../../../tests/browser/drawer/drawer-container-timing.spec.ts).
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
потребитель. В нативном режиме dialog сохраняет модальность, inert и возврат
фокуса в любом контейнере.

Эталонные зависимости — @rc-component/dialog 1.10.0 и portal 2.1.3;
лицензии сохранены в [LICENSE.rc-dialog](../../../src/lib/vendor/LICENSE.rc-dialog) и
[LICENSE.rc-portal](../../../src/lib/vendor/LICENSE.rc-portal).
Сверка Modal/Drawer использует 36 снимков официального UMD,
[browser-проверки](../../../tests/browser/dialog/dialog-container.spec.ts) и
[проверки взаимодействия](../../../tests/browser/dialog/dialog-container-interaction.spec.ts),
фикстура — `?fixture=dialog-container`.

## Маска, прокрутка и фокус

`mask` принимает boolean или объект с `enabled`, `blur` и `closable`.
По умолчанию маска видима и клик по фону закрывает окно. `blur: true` добавляет
размытие на 4 px. `mask={false}` оставляет прозрачную область вокруг панели.
Она обрабатывает клик по правилам `mask.closable` и блокирует кнопки под ней.
Клик начинается и заканчивается в этой области.

`focusable.trap` по умолчанию следует видимости маски. При `trap: false` фокус
можно перевести за пределы окна. `aria-modal` следует удержанию фокуса.
`focusable.focusTriggerAfterClose` по умолчанию возвращает фокус к триггеру
после закрытия окна с видимой маской. `ConfigProvider.modal` задаёт параметры
`mask` и `focusable`. Локальные поля имеют приоритет.

`scrollLock={false}` разрешает прокрутку страницы независимо от маски и фокуса.
По умолчанию нативный режим блокирует её в любом контейнере. Управляемый режим
блокирует страницу при стандартном портале и в `document.body`, как Ant Design.
Смена режима сохраняет dialog, черновик и фокус внутри панели.
[Эталон Ant Design 6.6.8](../../../tests/browser/fixtures/ant-design-modal-interaction-reference.json)
· [Chromium](../../../tests/browser/modal/modal-interaction.spec.ts)
· [Гидратация](../../../tests/browser/modal/modal-interaction-hydration.spec.ts).

## Размеры и положение

`width` принимает число в пикселях, строку с CSS-длиной или карту брейкпоинтов
Grid от `xs` до `xxxl`. Явный размер действует с указанного брейкпоинта до
следующего заданного. Правила используют пороги активной темы и работают при SSR.
Числовой ноль сохраняется. У контекстного подтверждения `width` принимает число
или строку. Пустое значение и ноль выбирают стандартную ширину 416 px.
`height` задаёт высоту обоих видов панели числом в пикселях или CSS-длиной.

`centered` наследуется из `ConfigProvider.modal`. Локальное `true` центрирует
панель, `false` размещает её сверху, как в Ant Design. Если обе настройки
отсутствуют, Svelte сохраняет нативное центрирование. В режиме верхнего
размещения содержимое прокручивается внутри панели по доступной высоте.
Смена размеров и положения сохраняет DOM, черновик, выделение и фокус.
[Эталон Ant Design 6.6.8](../../../tests/browser/fixtures/ant-design-modal-layout-reference.json)
· [Chromium](../../../tests/browser/modal/modal-layout.spec.ts)
· [Гидратация](../../../tests/browser/modal/modal-layout-hydration.spec.ts).

## Монтаж и завершение переходов

Без настроек монтажа Modal по-прежнему рендерит закрытый dialog и его содержимое,
включая SSR. В Ant Design 6.6.8 обычный Modal монтируется при первом открытии.
В Svelte `forceRender={false}` включает тот же ленивый режим. `forceRender={true}`
монтирует панель заранее. `destroyOnHidden` откладывает первый монтаж до открытия
и удаляет панель после скрытия. Одновременный `forceRender={true}` сохраняет панель.
При сохранении панели сохраняются DOM и черновик. После удаления следующий
показ монтирует новую панель.

Панель масштабируется от 0,2 до 1 при открытии и обратно при закрытии.
Маска меняет прозрачность независимо. Длительности берутся из токенов темы.
`theme.token.motion: false` и `prefers-reduced-motion: reduce` завершают переход
без анимации. Правила фокуса и блокировки прокрутки действуют до закрытия dialog.
После показа вызывается `afterOpenChange(true)`. При закрытии Modal сначала
освобождает модальность, возвращает фокус по настройкам `focusable` и завершает
удаление при `destroyOnHidden`. Затем вызовы идут в порядке `afterClose()`,
`afterOpenChange(false)`. Повторное открытие во время скрытия сохраняет
содержимое и отменяет уведомление о закрытии.

Эти параметры доступны и в контекстных подтверждениях. Их владелец завершает
`await` при принятии решения. После закрытия колбэки выполняются до удаления
подтверждения, чтобы cleanup дочерних компонентов видел их обновления.
SSR не запускает анимацию и не вызывает колбэки. Первое открытие при гидратации
использует уже отрисованный DOM.
[Снимки Ant Design 6.6.8](../../../tests/browser/fixtures/ant-design-modal-lifecycle-reference.json)
· [Chromium](../../../tests/browser/modal/modal-lifecycle.spec.ts)
· [SSR](../../../tests/package/modal/modal-lifecycle.ssr.test.ts)
· [Гидратация](../../../tests/browser/modal/modal-lifecycle-hydration.spec.ts).

## Именованные переходы и точка начала движения

`transitionName` задаёт CSS-переход панели, а `maskTransitionName` задаёт переход
маски. Пустая строка отключает движение указанной части. CSS может использовать
фазы `<имя>-appear`, `<имя>-enter`, `<имя>-leave` и их активные классы
`<имя>-<фаза>-active`. Без собственных имён действуют штатные zoom и fade.
Параметры доступны в конфигурации подтверждения и через `handle.update()`.

`mousePosition` задаёт точку в координатах страницы `{ x, y }`. При `null` или
`undefined` используется клик за последние 100 мс, включая клик, который
монтирует Modal. Координаты `{ x: 0, y: 0 }` оставляют обычную точку масштабирования.

Закрытие панели освобождает фокус и прокрутку. Маска может продолжать анимацию
после `afterOpenChange(false)` и пропускает ввод к странице или нижнему диалогу.
Маска закрывающегося нижнего окна остаётся под уже открытым верхним диалогом.
При `destroyOnHidden` без `forceRender` содержимое удаляется до колбэков,
а оставшаяся маска удаляется после них. Если для указанного имени нет
CSS-эффекта, Svelte завершает фазу после проверки кадра. В замере Ant Design
6.6.8 без CSS-правил оболочка оставалась видимой после закрытия, а колбэки
не приходили.
[Эталон Ant Design 6.6.8](../../../tests/browser/fixtures/ant-design-modal-motion-reference.json)
· [Chromium](../../../tests/browser/modal/modal-motion.spec.ts)
· [SSR](../../../tests/package/modal/modal-motion.ssr.test.ts)
· [Гидратация](../../../tests/browser/modal/modal-motion-hydration.spec.ts).

## Кнопки, футер и закрытие

`okButtonProps` и `cancelButtonProps` принимают настройки Button, включая ссылку
`href` и её нативный обработчик. Локальные поля перекрывают поля
`ConfigProvider.modal`. `okType` задаёт вид OK, по умолчанию `primary`.
`okText` и `cancelText` принимают scalar или Snippet. При `undefined` используется
локаль, `null` оставляет подпись пустой.

Кнопка сначала запускает действие Modal, затем свой `onclick` или `onClick`.
У подтверждения повторное нажатие на ту же кнопку во время Promise пропускает
оба обработчика, даже если визуальное ожидание снято через `loading: false`.

Футер получает штатную группу и snippets отдельных кнопок. Например, в обычном
Modal и в подтверждении можно поставить OK перед Cancel.

```svelte
{#snippet footer(_defaultFooter, { OkBtn, CancelBtn })}
  {@render OkBtn()}
  {@render CancelBtn()}
{/snippet}

<Modal bind:open {footer} okButtonProps={{ danger: true }} />
```

Футер без параметров работает как прежде. При `footer={null}` кнопок нет.
В подтверждении штатная группа включает элемент с классом `-confirm-btns`;
при выборе отдельных кнопок разметку группы задаёт сам snippet. Кнопка Cancel
появляется, когда её разрешает `okCancel`.

`closable` принимает boolean или объект с `closeIcon`, `disabled`, ARIA-атрибутами,
`role`, `onClose` и `afterClose`. `disabled` действует на кнопку закрытия.
Escape и фон управляются через `keyboard` и `mask.closable`. Если `closable` не
задан, отдельный `closeIcon={null}` или `closeIcon={false}` скрывает кнопку.
В объекте `closable` значение `closeIcon: null` оставляет кнопку с доступным
именем и без иконки.

Обычный Modal вызывает локальный `closable.onClose` после `onOk` или `onCancel`.
Подтверждение вызывает его при завершении действия кнопки либо сразу после
`onCancel` для Escape, фона и кнопки закрытия. `closable.afterClose` предшествует
`afterClose` при закрытии панели, в том числе при внешней смене `open` или
`handle.destroy()`. Для Promise сохраняется `onClose` на момент нажатия,
а `afterClose` читается при фактическом закрытии. Провайдер задаёт вид и
доступность кнопки.

В исходной версии `confirmLoading` блокирует действие Cancel через колбэк.
В Svelte он также сохраняет прежний disabled у кнопки Cancel и кнопки закрытия.
При загрузке сам Button использует нативный disabled. В обычном Modal OK
наследует `componentDisabled`, если в настройках кнопки не задано `disabled`.
[Эталон Ant Design 6.6.8](../../../tests/browser/fixtures/ant-design-modal-actions-reference.json)
· [Chromium](../../../tests/browser/modal/modal-actions.spec.ts)
· [SSR и типы](../../../tests/package/modal/modal-actions.ssr.test.ts)
· [Гидратация](../../../tests/browser/modal/modal-actions-hydration.spec.ts).

## Семантические части и оболочка

`classNames` и `styles` задают оформление слотов `root`, `wrapper`, `mask`,
`container`, `close`, `header`, `title`, `body` и `footer`. Можно передать карту
или функцию `({ props }) => карта`. Функция получает текущие параметры Modal,
в том числе ширину, состояние маски, настройки фокуса и zIndex. Классы
`ConfigProvider.modal` и экземпляра складываются. Строки CSS-деклараций
экземпляра идут после строк провайдера. `ConfigProvider.modal.class` оформляет
внутреннюю панель, а `style` экземпляра дополняет `ConfigProvider.modal.style`.

Слоты `root` и `wrapper` оформляют общий нативный `<dialog>`. На него
попадают также `class`, `rootClassName` и `wrapClassName`.
`styles.root` дополняет `rootStyle`, затем применяется оформление `wrapper`.
В React 6.6.8 стиль корня берётся из `styles.root`. Svelte применяет и напрямую
переданный `rootStyle`. Ширина и высота принадлежат нативной оболочке.

`wrapProps`, `maskProps` и `bodyProps` принимают нативные атрибуты и
обработчики соответствующих элементов. Явные `class` и `style` этих props
заменяют оформление соответствующего слота. Управление `open`, модальностью
и lifecycle остаётся у Modal. `wrapProps.onclick` и `wrapProps.onmousedown`
передают обработку закрытия по фону владельцу. Настройка слота маски создаёт
DOM-элемент под панелью. По умолчанию маска рисует фон, а клики принимает оболочка.
Модальность остаётся у нативного dialog.

`modalRender` получает штатный контейнер как snippet. Он может обернуть его
или отрисовать собственное содержимое. `bind:panelRef` получает
`HTMLDialogElement` на время жизни панели. В контекстном подтверждении
`panelRef` принимает callback и передаёт ему `undefined` при снятии ссылки.
У подтверждения слот `body` оформляет видимое содержимое, а `bodyProps`
относятся к его структурному контейнеру. Подтверждение сохраняет единственный
заголовок. Слоты `header` и `title` оформляют заголовок обычного Modal.

[Эталон Ant Design 6.6.8](../../../tests/browser/fixtures/ant-design-modal-semantics-reference.json)
· [Chromium](../../../tests/browser/modal/modal-semantics.spec.ts)
· [SSR и типы](../../../tests/package/modal/modal-semantics.ssr.test.ts)
· [Гидратация](../../../tests/browser/modal/modal-semantics-hydration.spec.ts).

## Контекстные подтверждения Modal

`createModal()` и единственный `ModalHolder` заменяют React `Modal.useModal()`.
Holder размещается под нужным ConfigProvider: открытые подтверждения наследуют его
тему, локаль, RTL и контейнер, включая последующие изменения контекста.
`zIndex` здесь по умолчанию равен `zIndexPopupBase + 1000` и обновляется
через `handle.update({ zIndex })`.

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
Title/content, icon и подписи кнопок принимают scalar или Snippet.
`ConfigProvider.modal` задаёт `infoIcon`, `successIcon`, `errorIcon` и `warningIcon`.
Тип confirm использует `warningIcon`. Локальный `icon` имеет приоритет, а
`icon: null` и `icon: false` скрывают иконку. Опции okCancel, closable, keyboard,
mask, focusable, scrollLock, getContainer и class применяются отдельно к каждому
подтверждению.
`direction` определяет направление конкретного окна. Вызванный метод задаёт
начальный тип. Через `handle.update({ type })` можно сменить иконку, класс и
состав штатных кнопок.
Клик по фону закрывает подтверждение при локальном `mask.closable: true`.
`focusable.autoFocusButton` выбирает OK или Cancel при открытии и в `handle.update()`.
По умолчанию выбирается OK. При `null` ни одна кнопка не получает явный autofocus.
В Ant Design 6.6.8 `null` даёт фокус OK. [Сверка](../../../tests/browser/modal/modal-interaction.spec.ts).

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
подписи кнопок из locale.okText/cancelText сохранены.
[модель](../../../src/lib/modal/modal.model.test.ts),
[браузер](../../../tests/browser/modal/modal-controller.spec.ts),
[SSR и декларации](../../../tests/package/modal/modal-controller.ssr.test.ts).

## Глобальные подтверждения

`Modal.confirm(config)`, `Modal.info(config)`, `Modal.success(config)`,
`Modal.warning(config)` и `Modal.error(config)` открывают окно без `ModalHolder`.
Каждый вызов создаёт отдельный браузерный корень. Диалог переносится в указанный
контейнер или использует контейнер провайдера и `document.body`. В статическом
вызове `getContainer: false` выбирает тот же путь, что и отсутствие настройки.

Handle предоставляет `destroy()` и `update()`. Объект в `update` дополняет
текущие настройки. Функция получает их снимок с `open` и `close` и возвращает
новую конфигурацию целиком. `update({ open: false })` скрывает панель с
возможностью повторного открытия. Несколько изменений до ближайшего рендера
применяются одним обновлением. Закрытие до первого показа освобождает корень
без callback видимости или закрытия.

Кнопки используют актуальные `onOk` и `onCancel`. Если обработчик принимает
`close`, он может завершить действие вручную. Ожидание Promise показывает
loading, а отклонение оставляет окно доступным для повтора. Результат
действия из предыдущего показа не меняет вновь открытое окно. При Escape,
клике по маске или кнопке закрытия исходный `onCancel` вызывается после
исходного `afterClose`. `destroy()` также вызывает исходный `afterClose` после
закрытия показанной панели. `afterOpenChange` читается из текущих настроек.

`Modal.destroyAll()` закрывает глобальные окна и снимает контекстные
подтверждения, включая `App.useApp().modal`. Контекстные handles при снятии
панели завершаются с `false`. В React такой handle остаётся в ожидании.
При SSR глобальный вызов возвращает пассивный handle. Контекстные
подтверждения принадлежат своему запросу.

Отдельные корни получают глобальные параметры и `holderRender`. При переносе
в `document.body` или пользовательский контейнер окно получает вычисленные
CSS-переменные своего провайдера. При обновлении темы цвета открытой панели
следуют за настройками. Смонтированные провайдеры `locale` участвуют в выборе
подписей кнопок статического Modal.
[ConfigProvider.config](../config-provider.md#глобальные-настройки-статических-вызовов)

[21 профиль Ant Design 6.6.8](../../../tests/browser/fixtures/ant-design-modal-static-reference.json)
· [Chromium](../../../tests/browser/modal/modal-static.spec.ts)
· [Цвета портального окна](../../../tests/browser/modal/modal-static-theme.spec.ts)
· [SSR и типы](../../../tests/package/modal/modal-static.ssr.test.ts).
