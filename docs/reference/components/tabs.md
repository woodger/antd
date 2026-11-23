# Tabs

```svelte
<script lang="ts">
  import { Input, Tabs } from '@woodger/antd';

  let activeKey = $state<string | undefined>('profile');
</script>

{#snippet profile()}
  <label>Имя<Input defaultValue="Анна" /></label>
{/snippet}
{#snippet history()}<p>Последние изменения профиля.</p>{/snippet}

<Tabs
  aria-label="Разделы участника"
  bind:activeKey
  items={[
    { key: 'profile', label: 'Профиль', children: profile },
    { key: 'access', label: 'Доступ', disabled: true },
    { key: 'history', label: 'История', children: history }
  ]}
/>
```

`items` принимает readonly-массив TabsItem: строковый key, label (строку, число,
boolean/null или пассивный Snippet), необязательные children (Snippet), icon, disabled,
forceRender, destroyOnHidden, closable и closeIcon. Ключи идентифицируют панели при перестановке;
содержимое и его фокус сохраняются.
Пустой строковый ключ допустим; при повторении используется первое вхождение.
Icon декоративный. Label должен давать вкладке доступное имя; интерактивные
элементы внутри label не поддерживаются. `aria-label` или `aria-labelledby`
именует список вкладок. Id/class/style относятся к корневому контейнеру.

`items[].className` и `items[].style` относятся к соответствующему tabpanel,
а не к заголовку. Классы добавляются после classNames.content. CSS-строки применяются
в порядке styles.content → item.style → motion style; у каждой панели свои overrides.
Например: `{ key: 'profile', label: 'Профиль', children: profile, className: 'profile-panel', style: 'padding-inline:12px' }`.
Живое обновление оформления сохраняет DOM, local state, draft, selection и focus.

`bind:activeKey` хранит выбранный ключ. DefaultActiveKey читается при создании;
без ключа выбирается первая доступная вкладка. Для binding задавайте начальное
значение у владельца без defaultActiveKey. При неизвестном, удалённом или
отключённом ключе отображается первая доступная панель. Внешнее значение при
этом сохраняется: его восстановление снова выберет соответствующую вкладку.
Если доступных вкладок нет, ни одна панель не выбрана, а фокус может получить
сам tablist. Пустой items показывает ConfigProvider.locale.emptyText.

`onTabClick(key, MouseEvent)` вызывается и по клику, и при нативной активации
Enter/Space, включая уже выбранную вкладку. PreventDefault отменяет смену
панели. Затем обновляется binding и вызывается onChange(key), если выбранная
вкладка действительно изменилась. Обновления владельцем, изменение defaults,
fallback при удалении/disabled и перемещение фокуса не вызывают onChange.
После onTabClick доступность пункта проверяется повторно: обработчик может
удалить или отключить вкладку.

Клавиатура использует ручную активацию. Стрелки перемещают фокус по кругу,
пропуская disabled; Home/End выбирают первый/последний доступный заголовок.
В горизонтальном списке действуют Left/Right с учётом RTL, в вертикальном —
Up/Down. Enter и Space активируют сфокусированную вкладку. Заголовки добавляют
одну остановку Tab; после выхода повторный вход возвращает фокус к выбранной
вкладке. В line/card Tab из списка переходит к именованной активной панели, затем к её
полям и кнопкам. При скрытии сфокусированной панели или удалении/disabled
сфокусированного заголовка фокус переходит на доступный заголовок либо tablist.
Изменения при фокусе снаружи Tabs не перемещают его внутрь.

Содержимое ленивое: впервые монтируется при активации и по умолчанию сохраняется
в скрытой панели, включая локальный state дочерних компонентов и DOM-черновики.
DestroyOnHidden=true удаляет содержимое при скрытии, а при анимации панели — после
завершения leave; следующий визит создаёт
новый экземпляр. После уничтожения отключение destroyOnHidden само по себе
не монтирует панель заново. Значение на отдельном item переопределяет общее,
включая явное false. Это сохранённый контракт native v1: rc-tabs 1.13.0 отдаёт
приоритет явно заданному общему destroyOnHidden. ForceRender=true монтирует содержимое сразу и сохраняет
его даже вместе с destroyOnHidden. Удаление key всегда уничтожает панель.
Состояние, которое владелец хранит снаружи Tabs, уничтожение панели не сбрасывает.

