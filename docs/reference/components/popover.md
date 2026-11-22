# Popover

```svelte
<script lang="ts">
  import { Button, Popover } from '@woodger/antd-svelte';

  let open = $state(false);
</script>

{#snippet content()}
  <p>Настройки сохранены.</p>
  <Button onclick={() => { open = false; }}>Закрыть</Button>
{/snippet}

<Popover title="Настройки" {content} trigger="click" bind:open>
  <Button>Открыть настройки</Button>
</Popover>
```

Title и content принимают строку, число или Svelte snippet; число 0 отображается,
строки экранируются. False не создаёт секцию; true создаёт пустую секцию без текста,
как исходный isReactRenderable. Children — snippet с одним основным DOM-элементом, например
Button или нативной кнопкой. Он служит anchor и получает aria-haspopup=dialog,
aria-controls и aria-expanded. Для клавиатурного доступа используйте фокусируемый
элемент. Карточка получает role=dialog и имя от title; при отсутствии заголовка
задайте aria-label. Она сохраняет немодальное поведение.

`bind:open`, defaultOpen и `onOpenChange(open)` следуют модели Svelte, как у
Tooltip. DefaultOpen учитывается один раз; внешнее изменение open и начальное
состояние не вызывают callback. Обработчики дочернего элемента сохраняются;
без явных showAction/hideAction preventDefault в его onclick отменяет открытие по клику.

Trigger без component config по умолчанию `['hover', 'focus']`. Поддерживаются
click, hover, focus, contextMenu, их массив и пустой массив для программного показа. MouseEnterDelay и
mouseLeaveDelay задаются в секундах, по умолчанию 0.1; фокус открывает карточку
сразу. Touch не имитирует hover. В прежнем native режиме (hover/focus/click без
component config) наведение на карточку и фокус внутри неё
сохраняют видимость. При сочетании hover/focus с click первый клик закрепляет
открытую карточку, второй закрывает её.

В этом режиме открытие кликом, Enter или Space переводит фокус на первый доступный
control в содержимом; для текстовой карточки фокусируется сама поверхность. Открытие
наведением, фокусом или внешним open сохраняет текущий фокус. Tab/Shift+Tab
следуют DOM-порядку между trigger, содержимым и соседними controls. В native режиме
выход фокуса за пределы карточки и trigger закрывает её, если нет активного наведения.
Escape закрывает карточку и возвращает фокус из содержимого к trigger;
нажатие снаружи сохраняет фокус на выбранном внешнем элементе. Закрытие через
bind:open возвращает фокус, если он находился внутри карточки.
Function binding может отклонить изменение open; отклонённое закрытие сохраняет
фокус и текущие способы удержания карточки открытой.
При новой component config или contextMenu открытие кликом сохраняет текущий
фокус, как upstream; сочетания trigger следуют правилам source config выше.

