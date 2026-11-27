# Tooltip

```svelte
<script lang="ts">
  import { Button, Tooltip, type TooltipRef } from '@woodger/antd';

  let open = $state(false);
  let tooltipRef = $state<TooltipRef>();
</script>

<Tooltip title="Сохранить изменения" bind:open bind:ref={tooltipRef} placement="top">
  <Button>Сохранить</Button>
</Tooltip>
```

Title принимает строку, число, boolean, пассивный Snippet, вложенные массивы или null.
Legacy `overlay` приоритетнее title, кроме title=0; falsy overlay использует title.
Boolean не создаёт текст: true и пустой массив позволяют открыть пустую подсказку,
false и NaN без fallback отключают её. Snippet рендерится внутри изолированного
popup-контекста; его пустоту компонент не определяет заранее. Пустая строка,
пробелы, undefined и null сохраняют native подавление показа и связи описания;
это отличается от whitespace и controlled empty title upstream. Число 0 отображается.
Текст экранируется.
Children — snippet с одним основным DOM-элементом, например Button, Input или
нативной кнопкой. Этот элемент служит anchor и получает aria-describedby.
Wrapper сохраняет обработчики дочернего элемента и не добавляет остановку Tab;
для клавиатурного доступа используйте фокусируемый дочерний элемент.
Hover работает и вокруг disabled Button; disabled ConfigProvider не отключает
объясняющую подсказку.

`bind:open` передаёт видимость владельцу; без привязки компонент хранит её сам.
DefaultOpen задаёт начальное состояние. `onOpenChange(open)` вызывается при
пользовательском открытии/закрытии; внешнее изменение open и начальное состояние
не вызывают callback. Как и другие bindable props модуля, open следует модели
Svelte; для синхронизации владельца используйте bind:open.

`disabled` скрывает подсказку и её open class, сохраняя raw open. Trigger-события
и ожидающий mouseEnterDelay продолжают менять это состояние и вызывать
onOpenChange, как в rc-trigger. Изменение самого disabled не вызывает callback;
повторное включение может показать уже открытую подсказку. ConfigProvider.disabled
по-прежнему не отключает объясняющий Tooltip.

`id` задаёт ID popup; пустая строка использует стабильный автоматически созданный
fallback. При fresh=false скрытый ID кэшируется вместе с содержимым и обновляется
при открытии. Существующая native связь aria-describedby сохраняется также при
закрытии; disabled снимает только собственную связь Tooltip. Описания владельца
не удаляются при смене ID или отключении.