Фикстура `?fixture=tabs-destroy` сопоставляет восемь актуальных сценариев официального
UMD: шесть совпадают с upstream, два фиксируют сохранённый приоритет item.

Сохранённая скрытая панель остаётся в DOM; её таймеры и подписки продолжают
работать. Поля посещённых/forceRender-панелей участвуют в нативной FormData,
даже когда скрыты; ещё не смонтированных или уничтоженных полей в FormData нет.
Tabs не является полем формы и не наследует disabled от Form/ConfigProvider:
доступность навигации задаётся disabled отдельных items. Заголовки используют
button type=button и не отправляют окружающую форму.

Type поддерживает line/card/editable-card, tabPlacement — top, bottom, start, end.
Start/end разрешаются относительно RTL. На экране шириной до 575px вертикальный
список переходит наверх. Переполнение прокручивается; навигация показывает
сфокусированный заголовок без прокрутки всей страницы. Size использует общий
ComponentSize: small/medium/large;
по умолчанию используется ConfigProvider.componentSize. Явный medium имеет
приоритет над размером провайдера.
Тема, compact, RTL и reduced motion применяются через существующие токены.

Source-тема применяет `theme.components.Tabs`: 26 исходных defaults, aliases и
component algorithms. Высоты карточек участвуют в вычислении padding до наложения
явных overrides; zero и undefined сохраняют исходное поведение. More popup наследует
тот же scope, включая CSS-variable prefix и hash. Стандартные native-темы сохраняют
прежнее оформление; source-тема допускает шапку ниже native минимума 32px.
Фикстура `?fixture=tabs-theme` сверяет 15 тем, 10 вариантов в LTR/RTL и popup
с официальным UMD; смена темы сохраняет DOM, черновики, выделение и фокус.

`animated` по умолчанию равен `{ inkBar: true, tabPane: false }`. False отключает обе
анимации, true включает обе без initial appear панели. Объект задаёт переключатели
независимо. `tabPane=true` заменяет весь переданный tabPaneMotion стандартным
`ant-tabs-switch`, включая его callbacks, как в 6.6.8.

Для собственного перехода передайте `animated={{ tabPaneMotion: motion }}` без
tabPane: rc-tabs включает его автоматически. Явное tabPane=false сохраняет motion,
но отключает body animated class. MotionName принимает строку с suffix фаз либо
объект имён. Поддержаны appear/enter/leave flags, leaveImmediately, deadline в ms,
visible/forceRender/removeOnLeave overrides, leavedClassName и lifecycle callbacks.
EventProps.className/style применяются в стабильном состоянии; CSS-фазы перекрывают
их. У скрытой forceRender-панели motion задаёт display:none, у сохранённой панели
leavedClassName перекрывает eventProps.className, как в исходном CSSMotion.
Собственный motionName требует CSS для перехода; положительный motionDeadline
завершает его без CSS end event. Prepare может вернуть Promise и работает даже
при `theme.token.motion=false`. Start/active получают native div и event=null,
возвращают CSS-строку после content styles; end получает native event либо
`{ deadline: true }`. Возврат false из end оставляет переход незавершённым.
Prepare/start читают DOM с prepare classes, active — со start classes.

Во время leave сохраняются DOM, local state и FormData уходящей панели. Aria-hidden
и inert сразу исключают её из навигации; owned focus переходит к новому заголовку.
Быстрое возвращение отменяет уничтожение. OnVisibleChanged вызывается после DOM
commit; первый невидимый mount не вызывает callback. Независимые deadline timers
не задают порядок между панелями, в том числе в upstream.
Native prefers-reduced-motion и живое отключение motion завершают CSS-переходы;
unmount отменяет frames, timers и продолжения prepare. Пустые native panel shells
и согласованный приоритет item destroy сохраняются.

