# Drawer

```svelte
<script lang="ts">
  import { Button, Drawer, Input } from '@woodger/antd';

  let open = $state(false);
</script>

{#snippet footer()}<Button onclick={() => { open = false; }}>Закрыть</Button>{/snippet}

<Button onclick={() => { open = true; }}>Редактировать</Button>
<Drawer bind:open title="Карточка участника" {footer}>
  <label>Имя<Input defaultValue="Анна" /></label>
</Drawer>
```

Drawer использует нативный dialog. `bind:open` передаёт запрос
видимости владельцу; без binding компонент может закрываться самостоятельно.
Начальное `open={true}` подготавливает содержимое в SSR и открывает dialog
после гидратации. Серверный dialog остаётся закрытым до подключения браузера.

`title`, `extra` и `footer` принимают текст, число, snippet или массив
содержимого. Ноль отображается как текст. Пустая строка, `false`, `null`
и `undefined` скрывают область. `true` и пустой массив оставляют пустую
область, как в Ant Design. `children` передаётся через snippet.
Заголовок использует `h2`. Интерактивные действия размещайте в `extra` и `footer`.

Без заголовка именуйте диалог через `aria-label` или `aria-labelledby`.
Внешний `aria-labelledby` имеет приоритет. `aria-label` заменяет автоматически
созданную связь с визуальным заголовком. `id`, `role`, `aria-*`, `class` и
`style` относятся к нативному `dialog`. Атрибуты `data-*` относятся к
выдвижной оболочке `*-content-wrapper`. Для маски `maskClassName` дополняет
`classNames.mask`.

PrefixCls задаёт локальный namespace Drawer, его mask/panel/header/body/footer.
Пустая строка наследует ConfigProvider.prefixCls. 32 исходных CSS-правила без
motion/pure/inline/resizable/skeleton изолированы по корню; canonical variables
и приватные native dialog/size markers сохраняются. Button в extra/footer
использует собственный общий prefix. Смена namespace сохраняет открытый dialog,
panel/input DOM, draft/focus/selection, IDs, scroll lock и возврат фокуса.
Внутренние motion/backdrop механизмы используют атрибуты, не BEM-классы.

Placement — физическая сторона top/right/bottom/left, по умолчанию right.
RTL меняет направление содержимого, сохраняя выбранную сторону. Size задаёт
ширину для left/right и высоту для top/bottom: default=378px, large=736px,
положительное число в px или корректную CSS-длину, например 50% или 30rem.
Размер ограничен viewport; пустая строка и неположительное/нефинитное число
используют default. Header и footer остаются на месте, длинное body прокручивается.

`resizable` показывает границу для изменения размера на свободном крае панели.
Жест меняет ширину у left/right и высоту у
top/bottom. Начальный `defaultSize` применяется, пока владелец не передал
`size` и пользователь ещё не изменил размер. `maxSize` ограничивает
предлагаемое значение сверху, а минимальное значение при перетаскивании
равно нулю. Размер в процентах измеряется в момент начала жеста.

При переданном `size` владелец принимает новое значение через
`resizable.onResize(size)`. `onResizeStart(size)` получает начальный размер
в пикселях, `onResizeEnd(size)` измеряет результат. После закрытия запомненный
размер сохраняется до удаления содержимого. Закрытие, отключение resize и
смена стороны отменяют текущий жест.

`closable` управляет кнопкой закрытия. Значение `false` скрывает кнопку.
Объект принимает `placement: 'start' | 'end'`, `disabled`, `closeIcon`
и ARIA-атрибуты. По умолчанию кнопка находится перед заголовком.
`placement: 'end'` ставит её после `extra` с учётом RTL. Локальный
`closable` определяет положение целиком. Иконка, `disabled` и ARIA-атрибуты
могут наследоваться по отдельности. Кнопка по умолчанию получает имя из locale.

