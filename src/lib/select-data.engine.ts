// Строит строки списка и индексы Select из пользовательских options. Кэш
// сохраняет подписи выбранных значений, когда исходные options исчезают.
// @rc-component/select1.10.1 / @rc-component/util; MIT, vendor/LICENSE.rc-select и LICENSE.rc-util.
import type { SelectFieldNames, SelectScrollKey } from './select.types';
import type {
  SelectDataAttributes, SelectDataCache, SelectDataDisplay, SelectDataFields, SelectDataFilter,
  SelectDataMaps, SelectDataRow, SelectDataValue
} from './select-data.types';

// Нормализует имена полей. Подпись группы по умолчанию использует то же поле, что option.
export function selectFields(fields?: SelectFieldNames): SelectDataFields {
  const label = fields?.label || 'label';
  return { label, value: fields?.value || 'value', options: fields?.options || 'options',
    groupLabel: fields?.groupLabel || label };
}

// Читает значение по настройке поля. Тип Value задаёт потребитель options.
export function selectOptionValue<Value extends SelectDataValue = SelectDataValue>(
  data: object,
  fields: SelectDataFields
) {
  return Reflect.get(data, fields.value) as Value | undefined;
}

// Оставляет содержимое подписи непрозрачным, включая snippet и числовое значение.
export function selectOptionLabel(data: object, fields: SelectDataFields): unknown {
  return Reflect.get(data, fields.label);
}

// Ключ строки выбирается независимо от fieldNames. Ноль и пустая строка допустимы.
function optionKey(data: object, index: number): SelectScrollKey {
  const key: unknown = Reflect.get(data, 'key');
  const value: unknown = 'value' in data ? Reflect.get(data, 'value') : undefined;
  return (key != null ? key : value !== undefined ? value : `rc-index-key-${index}`) as SelectScrollKey;
}

// Сохраняет порядок строк и исходный объект для callbacks и пользовательского render.
export function flattenSelectData<
  Value extends SelectDataValue = SelectDataValue, Data extends object = object
>(
  options: readonly Data[],
  fields: SelectDataFields
): SelectDataRow<Value, Data>[] {
  const rows: SelectDataRow<Value, Data>[] = [];

  // Заголовки групп создаются только на верхнем уровне, как в исходном списке.
  function appendRows(items: readonly Data[], grouped: boolean) {
    if (!Array.isArray(items)) {
      return;
    }
    for (const item of items) {
      const data = item as Data & Readonly<Record<string, unknown>>;
      if (grouped || !(fields.options in item)) {
        const key = optionKey(item, rows.length);
        const label = selectOptionLabel(item, fields);
        const value = selectOptionValue<Value>(item, fields);
        rows.push({
          key,
          groupOption: grouped,
          data,
          label,
          value
        });
      }
      else {
        const key = optionKey(item, rows.length);
        const label = Reflect.get(item, fields.groupLabel);
        rows.push({ key, group: true, data, label });

        const children = Reflect.get(item, fields.options) as readonly Data[];
        appendRows(children, true);
      }
    }
  }

  appendRows(options, false);
  return rows;
}

// Приводит заданные поля поиска к списку, игнорируя пустую строку.
function filterProperties(properties?: string | readonly string[]): readonly string[] {
  if (typeof properties === 'string') {
    return properties ? [properties] : [];
  }

  return properties ?? [];
}

// Разделяет обычный lookup по подписям и lookup только по собственным полям.
export function collectSelectData<
  Value extends SelectDataValue = SelectDataValue, Data extends object = object
>(
  options: readonly Data[],
  fields: SelectDataFields,
  optionFilterProp?: string | readonly string[],
  optionLabelProp?: string
): SelectDataMaps<Value, Data> {
  const valueOptions = new Map<Value | undefined, Data>();
  const labelOptions = new Map<unknown, Data>();
  const nativeLabelOptions = new Map<unknown, Data>();
  const labels = [fields.label, ...filterProperties(optionFilterProp), optionLabelProp];

  // Читает заголовки и значения в порядке обхода. При совпадении выигрывает последняя запись.
  function indexOptions(items: readonly Data[], grouped: boolean) {
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const children: unknown = Reflect.get(item, fields.options);
      // Lookup использует truthiness; flatten выше намеренно проверяет наличие свойства.
      if (!children || grouped) {
        const value = selectOptionValue<Value>(item, fields);
        valueOptions.set(value, item);
        for (const field of labels) {
          if (field && typeof field === 'string') {
            const label: unknown = Reflect.get(item, field);
            labelOptions.set(label, item);
            if (Object.hasOwn(item, field)) nativeLabelOptions.set(label, item);
          }
        }
      }
      else {
        indexOptions(children as readonly Data[], true);
      }
    }
  }

  indexOptions(options, false);
  return { valueOptions, labelOptions, nativeLabelOptions };
}

// Возвращает поверхностную копию option для публичного callback.
export function copySelectData<Data extends object>(data: Data): Data;
export function copySelectData<Data extends object>(data: Data | undefined): Partial<Data>;
export function copySelectData<Data extends object>(data: Data | undefined): Partial<Data> {
  return { ...data };
}

