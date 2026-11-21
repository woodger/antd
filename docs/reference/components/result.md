# Result

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

