# Tag, CheckableTag и CheckableTagGroup

```svelte
<script lang="ts">
  import { CheckableTag, ConfigProvider, Tag } from 'antd-svelte';
  let checked = $state(false);
</script>

<Tag color="success" variant="outlined">Готово</Tag>
<Tag closeIcon closeLabel="Удалить обязательную метку"
  onClose={event => event.preventDefault()}>Обязательная метка</Tag>
<Tag href="#tag-help" closable>Ссылка с закрытием</Tag>
<CheckableTag {checked} onChange={value => { checked = value; }}>
  Показывать готовые задачи
</CheckableTag>

<ConfigProvider tag={{ variant: 'outlined', style: 'letter-spacing:1px' }}>
  <Tag color="#2db7f5" styles={{ root: 'font-weight:600' }}>CSS color</Tag>
</ConfigProvider>
```

Tag показывает метку с обязательным children Snippet. Icon и пользовательский
closeIcon принимают Snippet; closeIcon также принимает текст и числа.
Содержимое — короткая phrasing-разметка
без вложенных controls, кроме ссылки. Иконки декоративные, aria-hidden/inert.
Без непустого href корень — span и Tag не создаёт остановок Tab или live-region.
Именование через aria-label/aria-labelledby добавляет span роль group; переданный
role имеет приоритет. Непустой href выбирает native anchor с target и естественным
Tab/Enter. Disabled оставляет anchor, убирает href и добавляет aria-disabled.
Закрытие ссылки предотвращает навигацию; отмена закрытия сохраняет её содержимое.
У ссылки в children сохраняется собственный href; disabled Tag меняет её стиль
и pointer-events, как upstream.

HTMLAttributes, data-/aria-атрибуты и нативные события относятся к корню; локальный
dir имеет приоритет над context. Bind:nativeElement даёт текущий span/anchor,
обновляется при смене типа корня и очищается при закрытии/unmount. В SSR ref пуст.
Hydration сохраняет существующий DOM и фокус. Явные a/span branches избегают
повторной вставки корня, которая сбрасывает фокус дочерней кнопки.

OnClick/onclick получают нативный click корневого span; onclick имеет приоритет.
Callback или единственная прямая ссылка включают [Wave](../wave.md).
Закрытие сохраняет stopPropagation и не вызывает onClick метки.

Variant: filled (по умолчанию), outlined, solid. Прежний default class сохраняется;
semantic callbacks получают исходный undefined color, кроме default для solid.
Статусы — success/processing/error/default/warning. Предустановленные цвета:
blue/purple/cyan/green/magenta/pink/red/orange/yellow/volcano/geekblue/lime/gold.
Pink и magenta используют соответствующие токены Ant Design. Статусный цвет не добавляет
role=status и не запускает анимацию/объявление. TagColor, TagPresetColor,
TagStatusColor и TagVariant экспортируются через index.ts.

Color также принимает CSS-строки. Solid задаёт background-color; filled и outlined
вычисляют светлый фон через исходный FastColor/HSL с lightness 0.95, сохраняя alpha.
Outlined добавляет border-color. CSS variables используются как исходная строка
foreground/border; FastColor не вычисляет их значение. Disabled убирает рассчитанные
цвета, но сохраняет явно переданные styles/style.

Приоритет variant: локальный prop, ConfigProvider.tag.variant, затем filled.

ConfigProvider.tag наследуется при отсутствии; явный объект, включая {}, заменяет
родительский record. Поддерживаются class, style, variant, classNames, styles,
closable и closeIcon.
TagSlots/TagSemantic задают root, icon, content и close строками CSS или classes;
callback получает props с разрешёнными color, variant и disabled. Root styles:
рассчитанный CSS-цвет, context styles.root, context style, local styles.root, local style.
RootClassName дополняет class. Изменения shorthand/longhand повторяют style diff
upstream; CSS-строки сохраняют нативный приоритет !important.

