# Alert

```svelte
<script lang="ts">
  import { Alert, Button } from '@woodger/antd';

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

