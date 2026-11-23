# Skeleton

```svelte
<script lang="ts">
  import { Skeleton } from '@woodger/antd';

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