// Поиск сравнивает текст и объединённые фрагменты подписи без учёта регистра.
function includes(value: unknown, query: string) {
  return (Array.isArray(value) ? value : [value]).join('').toUpperCase().includes(query);
}

// Фильтрует группы целиком при совпадении заголовка или оставляет подходящих потомков.
export function filterSelectData<Data extends object>(
  options: readonly Data[],
  search: string,
  fields: SelectDataFields,
  config: SelectDataFilter<Data> = {}
): readonly Data[] {
  if (!search || config.filterOption === false) {
    return options;
  }
  const properties = filterProperties(config.optionFilterProp);
  const query = search.toUpperCase();
  const custom = config.filterOption;
  // Выбирает только один способ поиска и сохраняет приоритет пользовательской функции.
  const match = (item: Data) => {
    if (typeof custom === 'function') {
      return custom(search, copySelectData(item));
    }
    // Прежний Native explicit-field поиск не читает свойства прототипа.
    if (properties.length) {
      return properties.some(field => Object.hasOwn(item, field)
        && includes(Reflect.get(item, field), query));
    }
    const group = Boolean(Reflect.get(item, fields.options));
    if (config.defaultMatch) {
      return config.defaultMatch(search, item, fields, group);
    }
    let field: string;
    if (group) {
      field = fields.label === 'children' ? 'label' : fields.label;
    }
    else {
      field = fields.value;
    }

    const text = Reflect.get(item, field);
    return includes(text, query);
  };
  const result: Data[] = [];
  for (const item of options) {
    const children = Reflect.get(item, fields.options) as readonly Data[] | undefined;
    if (children) {
      if (match(item)) {
        result.push(item);
      }
      else {
        const filtered = children.filter(child => match(child));
        if (filtered.length) result.push({ ...item, [fields.options]: filtered });
      }
    }
    else if (match(item)) result.push(item);
  }
  return result;
}

// Сортирует копию options и оставляет вложенные группы в той же структуре.
export function sortSelectData<Data extends object>(
  options: readonly Data[],
  search: string,
  comparator?: (left: Data, right: Data, info: { searchValue: string }) => number
): readonly Data[] {
  if (!comparator) {
    return options;
  }

  const sorted = [...options].sort((left, right) => comparator(left, right, { searchValue: search }));
  return sorted.map(sortGroup);

  // Исходный sorter читает поле options независимо от настройки fieldNames.
  function sortGroup(item: Data) {
    const children: unknown = Reflect.get(item, 'options');
    if (!Array.isArray(children)) {
      return item;
    }

    return {
      ...item,
      options: children.length ? sortSelectData(children as Data[], search, comparator) : children
    };
  }
}

// Начальное состояние не удерживает записи из предыдущего экземпляра Select.
export function emptySelectDataCache<Value extends SelectDataValue, Data extends object>():
  SelectDataCache<Value, Data> {
  return { labels: new Map(), options: new Map(), display: [] };
}

// Сравнивает значения и порядок записей перед переиспользованием Map.
function sameMap<Key, Value>(left: ReadonlyMap<Key, Value>, right: ReadonlyMap<Key, Value>) {
  if (left.size !== right.size) {
    return false;
  }
  const entries = left.entries();
  for (const [key, value] of right) {
    const previous = entries.next();
    if (previous.done || !Object.is(previous.value[0], key) || !Object.is(previous.value[1], value)) {
      return false;
    }
  }
  return true;
}

// Строку можно сохранить, только если данные и все видимые поля совпадают.
function sameDisplay<Value extends SelectDataValue, Data extends object>(
  previous: SelectDataDisplay<Value, Data>,
  next: SelectDataDisplay<Value, Data>
) {
  return Object.is(previous.value, next.value) && Object.is(previous.label, next.label)
    && previous.data === next.data && Object.is(previous.disabled, next.disabled)
    && Object.is(previous.title, next.title);
}

// Вычисляет подписи и метаданные текущего выбора с сохранением неизменившихся ссылок.
export function resolveSelectDataCache<Value extends SelectDataValue, Data extends object>(
  values: readonly Value[],
  maps: SelectDataMaps<Value, Data>,
  fields: SelectDataFields,
  previous: SelectDataCache<Value, Data>
): SelectDataCache<Value, Data> {
  const labels = new Map<Value, unknown>();
  const options = new Map<Value, Data | undefined>();
  const previousDisplay = new Map(previous.display.map(item => [item.value, item]));

  const display = values.map(resolveDisplay);
  const nextLabels = sameMap(previous.labels, labels) ? previous.labels : labels;
  const nextOptions = sameMap(previous.options, options) ? previous.options : options;
  const unchangedDisplay = display.length === previous.display.length
    && display.every((item, index) => item === previous.display[index]);
  const nextDisplay = unchangedDisplay ? previous.display : display;

  if (nextLabels === previous.labels && nextOptions === previous.options
    && nextDisplay === previous.display) {
    return previous;
  }

  return { labels: nextLabels, options: nextOptions, display: nextDisplay };

  // Читает актуальную подпись и использует старую только при undefined.
  function resolveDisplay(value: Value) {
    const current = maps.valueOptions.get(value);
    const data = current ?? previous.options.get(value);
    const rawLabel = current ? selectOptionLabel(current, fields) : undefined;
    const label = rawLabel === undefined ? previous.labels.get(value) : rawLabel;
    const next: SelectDataDisplay<Value, Data> = {
      value,
      label,
      data,
      // У удалённого option сохраняется disabled. Title относится к текущим данным.
      disabled: data ? Reflect.get(data, 'disabled') as boolean | undefined : undefined,
      title: current ? Reflect.get(current, 'title') : undefined
    };
    labels.set(value, label);
    options.set(value, data);

    const previousRow = previousDisplay.get(value);
    return previousRow && sameDisplay(previousRow, next) ? previousRow : next;
  }
}