`classNames` и `styles` принимают объект либо чистую функцию `({ props }) => slots`.
Доступны root/item/remove/indicator/body/content/header и popup.root; строка popup
сокращает запись popup.root. Styles используют CSS-строки. Remove применяется
к кнопкам удаления и в заголовках, и в More. Callback получает source size:
undefined без явного размера у компонента/провайдера, физический tabPlacement до
mobile fallback и items с нормализованным destroyOnHidden.
Остальные поля сохраняют переданные Svelte props; bind:activeKey остаётся живым.

`ConfigProvider.tabs` задаёт class/style, semantic slots, add/remove/more icons и
indicator. Отсутствующий record наследуется; явно переданный объект
во вложенном провайдере заменяет его целиком, как в Ant Design. Классы провайдера
и компонента накапливаются. Порядок root CSS: provider styles.root → provider style
→ local styles.root → local style; tabBarStyle идёт после styles.header.
Semantic indicator styles идут после вычисленной геометрии линии.

```svelte
<ConfigProvider tabs={{
  classNames: { header: 'section-tabs' },
  styles: { item: 'padding-inline:12px' },
  indicator: { size: 24, align: 'start' }
}}>
  <Tabs {items} classNames={{ content: 'section-panel' }} />
</ConfigProvider>
```

У More сохраняется исходный порядок: локальное more.icon, затем глобальные
tabs.more.icon ?? tabs.moreIcon, затем локальное moreIcon. Явное локальное
more.icon, включая null/false/undefined, перекрывает fallback. Глобальный tabs.more
использует только icon, как в 6.6.8; trigger и остальные параметры задаются локально.
Собственные поля more.overlayClassName/overlayStyle перекрывают semantic popup.root, даже при явном undefined.

`rootClassName` добавляет класс корню; нативные title/data-атрибуты и обработчики
передаются HTMLDivElement. `bind:nativeElement` предоставляет сам корневой div
после mount и очищается при unmount; SSR его не заполняет. Это Svelte binding,
без React ref wrapper. Aria-label/aria-labelledby сохраняют прежнее назначение:
именуют tablist. Обновления config/semantic styles сохраняют DOM, draft и фокус.

`indicator={{ size: 12.5, align: 'center' }}` задаёт длину и выравнивание линии.
Size также принимает чистую функцию `(origin) => origin - 20`: origin — полная
ширина горизонтального или высота вертикального заголовка с дробной точностью.
По умолчанию используется полный размер и align=center; start/end учитывают RTL.
Нули и отрицательные значения передаются в CSS без ограничения. Nullish
indicator.size наследует ConfigProvider.tabs.indicator.size.
Align наследуется отдельно.
Формулы, включая
end transform в RTL, повторяют rc-tabs 1.13.0. Измерение выполняется после mount;
SSR не вызывает size callbacks. Обновление откладывается на кадр, а сравнение
округлённых значений подавляет дрожание индикатора. Смена indicator не сбрасывает
прокрутку и не меняет фокус, выбранную вкладку или состояние панели.

OnTabScroll получает `{ direction: 'left' | 'right' | 'top' | 'bottom' }` при
изменении native scroll заголовков на текущей оси. Направления физические,
в том числе в RTL; фокусировка заголовка тоже может вызвать прокрутку.
Повторные scroll events при прежней позиции не вызывают callback. Браузер
может объединять соседние изменения в одно native событие; согласованная
прокрутка остаётся нативной, вместо transform/wheel/touch механизма React.
Смена callback не сбрасывает позицию, listener удаляется при unmount.

Centered=true центрирует горизонтальный список заголовков, пока хватает места.
Как в исходной реализации, вертикальный список растягивается по высоте, а
заголовки остаются сверху. TabBarGutter
задаёт отступ в px перед всеми заголовками, кроме первого, и перед кнопкой
добавления, если список не пуст. Нулевое значение убирает исходный отступ;
дробные и отрицательные значения сохраняются. По горизонтали используется
margin-inline-start с учётом RTL, по вертикали — margin-top; при мобильном
переходе наверх меняется и ось отступа. TabBarStyle принимает CSS-строку для
всей панели заголовков, включая extra content. Корневой style действует отдельно.
Например: `<Tabs {items} centered tabBarGutter={12} tabBarStyle="margin-bottom:8px" />`.