Icon styles/classes применяются к существующей декоративной wrapper-границе Snippet,
close — к нативной кнопке. Content semantic slot действует при наличии icon, как
upstream; прежняя private content-обёртка и описание кнопки закрытия сохраняются.
CheckableTag читает только context class/style и локальный style имеет приоритет;
semantic настройки и variant Tag к нему не применяются.

Без local/context close config кнопка скрыта. CloseIcon=true включает default Icon
close; текст/число и Snippet заменяют изображение внутри той же нативной кнопки.
Пустая строка и 0 сохраняют control. Отсутствие props наследует context;
closable=false скрывает кнопку независимо от icon. CloseIcon=false/null скрывает её,
если closable не включён. Явный closable=true сохраняет inherited icon или default.

Closable принимает также object config с closeIcon и ARIA-атрибутами. В этом объекте
closeIcon=null убирает control, а boolean оставляет пустое изображение. Undefined
не стирает context field. Передаются только ARIA-атрибуты, как в useClosable;
disabled/afterClose этого объекта Tag не использует. Блокировкой управляет Tag.disabled.
CloseLabel имеет приоритет над closable['aria-label'], затем используется locale.closeText.
По умолчанию описание кнопки ссылается на содержимое метки; closable['aria-describedby']
может его заменить, поэтому одинаковое «Закрыть» сохраняет контекст.
Disabled наследует ConfigProvider.componentDisabled; false явно снимает его.
Disabled запрещает закрытие и callbacks, не удаляя содержимое.

OnClose получает нативный MouseEvent; event.preventDefault() синхронно отменяет
закрытие. Возвращаемое значение и Promise не ожидаются. Повторный вход из callback
не вызывает onClose ещё раз. Прямой DOM listener останавливает всплытие клика;
Enter и Space обрабатываются при keydown через кнопку type=button; repeat и уже
отменённое событие игнорируются. Форма не отправляется. Callback может удалить
весь компонент или выбрать фокус.

После принятого закрытия содержимое удаляется из DOM. Изменение props не
открывает тот же экземпляр заново: для восстановления нужен новый экземпляр/key.
Tag не изменяет коллекцию владельца; при удалении записи или отмене onClose
владелец синхронизирует свою модель. Фокус из закрытой/удалённой кнопки переходит
на следующий доступный control текущего dialog/документа, затем предыдущий.
При скрытии closeIcon механизм также восстанавливает фокус. Явный выбор
владельца сохраняется; закрытие не создаёт дополнительных объявлений.

CheckableTag — отдельный export с обязательным children и декоративным icon.
Это нативный button type=button с aria-pressed, а не поле формы. Checked по
умолчанию false и полностью управляется владельцем. OnChange сообщает !checked;
компонент не присваивает checked и не поддерживает bind:checked/defaultChecked.
Внешнее обновление checked не вызывает callback. При disabled остаются значение
и содержимое, но кнопка исключается из Tab и не меняет состояние.

CheckableTag поддерживает Enter/Space и естественный Tab; при удалении кнопки
фокус восстанавливается рядом, сохраняя выбор владельца. OnClick вызывается
после onChange; отмена click внутри него не отменяет уже отправленное значение.
OnKeyDown вызывается первым: preventDefault отменяет переключение. Space
переключает при keydown, игнорирует repeat и не вызывает onClick; нативный Enter
создаёт click. Lowercase onclick/onkeydown имеют приоритет над соответствующими
callbacks. Уже отменённый click не вызывает переключение или onClick.

Id/class/style, title, data-/aria-атрибуты и остальные HTMLAttributes относятся
к кнопке. Dir наследуется при отсутствии локального значения. Bind:nativeElement
даёт ту же кнопку при обновлениях и очищается при unmount; SSR не создаёт ref.
Type=button и aria-pressed остаются собственными атрибутами компонента. Выбранные
фильтры, их объединение и связь с Form/Table принадлежат владельцу; скрытых
полей FormData и автоматической интеграции с FormItem нет.

CheckableTagGroup — отдельный export, соответствующий Tag.CheckableTagGroup.
Options принимает строки, числа или records с value, label, className и style;
label также принимает Snippet. Значения сохраняют тип и должны быть уникальными
стабильными ключами. Группа без options пуста; children не подменяют options.