// Подпись с числовым значением, включая 0, отображается как задана.
export function selectDataContent<Value extends SelectDataValue, Data extends object>(
  row: SelectDataRow<Value, Data>
): unknown {
  if (row.group) {
    return row.label !== undefined ? row.label : Reflect.get(row.data, 'key');
  }
  return typeof row.label === 'number' ? row.label : row.label || row.value;
}

// Резервный title берётся из текстового содержимого, а не из пользовательского render.
export function selectDataTitle<Value extends SelectDataValue, Data extends object>(
  row: SelectDataRow<Value, Data>
): unknown {
  const raw: unknown = Reflect.get(row.data, 'title');
  const content = row.group ? row.label : selectDataContent(row);
  const fallback = typeof content === 'string' || typeof content === 'number' ? String(content) : undefined;
  return row.group ? raw ?? fallback : raw !== undefined ? raw : fallback;
}

const nativeAttributes = new Set(`accept acceptCharset accessKey action allowFullScreen allowTransparency
  alt async autoComplete autoFocus autoPlay capture cellPadding cellSpacing challenge charSet checked classID
  className colSpan cols content contentEditable contextMenu controls coords crossOrigin data dateTime default
  defer dir disabled download draggable encType form formAction formEncType formMethod formNoValidate formTarget
  frameBorder headers height hidden high href hrefLang htmlFor httpEquiv icon id inputMode integrity is keyParams
  keyType kind label lang list loop low manifest marginHeight marginWidth max maxLength media mediaGroup method
  min minLength multiple muted name noValidate nonce open optimum pattern placeholder poster preload radioGroup
  readOnly rel required reversed role rowSpan rows sandbox scope scoped scrolling seamless selected shape size
  sizes span spellCheck src srcDoc srcLang srcSet start step style summary tabIndex target title type useMap value
  width wmode wrap`.split(/\s+/));
const nativeEvents = new Set(`onCopy onCut onPaste onCompositionEnd onCompositionStart onCompositionUpdate onKeyDown
  onKeyPress onKeyUp onFocus onBlur onChange onInput onSubmit onClick onContextMenu onDoubleClick onDrag onDragEnd
  onDragEnter onDragExit onDragLeave onDragOver onDragStart onDrop onMouseDown onMouseEnter onMouseLeave onMouseMove
  onMouseOut onMouseOver onMouseUp onSelect onTouchCancel onTouchEnd onTouchMove onTouchStart onScroll onWheel onAbort
  onCanPlay onCanPlayThrough onDurationChange onEmptied onEncrypted onEnded onError onLoadedData onLoadedMetadata
  onLoadStart onPause onPlay onPlaying onProgress onRateChange onSeeked onSeeking onStalled onSuspend onTimeUpdate
  onVolumeChange onWaiting onLoad onPointerDown onPointerMove onPointerUp onPointerCancel onPointerEnter onPointerLeave
  onPointerOver onPointerOut onGotPointerCapture onLostPointerCapture onAnimationStart onAnimationEnd onAnimationIteration
  onTransitionEnd onTransitionRun onTransitionStart onTransitionCancel onBeforeInput onReset onInvalid onAuxClick
  onToggle onBeforeToggle onCancel onClose onResize onScrollEnd`.split(/\s+/));
const aliases: Readonly<Record<string, string>> = { acceptCharset: 'accept-charset', htmlFor: 'for',
  httpEquiv: 'http-equiv', onDoubleClick: 'ondblclick', onFocus: 'onfocusin', onBlur: 'onfocusout' };

// Оставляет у группы доступные атрибуты, у option также пропускает нативные props.
export function selectDataAttributes<Value extends SelectDataValue, Data extends object>(
  row: SelectDataRow<Value, Data>,
  fields: SelectDataFields
): SelectDataAttributes {
  const physical: Record<string, unknown> = {};
  const aria: Record<string, unknown> = {};
  const omitted = new Set([...Object.values(fields), 'children', 'disabled', 'title', 'style', 'className']);
  for (const [name, value] of Object.entries(row.data)) {
    const accessible = name === 'role' || name.startsWith('aria-');
    if (accessible) aria[name] = value;
    if (row.group || omitted.has(name)) continue;
    if (accessible || name.startsWith('data-') || nativeAttributes.has(name) || nativeEvents.has(name))
      physical[aliases[name] ?? name.toLowerCase()] = value;
  }
  return { physical, aria };
}