TabBarExtraContent задаёт правый слот либо { left, right }: string/number/boolean/
Snippet. Слоты находятся вне tablist и допускают нативные интерактивные controls;
они не участвуют в навигации стрелками. Как @rc-component/tabs 1.13.0, falsy extra
(включая 0) не создаёт wrapper; числовой label=0 при этом отображается.

В editable-card `onEdit(target, action)` запрашивает изменение у владельца:
add получает native click event, remove — строковый key, включая пустой.
Items и activeKey меняет владелец; edit сам по себе не вызывает onChange/onTabClick.
HideAdd=true скрывает добавление. Disabled и closable=false запрещают удаление;
closeIcon=null/false скрывают кнопку только при не заданном closable.
Closable=true сохраняет кнопку и использует fallback иконки. Приоритет —
truthy closeIcon, removeIcon, затем «×»; nullish removeIcon использует CloseOutlined.
Falsy addIcon использует PlusOutlined. Boolean true создаёт пустую иконку,
сохраняя доступное имя кнопки. Иконки — пассивные TabsContent/Snippet.

Delete/Backspace и средняя кнопка мыши запрашивают удаление и перемещают фокус
вперёд, а для последней доступной вкладки — назад; disabled пропускаются.
Это происходит и при отказе владельца менять items. Обычный click на close
не активирует вкладку. Фокус, явно заданный владельцем снаружи Tabs, сохраняется.
Close выбранной вкладки и Add доступны через Tab; остальные close имеют tabindex=-1.
Locale.addAriaLabel/removeAriaLabel задают имена с defaults «Add tab»/«remove».
Locale.dropdownAriaLabel именует listbox скрытых вкладок, по умолчанию «expanded dropdown»;
явная пустая строка сохраняется.

```svelte
<script lang="ts">
  import { Tabs, type TabsItem } from '@woodger/antd';

  let items = $state<TabsItem[]>([{ key: 'first', label: 'Первая вкладка' }]);
  let next = 1;
</script>

<Tabs type="editable-card" aria-label="Разделы" {items}
  locale={{ addAriaLabel: 'Добавить вкладку', removeAriaLabel: 'Закрыть вкладку' }}
  onEdit={(target, action) => {
    if (action === 'add') {
      const key = `new-${next++}`;
      items = [...items, { key, label: 'Новая вкладка' }];
    } else if (typeof target === 'string') {
      items = items.filter(item => item.key !== target);
    }
  }} />
```

При переполнении More показывает вкладки вне видимого диапазона, включая частично
обрезанные и disabled. Native scroll сохраняется; Add переходит в блок операций
с сохранением DOM-узла, фокуса и исходного card gutter. Определение мобильного
устройства повторяет default is-mobile 5.0.0, отдельно от breakpoint расположения:
на мобильном user agent More скрыт, прокрутка и Add остаются доступны.

Непустой `prefixCls` задаёт классы Tabs, навигации, панелей и More; пустое значение
наследует `ConfigProvider.prefixCls`. Имена switch используют локальный Tabs prefix,
default More slide — общий prefix, независимо от cssVar.prefix. Canonical theme
markers и shared keyframes сохраняются. Смена prefix сохраняет активную панель,
DOM/ref, draft/selection/focus и открытый popup с его редактором.
Внутренние запросы фокуса используют стабильные атрибуты. Editable/custom cells
прокручиваются целиком, включая кнопку удаления, чтобы активная вкладка не
попадала в More из-за видимого только текста.
Сверка: [официальный prefix-эталон](../../../tests/browser/fixtures/ant-design-tabs-prefix-reference.json),
[браузер](../../../tests/browser/tabs-prefix.spec.ts) и
[SSR](../../../tests/package/tabs-prefix.ssr.test.ts), `?fixture=tabs-prefix`.