Иконку можно задать строкой, числом или snippet. Верхнеуровневый
`closeIcon={false}` или `closeIcon={null}` скрывает кнопку при опущенном
`closable`. В объекте `closable` значение `closeIcon: false` оставляет
кнопку без иконки, а `closeIcon: null` убирает кнопку и сохраняет область
заголовка.

`keyboard={false}` отключает закрытие верхней панели по Escape.
`mask` принимает boolean или объект с `enabled`,
`closable` и `blur`. По умолчанию маска включена, закрывается по нажатию
и отображается без размытия. Для закрытия указатель должен начать и закончить
нажатие на фоне. При `mask={false}` или `mask={{ enabled: false }}` доступны
клики и прокрутка страницы. Drawer продолжает передавать детям исходные
контексты Form и ConfigProvider.

`ConfigProvider.drawer` задаёт `mask`, `focusable`, `closable`, `closeIcon`
и оформление. Локальные поля имеют приоритет. Boolean `mask`
переопределяет только `enabled`, поэтому
`mask={true}` сохраняет заданные провайдером `blur` и `closable`.
Явный объект `drawer` во вложенном провайдере заменяет родительский объект.

`zIndex` задаёт слой панели и базу для вложенных диалогов и popup.
Явный 0 применяется к Drawer.
[Уровни вложенных панелей](../theme-context.md#уровни-вложенных-панелей)

Пользовательское закрытие сначала записывает open=false в binding, затем
вызывает onClose(Event) один раз: click для кнопки, cancel для Escape,
pointerup для фона. Callback уведомляет о запросе и не отменяет его.
Изменение open владельцем, нативный dialog.close() и удаление компонента
не вызывают onClose. Нативное закрытие синхронизирует binding; позднее событие
старого закрытия не закрывает заново открытый dialog.

Секция вызывает `onclick`, `onmouseenter`, `onmouseover`, `onmouseleave`,
`onkeydown`, `onkeyup` и `onfocusin`. `event.currentTarget` указывает на
секцию из `bind:panelRef`. События следуют DOM-вложенности, в том числе при
переносе секции через `getContainer`. Клик по кнопке закрытия сначала вызывает
`onClose`, затем доходит до `onclick` секции. Маска вызывает `onClose` своим
событием. `preventDefault()` в `onkeydown` отменяет закрытие по Escape.
[Эталон событий и атрибутов](../../../tests/browser/fixtures/ant-design-drawer-dom-reference.json)
· [Chromium](../../../tests/browser/drawer-dom.spec.ts)
· [SSR](../../../tests/package/drawer-dom.ssr.test.ts)
· [Гидратация](../../../tests/browser/drawer-dom-hydration.spec.ts)

По умолчанию Drawer с маской открывается через `showModal()`. Браузер
фокусирует первый доступный control или сам dialog, включает inert для
фона и удерживает фокус. После закрытия фокус возвращается к opener.
`focusable.trap` управляет удержанием фокуса независимо от маски.
`focusable.focusTriggerAfterClose={false}` отключает возврат.
`autoFocus={false}` сохраняет текущий фокус при свободном перемещении.
При включённом trap фокус остаётся внутри панели.
При отсутствии явного `aria-modal` атрибут применяется при включённых маске и trap.
Select, Tooltip и Popover обрабатывают свой Escape раньше Drawer.
Поддерживается стек с Modal
и другими модальными Drawer. Вложенная панель смещает родительскую внутрь
окна на 180 px по умолчанию. `push={false}` отключает смещение, а
`push={{ distance: 56 }}` задаёт своё в пикселях. Явное `push={true}`
наследует расстояние от родителя. Смещение остаётся, пока открыта хотя бы
одна вложенная панель. Нативный модальный Drawer блокирует прокрутку страницы,
в том числе в ShadowRoot. Управляемый Drawer с маской блокирует страницу
при стандартном портале или явном контейнере `document.body`.

Содержимое ленивое и после первого открытия сохраняет локальный state и
DOM-черновики в закрытом dialog. ForceRender монтирует его сразу и сохраняет
даже при destroyOnHidden. DestroyOnHidden удаляет header/body/footer после
завершения ухода панели; отключение настройки не монтирует уничтоженное
содержимое заново. Удаление Drawer уничтожает его содержимое и освобождает
модальность. Состояние, хранимое снаружи, не сбрасывается.
Сохранённые скрытые поля остаются в DOM и нативной FormData своей формы;
их таймеры и подписки продолжают работать. Для фокуса ошибки закрытую панель
сначала должен открыть владелец формы.

## Содержимое и оформление

`loading` заменяет `children` анимированным Skeleton из пяти строк.
Заголовок, действия и подвал остаются на месте. При возвращении к содержимому
поля монтируются заново, поэтому локальный черновик сбрасывается.

`drawerRender` получает snippet секции и позволяет обернуть или заменить её.
Маска, выдвижная оболочка и граница resize остаются под управлением Drawer.
Если замена убирает заголовок, задайте имя диалога через `aria-label` или
`aria-labelledby`. `bind:panelRef` получает `HTMLDivElement` секции при
монтировании. При удалении секции binding получает `undefined`.

```svelte
{#snippet decorate(section)}
  <div class="drawer-frame">{@render section()}</div>
{/snippet}

<Drawer open drawerRender={decorate} title="Карточка участника">
  <p>Здесь находится содержимое панели.</p>
</Drawer>
```

`classNames` и `styles` принимают объект слотов или функцию с аргументом
`{ props }`. Для `root`, `mask`, `wrapper`, `section` и `dragger` функция
получает пропсы оболочки с разрешёнными настройками маски и фокуса.
Для `header`, `title`, `extra`, `body`, `footer` и `close` она получает
пропсы секции с `closable`, унаследованным при отсутствии локального значения.
`styles` принимает строки CSS.

Классы слотов провайдера и экземпляра накапливаются. `ConfigProvider.drawer.class`
добавляет класс секции, а его `style` применяется между стилями слота провайдера
и экземпляра. `rootClassName` дополняет класс dialog. `rootStyle` применяется
после `styles.root` и `style`.
[Эталон Ant Design 6.6.8](../../../tests/browser/fixtures/ant-design-drawer-panel-reference.json)
· [Chromium](../../../tests/browser/drawer-panel.spec.ts)
· [SSR](../../../tests/package/drawer-panel.ssr.test.ts)
· [Гидратация](../../../tests/browser/drawer-panel-hydration.spec.ts)

## Анимация и тема

Панель выдвигается от выбранной стороны, а включённая маска меняет прозрачность.
Явные `styles.wrapper` с `transform` и `styles.mask` с `opacity` действуют
и во время перехода. Вызов `afterOpenChange` сохраняет время завершения.
При запросе закрытия dialog сохраняет текущий режим до завершения анимации.
Изменение `mask` и `focusable` применяется к тому же открытому dialog.
Повторное открытие прерывает уход без уничтожения черновика. Reduced motion
отключает анимацию; изменение этой настройки завершает текущую анимацию.
`afterOpenChange(open)` вызывается после завершения показа или скрытия. При
`afterOpenChange(false)` окно уже закрыто, а его содержимое доступно до
следующего обновления Svelte. Прерванный уход не вызывает уведомление о
скрытии. После гидратации начального `open={true}` приходит одно уведомление
о завершении показа.

### Пользовательские переходы

`motion` принимает `DrawerMotionConfig` или функцию от `placement`.
`maskMotion` отдельно настраивает маску. Без этих настроек соответствующая
поверхность использует штатную анимацию, а пустой объект отключает её.
Строковый `motionName` задаёт базу CSS-классов, карта позволяет задать имена
для отдельных фаз. `motionAppear`, `motionEnter` и `motionLeave` разрешают
свою фазу. `motionLeaveImmediately` запускает leave заранее смонтированного
закрытого Drawer, который остаётся скрыт.

`on*Prepare` может вернуть Promise. Подготовка работает и при выключенном
CSS-переходе, если разрешена соответствующая фаза. `on*Start` и `on*Active`
получают `null` как второй аргумент и возвращают CSS-строку или объект свойств.
Обработчики панели получают секцию из `bind:panelRef`. Классы и стили перехода
применяются к её обёртке, а `styles.wrapper` имеют приоритет.
Обработчики маски получают саму маску, для её оформления действует `styles.mask`.

`on*End` получает `transitionend` или `animationend` от секции или маски.
Положительный `motionDeadline` задаёт срок в миллисекундах после начала активной
фазы и передаёт `{ deadline: true }`. Возврат `false` оставляет переход
активным до следующего события. Для перехода, который анимирует только
обёртку, срок задаётся через `motionDeadline`.

`afterOpenChange` следует завершению панели. Маска сообщает о своей видимости
через `maskMotion.onVisibleChanged` и может закончить позже, если содержимое
Drawer остаётся смонтированным. `maskMotion.forceRender` и
`removeOnLeave: false` внутри `maskMotion` позволяют оставить скрытую маску. Для
сохранённой после показа маски `leavedClassName` задаёт класс скрытого состояния.
Жизненный цикл всей панели задают `forceRender` и `destroyOnHidden` самого Drawer.
[Эталон переходов](../../../tests/browser/fixtures/ant-design-drawer-motion-api-reference.json)
· [Chromium](../../../tests/browser/drawer-motion-api.spec.ts)
· [SSR](../../../tests/package/drawer-motion-api.ssr.test.ts)
· [Гидратация](../../../tests/browser/drawer-motion-api-hydration.spec.ts)

### Тема

`theme.components.Drawer` настраивает zIndexPopup, footerPaddingBlock и
footerPaddingInline, aliases и component algorithms. Пользовательский style
корневого dialog сохраняет приоритет. Title наследует цвет панели, как 6.6.8;
Button и Input внутри сохраняют собственные tokens. Токен `draggerSize`
задаёт толщину границы для изменения размера.
Обновление темы и inherit reset сохраняют модальность, DOM, draft, selection
и focus, в том числе после переноса через getContainer. Оформление по умолчанию
сохраняется. [Сверка с UMD и проверки](../theme-context.md#проверки-диалогов-и-уведомлений)
учитывают типографику внешнего ConfigProvider: в React она задана на статическом
host через публичный theme.useToken(), в Svelte — на DOM-контейнере provider.

Размеры, смещение и события проверены по [100 кадрам Ant Design 6.6.8](../../../tests/browser/fixtures/ant-design-drawer-geometry-reference.json).
В UMD закрытие одного из двух открытых дочерних Drawer сбрасывает смещение
родителя. В Svelte каждая открытая панель удерживает свою регистрацию.
Маска, фокус, прокрутка и Escape сверены по
[118 состояниям React UMD](../../../tests/browser/fixtures/ant-design-drawer-focus-reference.json).
UMD выставляет `aria-modal="true"` также без маски. В Svelte этот атрибут
отражает фактические настройки взаимодействия.

GetContainer поддерживает те же DOM-узлы, DocumentFragment, selectors, функции и
false, что [Modal](modal.md#modal). Undefined наследует ConfigProvider.getPopupContainer;
Drawer передаёт ему document.body, как Ant wrapper. Getter вызывается и в закрытом
состоянии, кроме destroyOnHidden без forceRender, пока содержимое не требуется.
Смена контейнера пересоздаёт панель и отменяет прежнюю анимацию. Замена функции
с тем же контейнером сохраняет DOM, состояния и фокус. Для управляемого
режима стандартный портал перемещает тот же dialog в ближайший диалог или
в `body`. Явный `getContainer={false}` удерживает такую панель в исходном
контейнере с absolute-размещением. Прежние настройки модального inline
Drawer сохраняют fullscreen-геометрию и нативный focus barrier.
Эталон — @rc-component/drawer 1.4.2 и portal 2.1.3;
[LICENSE.rc-drawer](../../../src/lib/vendor/LICENSE.rc-drawer) сохранена в пакете.
