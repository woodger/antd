# Notification

Создавайте экземпляр у владельца и размещайте один NotificationHolder в нужном
контексте ConfigProvider. Очереди компонентов и SSR-запросов независимы:

```svelte
<script lang="ts">
  import { Button, NotificationHolder, createNotification } from '@woodger/antd';

  const notification = createNotification({ maxCount: 3 });
</script>

{#snippet actions()}
  <Button onclick={() => notification.destroy('report')}>Понятно</Button>
{/snippet}

<NotificationHolder {notification} />
<Button onclick={() => notification.success({
  key: 'report',
  title: 'Отчёт готов',
  description: 'Подготовлены две записи.',
  duration: 0,
  actions
})}>Показать результат экспорта</Button>
```

Open/success/info/warning/error принимают объект NotificationConfig и возвращают
void. Open без type показывает карточку без статусной иконки. Типизированные
методы задают свой type. Title/description принимают текст, число или Snippet.
Ноль отображается как число, пустая строка убирает соответствующую область.
Icon и closeIcon декоративные. Действия могут находиться в actions или
description. Class/style относятся к карточке. `props` добавляет нативные
атрибуты корневого div, включая `data-*` и ARIA. Напрямую заданные
`aria-label`, `aria-labelledby` и `aria-describedby` имеют приоритет.
По умолчанию имя берётся из title, а описание — из description.
`onClick` получает нативное событие с карточкой в `currentTarget`.
Кнопка закрытия останавливает его всплытие.

Duration задаётся в секундах, по умолчанию 4.5. Значения 0 и false отключают
автоудаление; отрицательные и неконечные значения используют default.
CreateNotification фиксирует defaults duration, pauseOnHover=true, placement и
maxCount. Конфигурация карточки переопределяет duration/pauseOnHover/placement.
Наведение сохраняет оставшееся время; pauseOnHover=false разрешает отсчёт при
наведении. Фокус внутри всегда приостанавливает таймер, включая переходы Tab
между действиями и обновление ключа. Отсчёт продолжается после ухода фокуса и,
если включена hover-пауза, указателя. Touch не включает hover-паузу.

`showProgress` выводит нативный `progress` для положительной длительности.
Его значение показывает оставшееся время и следует тем же паузам, что таймер.
Индивидуальное `showProgress: false` переопределяет настройки очереди.

Key — string или number, включая 0 и пустую строку. Повтор активного ключа
обновляет содержимое на прежнем месте, перезапускает duration и заменяет onClose.
В одном placement сохраняются экземпляры неизменённых snippets и их controls.
Изменение placement переносит карточку в другую группу и пересоздаёт snippets.
Уходящий ключ можно открыть заново: это отдельная карточка, позднее завершение
старой анимации её не удалит. Destroy(key) закрывает ключ, destroy() — всю
очередь экземпляра. MaxCount ограничивает активные уведомления суммарно во всех
положениях по FIFO; обновления ключа не меняют очередь. Положительное конечное
значение округляется вниз, без допустимого значения ограничения нет.

Closable=true по умолчанию. False убирает кнопку; объект поддерживает disabled,
closeIcon и aria-label/aria-labelledby/aria-describedby кнопки. CloseIcon также
можно задать на верхнем уровне; false/null скрывает кнопку. Доступное имя берётся
из locale.closeText либо closable.aria-label. Disabled запрещает только кнопку;
destroy и таймер продолжают действовать. ConfigProvider.disabled не отключает
закрытие уведомления, а вложенные компоненты действий наследуют свой контекст.
Иконка закрытия наследуется от `ConfigProvider.notification.closeIcon`. Приоритет
имеют настройки держателя и карточки. `closable.onClose` вызывается перед
`onClose` карточки при закрытии кнопкой или по таймеру.

OnClose вызывается один раз при запросе закрытия: кнопкой, destroy, таймером или
FIFO. Уходящая карточка получает inert/aria-hidden и остаётся в DOM до конца
анимации. Ошибка callback не мешает обработать остальные карточки destroy(),
после обработки она передаётся вызывающему коду. При reduced motion анимация
пропускается; включение режима завершает уже запущенный уход.

Появление не захватывает фокус. Кнопки используют нативные Enter/Space и обычный
Tab; Escape остаётся у страницы или содержащего Modal/Drawer. При закрытии или
удалении сфокусированного action фокус переходит к следующему доступному control
в DOM, затем к предыдущему либо активному dialog. Фокус, выбранный onClose
снаружи карточки, сохраняется. Role по умолчанию alert, для обычного результата
используйте status; aria-atomic=true. Иконки не создают остановок Tab.