More открывается через hover с задержками 0.1/0.1 секунды. `more.trigger` также
поддерживает click, focus, contextMenu и массив событий. `showAction` и `hideAction`
раздельно заменяют действия открытия и закрытия; пустой массив отключает сторону.
У contextMenu исходное закрытие — click. Hover без click получает touch toggle;
после touch hover игнорируется до следующего обработанного click.
Закрывающий focus срабатывает на blur кнопки, включая переход внутрь popup,
как в исходном Trigger.
ArrowDown/Enter/Space на
кнопке открывают список без выбора; Up/Down затем меняют активный пункт, пропуская
disabled. Первый Up сохраняет исходный выбор предпоследнего enabled-пункта.
Tab переносит фокус в список; его стрелки/Home/End двигают фокус по native options.
Выбор с кнопки More при hover оставляет список открытым, клик по option закрывает.
Клавиатурный выбор использует native click: публичный onTabClick по-прежнему получает
MouseEvent, включая его подтип PointerEvent. Close вызывает только onEdit, не закрывая
список; items меняет владелец. Escape сначала закрывает вложенную поверхность,
затем More, затем содержащий Modal.

`more.icon` перекрывает исторический moreIcon, включая null/false/0 и пустую строку.
Без них используется исходный EllipsisOutlined; явно заданный more.icon=undefined
даёт строку «More», как rc-tabs. У пустой декоративной кнопки остаётся native имя
«ellipsis». More принимает placement, mouseEnterDelay/mouseLeaveDelay, autoFocus,
minOverlayWidthMatchTrigger, overlayClassName/overlayStyle, onOverlayClick и
getPopupContainer; CSS styles задаются строкой. Корневой getPopupContainer
также поддерживается; одноимённый more override имеет приоритет,
включая явно заданный undefined. Portal сохраняет тему и собственные CSS variables popup.
ConfigProvider.getPopupContainer наследуется, если корневой prop Tabs отсутствует.
Явный root getPopupContainer=undefined выключает provider, как исходный spread props.
More имеет следующий приоритет, включая собственный undefined. Эти правила сохраняются
в props стандартной панели при renderTabBar; semantic callbacks получают raw props.

Выравнивание More повторяет rc-dropdown/rc-trigger 3.10.1. `placements` заменяет
таблицу целиком, `builtinPlacements` имеет приоритет; его явный undefined даёт пустую
таблицу Trigger. `align` неглубоко перекрывает выбранный placement, в том числе весь
overflow. Points физические и не отражаются в RTL. Offset и targetOffset принимают
числа или проценты от popup и target соответственно. Поддержаны flip/shift, исходное
значение adjust=0, области htmlRegion visible/scroll/visibleFirst и dynamicInset
для right/bottom, включая legacy _experimental.dynamicInset. Старые useCssRight,
useCssBottom, useCssTransform и ignoreShake исходный 3.10.1 не использует.

`alignPoint` использует последнюю client-точку click/hover/contextMenu. Без точки
keyboard/touch используют кнопку. В point mode default stretch выключен;
minOverlayWidthMatchTrigger=true включает его, собственный undefined выключает.
Point menu с click-hide закрывается при scroll/resize; hover сохраняет точку,
включая уход кнопки за viewport. `onPopupAlign` получает popup и фактический align
после flip, перед записью offsets. Количество вызовов не фиксируется; idle frames
не создают callback loop. При нулевом scale выравнивание/callback пропускается.
CSS overlayStyle имеет приоритет над offsets и arrow variables.

```svelte
<Tabs {items} more={{
  trigger: 'contextMenu',
  alignPoint: true,
  align: { offset: ['10%', 4], overflow: { adjustX: true, adjustY: true } }
}} />
```

`arrow=true` добавляет div-arrow и show-arrow class низкоуровневого Dropdown.
Tabs upstream не задаёт стили этому div; потребитель может оформить его через
semantic popup.root. AutoFocus/Tab работают с overlay, пропуская div-arrow.
AutoFocus запускается при открытии; обновление align/размеров внутри сеанса
сохраняет фокус в пользовательском поле. Смена getPopupContainer callback с тем же
DOM-контейнером сохраняет portal и выделение текста. Flip переключает CSS insets даже тогда,
когда числовые координаты остаются теми же.
Native popover остаётся в fixed top layer и отслеживает изменения layout;
клиппинг предков участвует в расчёте доступной области. Сохраняется измерение
реального border box при пользовательском box-sizing:content-box.
Исходная логика сопровождается MIT-лицензиями
[rc-dropdown](../../../src/lib/vendor/LICENSE.rc-dropdown) и
[rc-trigger](../../../src/lib/vendor/LICENSE.rc-trigger).

