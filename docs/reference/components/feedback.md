# Подсказки, диалоги и обратная связь

## Tooltip

```svelte
<script lang="ts">
  import { Button, Tooltip, type TooltipRef } from 'antd-svelte';

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
Provider root styles и local styles.root идут после него;
без prop сохраняется тематический zIndexPopup. Настройки передаются single/range
Slider и ellipsis Tooltip Typography. В Typography disabled вычисляет сам ellipsis
и перекрывает значение из tooltip options, как в upstream. Общий source zIndex
context и порядок native top layer этим prop не меняются.

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
[SSR](../../../tests/package/tooltip-ref.ssr.test.ts) и
[browser](../../../tests/browser/tooltip-ref.spec.ts), `?fixture=tooltip-ref`.

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
[SSR](../../../tests/package/tooltip-actions.ssr.test.ts) и
[browser](../../../tests/browser/tooltip-actions.spec.ts), `?fixture=tooltip-actions`.

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
Удаление следует native закрытию без ожидания исходной CSS motion.

`forceRender=true` заранее монтирует скрытое содержимое после hydration и вызывает
getPopupContainer, даже без открытия и при disabled. При destroyOnHidden=true оно
сохраняет скрытое содержимое; выключение forceRender у закрытой подсказки удаляет
его. Новый force mount получает текущий payload, затем действует fresh cache.
ForceRender не открывает popup и не вызывает onOpenChange. Native shell сохраняется;
SSR при destroyOnHidden остаётся lazy, portal getter на сервере не вызывается.
Сверка: [19 UMD-сценариев и четыре consumer traces](../../../tests/browser/fixtures/ant-design-tooltip-lifecycle-reference.json),
[SSR](../../../tests/package/tooltip-lifecycle.ssr.test.ts) и
[browser](../../../tests/browser/tooltip-lifecycle.spec.ts), `?fixture=tooltip-lifecycle`.
У active range Slider сохраняется существующий один native shell до выбора ручки;
исходная conditional composition не подменяет его lifecycle.

Жизненный цикл сверяется с
[44 UMD-сценариями / 224 кадрами](../../../tests/browser/fixtures/ant-design-overlay-lifecycle-reference.json),
[SSR](../../../tests/package/overlay-lifecycle.ssr.test.ts) и
[browser](../../../tests/browser/overlay-lifecycle.spec.ts), `?fixture=overlay-lifecycle`.
Эталоны получены с отключённой motion из runtime CSS официального UMD.
Исходное lazy mount до первого открытия записано отдельно: существующий native
SSR и eagerly mounted default content остаются согласованной границей.
Title/overlay и fresh дополнительно сверяются с
[24 UMD-сценариями содержимого и 80 кадрами кэша](../../../tests/browser/fixtures/ant-design-tooltip-content-reference.json),
[SSR](../../../tests/package/tooltip-content.ssr.test.ts) и
[browser](../../../tests/browser/tooltip-content.spec.ts), `?fixture=tooltip-content`.
Исходные motion/UniqueProvider и оставшиеся delegated props ещё требуют переноса.

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
[числовой движок](../../../src/lib/tooltip-align-reference.test.ts),
[SSR](../../../tests/package/tooltip-align.ssr.test.ts) и
[browser](../../../tests/browser/tooltip-align.spec.ts), `?fixture=tooltip-align`.
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

Галерея находится на `/ant-design#tooltip`. Поддерживаются строки, числа и rich snippets.
Исходные motion/UniqueProvider и оставшиеся delegated props ещё не перенесены.
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
[unit](../../../src/lib/tooltip-options-reference.test.ts),
[SSR](../../../tests/package/overlay-options.ssr.test.ts) и
[browser](../../../tests/browser/overlay-options.spec.ts). Они включают настройки tokens,
обновления открытой карточки, оба режима range Tooltip и сохранение draft/focus.
Расчёт угловых позиций использует общий
[движок rc-trigger](../../../src/lib/popup-position.engine.ts). Координаты, CSS стрелки,
fractional sizes, flip history и смена placement проверяются по
[99 UMD-эталонам](../../../tests/browser/fixtures/ant-design-overlay-corner-reference.json),
[unit](../../../src/lib/tooltip-corner-reference.test.ts),
[SSR](../../../tests/package/overlay-corner.ssr.test.ts) и
[browser](../../../tests/browser/overlay-corner.spec.ts). Явные размеры в части эталонов
отделяют позиционирование от layout остальных компонентов.

### ConfigProvider и semantic slots

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

Проверки конфигурации:
[60 UMD-сценариев и 18 последовательностей событий](../../../tests/browser/fixtures/ant-design-overlay-config-reference.json),
[SSR](../../../tests/package/overlay-config.ssr.test.ts) и
[browser](../../../tests/browser/overlay-config.spec.ts).
Без component config поведение пустого trigger дополнительно сверяется с
[10 UMD-последовательностями / 130 кадрами](../../../tests/browser/fixtures/ant-design-overlay-empty-trigger-reference.json)
для controlled/default open и удаления focused содержимого:
[browser](../../../tests/browser/overlay-empty-trigger.spec.ts).
Tooltip.unique, motion, source zIndex context и остальные delegated rc-trigger props
ещё требуют переноса. Границы fresh cache для Snippet и CSS-transform/clipping описаны выше.

### Цвет Tooltip, Popover и Popconfirm

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

Проверки цвета: [129 UMD-сценариев и 12 вложенных поверхностей](../../../tests/browser/fixtures/ant-design-overlay-color-reference.json),
[engine](../../../src/lib/tooltip-color.engine.test.ts), [SSR](../../../tests/package/overlay-color.ssr.test.ts)
и [browser](../../../tests/browser/overlay-color.spec.ts). Эталоны цвета задают явные размеры
popup/anchor; геометрия проверяется отдельными наборами выше.

### Локальные префиксы и классы открытого trigger

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

Источник CSS — отдельные templates Tooltip (58 rules), Popover (72) и Popconfirm
(11); motion/unique этим этапом не переносились. Проверки:
[123 UMD-сценария / 172 кадра](../../../tests/browser/fixtures/ant-design-overlay-prefix-reference.json),
[CSS engine](../../../src/lib/overlay-prefix.engine.test.ts),
[SSR](../../../tests/package/overlay-prefix.ssr.test.ts) и
[browser](../../../tests/browser/overlay-prefix.spec.ts). UMD сам генерирует runtime CSS;
статический antd.css в этой сверке не подключается. Явные размеры popup/anchor
изолируют классы и оформление от измерения содержимого; trigger classes проверяются
также при закрытии. Точный React DOM и Svelte markers не сравниваются.

## Popover

```svelte
<script lang="ts">
  import { Button, Popover } from 'antd-svelte';

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
[Tooltip](#tooltip). Пустой hideAction отключает trigger/outside-закрытие,
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

`align`, `builtinPlacements` и `onPopupAlign` следуют правилам [Tooltip](#tooltip):
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

## Popconfirm

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
  import { Button, Popconfirm } from 'antd-svelte';

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

## Modal

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
[Сверка с официальным UMD](../theme-context.md#тема-modal) не означает
поддержку полного render/config API. Контекстные подтверждения описаны ниже.

GetContainer принимает DOM-узел, DocumentFragment (включая ShadowRoot), CSS-селектор,
функцию без аргументов либо false. Локальное undefined использует
ConfigProvider.getPopupContainer; Modal вызывает глобальный getter без trigger,
как Ant Design 6.6.8. False оставляет DOM на месте и отключает global fallback.
Без обеих настроек сохраняется прежнее native-размещение.

```svelte
<script lang="ts">
  import { Modal } from 'antd-svelte';
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

### Контекстные подтверждения Modal

`createModal()` и единственный `ModalHolder` заменяют React `Modal.useModal()`.
Holder размещается под нужным ConfigProvider: открытые подтверждения наследуют его
тему, локаль, RTL и контейнер, включая последующие изменения контекста.

```svelte
<script lang="ts">
  import { Button, ModalHolder, createModal } from 'antd-svelte';
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

## Drawer

```svelte
<script lang="ts">
  import { Button, Drawer, Input } from 'antd-svelte';

  let open = $state(false);
</script>

