# Popconfirm

GetPopupContainer передаётся Popover с теми же приоритетами.
Контекст темы и Promise действия сохраняются при переносе popup в контейнер.
Trigger и hover delays наследуются из ConfigProvider.popconfirm; локальные props
имеют приоритет. Без настройки trigger остаётся click.
ShowAction/hideAction и focusDelay/blurDelay передаются Popover с теми же
приоритетами и native границами, описанными выше. Пустой hideAction не отключает
кнопки подтверждения/отмены. Защита ожидающего Promise и прежний disabled contract
сохраняются; Popover.disabled и Popconfirm.disabled имеют собственные правила.
Align/builtinPlacements/onPopupAlign также передаются наружному Popover;
callback получает его DOM, перемещение не заменяет description и кнопки.
Bind:ref передаётся тому же Popover и использует общий PopoverRef; forceAlign
не прерывает ожидающее подтверждение и сохраняет припаркованный фокус.
Id/forceRender/fresh/zIndex передаются также. Смена ID/слоя сохраняет ожидающий
Promise, текущее содержимое и припаркованный фокус; его результат по-прежнему
подчиняется controlled owner и защите от устаревших запросов.
DestroyOnHidden передаётся Popover, включая явный false. При удалении содержимого заново
создаются description snippet и кнопки; сам контроллер подтверждения сохраняет
защиту от результата прежнего Promise после закрытия или повторного открытия.
При включённом удалении SSR-содержимое остаётся ленивым даже при начальном open/defaultOpen;
native shell, focus и ARIA следуют прежним правилам Popover.

```svelte
<script lang="ts">
  import { Button, Popconfirm } from '@woodger/antd-svelte';

  let open = $state(false);

  async function remove() {
    // Здесь владелец выполняет запрос и обновляет данные после успеха.
  }
</script>

<Popconfirm
  title="Удалить запись?"
  description="Запись исчезнет из списка."
  bind:open
  okText="Удалить"
  okButtonProps={{ danger: true }}
  onConfirm={remove}
>
  <Button danger>Удалить</Button>
</Popconfirm>
```

Title обязателен; title и description принимают строку, число или Svelte
snippet. Число 0 отображается, строки экранируются. Пустая строка title отключает
карточку; snippet должен содержать доступный заголовок. Icon — декоративный snippet;
по умолчанию показан знак предупреждения,
icon=null скрывает его. Children содержит один основной DOM-элемент, обычно
Button. Его атрибуты и обработчики сохраняются.

Popover обеспечивает открытие кликом, Enter/Space нативной кнопки, 12
положений Tooltip, arrow и autoAdjustOverflow. В содержимом
сначала находится отмена, затем подтверждение; showCancel=false скрывает
отмену. При открытии фокусируется первый доступный control, для обычного
описания — кнопка отмены. Tab следует естественному порядку, Escape закрывает
карточку и возвращает фокус. Поддерживаются Modal, вложенный Tooltip, темы,
compact, RTL и prefers-reduced-motion. Требуется нативный Popover API.

При source-настройках ConfigProvider aliases применяются в порядке
Tooltip → Popover → Popconfirm; Popconfirm подготавливает собственный zIndexPopup.
Вложенный самостоятельный Popover использует свои tokens без aliases Popconfirm.
Смена темы не прерывает ожидающее подтверждение.

`bind:open`, defaultOpen и `onOpenChange(open)` следуют модели Svelte.
DefaultOpen учитывается один раз; внешние изменения open не вызывают
onOpenChange. `onConfirm(event)` вызывается только кнопкой подтверждения.
Синхронное завершение и успешный Promise закрывают карточку; без onConfirm
подтверждение просто закрывает её. `onCancel(event)` вызывается только кнопкой
отмены. Escape, клик снаружи и повторный клик trigger меняют видимость через
onOpenChange и не вызывают onCancel.

Во время Promise подтверждение показывает loading, обе кнопки отключены;
повторный запуск, Escape, клик снаружи, повторный клик trigger и уход фокуса
не закрывают карточку. Внешнее open остаётся под контролем владельца.
Закрытие, повторное открытие, disabled и удаление компонента делают старый
результат неактуальным: он не закрывает новую карточку, не сбрасывает её
loading и не вызывает onError. Эта защита относится к состоянию Popconfirm;
отменой запроса и изменениями данных управляет владелец onConfirm.

Синхронный throw и отклонение Promise оставляют карточку открытой и показывают
безопасное сообщение с role=alert. `onError(error)` получает исходную ошибку
как unknown; её технический текст автоматически не выводится. Повторная
попытка очищает сообщение. Кнопки используют okText/cancelText или
locale.okText/cancelText; сообщение ошибки задаётся locale.confirmErrorText.
Поддерживаются ruRU и enUS, а частичная locale наследуется из ConfigProvider.

OkType задаёт тип подтверждения; okButtonProps/cancelButtonProps настраивают
размер, danger, disabled, атрибуты и события кнопок. Их onclick вызывается перед
внутренним действием: preventDefault отменяет подтверждение или отмену.
HtmlType всегда button, loading управляется Popconfirm. Disabled наследуется
из Form и ConfigProvider; disabled=false переопределяет наследование.
Disabled скрывает карточку и блокирует её действия, сохраняя open владельца;
исходный trigger не заменяется и сам по себе не отключается этим prop.

Карточка получает role=dialog, имя от title и описание от description.
Trigger сохраняет существующий aria-describedby и связан с карточкой через
aria-controls/aria-expanded. Во время ожидания выставляется aria-busy;
фокус из отключаемых кнопок сохраняется на содержимом. Class/style относятся
к wrapper trigger, как у Popover. Содержимое закрытой карточки остаётся
смонтированным, состояние ошибки сбрасывается для нового открытия.

Галерея `/ant-design#popconfirm` показывает удаление строки Table с задержкой,
отменой, ошибкой и повтором. После удаления trigger фокус переходит к кнопке
восстановления записей. Пример освобождает ожидающие таймеры при удалении.
Поддерживаются открытие по клику и все 12 направлений Tooltip;
hover/focus/contextMenu и независимые action props доступны также через Popconfirm.

