# Button

Button сохраняет прежние props и native onclick; добавлены href, color/variant,
ghost, square shape, iconPlacement,
classNames/styles и rootClassName. Children/icon принимают Snippet, текст,
число или boolean; 0 отображается, true создаёт пустой присутствующий контент.
ButtonProps остаётся интерфейсом native button и доступен по прежнему пути
Button.svelte; ButtonLinkProps описывает ссылку. Компонент выводит тип currentTarget
из href: существующий onclick без href получает HTMLButtonElement, с href —
HTMLAnchorElement. OnClick поддержан как alias; native onclick имеет приоритет.
Bind:nativeElement возвращает фактический button или a.

```svelte
<Button color="purple" variant="filled" iconPlacement="end">Действие</Button>
<Button href="#details">К подробностям</Button>
<SpaceCompact size="small"><Button>Назад</Button><Button>Вперёд</Button></SpaceCompact>
```

Полная пара color+variant имеет приоритет над type/danger. Без пары явный type
либо danger выбирает исходную sugar-map. Отдельный variant=solid выбирает primary;
неполные остальные пары fallback используют ConfigProvider.button либо default/
outlined, как в коде Ant Design 6.6.8. Color включает default/primary/danger и
13 preset colors. Ghost превращает solid в outlined и включает прозрачный фон;
для text/link ghost не применяется. Square использует обычный border radius без
дополнительного shape-класса. Block и размеры сохраняют прежнее поведение.

Loading принимает boolean или {delay,icon}. Положительный delay откладывает
spinner; смена delay/отмена/удаление очищают deadline. Loading.icon имеет приоритет
над button.loadingIcon. SSR не создаёт timer и не показывает отложенный spinner.
Согласованный v1 native button во время loading остаётся disabled и aria-busy;
это сохраняет существующее отличие от React click guard. Для ссылки loading
отменяет переход через preventDefault; disabled дополнительно убирает href,
ставит aria-disabled и tabindex=-1. Enabled anchor получает tabindex=0 как upstream.
Native button сохраняет htmlType/button/submit/reset и form-атрибуты; href не
превращает type=link в навигацию автоматически. AutoFocus фокусирует при mount.

При гидратации сфокусированная кнопка или ссылка сохраняет DOM-узел и фокус.
Enter вызывает обработчик на том же нативном элементе.
[Сверка с React 6.6.8](../../../tests/browser/button-hydration.spec.ts).

ClassNames/styles — объект или функция от {props}; слоты root/icon/content.
Классы объединяются. Стилевые слои: context.styles → context.style(root) →
local styles → local style(root). ConfigProvider.button задаёт autoInsertSpace,
shape/color/variant, loadingIcon, class/style и semantic slots. Omitted button
наследует config; явный объект, включая {}, заменяет его целиком как в upstream.
FloatButton может пропустить semantic slots этого config через внутренний
_skipSemantic; обычные пользователи не должны использовать этот prop.

Размер Button берётся из local size, затем Compact, затем ConfigProvider.
Для плотных групп используется SpaceCompact; native Tab-порядок сохраняется.

AutoInsertSpace по умолчанию true: scalar children из ровно двух символов
U+4E00–U+9FA5 получают пробел на SSR, если нет icon и variant не text/link.
Svelte Snippet непрозрачен для SSR; после hydration проверяется единственный
отрендеренный text/element и применяется исходный HOC-класс letter-spacing.
Текст и DOM владельца не переписываются; такой Snippet сохраняет textContent без
ASCII-пробела, в отличие от scalar children. Изменения текста наблюдаются с cleanup.
Эта адаптация явно учитывается как partial coverage в реестре.

Button поддерживает local/shared prefixCls для root, icon/loading, вариантов,
размеров, shapes и Compact. Непустой локальный prefix имеет приоритет; пустой
или undefined наследует ConfigProvider.prefixCls. Служебные переменные вариантов
и Compact используют общий namespace независимо от local class и cssVar.prefix;
component tokens и legacy themes сохраняют прежний namespace и приоритет стилей.
Смена prefix сохраняет DOM/ref, focus, draft/selection и native submit.

Enter/leave анимация loading icon пока отсутствует; прежний spinner сохранён.
Source component tokens и [Wave](../wave.md) подключены.
Общий механизм тем,
RTL, Form disabled и Compact остаётся прежним. Фикстура — ?fixture=button. Unit/SSR/Chromium проверяют приоритеты,
формы/ссылки, delay/cancel, CJK, nested config, Compact и совместимость
с Popconfirm. Фикстура ?fixture=button-prefix сравнивает оформление с официальным
UMD и сохраняемое состояние. Default CSS Button входит в vendor/antd.css;
button-prefix выводит отдельный template без deprecated ButtonGroup.

