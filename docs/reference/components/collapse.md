# Collapse

```svelte
<script lang="ts">
  import { Collapse, Input, type CollapseActiveKey } from 'antd-svelte';

  let activeKey = $state<CollapseActiveKey>(['contacts']);
</script>

{#snippet contacts()}<label>Имя<Input defaultValue="Анна" /></label>{/snippet}
{#snippet preferences()}<p>Настройки участника.</p>{/snippet}

<Collapse
  aria-label="Анкета участника"
  bind:activeKey
  items={[
    { key: 'contacts', label: 'Контакты', children: contacts },
    { key: 'preferences', label: 'Настройки', children: preferences }
  ]}
/>
```

`items` принимает readonly-массив CollapseItem: необязательный строковый/числовой
key, label, children и extra (scalar, вложенный readonly-массив или Snippet),
collapsible, showArrow, forceRender и destroyOnHidden. Без key используется
строковый индекс; числа преобразуются в строки. Пустой ключ допустим; при повторении
используется первое вхождение. Ключ сохраняет экземпляр панели и фокус при
перестановке. Интерактивные элементы размещаются в extra или children; label
должен давать кнопке доступное имя и не содержать других controls.
Extra находится рядом с заголовком, вне кнопки раскрытия: его действия не
переключают панель. Id/class/style относятся к корневому контейнеру;
aria-label или aria-labelledby именует группу.

`bind:activeKey` принимает строку, число или readonly-массив таких ключей. Активация пользователем
сначала записывает в binding новый массив, затем вызывает onChange с отдельным
массивом; изменение массива callback не меняет значение владельца. Затем вызывается
item.onItemClick со строковым ключом. Ключи дедуплицируются с сохранением порядка активации. DefaultActiveKey читается при
создании; без начального значения все панели закрыты, в том числе в accordion.
Для binding задавайте начальное значение у владельца без defaultActiveKey.
Внешние изменения, defaults и переключение accordion не вызывают onChange.

Без accordion можно открыть несколько панелей. В accordion отображается только
первый запрошенный ключ; повторная активация закрывает его. Неизвестные ключи
сохраняются без подстановки другой панели и без перезаписи владельца. Отключение
accordion снова показывает остальные запрошенные панели. Удаление item не
удаляет его ключ из значения владельца. Пустой items показывает locale.emptyText.

Collapsible поддерживает header (вся кнопка заголовка), icon (только стрелка
для указателя) и disabled. Enter/Space активируют нативную кнопку и в режиме
icon. Значение item переопределяет общее, включая header поверх disabled.
ShowArrow=false скрывает стрелку; вместе с icon используется header, чтобы
сохранить доступную зону активации. Disabled запрещает переключение пользователем,
но не скрывает панель, открываемую владельцем. Collapse не наследует disabled
от Form/ConfigProvider; поля внутри получают собственный контекст.

Каждый заголовок содержит button type=button внутри heading. HeadingLevel
задаёт уровень 2–6 (по умолчанию 3); вложенному Collapse задавайте следующий
уровень. Aria-expanded/aria-controls связывают кнопку с содержимым. В accordion
и группах до шести items панели получают именованный role=region; в больших
группах без accordion лишние landmarks не создаются. Все доступные заголовки,
extra и поля обходятся обычным Tab; стрелки не перехватываются. Escape остаётся
содержащему Modal. При скрытии сфокусированного содержимого фокус возвращается
к его доступному заголовку. При удалении/disabled заголовка выбирается открытый
доступный заголовок, затем первый доступный либо сама группа. Изменения при
фокусе снаружи Collapse не перемещают его внутрь.

Содержимое впервые монтируется при открытии и по умолчанию сохраняет локальный
state и DOM-черновики в скрытой панели. DestroyOnHidden=true удаляет содержимое
при закрытии; отключение этой настройки не монтирует уже уничтоженную панель.
Значение item переопределяет общее, включая false. ForceRender=true монтирует
содержимое сразу и сохраняет его даже с destroyOnHidden. Удаление key уничтожает
панель; состояние вне неё сохраняется. Скрытые сохранённые панели остаются в DOM,
их таймеры и подписки продолжают работать. Поля посещённых/forceRender-панелей
участвуют в FormData даже при скрытии; ещё не смонтированных или уничтоженных
полей в FormData нет. Перед фокусом ошибки скрытой панели владелец формы должен
открыть её. Кнопки заголовков не отправляют окружающую форму.

Size использует small/medium/large и ConfigProvider.componentSize. Bordered=false
убирает внешнюю рамку, ghost — фон и разделители. ExpandIconPlacement задаёт
start/end относительно кнопки заголовка и направления RTL; extra остаётся
отдельным элементом после заголовка. ExpandIcon — Snippet с данными панели:
isActive, header, panelKey, prefixCls, исходными showArrow/collapsible/accordion
и объединёнными item slots. Его onItemClick переключает доступную панель и вызывает
root/item callbacks. Пользовательская стрелка не поворачивается автоматически.

ConfigProvider.collapse задаёт expandIcon, class/style и classNames/styles;
локальная стрелка приоритетнее контекстной. Вложенный явный record заменяет
родительский. Semantic object/function slots: root, header, title, body, icon.
Callback получает props с разрешёнными size, bordered и expandIconPlacement.
Root style: context slots → context style → local slots → local style; component
variables идут перед ними. Item slots добавляют classes и перекрывают styles.
Header slot применяется к нативной кнопке, body — к внутреннему содержимому;
extra остаётся вне кнопки. Item id/class/style и data/ARIA относятся к обёртке
панели, rootClassName — к корню. Bind:nativeElement и bind:ref получают HTMLDivElement
после mount и очищаются при unmount. Смена config/theme/prefix сохраняет панели и поля.

Theme.components.Collapse подключает все десять токенов: headerPadding/SM/LG,
headerBg, contentPadding/SM/LG, contentBg, borderlessContentPadding/Bg. Aliases,
component algorithm, cssVar prefix/key, dark и compact используют общий механизм
темы. Local prefixCls либо общий ConfigProvider prefix поддерживается CSS template
из того же закреплённого архива;
все 49 CSS rules воспроизводятся инструментом. Высота содержимого меняется сразу;
анимируется только стрелка, с учётом reduced motion.

Галерея `/ant-design#collapse` показывает анкету, вложенные панели, сохранение
черновиков, destroyOnHidden и независимую кнопку сброса в extra. Сброс примера
пересоздаёт поля с исходными значениями, сохраняя открытые внешние панели.
Item поддерживает headerClass, HTML attributes, native lowercase events и camelCase
aliases (включая Capture). Click/capture/bubble/stopPropagation/preventDefault,
focus/blur, key и mouse traces сверяются с оригиналом. События остаются native DOM:
React SyntheticEvent и его input/change normalization не создаются. Enter/Space
сохраняют порядок активации нативной кнопки, включая возможность отменить default.
Item.ref — callback с node после mount и null при замене ref или unmount; стабильный
callback не вызывается повторно из-за label updates. Он использует post-DOM lifecycle
Svelte; React RefObject не мутируется.

React-анимация высоты пока не перенесена. Native group, heading/button/region,
ARIA-связи, Space, full button hit area, независимость extra, focus recovery
и icon/showArrow fallback сохранены; это явные отличия от DOM React. Пустой custom
expandIcon Snippet сохраняет wrapper. Общий ConfigProvider.prefixCls поддержан;
React DEV diagnostics пока не поддерживаются.