`zIndex` задаёт inline z-index popup, включая 0 и отрицательные значения.
Provider root styles и local styles.root идут после него. Без prop уровень
берётся из контекста или тематического `zIndexPopup`. Настройки передаются single/range
Slider и ellipsis Tooltip Typography. В Typography disabled вычисляет сам ellipsis
и перекрывает значение из tooltip options, как в upstream.
[Уровни вложенных панелей](../theme-context.md#уровни-вложенных-панелей)

`bind:ref` выдаёт TooltipRef после mount и очищает его при unmount. NativeElement
указывает на основной DOM trigger, включая SVG; popupElement — на существующий
native span shell. Getters отражают замену trigger и перенос popup в контейнер.
Shell доступен также до первого открытия и при destroyOnHidden: исходный lazy div
и его удаление не подменяют согласованный native lifecycle.

`tooltipRef?.forceAlign()` пересчитывает открытый popup текущим контроллером
placement/arrow/overflow. После изменения разметки вызовите его после `await tick()`
либо в `$effect`. Метод не создаёт дополнительный animation loop, не открывает
закрытый или уничтоженный popup и не вызывает onOpenChange; DOM, ввод, фокус и
выделение сохраняются. Прежнее автоматическое отслеживание anchor продолжает работать.
Вызовы в одном turn объединяются в одну microtask, как в rc-trigger; возвращаемое
значение — void. Императивный вызов не подписывает `$effect` на внутреннее состояние Tooltip.

Как в исходном interface, TooltipProps не содержит ref; полный тип Svelte-компонента
с binding доступен через `ComponentProps<typeof Tooltip>`. Сверка DOM/ref и layout:
[четыре UMD-сценария](../../../tests/browser/fixtures/ant-design-tooltip-ref-reference.json),
[SSR](../../../tests/package/tooltip/tooltip-ref.ssr.test.ts) и
[browser](../../../tests/browser/tooltip/tooltip-ref.spec.ts), `?fixture=tooltip-ref`.

Trigger без component config по умолчанию `['hover', 'focus']`; можно выбрать одно
событие или передать пустой массив для программного показа. MouseEnterDelay и mouseLeaveDelay
задаются в секундах, по умолчанию 0.1. Фокус открывает подсказку сразу. Pointer
с типом touch не имитирует hover. На подсказку можно перевести указатель, она
остаётся видимой; клик по ней сохраняет фокус. Escape и нажатие снаружи закрывают
её. После Escape она остаётся скрытой до нового наведения/фокуса. В Modal первый
Escape закрывает Tooltip, следующий — Modal.

`showAction` и `hideAction` независимо заменяют события открытия и закрытия из
trigger, в том числе при trigger=[]. Undefined возвращает соответствующий набор
trigger; пустой массив отключает только выбранное направление. `focusDelay` и
`blurDelay` задаются в секундах, по умолчанию 0, независимо от mouse delays.
Если событие закрытия отключено, blur/leave не отменяет ожидающее открытие;
сама замена списка событий также не сбрасывает уже запущенную задержку.

При явных action overrides hover без click добавляет touch отдельно для каждого
направления, как в rc-trigger. Touchstart переключает разрешённое направление,
последующие hover-события подавляются до обработанного click. Source config
также использует этот touch fallback; прежний native default без новых actions
сохраняет подавление touch hover. Для явных overrides закрытие снаружи происходит
по mousedown/contextmenu и только при hide click/contextMenu либо неявном touch;
hideAction=[] отключает его. Escape продолжает закрывать открытую подсказку.
Настройки работают также в ellipsis Tooltip Typography; его видимость по-прежнему
зависит от измеренного усечения, а onOpenChange сообщает raw open.
Controlled-сверка использует getter/setter binding с отклонением записи владельцем;
обычный open сохраняет прежнюю Svelte-семантику, описанную выше.
Native blur без relatedTarget проверяет доступность trigger в следующей microtask,
чтобы удаление focused DOM не вызывало callback. Это граница синхронного callback
rc-trigger; переход фокуса с relatedTarget сохраняет его исходное время вызова.
Сверка: [54 UMD-сценария / 310 кадров](../../../tests/browser/fixtures/ant-design-tooltip-actions-reference.json),
[SSR](../../../tests/package/tooltip/tooltip-actions.ssr.test.ts) и
[browser](../../../tests/browser/tooltip/tooltip-actions.spec.ts), `?fixture=tooltip-actions`.

По умолчанию содержимое скрытой подсказки сохраняется. `fresh=false` фиксирует
последнее открытое содержимое и semantic class/style внутреннего container;
`fresh=true` обновляет их также при закрытом popup. При открытии всегда применяется
текущее значение. Массивы сохраняются снимком, включая вложенные значения.
Внешние root/arrow styles и наследуемые CSS-переменные продолжают обновляться.
Кэш фиксирует выбранный Snippet, но реактивные значения и эффекты внутри него
продолжают работать по правилам Svelte: полный React.memo для opaque captures
не воспроизводится. Политика fresh передаётся в ellipsis Tooltip Typography
и single/range Slider; Typography сохраняет поддержку bigint и whitespace.

DestroyOnHidden=true без forceRender удаляет содержимое при закрытии и создаёт заново при открытии:
DOM-состояние и состояние вложенного
компонента сбрасываются. Смена destroyOnHidden у открытой подсказки сохраняет
её DOM, ввод и фокус; включение удаления у закрытой без forceRender сразу очищает содержимое.
При включённом удалении SSR не вызывает title snippet, включая начальный open/defaultOpen.
Прежний скрытый native shell и его ID/ARIA сохраняются; default SSR остаётся eager.
Это также работает в ellipsis Tooltip Typography и подсказках Slider.
У Tooltip и Typography содержимое удаляется после завершения закрытия.
Подсказки Slider по-прежнему используют собственный немедленный lifecycle.

`forceRender=true` заранее монтирует скрытое содержимое после hydration и вызывает
getPopupContainer, даже без открытия и при disabled. При destroyOnHidden=true оно
сохраняет скрытое содержимое; выключение forceRender у закрытой подсказки удаляет
его. Новый force mount получает текущий payload, затем действует fresh cache.
ForceRender не открывает popup и не вызывает onOpenChange. Native shell сохраняется;
SSR при destroyOnHidden остаётся lazy, portal getter на сервере не вызывается.
Сверка: [19 UMD-сценариев и четыре consumer traces](../../../tests/browser/fixtures/ant-design-tooltip-lifecycle-reference.json),
[SSR](../../../tests/package/tooltip/tooltip-lifecycle.ssr.test.ts) и
[browser](../../../tests/browser/tooltip/tooltip-lifecycle.spec.ts), `?fixture=tooltip-lifecycle`.
У active range Slider сохраняется существующий один native shell до выбора ручки;
исходная conditional composition не подменяет его lifecycle.

Жизненный цикл сверяется с
[44 UMD-сценариями / 224 кадрами](../../../tests/browser/fixtures/ant-design-overlay-lifecycle-reference.json),
[SSR](../../../tests/package/popup/overlay-lifecycle.ssr.test.ts) и
[browser](../../../tests/browser/popup/overlay-lifecycle.spec.ts), `?fixture=overlay-lifecycle`.
Эталоны получены с отключённой motion из runtime CSS официального UMD.
Исходное lazy mount до первого открытия записано отдельно: существующий native
SSR и eagerly mounted default content остаются согласованной границей.
Title/overlay и fresh дополнительно сверяются с
[24 UMD-сценариями содержимого и 80 кадрами кэша](../../../tests/browser/fixtures/ant-design-tooltip-content-reference.json),
[SSR](../../../tests/package/tooltip/tooltip-content.ssr.test.ts) и
[browser](../../../tests/browser/tooltip/tooltip-content.spec.ts), `?fixture=tooltip-content`.
Остальные delegated props учтены в реестре миграции.

## Завершение открытия и закрытия

`onOpenChange(open)` сообщает о запросе от trigger. `afterOpenChange(open)` вызывается
после применения видимости и завершения анимации, включая начальный `defaultOpen`,
внешнее изменение `open` и скрытие через `disabled`. В режиме без анимации вызов
следует за обновлением DOM. Отклонённый владельцем запрос через `bind:open` не меняет
видимость. При прерывании анимации callback получает только завершённое состояние.
`forceRender` подготавливает скрытое содержимое без вызова `afterOpenChange`.

По умолчанию Tooltip использует CSSMotion `zoom-big-fast` с длительностью темы
(100 мс по умолчанию). Префикс классов движения берётся из ConfigProvider.
`motion={{ motionName: 'my-motion' }}` применяет пользовательские классы фаз
appear, enter и leave. Пустое имя, `theme.token.motion=false` и
`prefers-reduced-motion: reduce` отключают движение. При отсутствии события
завершения для пользовательского имени действует deadline в 1000 мс.

Панель при уходе остаётся в top layer вне порядка фокуса. В
`afterOpenChange(false)` она уже скрыта, но её содержимое доступно через
`popupElement`. При `destroyOnHidden` без `forceRender` snippet удаляется
после callback, а скрытый native shell и ID сохраняются.

Сверка для Tooltip, Popover и Popconfirm включает 19 сценариев закреплённого
React UMD, каждый снят дважды. [Эталон](../../../tests/browser/fixtures/ant-design-overlay-motion-reference.json),
[браузерные сценарии](../../../tests/browser/popup/overlay-motion.spec.ts) и
[SSR-проверка](../../../tests/package/popup/overlay-motion.ssr.test.ts).

## Общая подсказка для нескольких триггеров

```svelte
<Tooltip.UniqueProvider>
  <Tooltip title="Скопировать ссылку"><button type="button">Скопировать</button></Tooltip>
  <Tooltip title="Открыть в новом окне"><button type="button">Открыть</button></Tooltip>
</Tooltip.UniqueProvider>
```

Ближайший провайдер показывает одну общую панель без стрелки. При смене
триггера панель сохраняет DOM-узел, а её фон плавно меняет позицию и размер.
Фон и содержимое находятся в одной нативной popover-поверхности.
При запросе во время анимации открытия группа применяет последнюю цель после
завершения этой фазы. Если указатель успевает уйти с обеих целей, группа
отменяет перенос и закрывает панель. Группа использует тему и префиксы
активного владельца. Popover и Popconfirm присоединяются при явном
`unique={true}`. При переходе между Tooltip и карточкой тот же `div` меняет
роль с `tooltip` на `dialog` и получает имя и ID нового владельца.
`unique={false}` оставляет Tooltip самостоятельным. Настройка доступна также
в `Slider.tooltip` и в объекте `Typography.ellipsis.tooltip`.

Участник получает `onOpenChange` на обычном этапе обработки триггера. Группа
затем применяет свои `mouseEnterDelay` и `mouseLeaveDelay`, как в Ant Design
6.6.8. У общей панели собственные lifecycle и выравнивание. Пользовательские
`afterOpenChange` и `onPopupAlign` относятся к самостоятельной панели.
Группа сохраняет скрытую оболочку после первого открытия и выбирает контейнер
в `body` или открытом нативном диалоге. `getPopupContainer`, `forceRender`
и `destroyOnHidden` управляют самостоятельной панелью через `unique={false}`.

В Svelte `popupElement` возвращает общую панель текущего владельца, а
`aria-describedby` ссылается на её фактический ID. У Tooltip внутри Popover
своя панель и свой Escape. При удалении активного триггера общая панель
освобождается. Фон переносит preset color выбранного Tooltip.
В закреплённом React UMD это три отдельных расхождения. Вложенный Tooltip
пропускает показ, удалённый триггер оставляет прежнюю панель, а `color="blue"`
оставляет на общем фоне цвет `colorBgSpotlight`.

Переходы, задержки и отличия зафиксированы в [снимках React UMD](../../../tests/browser/fixtures/ant-design-tooltip-unique-reference.json).
Сравнение выполняется в [Chromium](../../../tests/browser/tooltip/tooltip-unique.spec.ts),
с отдельными проверками [гидратации](../../../tests/browser/tooltip/tooltip-unique-hydration.spec.ts)
и [публичного API](../../../tests/package/tooltip/tooltip-unique.ssr.test.ts).
Сценарии с карточками сверяются с [отдельными снимками React UMD](../../../tests/browser/fixtures/ant-design-tooltip-unique-delegates-reference.json)
в [Chromium](../../../tests/browser/tooltip/tooltip-unique-delegates.spec.ts).

Placement принимает top/bottom/left/right, topLeft/topRight/bottomLeft/bottomRight
и leftTop/leftBottom/rightTop/rightBottom. Направления физические и не меняются
при RTL. Arrow=false скрывает стрелку. Arrow={{ pointAtCenter: true }} привязывает
tip стрелки к центру trigger. Угловые варианты с pointAtCenter=false или arrow={{}}
сохраняют исходную привязку к краю. Локальные object arrow и object autoAdjustOverflow включают исходный
расчёт всех 12 направлений, включая shift центральных вариантов. Без object props
у четырёх прежних вариантов сохраняются
переворот в сторону с большим местом и сдвиг внутри viewport.
Угловые варианты используют исходные points, visibleFirst и flip по обеим осям
без сдвига вдоль края. Выбранный flip сохраняется до закрытия; после открытия
расчёт начинается заново. AutoAdjustOverflow=false отключает переворот и сдвиг.
Положение обновляется при прокрутке, resize и перемещении anchor, пока подсказка
открыта. Class и style относятся к wrapper.

`align` накладывается поверх выбранной записи placements; вложенный `overflow`
заменяется целиком. `builtinPlacements` заменяет всю автоматическую карту, включая
пустой объект. Points задают точки popup/target; offset считается относительно popup,
targetOffset — относительно target. Поддержаны числа, проценты и строки через
parseFloat, включая исходную трактовку `5px` как числа 5. TooltipAlignConfig также
содержит htmlRegion, dynamicInset/_experimental.dynamicInset и autoArrow.
UseCssRight/useCssBottom/useCssTransform/ignoreShake сохраняются в metadata,
но rc-trigger 3.10.1 их не использует.

Класс placement выбирается по первому совпадению points в текущей карте: возможен
пользовательский ключ или отсутствие класса. Стрелка использует итоговые points;
semantic styles.arrow и styles.root сохраняют приоритет над координатами.
Новые align/builtinPlacements/onPopupAlign включают исходную геометрию и gap также
без source-настроек; прежние defaults без этих props сохраняются.

`onPopupAlign(node, info)` получает реальный popup и итоговые points после flip,
до применения новых координат. Он вызывается при открытии, фактическом изменении
геометрии и явном forceAlign; запросы forceAlign в одном turn объединяются.
Прежнее native отслеживание anchor продолжает работать, callback не вызывается
на каждом неизменившемся animation frame. SSR и закрытый popup не вызывают callback.
Настройки передаются Typography и single/active range/pinned range Slider.
Сверка: [38 UMD-сценариев](../../../tests/browser/fixtures/ant-design-tooltip-align-reference.json),
[числовой движок](../../../src/lib/tooltip/tooltip-align-reference.test.ts),
[SSR](../../../tests/package/tooltip/tooltip-align.ssr.test.ts) и
[browser](../../../tests/browser/tooltip/tooltip-align.spec.ts), `?fixture=tooltip-align`.
Размеры box заданы явно для проверки геометрии; native fixed/top-layer и viewport
ограничения сохраняются, полный CSS-transform/scroll-container clipping здесь не заявлен.

При source-настройках ConfigProvider панель использует Tooltip tokens: maxWidth,
zIndexPopup, offsets и форму стрелки, включая component aliases/algorithm.
Отступ от anchor рассчитывается по глобальным sizePopupArrow и marginXXS, как
в исходном Tooltip: обычно 12px со стрелкой и 4px без неё. Угловые варианты
используют эти source defaults и без source-настроек; у четырёх прежних вариантов
в native-темах сохраняется отступ 8px. Object arrow/autoAdjustOverflow используют
source gap и глобальный borderRadius даже без source-настроек. Component aliases
меняют оформление стрелки, но не её исходную привязку. Подробности — в
[описании темы](../theme-context.md#токены-всплывающих-панелей).

Поверхность использует нативный `popover="manual"` в верхнем слое браузера.
Без container getter DOM остаётся на месте: overflow не обрезает её, контекст темы и
модальность dialog сохраняются. Нужен браузер с Popover API, как для фильтров Table.
Скрытый или находящийся за пределами viewport anchor скрывает поверхность;
при возвращении anchor внешний open сохраняется. В SSR поверхность скрыта,
позиционирование и aria-describedby подключаются после гидратации. Добавление
описания сохраняет существующие ID и отслеживает их изменения; cleanup удаляет
только ID Tooltip.

Контейнер выбирается через getPopupContainer → ConfigProvider.getPopupContainer. Undefined сохраняет fallback; функция получает
исходный DOM trigger, включая SVG, и вызывается только в браузере после открытия.
Смена функции с тем же контейнером сохраняет DOM, state, focus и selection.
Portal переносит наследуемые variables и сохраняет приоритет собственных component tokens.
Вложенные popup сохраняют собственные координаты и цвет стрелки.

Поддерживаются строки, числа и rich snippets.
Общая панель настраивается через [Tooltip.UniqueProvider](#общая-подсказка-для-нескольких-триггеров).
AutoAdjustOverflow принимает также `{ adjustX?: 0 | 1, adjustY?: 0 | 1 }`.
Числовой 0 тоже разрешает flip, как в rc-trigger; отключение обеих коррекций
задаётся boolean false.

```svelte
<Tooltip title="Подсказка" placement="topLeft"
  arrow={{ pointAtCenter: true }} autoAdjustOverflow={{ adjustX: 1, adjustY: 1 }}>
  <button type="button">Подробнее</button>
</Tooltip>
```

Локальные arrow/overflow настройки сверяются с
[84 UMD-эталонами](../../../tests/browser/fixtures/ant-design-overlay-options-reference.json),
[unit](../../../src/lib/tooltip/tooltip-options-reference.test.ts),
[SSR](../../../tests/package/popup/overlay-options.ssr.test.ts) и
[browser](../../../tests/browser/popup/overlay-options.spec.ts). Они включают настройки tokens,
обновления открытой карточки, оба режима range Tooltip и сохранение draft/focus.
Расчёт угловых позиций использует общий
[движок rc-trigger](../../../src/lib/popup/popup-position.engine.ts). Координаты, CSS стрелки,
fractional sizes, flip history и смена placement проверяются по
[99 UMD-эталонам](../../../tests/browser/fixtures/ant-design-overlay-corner-reference.json),
[unit](../../../src/lib/tooltip/tooltip-corner-reference.test.ts),
[SSR](../../../tests/package/popup/overlay-corner.ssr.test.ts) и
[browser](../../../tests/browser/popup/overlay-corner.spec.ts). Явные размеры в части эталонов
отделяют позиционирование от layout остальных компонентов.

## ConfigProvider и semantic slots

ConfigProvider.tooltip/popover/popconfirm задают class/style, classNames/styles,
arrow, trigger и hover delays. Отсутствующий объект наследуется; явный объект,
включая {}, заменяет родительский целиком. Локальные trigger и delays приоритетнее;
0 сохраняется, undefined наследует следующий слой. При trigger=[] события hover,
focus, click и contextMenu на trigger и popup не открывают и не закрывают панель.
Это работает и без component config: уход указателя и blur не закрывают панель
и не вызывают onOpenChange. События содержимого работают, contextmenu не подавляется.
Escape и нажатие снаружи закрывают панель по прежним native правилам.
Правило для trigger=[] работает также в Popconfirm, Typography ellipsis Tooltip
и AvatarGroup.max.popover.

```svelte
<ConfigProvider tooltip={{ trigger: 'click', arrow: { pointAtCenter: true },
  class: 'help-popup', styles: { container: 'padding:12px' } }}>
  <Tooltip title="Подсказка"><button type="button">Подробнее</button></Tooltip>
</ConfigProvider>
```

Новая component config включает исходные defaults: hover для Tooltip/Popover,
click для Popconfirm и source geometry всех 12 направлений. В обычной теме это
12px со стрелкой, 4px без неё. Без component config сохраняются прежние
hover/focus и native gap/flip/shift четырёх центральных направлений с boolean
arrow/overflow. Локальный arrow boolean меняет видимость, сохраняя унаследованный
pointAtCenter; объект
перекрывает только свои поля. Настройки tooltip не попадают в Popover/Popconfirm.
Popover defaults участвуют в наружной поверхности Popconfirm; его собственные
trigger/delays и видимость стрелки приоритетнее.

Поддерживаются hover, focus, click и contextMenu, а также их массивы. Повторный
contextMenu переключает видимость; обычный click закрывает такую поверхность.
Browser context menu подавляется только при включённом contextMenu. Положение
привязывается к trigger, как в исходном Tooltip без alignPoint.
В source config события действуют независимо: hover leave закрывает панель,
открытую click/focus, если hover тоже включён. События, отсутствующие в trigger,
не закрывают программно открытую поверхность.

Class/style provider относятся к popup. Прежние локальные class/style относятся
к wrapper trigger; rootClassName задаёт дополнительный класс popup. ClassNames
и styles принимают slot records либо callback({ props }); стили задаются CSS-строками.
Tooltip имеет root/container/arrow, Popover добавляет title/content, Popconfirm —
icon. У Popconfirm title/content оформляют заголовок и описание подтверждения.
Callbacks видят разрешённые trigger и delays, у Popover/Popconfirm — placement,
у Tooltip — исходные builtinPlacements и container getter.
Open в callback — исходный prop владельца; неконтролируемое открытие не подставляет
в него внутреннее состояние.
Callbacks выполняются и при SSR, когда DOM ещё недоступен.

Классы слоёв накапливаются. Порядок CSS: context styles → context style(root) →
local styles. Цветовой слой color применяется после semantic container styles.
Класс popup задаётся через rootClassName и classNames.root.
Root styles имеют приоритет над вычисленными координатами, как в rc-trigger;
их обновление не сбрасывает variables темы, DOM, ввод, selection и focus.
Настройки наследуются также подсказками Slider, overflow AvatarGroup и ellipsis
Tooltip Typography. У Typography без config сохраняется исходный hover trigger;
его Tooltip создаётся лениво после DOM-измерения и не вызывает semantic callbacks при SSR.

Границы fresh cache для Snippet и CSS-transform/clipping описаны выше.

## Цвет Tooltip, Popover и Popconfirm

`color` принимает 13 preset-имён Ant Design либо CSS background. Имена чувствительны
к регистру: `blue` использует палитру Ant Design, `Blue` — CSS named color. Имена
`*-inverse` получают исходный класс, но у Tooltip/Popover 6.6.8 для них нет цветовой
заливки. Preset CSS использует текущие `--ant-<color>-6`, включая component aliases
и algorithm. Прежние native-темы сохраняют свои палитры; source-тема использует
исходные tokens Ant Design.

```svelte
<Tooltip title="Сохранено" color="#fadb14">
  <button type="button">Статус</button>
</Tooltip>
<Slider defaultValue={40} tooltip={{ color: 'purple' }} />
```

У пользовательского background Tooltip выбирает чёрный или белый текст по исходной
RGB luminance с порогом 0.5; alpha не участвует. Color parser не разрешает CSS
variables перед расчётом контраста, хотя browser использует их при отрисовке.
Popover и Popconfirm сохраняют собственные цвета title/content, как upstream.
Semantic `color` текста может их переопределить.

Цветовой background следует после container styles. Root styles
могут переопределить цвет стрелки; у preset Tooltip variable задана на самой стрелке,
поэтому для неё используется styles.arrow. Raw background передаётся одним CSS value,
а не списком declarations. Реактивное невалидное значение может сохранить прежний
background, как React style setter; удаление shorthand сохраняет исходный style diff.

Цвет работает также в `AvatarGroup.max.popover` и обоих режимах Slider Tooltip.
Обновление открытой панели сохраняет DOM, ввод, выделение и фокус. Private contrast
родительской панели не копируется в body portal и изолирован у вложенного native
Tooltip без getter. Явный контейнер внутри родительской панели наследует его,
как исходный getPopupContainer.

## Локальные префиксы и классы открытого trigger

`prefixCls` меняет классы Tooltip/Popover, их slots, placements и preset colors.
Без локального prefix используется ConfigProvider.prefixCls; пустая строка также
наследует его. По умолчанию это ant-tooltip и ant-popover.
У Popconfirm default `ant-popconfirm`: его локальный prefix меняет только классы
подтверждения. Наружный Popover отдельно наследует общий prefix, как upstream.
CSS variables и глобальные `.anticon` сохраняют имена. Это отдельная настройка
от `theme.cssVar.prefix`; совместимые aliases и существующие native markers/hash
остаются частью Svelte-адаптации.

```svelte
<Popover prefixCls="project-card" title="Настройки" content="Сохранены">
  <button type="button">Показать</button>
</Popover>
```

`openClassName` задаёт класс открытого trigger, включая несколько tokens. Без него
или при пустой строке используется `${prefixCls}-open`; у Popconfirm это по умолчанию
`ant-popover-open`. Класс добавляется к фактическому DOM trigger после hydration.
Собственные классы ребёнка сохраняются, при закрытии и unmount удаляются только
добавленные компонентом tokens. Обновление caller class во время показа не снимает
open class. SSR не клонирует непрозрачный children snippet; скрытый shell, стабильные
ID, native wrapper и ARIA-поведение сохраняются.

Настройки работают также в AvatarGroup.max.popover, Slider.tooltip и ellipsis Tooltip
Typography. Последний передаёт color и semantic styles общему popup.
Смена prefix сохраняет DOM, ввод, выделение и фокус; stylesheet удаляется вместе
с владельцем. Portal и native ограничения viewport остаются прежними, включая
заголовок Popover на узком экране и восстановление фокуса AvatarGroup.

