# Message

Создавайте экземпляр у владельца, чтобы компоненты и SSR-запросы не разделяли
очередь. Один экземпляр поддерживает один смонтированный MessageHolder:

```svelte
<script lang="ts">
  import { Button, MessageHolder, createMessage } from '@woodger/antd';

  const message = createMessage({ maxCount: 3 });

  async function save() {
    const close = message.loading({ key: 'save', content: 'Сохраняем…', duration: 0 });
    try {
      const response = await fetch('/api/settings', { method: 'POST' });
      if (!response.ok) throw new Error('Save failed');
      message.success({ key: 'save', content: 'Настройки сохранены.' });
    } catch {
      message.error({ key: 'save', content: 'Не удалось сохранить настройки.' });
    }
    // close() закроет обновлённое сообщение; await дождётся его удаления.
    const closed = await close;
    if (closed) console.log('Сообщение удалено');
  }
</script>

<MessageHolder {message} />
<Button onclick={save}>Сохранить</Button>
```

`open` принимает `MessageConfig` с обязательным `content`. Методы
`info`, `success`, `warning`, `error` и `loading` принимают скалярное значение,
пассивный Snippet или объект с `content`. Числа, включая 0, выводятся текстом.
Булевы значения и null дают пустое содержимое. После первого аргумента можно
передать `duration` и `onClose` либо сразу `onClose`. Позиционные параметры
имеют приоритет над полями объекта.

Типизированный метод задаёт свой `type`. У `open` по умолчанию тип `info`.
`type: null` даёт нейтральное сообщение. `icon` принимает декоративный Snippet
или скалярное значение. Без своей иконки у статуса используется штатная
иконка, а у `loading` она вращается. `onClick` получает нативное событие
с корнем сообщения в `currentTarget`. В Snippet содержимого и иконки используйте
пассивные элементы.

Duration задаётся в секундах, по умолчанию 3; 0 отключает автоудаление.
CreateMessage фиксирует defaults duration, pauseOnHover=true и maxCount;
конфигурация сообщения может переопределить duration/pauseOnHover.
Невалидная duration использует default. MaxCount ограничивает активные сообщения
по FIFO, положительное конечное значение округляется вниз; без допустимого
значения ограничения нет. Уходящие сообщения остаются в DOM до конца анимации
и не занимают активные места. Hover сохраняет оставшееся время, уход указателя
возобновляет отсчёт. На touch hover-пауза не включается.

Key — string или number; 0 и пустая строка являются допустимыми ключами.
Повтор активного ключа обновляет содержимое на том же месте, перезапускает
duration и заменяет onClose. Все handles этого активного сообщения ждут одно
завершение. Уходящий ключ можно открыть заново: это отдельное сообщение,
старый handle его не закроет. Destroy(key) закрывает ключ, destroy() — всю
очередь экземпляра. Другие экземпляры независимы.

Возвращаемый MessageHandle можно вызвать для закрытия или ожидать через await/
then. OnClose вызывается один раз при запросе закрытия, включая timer и FIFO;
handle завершается true после анимации и фактического удаления DOM. Уходящий
контент получает inert/aria-hidden. При reduced motion уход завершается сразу,
включение этого режима завершает уже запущенную анимацию. Ошибка onClose не
мешает закрытию остальных сообщений destroy(), после обработки она передаётся
вызывающему коду.

До первого монтирования сообщения можно поставить в очередь: SSR выводит
скрытую поверхность без таймеров и callbacks. Отсчёт начинается после показа.
Удаление holder или замена его message отменяет таймеры/анимации, очищает очередь
без onClose и завершает ожидающие handles false. Поздние вызовы такого экземпляра
возвращают false без постановки в очередь; повторное монтирование разрешает
новые сообщения. Для последовательных действий проверяйте результат await,
чтобы не продолжать сценарий после удаления holder.

Holder наследует тему, compact и направление ближайшего ConfigProvider.
`rtl` явно переопределяет направление. Настройки поверхности можно задать
в `createMessage` либо отдельными props `MessageHolder`, у которых приоритет.
При использовании App те же настройки задаются через `App.message`.
`MessageHolder.prefixCls` меняет namespace списка и всех сообщений; пустая строка
наследует ConfigProvider.prefixCls.
Canonical tokens и native popover/viewport/motion не зависят от публичных классов;
private Notification metrics используют общий namespace отдельно от local prefix.
[Raw замеры](../../../tests/browser/fixtures/ant-design-message-prefix-reference.json)
фиксируют исходную потерю status-классов у уже показанной иконки при смене prefix.
Отдельный public same-key refresh counterpart возвращает цвет. Native обновляет
классы без повторного открытия, сохраняя очередь, handles, deadlines и внешний фокус.