Placement поддерживает top/topLeft/topRight/bottom/bottomLeft/bottomRight,
по умолчанию topRight. Left/right задают физическую сторону и не меняются в RTL.
Карточки растут к середине viewport; список прокручивается при переполнении.
Top/bottom у holder задают отступ в px, по умолчанию 24; невалидные значения
используют 24. Id/class/style относятся к нативной popover-поверхности holder;
ширину карточек можно настроить CSS-переменной --ant-notification-width
(по умолчанию 384px). Ширина ограничивается viewport, длинный текст переносится.
Темы, compact и RTL наследуются от ConfigProvider. `theme.components.Notification`
настраивает width, zIndexPopup, status backgrounds, aliases и component algorithms.
`NotificationHolder.prefixCls` меняет namespace всех placement-списков и карточек;
пустая строка наследует ConfigProvider.prefixCls. В App настройка передаётся через
notification. Canonical component tokens и прежний status background bridge
сохранены; private icon/title metrics используют независимый общий namespace.
[Raw prefix-замеры](../../../tests/browser/fixtures/ant-design-notification-prefix-reference.json)
отделены от public styles для native close target и wrapping guards. Потеря
status-классов уже открытой карточки в React записана отдельно от public same-key
refresh. Native обновляет классы без reopening, сохраняя DOM/ARIA IDs, draft,
selection/focus, очередь, deadlines и callbacks, в том числе внутри App.

`progressBg` задаёт заливку индикатора времени. Локальные CSS variables
другого prefix разрешаются на notice. Пользовательские variables Holder имеют приоритет.
Обновления сохраняют viewport styles, очередь, deadlines, actions DOM, draft/focus/selection.
Actions находятся на уровне корня, как в эталоне; wrapper выводится только с иконкой,
section — только для пары title/description. Legacy grid сохраняет прежние отступы
и расположение. Source flow-root сохраняет высоту float actions
при native relative positioning; тема переключается без пересоздания controls.
[Сверка и проверки](../theme-context.md#проверки-диалогов-и-уведомлений).

Явные status backgrounds применяются и при равенстве global alias, и при другом
cssVar prefix. В 6.6.8 такие настройки иногда теряются: [исходные замеры](../../../tests/browser/fixtures/ant-design-notification-background-observation.json).
В Svelte эти ошибки не повторяются. Сохраняются native close target минимум 24px,
padding:0, root/actions max-width:100% и перенос title/description; сравнение задаёт
те же условия через публичные semantic styles эталона.
Raw замер [width:undefined](../../../tests/browser/fixtures/ant-design-notification-width-observation.json)
также сохранён: Source обрезает close, а native относительный список сохраняет доступную кнопку.

До первого монтирования можно поставить уведомления в очередь. SSR выводит
закрытый popover без таймеров и callbacks; отсчёт начинается после показа.
Скрытый контекст, скрытая вкладка или верхний чужой dialog приостанавливают
очередь. Внутри Modal/Drawer размещайте holder в содержимом нужного dialog;
фоновые holders ждут его закрытия. Удаление holder или замена notification
очищает очередь и отменяет таймеры/анимации без onClose. Поздние вызовы такого
экземпляра игнорируются до повторного монтирования; новый holder начинает
пустую очередь. Общая модель очереди находится в notice-queue.model.svelte.ts,
DOM-видимость и фокус — в notice.dom.ts; ими также пользуются Message и Alert.

## Стек и контейнер

Стек по умолчанию сворачивается, когда в одном placement больше трёх активных
карточек. `stack: { threshold: 2 }` задаёт свой порог, `stack: false`
держит список раскрытым. В свёрнутом виде видны до трёх свежих карточек.
Наведение или фокус внутри раскрывают список. Наведение приостанавливает
таймеры с `pauseOnHover` в текущем placement. При явно заданном `stack`
или при превышении порога самые свежие карточки ближе к краю viewport.
Обычный список в пределах порога сохраняет порядок вставки.

`getContainer` выбирает узел для popover. Метод вызывается в браузере без
аргументов. При пустом результате используется `ConfigProvider.getPopupContainer`,
затем `document.body`. Без обоих getter элемент остаётся в DOM-контексте
держателя. Смена контейнера пересоздаёт списки и сохраняет очередь и таймеры.
`rtl` переопределяет направление провайдера. `onAllRemoved` срабатывает,
когда последняя карточка завершила уход и очередь пуста.

## Семантическое оформление

`classNames` и `styles` принимают объект слотов либо функцию с аргументом
`{ props }`. Для списка props содержат настройки держателя. Для отдельной
карточки они содержат конфигурацию вызова. `list` и `listContent` относятся
к placement. `root`, `wrapper`, `icon`, `section`, `title`,
`description`, `actions`, `close` и `progress` относятся к карточке.
Стили задаются строками inline CSS. Слои провайдера, держателя и карточки
объединяются в этом порядке. Явный style карточки применяется последним.

## Сверка с Ant Design 6.6.8

`createNotification` и `NotificationHolder` соответствуют контекстному
`notification.useNotification`. В App тот же экземпляр доступен через
`App.useApp().notification`. В закреплённом справочнике глобальные методы
помечены deprecated. Устаревшим полям message и btn соответствуют title и actions.
[Исходный справочник](https://github.com/ant-design/ant-design/blob/984592267de88fbf9cdaecc96a56629e721c709d/components/notification/index.en-US.md#examples)

В двух прогонах эталона FIFO убирал карточку без вызова `onClose`. Svelte
вызывает `onClose` при вытеснении. Измерения включают оформление, иконки и
callbacks закрытия, несколько placements, смену контейнера и App defaults,
раскладку стека и ход индикатора времени.
[Исходные замеры](../../../tests/browser/fixtures/ant-design-notification-api-reference.json) ·
[Браузерная проверка](../../../tests/browser/notification-api.spec.ts) ·
[SSR и типы](../../../tests/package/notification/notification-api.ssr.test.ts)

