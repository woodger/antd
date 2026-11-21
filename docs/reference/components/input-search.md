# InputSearch (Input.Search)

InputSearch переносит Search.tsx Ant Design: Input и кнопка являются
соседними элементами SpaceCompact. Стили Search уже входят в vendor/antd.css;
геометрия SearchOutlined взята из @ant-design/icons-svg с сохранением MIT.
Публичный контракт находится в [исходных типах](../../../src/lib/input-search.types.ts).

```svelte
<script lang="ts">
  import { InputSearch } from 'antd-svelte';
  let query = $state('');
</script>

<InputSearch bind:value={query} allowClear enterButton="Найти"
  onSearch={(value, event, info) => console.log(value, info?.source)}
  aria-label="Поиск" />
```

Кнопка и Enter вызывают onSearch с текущим native value и source=input.
OnPressEnter вызывается перед поиском; IME, isComposing, повторный Enter и loading
не запускают поиск. Очистка вызывает onValueChange(''), onSearch с source=clear,
onChange(click), onClear, сохраняя Svelte/native события Input. Loading блокирует
кнопку и Enter, но не очистку. Click кнопки сохраняет фокус Input, если он уже
был в поле. Сам по себе ввод не вызывает onSearch.

Boolean enterButton показывает обычную или primary icon button; scalar задаёт
текст primary button. SearchIcon наследуется из inputSearch config, локальный
prop имеет приоритет, null/false скрывают иконку. Для boolean enterButton
доступное имя кнопки использует locale.searchText. Текстовые кнопки именуются
своим содержимым. Вместо React cloneElement пользовательская кнопка задаётся
snippet с InputSearchButtonContext:

```svelte
<script lang="ts">
  import { Button, InputSearch, type InputSearchButtonContext } from 'antd-svelte';
</script>

{#snippet searchButton(context: InputSearchButtonContext)}
  <Button {...context.getButtonProps({ class: 'custom-search' })}>Найти</Button>
{/snippet}
<InputSearch enterButton={searchButton} aria-label="Поиск" />
```

Snippet заменяет кнопку целиком. GetButtonProps сохраняет собственные
disabled/loading, добавляет size и search class, объединяет callbacks в порядке
«собственный → Search». GetNativeProps аналогично обслуживает native button,
сохраняя его class/type и блокируя его при loading. Onmousedown пользователя
получает событие до preventDefault Search. Semantic button styles Search
применяются к стандартной кнопке; пользовательская сохраняет собственные, как
в upstream. Rich content можно разместить внутри своей Button.

ConfigProvider.inputSearch поддерживает class/style, semantic slots, searchIcon
и variant; вложенный объект заменяется целиком. Общий Input config продолжает
действовать на поле. Как в исходнике, input.variant является fallback для поля,
но не для кнопки: без отдельного Search variant она сохраняет обычный Button
variant. Semantic root относится к Compact, а button содержит root/icon/content;
строка в button — сокращение для button.root.

Class/style/hidden и data-* передаются Compact root; id/name/ARIA/constraints
остаются на Input. RootClassName относится к внутреннему Input.
InputElement/nativeElement и методы
bind:this возвращают внутренний Input, не внешний Compact. String bind:value,
defaultValue, FormItem, RTL, Compact, темы и SSR сохраняют контракты Input.
Fixture `?fixture=input-search` проверяет поиск, IME, callbacks, пользовательские
кнопки, semantic/config приоритеты и геометрию. Component token engine и variant
inheritance подключены; согласованные value/ref conventions сохраняются.
Аудит всего семейства остаётся unreviewed.

PrefixCls задаёт Search root/button classes, inputPrefixCls — независимый Input.
Empty/undefined наследуют ConfigProvider; Button и служебная btn-height variable
используют общий prefix независимо от local class и cssVar.prefix. Canonical token
markers и variables сохраняются. Source component tokens применяются также к
корню Search: small-button min-height учитывает inputFontSizeSM/paddingBlockSM.
Semantic styles и style имеют прежний приоритет над вычисленной темой.

Смена prefix сохраняет DOM/ref, value, selection/focus, FormData и поиск. React
Compact пересоздаёт Input при смене общего prefix из-за ключа с prefix в имени;
Native сохраняет прежний стабильный DOM. Raw переходы и измерения после public ref
focus хранятся раздельно. Для enterButton=true Source создаёт пустое Button content
и лишнюю ширину; Native сохраняет прежнюю icon-only кнопку. Public counterpart
использует официальный Button без children. Source shared-class cache теряет
вложенный private variable namespace; freshNested отдельно измерен со свежим
локальным классом в Inner provider. Данные —
[эталон UMD](../../../tests/browser/fixtures/ant-design-input-search-prefix-reference.json),
проверки — `?fixture=input-search-prefix`,
[browser](../../../tests/browser/input-search-prefix.spec.ts) и
[SSR](../../../tests/package/input-search-prefix.ssr.test.ts).