{#snippet footer()}<Button onclick={() => { open = false; }}>Закрыть</Button>{/snippet}

<Button onclick={() => { open = true; }}>Редактировать</Button>
<Drawer bind:open title="Карточка участника" {footer}>
  <label>Имя<Input defaultValue="Анна" /></label>
</Drawer>
```

Drawer v1 — модальная панель на нативном dialog. `bind:open` передаёт запрос
видимости владельцу; без binding компонент может закрываться самостоятельно.
Начальное open=true подготавливает содержимое в SSR и открывает настоящий
модальный dialog после гидратации. Атрибут open не выводится в SSR, чтобы
избежать промежуточного немодального окна.

Title принимает строку или пассивный Snippet, children/extra/footer — Snippet.
Заголовок использует h2; интерактивные действия размещайте в extra/footer.
Без footer нижняя область отсутствует. Без title именуйте dialog через
aria-label или aria-labelledby. Внешнее aria-labelledby имеет приоритет;
aria-label заменяет автоматически созданную связь с визуальным title.
Aria-describedby связывает внешнее описание. Id/class/style относятся к
корневому dialog; дополнительные semantic classNames/styles не поддерживаются.

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

Closable=false убирает кнопку закрытия. Keyboard=false отключает закрытие по
Escape. Mask принимает объект с closable (по умолчанию true) и blur (false).
Закрытие по фону требует начала и конца основного pointer-действия на фоне;
перетаскивание из панели или в панель не закрывает её. Маска всегда включена,
фон страницы остаётся inert. Drawer не наследует disabled от Form/ConfigProvider;
его поля и пользовательские кнопки получают собственный контекст.

Пользовательское закрытие сначала записывает open=false в binding, затем
вызывает onClose(Event) один раз: click для кнопки, cancel для Escape,
pointerup для фона. Callback уведомляет о запросе и не отменяет его.
Изменение open владельцем, нативный dialog.close() и удаление компонента
не вызывают onClose. Нативное закрытие синхронизирует binding; позднее событие
старого закрытия не закрывает заново открытый dialog.

При открытии фокус получает первый доступный control; без controls — сам
dialog. Нативная модальность удерживает фон inert и ограничивает Tab;
после закрытия фокус возвращается к доступному opener. Select, Tooltip и
Popover потребляют свой Escape раньше Drawer. Поддерживается стек с Modal
и другими модальными Drawer без push. Прокрутка страницы заблокирована,
пока остаётся открытый модальный Drawer или Modal.

Содержимое ленивое и после первого открытия сохраняет локальный state и
DOM-черновики в закрытом dialog. ForceRender монтирует его сразу и сохраняет
даже при destroyOnHidden. DestroyOnHidden удаляет header/body/footer после
завершения ухода панели; отключение настройки не монтирует уничтоженное
содержимое заново. Удаление Drawer уничтожает его содержимое и освобождает
модальность. Состояние, хранимое снаружи, не сбрасывается.
Сохранённые скрытые поля остаются в DOM и нативной FormData своей формы;
их таймеры и подписки продолжают работать. Для фокуса ошибки закрытую панель
сначала должен открыть владелец формы.

Панель выдвигается от выбранной стороны, маска меняет прозрачность.
При запросе закрытия dialog сохраняет модальность до завершения анимации.
Повторное открытие прерывает уход без уничтожения черновика. Reduced motion
отключает анимацию; изменение этой настройки завершает текущую анимацию.
`theme.components.Drawer` настраивает zIndexPopup, footerPaddingBlock и
footerPaddingInline, aliases и component algorithms. Пользовательский style
корневого dialog сохраняет приоритет. Title наследует цвет панели, как 6.6.8;
Button и Input внутри сохраняют собственные tokens. DraggerSize вычисляется
как в upstream, но resize-handle пока не реализован.
Обновление темы и inherit reset сохраняют модальность, DOM, draft, selection
и focus, в том числе после переноса через getContainer. Оформление по умолчанию
сохраняется. [Сверка с UMD и проверки](../theme-context.md#тема-drawer)
учитывают типографику внешнего ConfigProvider: в React она задана на статическом
host через публичный theme.useToken(), в Svelte — на DOM-контейнере provider.

Галерея `/ant-design#drawer` редактирует строку Table через Form с валидацией,
Tabs и Collapse. Черновик сохраняется при закрытии той же карточки; переход
к другому участнику создаёт отдельный редактор. DestroyOnHidden пересоздаёт
редактор из сохранённой строки. Сохранение обновляет Table и закрывает панель.
Первая версия не поддерживает немодальный режим, mask=false, resizable, push,
loading/Skeleton, focusable и afterOpenChange.

GetContainer поддерживает те же DOM-узлы, DocumentFragment, selectors, функции и
false, что [Modal](#modal). Undefined наследует ConfigProvider.getPopupContainer;
Drawer передаёт ему document.body, как Ant wrapper. Getter вызывается и в закрытом
состоянии, кроме destroyOnHidden без forceRender, пока содержимое не требуется.
Смена контейнера пересоздаёт панель и отменяет прежнюю анимацию; замена функции
с тем же контейнером сохраняет DOM/state/focus. Нативные SSR, lifecycle children,
модальность и fullscreen-геометрия сохранены. Source absolute-размещение inline
Drawer при getContainer=false ещё не перенесено: false пока выбирает исходную
DOM-ветку. Эталон — @rc-component/drawer 1.4.2 и portal 2.1.3;
[LICENSE.rc-drawer](../../../src/lib/vendor/LICENSE.rc-drawer) сохранена в пакете.

## Alert

```svelte
<script lang="ts">
  import { Alert, Button } from 'antd-svelte';

  let revision = $state(0);
</script>

{#key revision}
  <Alert
    type="warning"
    title="Есть несохранённые изменения"
    description="Сохраните настройки перед выходом."
    showIcon
    closable
  />
{/key}
<Button onclick={() => { revision++; }}>Показать сообщение снова</Button>
```

Type поддерживает success/info/warning/error, по умолчанию info. Variant —
outlined или filled; filled сохраняет фон статуса и убирает видимую рамку.
Banner убирает рамку и скругления; без явно заданных type/showIcon использует
warning и видимую иконку. В обычном режиме showIcon=false.

Title/description/icon/action принимают строку, число, boolean, null, Snippet
и вложенные массивы такого содержимого. Null/undefined/false/пустая строка не
создают title/description/actions; 0, true и массивы создают контейнеры,
но boolean не выводится текстом. Явные 0/false/пустая строка сохраняются. Snippet
считается присутствующим; условное отсутствие содержимого выражайте через
undefined у владельца. Description включает увеличенные отступы и иконку.
Icon декоративный и отображается только при showIcon, включая пользовательский
snippet. Для интерактивных controls используйте description/action;
icon и closable.closeIcon не должны содержать интерактивных элементов.
Действия не закрывают Alert и не вызывают callbacks закрытия.

Без ConfigProvider.alert закрытие отключено по умолчанию. True добавляет кнопку type=button с
ConfigProvider.locale.closeText. Объект дополнительно поддерживает disabled,
closeIcon (строка или Snippet), aria-label/aria-labelledby/aria-describedby,
onClose(MouseEvent) и afterClose(). Пользовательский текст closeIcon остаётся
декоративным содержимым; доступное имя задаётся через aria-label или локаль.
Явный boolean closable приоритетнее context, а объект включает кнопку.
Содержимое задаёт truthy local closable.closeIcon, затем context closable.closeIcon.
Пустой local closable.closeIcon='' сохраняет пустую кнопку; Source выбирает fallback.
Callbacks задаются в локальном closable.
Disabled запрещает закрытие, сохраняя действия. Alert не наследует disabled
от Form/ConfigProvider; вложенные controls используют собственный контекст.

Enter/Space и нажатие на кнопку запускают закрытие ровно один раз. OnClose
уведомляет о запросе и не отменяет его через preventDefault; callbacks
фиксируются на момент запроса. После onClose панель плавно сворачивается.
Во время ухода содержимое остаётся в DOM, но получает inert и aria-hidden.
AfterClose вызывается после удаления содержимого, включая при reduced motion.
Удаление или замена компонента отменяет анимацию и ожидающий afterClose.
При включении reduced motion текущий уход завершается сразу.

Закрытый экземпляр остаётся закрытым при изменении props. Для повторного показа
создайте новый экземпляр через условное монтирование или новый key; публичного
open/bind:open нет. Изменение типа и содержимого открытого сообщения сохраняет
его дочерние экземпляры. SSR показывает открытое сообщение без вызова callbacks;
анимация запускается только при пользовательском закрытии.

Role по умолчанию alert с неотложным объявлением, как в Ant Design. Для обычного
результата действия задавайте role=status с мягким объявлением. Aria-atomic=true
по умолчанию; aria-live и aria-atomic можно переопределить. Aria-label,
aria-labelledby и aria-describedby именуют и описывают корневой контейнер.
Id/class/style, data-* и остальные aria-* также относятся к корню.
OnClick/onMouseEnter/onMouseLeave уведомляют о событиях контейнера; controls остаются
нативными, stopPropagation в onClose предотвращает root click. Появление и обновление не перемещают
фокус. При закрытии фокус из сообщения переходит к следующему доступному control
в DOM, затем к предыдущему либо содержащему нативному dialog. Поиск внутри
Modal/Drawer ограничен активным dialog. Фокус снаружи и фокус, выбранный onClose
у владельца, сохраняются. Иконки не добавляют остановок Tab. Кнопка закрытия
использует естественную клавиатуру и не отправляет окружающую форму;
тип пользовательских action-кнопок задаёт их владелец.

ConfigProvider.alert поддерживает variant, closable с closeIcon, четыре status icons,
class/style и object/function classNames/styles для root/icon/section/title/
description/actions/close. Undefined наследует record, явный объект заменяет его
целиком. Callbacks получают входные props с разрешёнными prefixCls/variant/type/
showIcon/boolean closable. Root style priority: provider.styles.root → provider.style
→ local.styles.root → local.style. Local prefixCls/rootClassName и bind:nativeElement/ref
поддержаны; refs присваиваются после mount и очищаются при unmount. Ref хранит snapshot
root, включая отсоединённый узел после закрытия; nativeElement отражает текущий DOM.
Обновления оформления сохраняют DOM, поля, focus и selection.

Все четыре [токена Alert](../theme-context.md#токены-alert), aliases и
component algorithm применяются перед semantic/user styles. Source theme использует
fitted viewBox статусных иконок из icons-svg 4.6.0; legacy сохраняет прежний viewport.
На ширине
до 575px action переносится на отдельную строку, оставляя место длинному тексту.
Кнопка закрытия имеет зону не меньше 24px. Галерея `/ant-design#alert` показывает
настройки сообщения, действие и повторное создание закрытого экземпляра.
Ошибка загрузки `/ant-design#server-table` использует Alert с прежним retry:
текущая страница и query сохраняются.

94 официальных UMD-сценария фиксируют API, computed styles, геометрию status icons,
порядок callbacks и исходные corner cases. Отдельный свежий SSR baseline подтверждает
прежний пустой local closeIcon. Сохранены native atomic/ARIA, локализованное имя,
декоративный close wrapper/glyph/palette, hit target и responsive/focus guards.
WAAPI закрытие сохраняет snapshot callbacks, afterClose после удаления и reduced motion;
в Source afterClose видит ещё подключённый узел. Эти различия исключены из source metrics.
Alert.ErrorBoundary возвращает здоровые children без контейнера. Ошибка дочернего
render или синхронного effect заменяет их на Alert type=error. Title ?? Error.toString()
задаёт заголовок; description ?? Error.stack выводится внутри
pre с font-size:0.9em и overflow-x:auto. Явные 0/false/пустая строка сохраняются,
id относится только к fallback. Изменение props обновляет тот же Alert, но не
сбрасывает ошибку даже при здоровых новых children; для сброса нужен remount/key.
Ошибку самого fallback ловит внешняя ErrorBoundary. Event handlers, отдельные
Promise/timer callbacks и SSR ошибки эта граница не перехватывает, как исходник.
Безопасный SSR сохраняет DOM/focus/selection при hydration, затем умеет показать fallback.

Вместо React componentStack используется доступный Error.stack Svelte/JavaScript;
React recovery diagnostics не воспроизводятся. Эти framework differences отделены
от [16 официальных сценариев](../../../tests/browser/fixtures/ant-design-alert-boundary-reference.json),
SSR, hydration и lifecycle-проверок. Общий ConfigProvider prefix поддержан;
React diagnostics ещё не перенесены.

## Message

Создавайте экземпляр у владельца, чтобы компоненты и SSR-запросы не разделяли
очередь. Один экземпляр поддерживает один смонтированный MessageHolder:

```svelte
<script lang="ts">
  import { Button, MessageHolder, createMessage } from 'antd-svelte';

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

Open принимает MessageConfig с обязательным content. Методы info/success/warning/
error/loading принимают строку, пассивный Snippet или объект с content. После
первого аргумента можно передать duration и onClose, либо сразу onClose.
Типизированный метод задаёт свой type; open без type использует info.
Icon принимает декоративный Snippet; по умолчанию используются filled-иконки
статусов и вращающийся loading. Class/style относятся к отдельному сообщению.
Snippet содержимого и иконки должен обходиться без ссылок, кнопок и полей ввода.

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
`MessageHolder.prefixCls` меняет namespace списка и всех сообщений; пустая строка
наследует ConfigProvider.prefixCls. В App тот же параметр задаётся через message.
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
legacy-оформление сохраняется. [Проверки и исходные замеры](../theme-context.md#тема-message).

Прежние min-width:0/overflow-wrap:anywhere у title сохранены. В официальной
6.6.8 длинное неразрывное слово дало scrollWidth 3871px при карточке 1352px;
это [отдельное наблюдение upstream](../../../tests/browser/fixtures/ant-design-message-wrap-observation.json).
Raw CSS эталона не изменены; browser-сравнение явно учитывает только это отличие переноса.

Нативный manual popover показывает обычный вертикальный список по центру сверху.
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
для сообщений другого контекста. Галерея `/ant-design#message` показывает
loading → success/error, повтор, последовательные сообщения и отмену при сбросе.

В первой версии нет глобального static API/config, getContainer, collapsing
stack, других положений, интерактивных действий и semantic classNames/styles.

## Notification

Создавайте экземпляр у владельца и размещайте один NotificationHolder в нужном
контексте ConfigProvider. Очереди компонентов и SSR-запросов независимы:

```svelte
<script lang="ts">
  import { Button, NotificationHolder, createNotification } from 'antd-svelte';

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
void. Open без type не добавляет статусную иконку; типизированные методы задают
свой type. Title/description принимают строку или Snippet; пустые строки не
создают соответствующую область. Actions — интерактивный Snippet, действия не
закрывают уведомление автоматически. Icon и closeIcon декоративные; используйте
actions/description для кнопок, ссылок и полей ввода. Class/style относятся к
карточке. Корень поддерживает aria-label/aria-labelledby/aria-describedby;
по умолчанию доступное имя связано с title, описание — с description.

Duration задаётся в секундах, по умолчанию 4.5. Значения 0 и false отключают
автоудаление; отрицательные и неконечные значения используют default.
CreateNotification фиксирует defaults duration, pauseOnHover=true, placement и
maxCount. Конфигурация карточки переопределяет duration/pauseOnHover/placement.
Наведение сохраняет оставшееся время; pauseOnHover=false разрешает отсчёт при
наведении. Фокус внутри всегда приостанавливает таймер, включая переходы Tab
между действиями и обновление ключа. Отсчёт продолжается после ухода фокуса и,
если включена hover-пауза, указателя. Touch не включает hover-паузу.

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

ProgressBg подготавливается, но showProgress пока отсутствует. Локальные CSS variables
другого prefix разрешаются на notice; пользовательские variables Holder имеют приоритет.
Обновления сохраняют viewport styles, очередь, deadlines, actions DOM, draft/focus/selection.
Actions находятся на уровне корня, как в эталоне; wrapper выводится только с иконкой,
section — только для пары title/description. Legacy grid сохраняет прежние отступы
и расположение. Source flow-root сохраняет высоту float actions
при native relative positioning; тема переключается без пересоздания controls.
[Сверка и проверки](../theme-context.md#тема-notification).

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

Галерея `/ant-design#notification` готовит CSV-отчёт, обновляет уведомление по
ключу, скачивает настоящий файл и предлагает повтор после ошибки. Сброс и
удаление примера отменяют ожидающий результат и освобождают download URL.
Подготовка показывает Progress с этапами 0 → 25 → 65 → 90 → 100 и кнопкой
отмены. Отмена сохраняет достигнутый процент; повтор начинает новую попытку с 0.

Первая версия не поддерживает collapsing stack, showProgress, getContainer,
глобальный static API/config, onClick на карточке и semantic classNames/styles.
Устаревшие message/btn заменены title/actions.

## Progress

Компонент отображает переданный percent и не запускает работу самостоятельно:

```svelte
<script lang="ts">
  import { Progress } from 'antd-svelte';

  let percent = $state(42.5);
</script>

<Progress {percent} aria-label="Подготовка отчёта" />
<Progress type="circle" {percent} size={120} aria-label="Проверка файлов" />
```

Type по умолчанию line, также поддерживаются circle и dashboard. Percent по умолчанию 0;
конечные значения ограничиваются 0–100 без округления. Undefined, NaN и ±Infinity
заменяются на 0. Отображение, ширина/дуга и aria-valuenow используют одно
нормализованное значение. Percent не bindable; владелец операции передаёт
обновления через props. У Progress нет собственных таймеров и callbacks работы.

Status поддерживает normal/success/exception/active. Без явного
status значение 100 включает success, остальные значения — normal. Явный
normal/exception/success сохраняется при любом проценте. Active добавляет
декоративную анимацию line и не изменяет percent; circle/dashboard с active остаются
статичными. Success/exception показывают декоративную иконку вместо
подписи, если не задан format. Цвета статусов используют токены темы.

ShowInfo=true по умолчанию. Format получает нормализованный percent и может вернуть
строку, число или пассивный Snippet. При success либо format.length > 1 вторым аргументом
передаётся нормализованный success percent (по умолчанию 0). Прежний callback с
format.length <= 1 без success получает один аргумент, как раньше. Callback вычисляется
один раз; строка/число используются в aria-valuetext. Для Snippet доступное значение
сохраняет числовой percent; его можно уточнить через aria-valuetext. HTML в строке экранируется. При showInfo=false
подпись скрывается, доступные значения сохраняются. Длинная внешняя текстовая подпись
сокращается многоточием; полный текст остаётся в title и aria-valuetext. Это сохранённый
native contract: при size=24 подпись ограничена 12px, тогда как React допускает её выход
за body. В line статусные иконки используют исходную SVG-область и не получают текстовую обрезку.

Size по умолчанию medium. Для line medium/small задают высоту 8/6px; число
задаёт ширину и высоту в px. Пара [width, height] и объект { width?, height? }
настраивают line отдельно: ширина — число в px или CSS-строка, по умолчанию
100%, высота — положительное конечное число. Невалидные числовые размеры
заменяются defaults. Например, size={{ height: 4 }} сохраняет ширину 100%.
Доступная ширина контейнера ограничивает индикатор на узких экранах.

Для circle/dashboard size принимает medium=120px, small=60px или положительный конечный
диаметр в px. Совместимая пара использует первый размер. Невалидный диаметр заменяется
на 120px. SVG сохраняет пропорции и помещается в контейнер. При диаметре ≤20px подпись
показывается в Tooltip; доступные значения сохраняются, остановка Tab не добавляется.
Подпись Tooltip создаётся при первом открытии и сохраняется при закрытии.
Контейнер подсказки наследуется из ConfigProvider; по умолчанию это body либо
родительский native modal. Подпись сохраняет цвет Tooltip и доступное имя из содержимого.
У circle strokeWidth задаётся в процентах viewBox; default — не меньше 6% и 3px при заданном диаметре.
Невалидное значение использует default, чрезмерное ограничивается 99.9%, чтобы
радиус оставался положительным. Нулевой процент не рисует цветной дуги.
При сжатии контейнер круга сохраняет квадрат и центрирование подписи. Явный
styles.body.width сохраняет исходную высоту; styles.body.height задаёт её напрямую.
CSS-геометрия следует @rc-component/progress 1.0.3: круглые концы корректируют длину
сегмента, а быстрые обновления с интервалом менее 100ms отключают переход. Числовые
dash attributes сохраняют прежнюю геометрию для измеряющих её consumers; видимую дугу
определяют CSS declarations. Минимальная толщина вычисляется в исходном порядке операций.

StrokeColor/railColor принимают CSS-цвета и переопределяют цвет заполнения/фона,
включая при success/exception.
Для line strokeColor также принимает { from, to, direction? } или record процентных
stops: ключи сортируются по исходному parseFloat, direction по умолчанию to right/to left
в LTR/RTL. В обычном line массив strokeColor использует первый цвет; в steps цвета
применяются по индексу. Gradient object в line steps игнорируется, как upstream. StrokeLinecap поддерживает round/butt/square;
у line butt/square убирают скругления, у circle задают SVG stroke-linecap.
Круговой градиент использует record процентных stops, SVG mask и conic/linear background;
порядок ключей сохраняется, концы становятся butt. From/to не преобразуются в процентные
stops, как и в исходном круговом renderer.
Темы и compact используют существующие токены. RTL меняет начало заполнения
line на правое и направление active-анимации; circle сохраняет обход по часовой
стрелке. Reduced motion отключает active-анимацию и переходы значений/цвета.

Корень имеет role=progressbar и aria-valuemin=0/aria-valuemax=100. Доступное имя
по умолчанию берётся из locale.progress.label; задавайте aria-label либо
aria-labelledby для конкретной операции. Aria-describedby связывает пояснение.
Без format aria-valuetext содержит процент и локализованный success/exception;
явный aria-valuetext имеет приоритет. Locale.progress поддерживает label,
successText и exceptionText, включая частичные переопределения; отсутствующие
поля используют ruRU. Иконки, подпись и SVG декоративные.

Progress не создаёт live region, остановку Tab и обработчики клавиатуры, не
захватывает фокус и не блокирует Escape содержащего Modal/Drawer.
ConfigProvider.disabled не скрывает обратную связь. Id/class/style относятся
к корню. SSR сразу выводит корректные значения и SVG-геометрию без таймеров
и DOM-измерений; независимые экземпляры не разделяют состояние.

Галерея `/ant-design#progress` связывает line/circle со Slider и InputNumber,
показывает статусы, размеры и форматирование. `/ant-design#notification`
использует Progress для экспорта: модель notification-export.model.svelte.ts
владеет процентом и этапами, отменяет ожидающие callbacks при отмене/сбросе/
unmount и защищает повтор от результата предыдущей попытки. Скачиваемый CSV
и успешное завершение через 700ms сохранены.

Line поддерживает success={{ percent, strokeColor? }} как отдельный track поверх основного.
Наличие success.percent определяет автоматический status вместо общего percent, в том числе
при success.percent=0. Длины обоих tracks ограничиваются отдельно; success может выходить
за основной track, как в upstream. Высота line задаётся через size.

Steps задаёт число отдельных элементов line. Math.round определяет активное количество;
rounding получает steps*percent/100. Size задаёт размер одного элемента, а не общей полосы.
По умолчанию ширина 14px (2px при small), высота 8px. Object steps использует
count; gap в этой ветке не меняет интервалы. PercentPosition выбирает start/center/end и
inner/outer. Внутренняя подпись всегда текстовая, в том числе при success/exception;
яркость первого заданного цвета выбирает контраст подписи по исходному FastColor.

ConfigProvider.progress задаёт class/style и object/function classNames/styles для
root/body/rail/track/indicator. Undefined наследует record, явный объект заменяет его.
Callbacks получают props с defaults для type/percent/size/showInfo/percentPosition.
Provider styles.root → provider style → local styles.root → local style сохраняют приоритет;
styles отдельных частей применяются после вычисленных размеров/цветов.
PrefixCls меняет BEM classes; undefined/пустая строка наследуют ConfigProvider.prefixCls
(по умолчанию ant-progress).
Bind:nativeElement возвращает текущий root после mount и очищается при unmount.
Тема Progress подключает шесть исходных component tokens, aliases/algorithm и CSS-variable
prefix/key/hash; переменные идут перед semantic/user styles.

Dashboard использует gapDegree=75, circle — 0. GapPlacement принимает top/bottom/start/end;
start/end учитывают RTL. Для circle с положительным gapDegree задавайте placement:
без него исходный renderer не применяет rotation. Success у круга рисуется отдельным
сегментом перед остатком percent-success, с исходным порядком наложения.

Круговые steps используют Math.round независимо от rounding. Object steps задаёт count/gap,
по умолчанию промежуток 2 единицы viewBox; отдельная непрерывная rail не рисуется.
Success вычитается из процента перед расчётом активных steps. Сохранены особенности
6.6.8: без railColor неактивные steps наследуют основной stroke, а градиентные steps
ссылаются на отсутствующее gradient definition. Эти случаи входят в source-проверки.

[Эталоны line/steps](../../../tests/browser/fixtures/ant-design-progress-line-reference.json)
сняты из официального UMD в стандартном режиме браузера для 65 сценариев.
Для узкого size=24 отдельно сохранён
[эталон native clipping](../../../tests/browser/fixtures/progress-native-clipping-reference.json)
из свежей сборки прежнего коммита библиотеки. Для circle/dashboard есть
[69 UMD-сценариев и transition trace](../../../tests/browser/fixtures/ant-design-progress-circle-reference.json).
Сохранены native finite bounds, clipping длинной подписи и числовые SVG attributes;
Tooltip использует существующую Svelte-обёртку. Общий ConfigProvider prefix поддержан;
React development warnings остаются следующим этапом. Исходная лицензия
[@rc-component/progress](../../../src/lib/vendor/LICENSE.rc-progress) включена в пакет.

## Spin

```svelte
<script lang="ts">
  import { Button, Input, Spin } from 'antd-svelte';

  let loading = $state(false);
  let draft = $state<string | undefined>('Анна');
</script>

<Button onclick={() => { loading = !loading; }}>Переключить загрузку</Button>
<Spin spinning={loading} delay={200} description="Обновляем профиль…" aria-label="Профиль">
  <label for="profile-name">Имя</label>
  <Input id="profile-name" bind:value={draft} />
</Spin>
```

Без children Spin показывает отдельный индикатор; spinning по умолчанию true.
С children компонент сохраняет их DOM и локальное состояние между загрузками.
Запросами, результатом и отменой операции управляет владелец; Spin отображает
переданный spinning и не выполняет запросов.

Delay задаётся в миллисекундах и откладывает только индикатор. Busy-контент
сразу получает inert и aria-busy=true, даже когда индикатор ещё скрыт.
Положительная конечная задержка округляется вниз и ограничивается 2147483647;
отрицательные, NaN и Infinity означают 0. При короткой загрузке индикатор не
появляется. Изменение spinning или нормализованной delay отменяет старый таймер;
новая задержка отсчитывается заново, в том числе после показа индикатора.
Изменение содержимого, подписи или размера не перезапускает задержку.
Unmount отменяет таймер; SSR не создаёт таймеров и скрывает отложенный индикатор.

Size принимает small, medium и large с точками 14, 20 и 32px по умолчанию. Без size
используется ConfigProvider.componentSize.
`theme.components.Spin` меняет размеры независимо от других компонентов. Поддерживаются темы,
compact, primary, RTL и динамический prefers-reduced-motion. Стандартная анимация
и CSS-анимации/переходы внутри indicator отключаются при reduced motion;
таймерами, SVG/JavaScript-анимацией собственного snippet управляет его владелец.
Высота wrapper определяется содержимым.

Description принимает строку, число или пассивный Snippet.
Indicator — пассивный Snippet, заменяющий четыре точки.
Он получает аргумент { percent, prefixCls, class, style }; прежние snippets без аргументов
работают как раньше. В отличие от React cloneElement, Svelte не клонирует содержимое snippet:
класс dot и semantic style применяются к декоративному span вокруг него. Строки экранируются. Indicator декоративный, без controls
и остановок Tab. Id/class/style относятся к корню. Отдельный индикатор можно
сделать декоративным через aria-hidden, когда текстовый статус уже есть рядом.

Видимый индикатор использует role=status, polite и atomic. Wrapper — именованная
group; её status находится рядом с busy-контентом, вне inert. Объявление не
охватывает форму. Имя задаётся aria-label/aria-labelledby; без них используется
строковая description или Locale.spin.loadingText. Для snippet-description
нужно содержательное доступное имя. ruRU/enUS включают «Загрузка…»/«Loading…»;
частичная locale.spin использует ruRU для отсутствующих полей.

Если фокус был внутри блокируемых children, он временно переходит на wrapper
с tabindex=-1, вне обычного Tab. После загрузки он возвращается в прежний
доступный control, затем в доступный control внутри children или соседний control
текущего dialog/документа. Если пользователь уже перевёл фокус наружу, Spin
его не возвращает. При unmount сфокусированного wrapper используются сохранённые
доступные соседи. Escape остаётся у содержащего Modal/Drawer.
ConfigProvider.disabled не скрывает обратную связь.

Table использует отдельный декоративный Spin в существующей строке загрузки.
Текстовый status, aria-busy таблицы, блокировка её controls и данные сохранены;
таблица не оборачивается в Spin.

Галерея `/ant-design#spin` показывает размеры, задержку, быстрый/медленный ответ,
сохранение имени, checkbox и счётчика, ошибку с Alert/retry, отмену и сброс.
При retry фокус переходит с удаляемой кнопки Alert на карточку профиля.
Её [модель](https://woodger.org/ant-design#spin) отменяет
ожидающий результат при cancel/reset/unmount и защищает новую попытку от старой.

Fullscreen добавляет фиксированный backdrop в текущей DOM-ветке. Он не использует portal,
не блокирует внешний документ через inert и не перехватывает фокус. При spinning=false
корень остаётся в DOM с opacity=0 и pointer-events=none; отдельный обычный Spin по-прежнему
использует hidden. Для children сохраняется описанная выше блокировка и восстановление фокуса.

Percent принимает число или auto. Число ограничивается 0–100 для SVG-кольца; дробная часть
сохраняется. При нуле показываются четыре точки; после первого ненулевого percent кольцо
остаётся смонтированным и скрывается при возврате к нулю. Как в upstream, SVG появляется
после mount и отсутствует в SSR. Auto обновляется каждые 200 мс после появления индикатора:
5%, 3% и 1% от остатка до 100 при текущем значении до 30, 70 и 96 включительно.
Значение останавливается на 96.01238963686535; новый цикл видимой загрузки начинает с нуля.
Переход к числу, остановка и unmount освобождают interval. Размер, описание, тема и prefix
не перезапускают auto.

ConfigProvider.spin задаёт indicator, class/style и object/function classNames/styles.
Undefined наследует record целиком; явный объект, включая {}, заменяет родительский.
Локальный indicator имеет приоритет над provider, затем Spin.setDefaultIndicator(snippet).
Статический setter хранит модульный fallback, принимает null/undefined для сброса и сам
не обновляет смонтированные Spin: новое значение читается при следующем обновлении props.
Semantic callbacks получают нормализованные size, spinning, description, fullscreen и
числовой percent. Поддержаны root, section, indicator, description и container.
Provider styles.root → provider style → local styles.root; для standalone затем идут section,
а локальный style применяется последним. RootClassName, native attrs/events, bind:nativeElement
и bind:ref с nativeElement сохраняются при обновлениях; refs очищаются при unmount.

PrefixCls меняет BEM classes; undefined/пустая строка наследуют ConfigProvider.prefixCls
(по умолчанию ant-spin). CSS template из
35 правил закреплённого архива сохраняет namespace переменных и изолирует root defaults.
Component tokens, aliases, algorithm и CSS-variable prefix/key/hash работают через общий
[контекст темы](../theme-context.md#токены-spin).
Сверка 49 Source-профилей и auto timeline принадлежит библиотеке; примеры потребителя
не заменяют эти проверки. Сохранённые native delay/inert/focus/ARIA и reduced motion — явные
отличия от React. Общий ConfigProvider prefix поддержан; React development warnings
ещё не перенесены.

## Skeleton

```svelte
<script lang="ts">
  import { Skeleton } from 'antd-svelte';

  let loading = $state(true);
</script>

<Skeleton {loading} active avatar paragraph={{ rows: 3 }} aria-label="Профиль участника">
  <p>Анна — разработчик.</p>
</Skeleton>
```

Skeleton показывает структуру будущего содержимого при первой загрузке.
Loading по умолчанию true; active и round — false, avatar — false,
title и paragraph — true. При loading=true children не монтируются;
при переходе к false монтируется Snippet children. Повторный переход к true
размонтирует содержимое и уничтожает его локальное состояние и нативные черновики.
Данные, которые должны переживать такую замену, хранит владелец. Для обновления
уже показанной формы используйте Spin с сохранёнными children.

Avatar принимает boolean или объект с shape=circle/square и size=small/medium/
large либо числом в px. По умолчанию составной Skeleton использует large:
40px, compact — 36px. Small/medium соответствуют control-height-sm/control-height;
ConfigProvider.componentSize не меняет выбранный размер. Без paragraph, но с
title автоматическая форма square, в остальных случаях circle. Числовой размер
0 допустим; отрицательный или неконечный размер использует large.

Title принимает boolean или { width }; paragraph — boolean или { rows, width }.
Ширина — неотрицательное число в px или CSS-строка. Для title по умолчанию
используется 38% без avatar и 50% с avatar при наличии paragraph; без paragraph
заголовок занимает полную ширину. Paragraph по умолчанию содержит три строки
без avatar при наличии title, в остальных сочетаниях — две.
Скалярная ширина задаёт последнюю строку; массив задаёт ширину каждой строки.
Пропущенные элементы массива используют обычные CSS-правила, включая стандартные
61% для последней строки из трёх и более. Без avatar или title последняя строка
также получает 61%. Rows округляется вниз и ограничивается 1000; 0 допустим,
отрицательные/NaN/Infinity используют рассчитанное число строк по умолчанию.
Пустые строки и некорректные числовые ширины используют значения по умолчанию.

Round скругляет title и строки paragraph. Active включает CSS-анимацию;
prefers-reduced-motion отключает её динамически. Каркас наследует цвета,
плотность и направление из ConfigProvider. Аватар основного каркаса сохраняет пропорцию 1:1;
большие размеры и ширины ограничены доступным контейнером. Компонент не
выполняет запросов, не создаёт таймеров и не измеряет DOM для разметки.
SSR сразу выводит каркас или готовое содержимое согласно loading.

Корень — постоянная именованная group; id/class/style и aria-label/labelledby/
describedby относятся к ней. Busy-контейнер получает aria-busy; отдельный
status вне него объявляет Locale.skeleton.loadingText с polite/atomic.
Плейсхолдеры декоративные, без доступных заголовков, controls и остановок Tab.
Ru/en-тексты — «Загрузка…»/«Loading…»; отсутствующие поля locale.skeleton
используют ruRU. Для статического превью aria-hidden скрывает всю группу и
подавляет status. ConfigProvider.disabled не скрывает обратную связь.

ConfigProvider.skeleton задаёт class/style и object/function classNames/styles.
Вложенный record заменяется целиком; undefined наследует родительский.
Semantic slots root/header/section/avatar/title/paragraph объединяются с локальными;
callbacks получают defaults avatar=false, title=true, paragraph=true и исходные
optional props, включая отсутствующие active/loading.
Root styles применяются в порядке context styles.root → context style → local styles.root.
Существующие локальные class/style остаются на постоянной group. Новые rootClassName,
context class/style и semantic root относятся к декоративному каркасу и отсутствуют
при loading=false. Это сохраняет прежний native контракт без дублирования padding.

Локальный prefixCls меняет BEM-классы каркаса; иначе он наследует ConfigProvider
(по умолчанию ant-skeleton);
переменные темы сохраняют свой namespace. Вложенные avatar/title/paragraph принимают
class и prefixCls, которые заменяют соответствующие semantic class и default prefix,
как при spread в исходнике. Их style заменяется объединённым semantic style;
для оформления этих частей используйте styles.avatar/title/paragraph.
Bind:nativeElement указывает на div каркаса, при loading=false и unmount очищается
до undefined. Bind:ref даёт объект с nativeElement, равным null без каркаса;
при unmount сам ref очищается до undefined. Refs не присваиваются при SSR.

Если loading удаляет сфокусированные children, фокус предварительно переходит
на постоянную group с tabindex=-1. Он остаётся там после завершения; Tab входит
в новое содержимое. Skeleton не фокусирует новые controls автоматически и не
меняет фокус, выбранный снаружи. При unmount припаркованный фокус переходит к
доступному сохранённому соседу в текущем dialog/документе. Escape остаётся
у содержащего Modal/Drawer.

Галерея `/ant-design#skeleton` настраивает каркас и показывает первую загрузку,
быстрый ответ, ошибки с Alert/retry, отмену и сброс. После получения данных
обновления используют Spin и сохраняют имя, checkbox, счётчик и DOM карточки.
Примеры Skeleton и Spin используют одну
[модель загрузки](https://woodger.org/ant-design#spin),
которая отменяет ожидание при cancel/reset/unmount и защищает новую попытку
от старого результата. При retry фокус переходит на постоянную группу карточки.

Самостоятельные `Skeleton.Avatar`, `Skeleton.Button`, `Skeleton.Input`, `Skeleton.Image`
и `Skeleton.Node` доступны также как SkeletonAvatar/Button/Input/Image/Node. Это одни
и те же Svelte-компоненты. Avatar/Button/Input наследуют componentSize; локальный size
имеет приоритет, включая 0 у Avatar. Поддержаны small/medium/large;
Avatar принимает числовой размер. У основного Skeleton default avatar остаётся large.

Button принимает circle/square/round/default и block; Input поддерживает block.
Это span-плейсхолдеры, которые не добавляют button/input, live status или остановку Tab.
Image выводит исходный декоративный SVG; Node рисует пустую область либо Svelte children
snippet и сохраняет её состояние при изменении темы/размера/prefix. Active анимирует
placeholder; reduced motion отключает его анимацию.
Node поддерживает исходный internalClassName: он заменяет стандартный content class.
При reduced motion фон сохраняется, а загрузочная анимация останавливается.

У primitives object classNames/styles задают root/content. Class/rootClassName относятся
к внешнему div, styles.root применяется к нему после component variables. Style относится
к content и имеет приоритет над styles.content и числовым размером Avatar. Локальный
prefixCls меняет BEM-классы; иначе он наследует ConfigProvider (по умолчанию ant-skeleton).
Переменные темы сохраняют namespace.
Primitives повторяют исходную изоляцию от ConfigProvider.skeleton: используют размер,
тему и prefix, а component record основного Skeleton к ним не применяется.

Тема Skeleton подготавливает шесть текущих tokens для основного каркаса и primitives,
поддерживает gradientFromColor/gradientToColor, overrides, aliases/algorithm и
CSS-variable prefix/key/hash. Основной Skeleton сохраняет native host/status/focus,
размеры и normalization. Основной Skeleton и primitives наследуют общий
ConfigProvider prefix; React development warnings остаются следующим этапом.

[98 UMD-сценариев](../../../tests/browser/fixtures/ant-design-skeleton-element-reference.json)
сверяют каждый primitive с Ant Design 6.6.8 в стандартном режиме браузера, с одинаковой
унаследованной typography/color из global design tokens.
[34 сценария основного Skeleton](../../../tests/browser/fixtures/ant-design-skeleton-main-reference.json)
сверяют классы, объявленные slot styles, наследование и вложенные props.
Постоянная группа, title/div, flex/responsive layout и нормализация сохраняют
native поведение и не выдаются за исходную React-разметку.

## Empty

```svelte
<script lang="ts">
  import { Button, Empty } from 'antd-svelte';

  let hasRecords = $state(false);
</script>

<Button onclick={() => { hasRecords = false; }}>Очистить список</Button>
{#if hasRecords}
  <p>Первый участник создан.</p>
{:else}
  <Empty image="simple" description="Участников пока нет.">
    <Button type="primary" onclick={() => { hasRecords = true; }}>Создать участника</Button>
  </Empty>
{/if}
```

Empty показывает отсутствие данных и предлагает действие через Snippet children.
Данными, фильтром и результатом действия управляет владелец; компонент не
выполняет запросов и не создаёт таймеров.

Image принимает default (по умолчанию), simple, URL, собственный Snippet или scalar.
Empty.PRESENTED_IMAGE_DEFAULT/SIMPLE дают прежние aliases default/simple;
остальные строки трактуются как URL и выводятся через img с draggable=false.
Alt берётся из строкового description, иначе используется empty.
False удаляет изображение вместе с контейнером. Встроенные иллюстрации — SVG
Ant Design 6.6.8. В нативном режиме их цвета используют текущие CSS-токены; SVG-паттерны совмещают
полупрозрачный fill с colorBgContainer, сохраняя непрозрачную заливку при
перекрытии частей. Идентификаторы уникальны для каждого экземпляра и стабильны
между SSR и гидратацией. При явной source theme используется исходный getAsSolidColor
и цвета глобальной темы, независимо от component aliases Empty. CSS-переменные
сохраняются без предварительного смешивания; декоративный SVG получает исходный title.
Контейнер изображения декоративный: aria-hidden и inert исключают
его содержимое из accessibility tree, Tab и взаимодействий.

Description принимает scalar или Snippet. Undefined использует
Locale.empty.description: ruRU — «Нет данных», enUS — «No data»; отсутствующие
поля используют ruRU. False, null и пустая строка убирают описание без fallback.
Ноль выводится текстом; true сохраняет пустой description div, как в закреплённом upstream.
Строки экранируются. Generic locale.emptyText для Select и других компонентов
сохраняет прежний смысл и значения.

Children принимает scalar или Snippet и выводится в footer с обычными controls и Tab-навигацией.
Ноль сохраняется; false/null/пустая строка убирают footer, true оставляет пустой div. Изменение
image/description не пересоздаёт сохранённые действия. Без явного aria-label
или aria-labelledby корень остаётся обычным div; с ними — именованная group.
Id/class/style и aria-describedby относятся к корню. Empty не создаёт live-region,
не добавляет остановку Tab и не переносит фокус при показе. Объявление результата
операции и выбор конкретного control после неё остаются у владельца.

При удалении сфокусированного действия внутри сохранённого Empty фокус
переходит к доступному control внутри него, затем к соседу снаружи. При удалении
всего Empty используются сохранённые соседи текущего dialog/документа: сначала
следующий, затем предыдущий, затем сам dialog. Проверка после tick сохраняет
фокус, уже выбранный владельцем. Выбор снаружи также сохраняется. Ресурсы
focusin/MutationObserver освобождаются при unmount; SSR не обращается к DOM.
Escape остаётся у содержащего Modal/Drawer.

Компонент наследует темы, compact и RTL из ConfigProvider. Высота изображения
default — 2.5 controlHeightLG, simple — controlHeightLG; compact уменьшает их
с 100/40 до 90/36px. Изображения ограничены контейнером, длинное описание
переносится, действия footer переходят на следующую строку. Встроенной анимации
нет; reduced motion не требует таймеров или переходов. ConfigProvider.disabled
не скрывает описание и иллюстрацию; disabled controls задаёт их владелец.

Table использует simple Empty в прежней единственной ячейке пустой строки.
Colspan и нативная семантика таблицы сохранены. Description получает
Locale.table.emptyText, включая существующие переопределения. Snippet empty
имеет приоритет; во время loading оба варианта пустого состояния не выводятся.

Галерея `/ant-design#empty` настраивает изображение, описание и действия.
Пример списка создаёт первую запись, показывает пустой результат поиска,
восстанавливает записи при сбросе фильтра и очищает список. Владелец выбирает
стабильный region таблицы после создания/сброса поиска и поле имени после очистки.

ConfigProvider.empty задаёт image, class/style и object/function classNames/styles;
вложенный record заменяется целиком, undefined наследует родительский.
Локальный image имеет приоритет, null/undefined используют context image и затем default.
Semantic slots root/image/description/footer получают исходные props без defaults.
Root styles: context styles.root → context style → local styles.root → local style.
Styles.image задаёт оформление изображения. PrefixCls меняет
BEM-классы; иначе он наследует ConfigProvider (по умолчанию ant-empty).
RootClassName относится к корню.
Bind:nativeElement и поле nativeElement объекта bind:ref указывают на корневой div после mount;
при unmount bindings очищаются до undefined, при SSR не присваиваются.

Empty не имеет собственных component tokens; theme.components.Empty поддерживает
общие aliases/algorithm, variable prefix/key/hash, dark и compact. Все 15 исходных
CSS rules включают small; для совместимого размера можно добавить class="ant-empty-small".
[55 UMD-сценариев](../../../tests/browser/fixtures/ant-design-empty-reference.json) сверяют классы,
slot styles, изображения и их исходные цвета при явной source theme.
Native image=false, inert/ARIA, responsive guards, footer wrapping, paint patterns
прежнего режима и восстановление фокуса сохранены.
Общий ConfigProvider prefix поддержан; React diagnostics остаются в работе.
[RenderEmpty](../render-empty.md) подключён к Select/TreeSelect,
Cascader/Panel, Mentions, Transfer, Table/фильтру; AutoComplete сохраняет
исходное исключение combobox. Без callback действуют прежние native defaults.
Собственный image Snippet отвечает за свои ресурсы и анимацию.

## Result

```svelte
<script lang="ts">
  import { Button, Result } from 'antd-svelte';
  let { edit }: { edit: () => void } = $props();
</script>

<Result status="success" title="Заявка отправлена"
  subTitle="Данные сохранены." headingLevel={2}>
  {#snippet extra()}<Button onclick={edit}>Изменить заявку</Button>{/snippet}
  <p>Номер заявки: 42.</p>
</Result>
```

Обработчик edit принадлежит владельцу формы. Result показывает итог операции;
встроенных запросов, таймеров и управления данными в компоненте нет.
Status: success/error/info/warning и 403/404/500 в строковой или числовой форме.
По умолчанию — info. У первых четырёх статусов официальные filled-иконки;
у 403/404/500 — отдельные иллюстрации Ant Design с исходной палитрой.
Эти варианты не меняют маршруты и HTTP-статусы приложения.

Title, subTitle, extra и children принимают строки, числа, boolean, null, Snippet
и вложенные массивы такого содержимого. Undefined/null/false/пустая строка
не создают контейнеров; 0, true и массивы создают, но boolean не выводится текстом.
Строки экранируются. Title — нативный
заголовок: headingLevel от 1 до 6, по умолчанию 2. Владелец выбирает уровень
под структуру страницы и передаёт текстовое содержимое без вложенного заголовка.
Extra содержит действия; children — подробности. Порядок чтения:
иконка, заголовок, описание, действия, подробности. Действия остаются обычными
controls с естественным Tab/Shift+Tab и своей клавиатурной семантикой.

Icon принимает такое же декоративное содержимое; null/false скрывают обычную иконку,
undefined/пустая строка оставляют встроенную, 0 выводится буквально.
Как в исходном Ant Design, иллюстрации 403/404/500 имеют приоритет над icon,
включая false. Контейнер изображения aria-hidden/inert: иконка не дублирует
заголовок и не создаёт остановок фокуса. Собственный icon отвечает за ресурсы
и анимацию; интерактивные элементы следует передавать в extra/children.

Result.PRESENTED_IMAGE_403/404/500 — Svelte-компоненты исходных иллюстраций:
`<Result.PRESENTED_IMAGE_404 />`. Самостоятельные изображения сохраняют исходные
SVG-геометрию, цвета и title (Unauthorized / No Found / Server Error), без добавленных
viewBox/ARIA. Внутри exception Result остаются decorative viewBox-иллюстрации без title;
один контейнер имеет оба класса icon/image, как upstream.

Id/class/style, data-* и aria-* относятся к корню. Aria-label или
aria-labelledby создают именованную group; явный role имеет приоритет. Собственных live-region,
автофокуса и перехвата Tab нет. Владелец решает, нужно ли объявление результата
или явный перенос фокуса после отправки. Если сфокусированное действие исчезает,
фокус восстанавливается на доступном control внутри Result или рядом с ним.
При unmount используются сохранённые соседи текущего dialog/документа;
явный выбор фокуса владельцем сохраняется. Механизм общий с Empty.

ConfigProvider.result задаёт class/style и object/function classNames/styles
для root/title/subTitle/body/extra/icon. Callbacks получают входные props с
разрешённым status='info'. Классы объединяются; root styles следуют порядку
provider.styles.root → provider.style → local.styles.root → local.style.
Undefined наследует provider record; явный объект, включая {}, заменяет его целиком.
Локальные prefixCls/rootClassName и bind:nativeElement/ref поддержаны; refs
присваиваются после mount и очищаются при unmount. Обновления оформления сохраняют
DOM действий, value, focus и selection.

ConfigProvider передаёт тему, compact и direction. Все четыре
[токена Result](../theme-context.md#токены-result), aliases и component
algorithms применяются к корню перед пользовательскими styles. Цвета обычных иконок,
текст и фон подробностей используют токены; иллюстрации сохраняют исходные цвета.
Текст и действия переносятся, SVG уменьшается на узком экране.
Заголовок, описание и текст действий вместе с их переводами задаёт владелец.

Галерея `/ant-design#result` переключает все статусы и показывает Form →
success/error → редактирование/retry без потери полей. После отправки владелец
фокусирует область итога, при редактировании — поле имени. Отдельная модель
имитирует ответ, отклоняет повторный старт и отменяет ожидание при reset/unmount,
поэтому позднее завершение не заменяет новый экран. Это локальный пример без API.

Сохранены native heading вместо div, именованная group, декоративные inert icons,
responsive inline padding/image, flex/wrapping действий и восстановление фокуса.
81 официальный UMD-сценарий сверяет остальной API, slot styles и полную геометрию SVG;
path d сравнивается через браузерный CSSOM, который разбирает compact arc flags.
Source theme использует исходный fitted viewBox статусных иконок; legacy viewport сохранён.
Эти native layout/ARIA boundaries исключены из source snapshots и проверяются
отдельно. Общий prefix ConfigProvider поддержан; React development warnings
ещё не перенесены.

## Tour

Tour переносит Ant Design 6.6.8 и @rc-component/tour 2.4.0. Состояния, маска и
панель сверены с исходниками; выравнивание использует алгоритм rc-trigger 3.10.1.
Точные Props/snippets описаны в [tour.types.ts](../../../src/lib/tour.types.ts).

```svelte
<script lang="ts">
  import { Tour } from 'antd-svelte';

  let open = $state(false);
  let target = $state<HTMLButtonElement>();
</script>

<button type="button" bind:this={target} onclick={() => { open = true; }}>
  Начать знакомство
</button>
<Tour {open} onClose={() => { open = false; }}
  steps={[{ title: 'Первый шаг', description: 'Описание', target: () => target }]} />
```

`Open` и `current` — controlled props: компонент сообщает изменения через
callbacks, владелец может их отклонить. Без open/defaultOpen непустой Tour открыт.
Default props читаются при создании; повторное открытие сбрасывает uncontrolled
current в ноль. Индекс вне steps закрывает Tour. OnChange получает новый индекс;
штатное завершение вызывает onClose, onFinish, затем nextButtonProps.onClick.
Поля шага заменяют общие panel callbacks/metadata, даже если явно равны undefined.

Target принимает DOM-элемент, getter либо null; getter вызывается только в браузере.
Без цели default placement — center, стрелка скрыта. Есть 12 направлений,
pointAtCenter, flip/shift, сохранение исходного flip cache и onPopupAlign.
Gap по умолчанию равен 6px по обеим осям, radius — 2px. Mask поддерживает color/style;
disabledInteraction блокирует pointer в подсвеченной области. Внешний click не
закрывает Tour. Mask=false с целью оставляет страницу интерактивной, но body scroll
по-прежнему блокируется; без цели прозрачный слой перехватывает pointer, как upstream.

Автопрокрутка зависит от raw open: одного defaultOpen недостаточно. Обычный шаг
получает собственный scrollIntoViewOptions={block:'center',inline:'center'} до
fallback к корневой настройке. Явный false передаётся native scrollIntoView(false),
а не отключает прокрутку. Animated и builtinPlacements принимаются в типах, но
Ant Design принудительно включает placeholder animation и подставляет свои placements.

Title/description/cover и подписи кнопок принимают текст, массивы и Svelte snippets.
ActionsRender получает исходные actions как snippet и current/total;
indicatorsRender — current/total. Step.renderPanel заменяет всю панель. Собственный
renderPanel=undefined выбирает базовую rc-tour панель с native Prev/Next/Finish.
Стабильный description snippet сохраняет native input draft при смене шагов.

ConfigProvider.tour задаёт class/style, closeIcon и semantic slots/callbacks.
Callback получает raw props с объединёнными steps и primary-классами. Root style
и styles.root относятся к маске; step styles/classNames целиком заменяют panel
slots. Локальные слои имеют приоритет. Locale.tour и исходный Tour alias задают
подписи кнопок; локальный Tour перекрывает tour. Global.close задаёт имя закрытия.
Темы light/dark/compact и RTL config сохраняются в portal. Физическое направление
текста наследуется от фактического контейнера: body остаётся LTR при RTL config,
как в React-эталоне; класс ant-tour-rtl и контекст кнопок при этом сохраняются.

Непустой prefixCls задаёт классы Tour; empty/undefined наследуют ConfigProvider.
Панель, маска, placeholder, primary state, placements и стрелки используют один
resolved prefix. Button namespace и private Tooltip variables следуют общему
prefix отдельно от local Tour; canonical tokens/markers не переименовываются.
Scoped template повторяет 61 source CSS rule. Смена prefix сохраняет текущий
шаг, открытый popup, draft/focus/selection и порядок callbacks.

При общем local class=guide вложенный Source provider с другим global prefix
теряет margins кнопок из-за CSS-кэша первого namespace. Raw результаты сохранены;
freshNested измерен с новым public local class. Svelte изолирует CSS по обоим
prefixes. Сверка — [UMD](../../../tests/browser/fixtures/ant-design-tour-prefix-reference.json),
[browser](../../../tests/browser/tour-prefix.spec.ts),
[SSR](../../../tests/package/tour-prefix.ssr.test.ts), `?fixture=tour-prefix`.

По умолчанию mask/placeholder/popup находятся в body. GetPopupContainer=false
оставляет их inline без body lock; функция задаёт собственный контейнер. Как в
rc-tour, mask/placeholder вызывают getter без аргумента, popup передаёт placeholder.
Внутри native Modal/Drawer стандартный portal остаётся в dialog top layer, чтобы
сохранить интерактивность. CSS variables обновляются при смене наследуемой темы.

Tour не устанавливает autofocus/focus trap и не возвращает фокус при закрытии.
Physical Left/Right меняют шаги, кроме событий из editable controls. Escape
учитывает keyboard, closable и 200ms после IME compositionend. Все открытые Tour
реагируют на Escape, как исходный rc-tour. SSR не рендерит portal layers и не
вызывает DOM getters/snippets. При закрытии/unmount удаляются DOM, locks, listeners
и observers; отложенное выравнивание не публикует callbacks после уничтожения.

`ConfigProvider.theme.components.Tour` подготавливает девять исходных CSS tokens,
alias overrides и algorithms для default/primary panels, close, indicators и arrows.
Button сохраняет независимую тему; local step/semantic styles имеют исходный приоритет.
CSS Tour подключён перед Button, как в исходном runtime: при наведении на Next
в primary panel Button задаёт цвет текста и рамки, Tour — фон.
Обновления темы сохраняют шаг, portal DOM, focus/caret и пользовательский input.
Проверки и 15 UMD-тем — [tour-theme](../../../tests/browser/tour-theme.spec.ts), `?fixture=tour-theme`.

Runtime `zIndex` имеет приоритет над CSS token `zIndexPopup`: обычное окно без prop
сохраняет слой 1001, даже при другом token/base. Это ограничение Ant Design 6.6.8,
подтверждённое [raw observation](../../../tests/browser/fixtures/ant-design-tour-z-index-observation.json).
Для изменения фактического слоя используйте prop `zIndex`; его default сохранён.

Общий zIndex context всех popup families остаётся вне этого этапа.
React private PurePanel и development diagnostics не экспортируются.

Проверки: [engine](../../../src/lib/tour.engine.test.ts),
[public package SSR](../../../tests/package/tour.ssr.test.ts),
[browser](../../../tests/browser/tour.spec.ts) и `?fixture=tour`.
[61 исходное CSS-правило](../../../src/lib/vendor/tour.css) воспроизводится
[рецептом](../../../tools/ant-design-css-recipes.json). Перенесённая логика снабжена
MIT-лицензиями [rc-tour](../../../src/lib/vendor/LICENSE.rc-tour),
[rc-trigger](../../../src/lib/vendor/LICENSE.rc-trigger) и
[rc-portal](../../../src/lib/vendor/LICENSE.rc-portal). CloseOutlined из icons-svg 4.6.0
использует существующую [MIT-лицензию icons](../../../src/lib/vendor/LICENSE.ant-design-icons).