`showAction`/`hideAction` независимо заменяют события trigger; focusDelay/blurDelay
задаются в секундах с default 0 независимо от hover delays, как у
[Tooltip](tooltip.md#tooltip). Пустой hideAction отключает trigger/outside-закрытие,
сохраняя Escape и действия содержимого. Явные списки используют source click,
contextMenu и touch fallback: click не переводит фокус в popup и не блокируется
preventDefault дочернего handler. Фокус внутри панели не отменяет отложенное
закрытие, а blur trigger следует hideAction также при переходе в содержимое.
Прежнее native удержание и перевод фокуса без overrides сохраняются.
Blur без relatedTarget ждёт microtask для проверки connected/cleanup;
возврат фокуса перед скрытием/удалением содержимого остаётся native адаптацией.
Изменение и удаление action props не отменяет уже запущенную задержку;
uncontrolled open сохраняется при обновлении spread props.

`Popover.disabled` скрывает панель/open class, сохраняя raw open, callbacks
и ожидающие события. Изменение самого disabled не вызывает onOpenChange;
повторное включение может показать уже открытую панель.
Сверка: [67 UMD-сценариев / 389 кадров и шесть cleanup traces](../../../tests/browser/fixtures/ant-design-popover-actions-reference.json),
[SSR](../../../tests/package/popover-actions.ssr.test.ts) и
[browser](../../../tests/browser/popover-actions.spec.ts), `?fixture=popover-actions`.
Эталоны включают Popconfirm и передачу настроек через AvatarGroup.max.popover.
Controlled-сценарии используют getter/setter binding с отклонением записи;
обычный open продолжает следовать модели Svelte.

Placement принимает те же 12 направлений, что Tooltip; arrow=false скрывает стрелку.
AutoAdjustOverflow по умолчанию переворачивает и сдвигает поверхность у края
viewport; false сохраняет запрошенное положение. Позиция обновляется при
прокрутке, resize, перемещении anchor и изменении размеров содержимого.
Смена положения сохраняет текущий ввод, выделение и фокус. Class и style
относятся к wrapper. Поддерживаются темы ConfigProvider, compact, RTL и
prefers-reduced-motion.
PopupClass относится к самой поверхности. Aria-labelledby, aria-describedby
и aria-busy позволяют связать её с содержимым составного компонента;
aria-label имеет приоритет при выборе имени.

`align`, `builtinPlacements` и `onPopupAlign` следуют правилам [Tooltip](tooltip.md#tooltip):
align перекрывает выбранную запись, карта заменяется целиком, включая {},
класс placement выбирается по первому совпадению points. Callback получает
реальную поверхность Popover и итоговый align до применения новых координат.
Semantic root/arrow styles сохраняют приоритет. Эти настройки включают исходную
геометрию также без component config и передаются через Popconfirm и
AvatarGroup.max.popover; прежние defaults без новых props сохраняются.

Сверка: [84 UMD-сценария](../../../tests/browser/fixtures/ant-design-popover-align-reference.json),
[SSR](../../../tests/package/popover-align.ssr.test.ts) и
[browser](../../../tests/browser/popover-align.spec.ts), `?fixture=popover-align`.
В 6.6.8/rc-trigger 3.10.1 изменение align или существующей записи placements
само по себе оставляет прежнюю геометрию до forceAlign либо другого события
выравнивания; состояния до/после forceAlign записаны в эталоне для отдельного
разбора. Svelte сохраняет автоматическое отслеживание новых props, draft,
выделение и фокус. Fixed/top-layer, viewport и CSS-transform/scroll-container
границы остаются теми же, что у Tooltip.

`bind:ref` возвращает общий PopoverRef для Popover и Popconfirm после mount;
при SSR и после unmount binding равен undefined. Стабильный объект содержит
getters nativeElement (основной trigger, включая SVG) и popupElement (наружный div).
Они отслеживают замену trigger и перенос popup в другой контейнер.
ForceAlign пересчитывает открытый popup без ожидания animation frame; несколько
синхронных вызовов объединяются в microtask. Он не открывает скрытую карточку,
не меняет open/confirm callbacks и не создаёт зависимостей в пользовательском
$effect. Сохранённый handle после unmount безопасен: forceAlign ничего не делает,
DOM getters возвращают undefined.

Native div shell существует также до первого открытия и при destroyOnHidden;
ref возвращает этот же узел, а удаление относится к содержимому. В React ref
до первого открытия не содержит popup, после destroy может ссылаться на удалённый
div; существующий Svelte lifecycle сохраняется. Nullable DOM types отражают
эти состояния и поддерживают SVG без приведения к HTMLElement.
Сверка: [восемь UMD-сценариев](../../../tests/browser/fixtures/ant-design-popover-ref-reference.json),
[SSR](../../../tests/package/popover-ref.ssr.test.ts) и
[browser](../../../tests/browser/popover-ref.spec.ts), `?fixture=popover-ref`.
Bind:ref задаётся непосредственно компоненту; max.popover остаётся объектом PopoverProps.

`id` задаёт ID native dialog; пустая строка использует стабильный generated ID.
Скрытый ID обновляется вместе с кэшем содержимого. Aria-controls trigger меняется
без потери caller IDREF tokens, включая совпадение нового ID с существующим token.
`zIndex`, включая 0 и отрицательные числа, задаёт явный слой перед semantic root styles; общий source zIndex context и порядок native top layer
этот prop не заменяет.

`forceRender=true` прогревает скрытое содержимое и portal после mount/hydration,
также при disabled и destroyOnHidden. Выключение forceRender у закрытой панели
с destroyOnHidden удаляет содержимое; новый force mount получает текущие props.
`fresh=false` сохраняет скрытые title/content, container/title/content class/style
и ID до открытия; root/arrow styles обновляются сразу. Fresh=true обновляет
скрытый payload. В Popconfirm кэшируются также icon и props кнопок; loading,
disabled guards и локализация остаются текущими. Внутреннее состояние виджета
сохраняется до его удаления, а opaque Snippet captures остаются реактивными по
правилам Svelte: полная заморозка React.memo здесь не обещается.
Сверка: [50 UMD-сценария / 399 кадров](../../../tests/browser/fixtures/ant-design-popover-lifecycle-reference.json),
[SSR](../../../tests/package/popover-lifecycle.ssr.test.ts) и
[browser](../../../tests/browser/popover-lifecycle.spec.ts), `?fixture=popover-lifecycle`.

Source-тема подготавливает Tooltip и Popover tokens в исходном порядке:
maxWidth и стрелку внутреннего Tooltip, затем собственные titleMinWidth,
zIndexPopup, padding и wireframe-разделение заголовка/содержимого. Deprecated
width/minWidth сохраняют исходный приоритет перед titleMinWidth по умолчанию.
Обновление темы сохраняет позицию панели, введённый текст и фокус.

Popover использует нативный `popover="manual"` и требует Popover API.
Без container getter поверхность остаётся в исходном DOM-поддереве и верхнем слое:
overflow контейнера не обрезает её, темы и работа внутри Modal сохраняются.
Вложенный Tooltip обрабатывает Escape первым; затем закрывается Popover,
следующим Escape — Modal. Существующий aria-describedby trigger сохраняется.
Aria-controls объединяется с имеющимися ID; при отключении карточки её ID
удаляется, а aria-haspopup/aria-expanded восстанавливаются с учётом изменений
владельца. Позиционирование и связь с trigger подключаются после гидратации;
в SSR поверхность скрыта.

GetPopupContainer выбирает контейнер по тем же
правилам, что Tooltip; локальный undefined сохраняет provider fallback.
Getter не вызывается до первого открытия или forceRender и при SSR. Обновление контейнера
и темы сохраняет native popup lifecycle; неизменный контейнер не перемещает DOM.

Пустые title и content отключают показ и ARIA-связь. Если один из них является
snippet, компонент считает содержимое доступным; условное отсутствие текста
внутри snippet контролирует его владелец. Закрытое содержимое остаётся
смонтированным и сохраняет состояние. Без forceRender destroyOnHidden=true удаляет title/content
при закрытии и создаёт их заново при открытии; при SSR такие snippets не вызываются,
включая начальный open/defaultOpen.
Фокус возвращается к trigger перед удалением содержимого. Отложенные открытия отменяются при
удалении компонента, очистке содержимого и замене trigger.

Галерея `/ant-design#popover` содержит редактор профиля и информационную
карточку с кнопкой. Arrow и autoAdjustOverflow принимают те же object настройки,
что Tooltip; они передаются также через Popconfirm и AvatarGroup.max.popover.
ContextMenu и color поддержаны по общим правилам Tooltip выше.