`more.visible` со значением true/false перекрывает внутренние запросы и onClose.
Как в rc-tabs,
more.onVisibleChange заменяет внутренний pointer/dismiss callback; для controlled
режима передавайте оба поля. Клавиатурное открытие и aria-expanded используют
внутренний флаг OperationNode. Явный more.visible=undefined включает отдельный
uncontrolled Trigger: pointer actions управляют popup, а keyboard/onClose меняют
только флаг OperationNode. В этой ветке Dropdown не добавляет open class и не
переносит фокус по autoFocus/Tab. Изменение visible сбрасывает внутреннее значение
Trigger, как useControlledState исходника.

PopupRender получает menu Snippet и { restTabs, onClose }; `more.overlay` — Snippet,
который заменяет и menu, и popupRender. Клавиатурный выбор с More работает даже
без исходного menu DOM. Содержимое ленивое и сохраняется после
первого открытия. `autoDestroy=true` удаляет его вместе с popup после leave end;
повторное открытие во время leave сохраняет DOM/state. Уходящая поверхность остаётся
aria-hidden/inert и не перехватывает Escape у следующего popup/Modal.

По умолчанию More использует ant-slide-up с placement overrides. `transitionName`
задаёт другой CSS motion prefix; пустая строка отключает motion. Непустой animation
имеет приоритет и добавляет префикс ant-tabs-dropdown-. CSS для собственного имени
задаёт потребитель. Theme motion=false и reduced motion завершают переход;
`openClassName` заменяет класс открытой кнопки, пустая строка убирает его.
Прежний native SSR shell сохраняется без содержимого; при autoDestroy=true его нет.

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Tabs, type TabsMoreRenderInfo } from '@woodger/antd';

  const items = Array.from({ length: 12 }, (_, index) => ({
    key: String(index),
    label: `Вкладка ${index + 1}`
  }));
</script>

