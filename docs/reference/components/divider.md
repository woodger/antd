# Divider

```svelte
<Divider titlePlacement="start" variant="dashed">Раздел проекта</Divider>
<Divider orientation="vertical" />
```

Divider сохраняет структуру Ant Design 6.6.8: корневой div с role=separator,
две rail и inner-text для горизонтальной подписи. Children принимает строку,
число или Snippet; 0 отображается, null/false/пустая строка дают линию без подписи.
Переданный Snippet считается подписью, даже если он выводит пустое содержимое.
Вертикальный Divider не монтирует подпись. Aria-orientation отражает направление;
компонент не добавляет tabindex и не меняет фокус.

Orientation=horizontal/vertical имеет приоритет над boolean vertical.
TitlePlacement задаёт положение подписи: start/end зависят от RTL,
left/right сохраняют физическую сторону, default=center. Отступ подписи
задаётся через styles.content.

Variant=solid/dashed/dotted, dashed alias и plain повторяют классы эталона.
Size=small/medium/large наследуется от явно заданного componentSize в ConfigProvider,
включая вложенные провайдеры. Без явного
размера Divider сохраняет стандартный отступ 24px без подписи и 16px с подписью.
В semantic callbacks size в этом случае undefined. Без подписи large имеет
отступ 24px, medium — 16px, small — 8px;
с подписью large использует 16px, как upstream. Размеры действуют горизонтально.
Темы, compact, RTL и componentDisabled не скрывают разделитель.

Class/style и нативные атрибуты/события передаются корню. Bind:nativeElement
даёт HTMLDivElement после mount. RootClassName добавляет корневой класс.
ClassNames/styles принимают объект со слотами root/rail/content либо callback
({ props }) с нормализованными orientation/titlePlacement/size. Значения styles —
CSS-строки, как style остальных Svelte-компонентов. Root style имеет приоритет
над styles.root; без подписи styles.rail также применяется к корню.

Фикстура — `?fixture=divider`.
SSR и Chromium-проверки покрывают aliases, ноль, snippets, варианты, размеры,
semantic slots, геометрию размещения, темы, RTL и узкий экран.
`ConfigProvider.theme.components.Divider` поддерживает textPaddingInline,
orientationMargin и verticalMarginInline, локальные alias-токены и algorithm.
Токен orientationMargin задаёт долю ширины rail. Тема применяется уже при SSR,
обновляется без замены DOM и предшествует semantic styles и пользовательскому style.
Нули, CSS-единицы, явный undefined и собственный cssVar.prefix сохраняются.
Проверки: [SSR](../../../tests/package/divider-theme.ssr.test.ts),
[browser](../../../tests/browser/divider-theme.spec.ts),
[эталон UMD](../../../tests/browser/fixtures/ant-design-divider-theme-reference.json),
фикстура `?fixture=divider-theme`.

Локальный prefixCls меняет BEM-классы корня, вариантов и потомков; пустой prefix
наследует ConfigProvider.prefixCls (по умолчанию ant-divider).
CSS variables и общий marker сохраняют прежние имена.
Собственный stylesheet из 27 правил добавляется при SSR и очищается при unmount.
Defaults ограничены владельцем, включая prefix, совпадающий с общим marker.

ConfigProvider.divider задаёт class/style и object/function classNames/styles.
Undefined наследует родительский record; явный объект, включая {}, заменяет его
целиком. Приоритет root styles: provider styles.root → provider style → local
styles.root → local style. Без подписи merged styles.rail идёт перед local style.
Callbacks получают прежние нормализованные props и могут вернуть undefined.
Prefix/config updates сохраняют nativeElement, DOM, фокус и состояние соседних полей;
строчный vertical Divider не добавляет пробелы. Проверки:
[SSR](../../../tests/package/divider-config.ssr.test.ts),
[browser](../../../tests/browser/divider-config.spec.ts),
[эталон UMD](../../../tests/browser/fixtures/ant-design-divider-config-reference.json),
фикстура `?fixture=divider-config`. Общий prefix ConfigProvider поддержан;
React development warnings ещё не перенесены.

Vendor/divider.css содержит 27 правил из закреплённого архива; рецепт divider
исключает интеграцию ColorPicker и воспроизводится через `npm run cli -- css`.
Рецепт divider-prefix выводит CSS data module для локального prefix из тех же правил.