`theme.components.Message` настраивает zIndexPopup, contentBg и contentPadding,
aliases и component algorithms. Отступ по умолчанию вычисляется без округления.
Style сообщения и Holder сохраняют приоритет; локальные component variables
другого cssVar prefix разрешаются на самом сообщении. Обновления меняют отдельные
CSS declarations, сохраняя native viewport styles, очередь, handles и deadline
таймеров. В теме Ant Design контейнер иконки повторяет исходную высоту строки;
legacy-оформление сохраняется. [Проверки и исходные замеры](../theme-context.md#проверки-диалогов-и-уведомлений).

Прежние min-width:0/overflow-wrap:anywhere у title сохранены. В официальной
6.6.8 длинное неразрывное слово дало scrollWidth 3871px при карточке 1352px;
это [отдельное наблюдение upstream](../../../tests/browser/fixtures/ant-design-message-wrap-observation.json).
Raw CSS эталона не изменены; browser-сравнение явно учитывает только это отличие переноса.

Нативный manual popover показывает список по центру сверху. Свежие сообщения
располагаются выше остальных.
Top по умолчанию 8px: число задаёт px, строка — CSS-длину. Id/class/style
относятся к поверхности списка. Фокус и клавиши Tab/Escape остаются у страницы;
сообщение использует role=status, aria-atomic=true и декоративную иконку.
Для срочного объявления можно явно задать role=alert. ConfigProvider.disabled
не отключает обратную связь.

Внутри Modal/Drawer размещайте holder в содержимом нужного dialog. При закрытом,
скрытом или перекрытом другим модальным окном контексте поверхность скрыта,
таймеры приостановлены; после возврата продолжается оставшееся время.
При скрытии вкладки отсчёт также приостанавливается.
Фоновые holders также ждут закрытия верхнего dialog. Отдельный holder нужен
для сообщений другого контекста.

## Размещение и стек

`getContainer` переносит поверхность в заданный DOM-узел. Getter вызывается
в браузере без аргументов. При пустом результате учитывается
`ConfigProvider.getPopupContainer`, затем `document.body`. Когда оба getter
отсутствуют, поверхность остаётся в DOM-контексте holder. Смена целевого узла
пересоздаёт поверхность и сохраняет очередь, handles, сроки и фокус за её пределами.

`stack: true` сворачивает список, когда активных сообщений больше трёх.
`stack: { threshold: 2 }` задаёт свой порог. В свёрнутом стеке видна самая
свежая карточка. Наведение мышью раскрывает список и приостанавливает отсчёт
у записей с `pauseOnHover`. При уходе указателя продолжается оставшееся время.

`transitionName` задаёт имя CSS-фаз `appear`, `enter` и `leave` у holder.
Пустая строка отключает движение. Без настройки используется штатная анимация.
Учитываются токен `motion` и системная настройка reduced motion.

## Семантическое оформление

`classNames` и `styles` принимают объект слотов либо функцию с аргументом
`{ props }`. Стили задаются строками inline CSS. `list` и `listContent`
оформляют список, а `root`, `wrapper`, `icon` и `title` относятся к записи.
Настройки списка можно задать в `ConfigProvider.message`, при создании очереди
или в `MessageHolder`. Оформление отдельной записи также можно передать в
`open` или типизированный метод.

Классы складываются. Стили применяются в порядке от `ConfigProvider.message`
через настройки holder к записи. Явный `style` записи применяется последним.
Для списка учитываются настройки поверхности, для записи функция получает
поля `createMessage` и текущей записи.

## Сверка с Ant Design 6.6.8

`createMessage` с `MessageHolder` соответствует контекстному `message.useMessage`.
В закреплённой документации Ant Design глобальные методы `message` обозначены
как deprecated. Контекстный API доступен также через `App.useApp().message`.
[Исходный справочник](https://github.com/ant-design/ant-design/blob/984592267de88fbf9cdaecc96a56629e721c709d/components/message/index.en-US.md#examples)

Эталон использует `role="alert"`, нейтральный вид по умолчанию у `open` и
приоритет полей объекта в типизированных вызовах. Svelte сохраняет
`role="status"`, тип `info` и приоритет позиционных параметров. В двух прогонах
исходной сборки удаление по ключу, вызов handle и вытеснение по FIFO убирали
сообщения без `onClose` и завершения `then`. При автозакрытии наблюдались оба
события. Svelte сохраняет завершение handle и `onClose` для программного закрытия.
[Исходные замеры](../../../tests/browser/fixtures/ant-design-message-api-reference.json) ·
[Браузерная проверка](../../../tests/browser/message-api.spec.ts) ·
[Проверка SSR и типов](../../../tests/package/message/message-api.ssr.test.ts)