{#snippet popup(menu: Snippet, info: TabsMoreRenderInfo)}
  {@render menu()}
  <button type="button" onclick={info.onClose}>Закрыть список</button>
{/snippet}
<Tabs {items} aria-label="Разделы" more={{ trigger: 'click', popupRender: popup }} />
```

`renderTabBar` получает разрешённые props навигации и Snippet стандартной панели.
Он может обернуть её, заменить props или построить собственную шапку:

```svelte
<script lang="ts">
  import { Tabs, type TabsDefaultTabBar, type TabsTabBarProps } from '@woodger/antd';

  const items = [{ key: 'profile', label: 'Профиль' }, { key: 'history', label: 'История' }];
</script>

{#snippet bar(props: TabsTabBarProps, DefaultTabBar: TabsDefaultTabBar)}
  <div class="custom-bar">
    {@render DefaultTabBar({ ...props, className: 'custom-header', style: 'padding-top:8px' })}
  </div>
{/snippet}
<Tabs {items} renderTabBar={bar} />
```

Стандартной панели передают полный набор props через spread. Её overrides меняют
только навигацию: например, activeKey управляет выделением заголовка, а активная
панель остаётся под управлением Tabs. Переданный onTabClick выполняет native выбор;
его можно заменить или вызвать из своего обработчика. KeyboardEvent из полностью
пользовательской шапки преобразуется в MouseEvent для публичного onTabClick,
сохраняя modifiers, target/currentTarget и отмену события.
Callback-ref `ref` предоставляет DOM-узел стандартной панели и получает null
при замене ref или unmount; во время SSR он не вызывается.

Сохраняется native наследование темы popup. В исходном UMD замена
more.overlayClassName может удалить служебный CSS-variable scope и сбросить цвет
текста до browser default; native portal продолжает наследовать тему Tabs.

`children` стандартной панели — Snippet `(node, item, attributes)`. Он оборачивает
каждый заголовок; `node(overrides)` дополняет или заменяет его исходные DOM attributes.
Attributes позволяют сохранить class/style/handlers и добавить Svelte attachments.
Как в исходном TabNode, внешний узел отделён от нативной кнопки tab: её клик
останавливает всплытие до внешнего onclick. Для перехвата выбора всей шапки
используйте props.onTabClick. Перестановка items и интеграция с drag-and-drop
остаются у владельца, как в официальном примере.

Собственная шапка отвечает за клавиатуру и ARIA. Публичный
`getTabsItemId(props.id, key, 'tab' | 'panel')` связывает её controls с native
панелями, включая пустые и Unicode keys. Панели, их состояние и корневой ref
не пересоздаются при обновлении или замене renderer'а. Точные типы находятся в
[tabs-nav.types.ts](../../../src/lib/tabs-nav.types.ts).
Поля tabPosition/popupClassName стандартной панели следуют текущему интерфейсу
TabNavList закреплённого rc-tabs; они независимы от удалённых корневых props Tabs.

Фикстура `?fixture=tabs-editable` сверяет truthiness, иконки и размеры с Ant Design
6.6.8 и @rc-component/tabs 1.13.0. Проверяются callbacks, принятие/отказ владельца,
фокус, FormData, layout/RTL и сохранение панелей. Фикстура `?fixture=tabs-layout`
сравнивает centered/gutter/header style с 31 эталоном официального UMD, включая
все типы и положения в LTR/RTL, нулевой отступ и пустой editable список.
Здесь же проверяются medium, наследование размера и сохранение панелей
при смене расположения.
Фикстура `?fixture=tabs-overflow` сверяет 35 эталонов More из официального UMD:
скрытые вкладки, CSS метрики, SVG, icon precedence, RTL и locale. Проверяются также
keyboard, control/owner callbacks, popupRender, portal, вложенные поверхности и focus.
Фикстура `?fixture=tabs-more-runtime` сверяет lifecycle, overlay precedence,
раздельные actions/touch, visible=undefined и motion phases с 33 эталонами UMD.
Здесь же проверяются autoDestroy после leave, reversal, смена motion и cleanup portal.
Фикстура `?fixture=tabs-more-position` сверяет 51 эталон геометрии официального UMD:
placements, offsets, overflow/regions, point targeting, arrow, callback payload и
container. Живые проверки защищают DOM/state/draft/selection/focus, callback loop,
scroll/resize, уход anchor за viewport и cleanup. Общий числовой engine проверяется
также прежними сценариями Tour.
Фикстура `?fixture=tabs-indicator` сверяет 52 эталона indicator из
официального UMD и направления onTabScroll в восьми сочетаниях RTL/placement.
Здесь же проверяются сохранение DOM, focus, More, прокрутки и cleanup кадров/listeners.
Фикстура `?fixture=tabs-semantic` сравнивает 22 эталона semantic slots, CSS-слоёв,
callback props, provider inheritance и icon precedence с официальным UMD.
Проверяются native attrs/events/ref и живое обновление открытого popup.
Фикстура `?fixture=tabs-motion` сверяет 41 UMD-эталон фаз, CSS, callbacks,
приоритетов, RTL и lifecycle; дополнительно проверяются незавершённые переходы,
FormData, focus, reversal, end=false, async prepare, reduced motion и cleanup.
Восемь сценариев задают per-item class/style, semantic/motion precedence, hidden
forceRender и RTL; живое обновление проверяется также во время перехода.
Фикстура `?fixture=tabs-render` сверяет 35 UMD-эталонов props, overrides,
per-tab wrappers/attributes, callbacks, More, RTL и пустого editable набора.
Проверяются также SSR, native keyboard/cancellation, attachments и обновления
шапки без потери DOM/state/draft/selection/focus и открытого More.
Приоритет уничтожения панелей сохраняет native v1. Остальные low-level
Dropdown/Trigger возможности More требуют отдельного аудита; перенесённые
arrow, align/alignPoint, placements, actions, callbacks, overlay и motion описаны выше.