```svelte
<script lang="ts">
  import { CheckableTagGroup } from 'antd-svelte';

  let selected = $state<string[]>(['Books']);
</script>

<CheckableTagGroup multiple options={['Movies', 'Books', 'Music']}
  value={selected} onChange={next => { selected = next; }} />
```

Без multiple повторное нажатие выбранной метки возвращает null. В multiple
callback получает массив: добавление сохраняет порядок текущих значений,
удаление сохраняет остальные, включая значения вне options. Value полностью
управляется владельцем; отказ принять callback сохраняет checked. Без value
состояние хранится внутри, defaultValue читается только при создании. Смена
value на undefined сбрасывает внутреннее значение, как useControlledState upstream;
callback при внешнем обновлении не вызывается. Bind:value не поддерживается.

ClassNames/styles задают root/item объектом или callback с raw props группы.
Приоритет root styles: context styles.root, context style, local styles.root,
local style. Item получает context style CheckableTag, context styles.item,
local styles.item и option.style. Context class относится к группе и меткам;
local class/rootClassName — к группе, option.className — к метке. Общие callbacks
ConfigProvider.tag получают props текущего компонента; тип context остаётся Tag,
как upstream. Для типизированных group callbacks используйте локальные props.

Корень — div без автоматической group/radiogroup роли. Передаются id, role,
data-/aria-атрибуты; остальные HTML props отбрасываются, как upstream. Bind:nativeElement
даёт div после mount и очищается при unmount. Disabled группы передаётся меткам;
undefined наследует componentDisabled, false явно снимает блокировку. Class disabled
группы отражает локальный prop. Flex-wrap и gap используют исходный paddingXS.
Метками остаются native toggle-кнопки CheckableTag: Enter/Space, aria-pressed,
focus recovery и отсутствие FormData сохраняются. Это осознанная граница с React span.

Tag, CheckableTag и CheckableTagGroup принимают локальный prefixCls. Отсутствие
или пустая строка наследуют ConfigProvider.prefixCls (по умолчанию ant-tag);
root/modifier/close classes следуют префиксу. У группы меняются group/item classes,
но вложенные CheckableTag отдельно наследуют общий prefix,
как в закреплённом upstream. PrefixCls не передаётся HTML-атрибутом и не меняет
имена CSS variables. Приватные content/icon wrappers и native dark class сохраняются.

Для нестандартного prefix используется шаблон из 90 исходных CSS rules. Он
попадает в SSR head и обновляется вместе с props; смена prefix не заменяет root,
close control или элементы группы. Удаление/закрытие экземпляра освобождает его
stylesheet, сохраняя стили соседей. Стандартный prefix использует прежний vendor CSS
без дополнительного head style. Native wrapping, hit target, focus и dark/compact
theme сохраняются; источник semantic styles и component tokens не меняется.

Компоненты наследуют тему, primary, compact и RTL. Для тёмной темы Tag связывает
обычный цвет текста с токенами и адаптирует фон/границу preset/status меток
через color-mix и локальные токены палитры. Solid сохраняет исходный цвет;
обычный solid в тёмной теме использует светлый фон и тёмный текст.
Эта прежняя адаптация действует в native theme; source token/algorithm theme
использует исходные Tag aliases, component overrides и палитры алгоритма.
Текст переносится на узком экране; close control не сжимается. Reduced motion
отключает встроенные transitions; ресурсы пользовательского Snippet принадлежат
его владельцу. Новая локаль не нужна: closeText уже входит в ruRU/enUS.

Галерея `/ant-design#tag` переключает цвета и варианты, показывает отмену
закрытия и восстановление экземпляра. Модель меток обрезает пробелы, проверяет
дубликаты без учёта регистра и защищает обязательную метку. Повторное добавление
удалённой метки получает новый key. CheckableTag фильтрует отдельную Table по
объединению выбранных статусов; пустой выбор показывает все строки. Ядро Table
не изменяется. Введённые значения выводятся обычными Svelte bindings.

Drag-and-drop и внешняя анимация остаются ответственностью владельца.

