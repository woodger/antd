# Descriptions

Передайте в `items` пары из подписи (`label`) и значения (`children`). Например,
карточка проекта с `column={1}` покажет каждое свойство в отдельной строке.

```svelte
<script lang="ts">
  import { Descriptions } from '@woodger/antd';

  const items = [
    { key: 'owner', label: 'Владелец', children: 'Анна' },
    { key: 'status', label: 'Статус', children: 'В работе' }
  ];
</script>

<Descriptions title="Проект" column={1} {items} />
```

Label/children/title/extra принимают string, number или Snippet; 0 отображается,
пустые значения не создают соответствующий wrapper. Корень — div, затем view/table/tbody/tr и нативные th/td;
bind:nativeElement возвращает div, нативные attrs передаются корню.

Column — число либо responsive map xs–xxxl; по умолчанию xs=1, sm=2,
md/lg/xl/xxl=3, xxxl=4. Пользовательская map проверяется от большего активного
breakpoint к меньшему; затем используется default map. При SSR screens={}
и column=3; media подключаются после mount и очищаются при unmount.
Span — число, responsive map либо filled. Переполнение ограничивается остатком
строки; последняя ячейка неполной строки растягивается на свободные колонки.
Filled завершает текущую строку и занимает оставшуюся часть. Входные items не
мутируются. Как в upstream, responsive перестройка строк может пересоздать
содержимое ячейки, переместившейся между строками; state таких controls храните
снаружи в модели.

Layout=horizontal по умолчанию; vertical создаёт отдельные строки labels/content.
Bordered=false, colon=true. В horizontal bordered label получает th/span=1,
content — td/span=2*span-1; vertical сохраняет span на обеих строках. Colon
управляет псевдоэлементом label только без рамки. Без явного size/componentSize
используется размер large; medium и small уменьшают отступы.
ComponentDisabled не меняет read-only поля.

ClassNames/styles поддерживают root/header/title/extra/label/content, объект
либо callback ({ props }) с разрешёнными column/items/size. У items есть
class/style и classNames/styles.label/content.
Приоритет label/content: root semantic style → item semantic style. В bordered
эти стили относятся к th/td и перекрывают item.style; без рамки — к внутренним span. Style корня идёт после styles.root.
Вложенные таблицы сохраняют собственные bordered/size и не получают row-стили
внешней таблицы. Темы/RTL наследуются через ConfigProvider.

Непустой локальный `prefixCls` задаёт корень, header/title/extra, view/row и все
ячейки; пустое значение наследует `ConfigProvider.prefixCls`. Semantic callbacks
получают исходный локальный prefix. Namespace theme variables независим.
Смена prefix сохраняет DOM/ref, draft/selection/focus и FormData.

Два правила Descriptions внутри Table expanded-row используют общий prefix Table
и локальный prefix Descriptions; namespace владельца изолирует соседние scopes.
Их default-копии в descriptions.css и общем vendor/antd.css ограничены стандартным
owner через zero-specificity selector, чтобы не перекрывать custom namespace.
В оригинале Table ищет только общий Descriptions class и пропускает local prefix.
Raw UMD замеры сохранены; Native сохраняет expanded-row оформление и с local prefix.
Для этого случая expectedNative в эталоне меняет только display view и flex table
на измеренные значения обычного Table context. Полный перенос prefix Table идёт отдельно.
Сверка: [prefix-эталон](../../../tests/browser/fixtures/ant-design-descriptions-prefix-reference.json),
[браузер](../../../tests/browser/descriptions/descriptions-prefix.spec.ts) и
[SSR](../../../tests/package/descriptions/descriptions-prefix.ssr.test.ts), `?fixture=descriptions-prefix`.

ConfigProvider.descriptions задаёт class/style и object/function classNames/styles
для тех же semantic slots. Классы context/local объединяются; root style layers:
context semantic → context style → local semantic → local style. Для ячеек общий
semantic слой идёт перед item semantic styles. Явный вложенный
record, включая {}, заменяет родительский; undefined наследует его. Обновления
сохраняют editor/focus/selection и FormData первой ячейки при смене column/size.
Фикстура — `?fixture=descriptions-config`,
[браузерная сверка](../../../tests/browser/descriptions/descriptions-config.spec.ts) сохраняет raw UMD
classes/tags/colspan/computed styles; проверка классов учитывает состав и количество.

Callbacks сохраняют прежние native bordered=false, layout=horizontal и colon=true
при отсутствии этих props. У upstream raw mergedProps они отсутствуют; наблюдение
записано отдельно в [эталоне](../../../tests/browser/fixtures/ant-design-descriptions-config-reference.json).
Column/items/size разрешены в обоих вариантах.

ConfigProvider.theme.components.Descriptions применяет все десять компонентных
токенов, включая цвета title/extra/label/content, фон label, отступ заголовка,
ячеек и двоеточия. Значения рассчитываются из общих alias tokens; поддержаны
глобальные и компонентные algorithms, cssVar.prefix, вложенные providers
и обновление после mount. Переменные темы идут перед semantic/user styles.
Сохраняются исходные правила 6.6.8: bordered использует labelBg и общий
colorTextSecondary вместо labelColor, а размеры и рамка могут перекрывать
itemPaddingBottom/itemPaddingEnd собственными отступами.
Сверка: [официальные CSS tokens](../../../tests/reference/ant-design-descriptions-tokens-reference.json),
[варианты и responsive spans](../../../tests/browser/fixtures/ant-design-descriptions-theme-reference.json),
[SSR](../../../tests/package/descriptions/descriptions-theme.ssr.test.ts) и
[browser](../../../tests/browser/descriptions/descriptions-theme.spec.ts), `?fixture=descriptions-theme`.

Фикстура — `?fixture=descriptions`.
Unit/SSR/Chromium проверяют раскладку, media, приоритет стилей и вложенность.
Рецепт descriptions извлекает 40 правил без keyframes, включая две интеграции
Table expanded-row. Responsive column/span используют глобальные
`theme.token.screen*`, включая отдельные screenSMMin/screenSM и gaps между
порогами. Вложенный provider наследует значения; inherit:false возвращает defaults.
Порядок порогов проверяется и при SSR; в браузере смена токенов заменяет queries
без remount. Существующее оформление без source theme сохраняет стандартные пороги.
[Исходные замеры](../../../tests/browser/fixtures/ant-design-descriptions-breakpoints-reference.json)
содержат raw stale observer Source при смене токенов и отдельный public fresh mount:
Native сохраняет реактивное поведение, проверенное по свежей исходной раскладке.
[Browser](../../../tests/browser/descriptions/descriptions-breakpoints.spec.ts) проверяет column/span,
editor/ref/focus/selection/FormData и cleanup подписок;
[SSR](../../../tests/package/descriptions/descriptions-breakpoints.ssr.test.ts) — fallback и validation.

