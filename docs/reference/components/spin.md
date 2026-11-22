# Spin

```svelte
<script lang="ts">
  import { Button, Input, Spin } from '@woodger/antd-svelte';

  let loading = $state(false);
  let draft = $state<string | undefined>('Анна');
</script>

<Button onclick={() => { loading = !loading; }}>Переключить загрузку</Button>
<Spin spinning={loading} delay={200} description="Обновляем профиль…" aria-label="Профиль">
  <label for="profile-name">Имя</label>
  <Input id="profile-name" bind:value={draft} />
</Spin>
```

Без children Spin показывает отдельный индикатор; spinning по умолчанию true.
С children компонент сохраняет их DOM и локальное состояние между загрузками.
Запросами, результатом и отменой операции управляет владелец; Spin отображает
переданный spinning и не выполняет запросов.

Delay задаётся в миллисекундах и откладывает только индикатор. Busy-контент
сразу получает inert и aria-busy=true, даже когда индикатор ещё скрыт.
Положительная конечная задержка округляется вниз и ограничивается 2147483647;
отрицательные, NaN и Infinity означают 0. При короткой загрузке индикатор не
появляется. Изменение spinning или нормализованной delay отменяет старый таймер;
новая задержка отсчитывается заново, в том числе после показа индикатора.
Изменение содержимого, подписи или размера не перезапускает задержку.
Unmount отменяет таймер; SSR не создаёт таймеров и скрывает отложенный индикатор.

Size принимает small, medium и large с точками 14, 20 и 32px по умолчанию. Без size
используется ConfigProvider.componentSize.
`theme.components.Spin` меняет размеры независимо от других компонентов. Поддерживаются темы,
compact, primary, RTL и динамический prefers-reduced-motion. Стандартная анимация
и CSS-анимации/переходы внутри indicator отключаются при reduced motion;
таймерами, SVG/JavaScript-анимацией собственного snippet управляет его владелец.
Высота wrapper определяется содержимым.

Description принимает строку, число или пассивный Snippet.
Indicator — пассивный Snippet, заменяющий четыре точки.
Он получает аргумент { percent, prefixCls, class, style }; прежние snippets без аргументов
работают как раньше. В отличие от React cloneElement, Svelte не клонирует содержимое snippet:
класс dot и semantic style применяются к декоративному span вокруг него. Строки экранируются. Indicator декоративный, без controls
и остановок Tab. Id/class/style относятся к корню. Отдельный индикатор можно
сделать декоративным через aria-hidden, когда текстовый статус уже есть рядом.

Видимый индикатор использует role=status, polite и atomic. Wrapper — именованная
group; её status находится рядом с busy-контентом, вне inert. Объявление не
охватывает форму. Имя задаётся aria-label/aria-labelledby; без них используется
строковая description или Locale.spin.loadingText. Для snippet-description
нужно содержательное доступное имя. ruRU/enUS включают «Загрузка…»/«Loading…»;
частичная locale.spin использует ruRU для отсутствующих полей.

Если фокус был внутри блокируемых children, он временно переходит на wrapper
с tabindex=-1, вне обычного Tab. После загрузки он возвращается в прежний
доступный control, затем в доступный control внутри children или соседний control
текущего dialog/документа. Если пользователь уже перевёл фокус наружу, Spin
его не возвращает. При unmount сфокусированного wrapper используются сохранённые
доступные соседи. Escape остаётся у содержащего Modal/Drawer.
ConfigProvider.disabled не скрывает обратную связь.

Table использует отдельный декоративный Spin в существующей строке загрузки.
Текстовый status, aria-busy таблицы, блокировка её controls и данные сохранены;
таблица не оборачивается в Spin.

Галерея `/ant-design#spin` показывает размеры, задержку, быстрый/медленный ответ,
сохранение имени, checkbox и счётчика, ошибку с Alert/retry, отмену и сброс.
При retry фокус переходит с удаляемой кнопки Alert на карточку профиля.
Её [модель](https://woodger.org/ant-design#spin) отменяет
ожидающий результат при cancel/reset/unmount и защищает новую попытку от старой.

Fullscreen добавляет фиксированный backdrop в текущей DOM-ветке. Он не использует portal,
не блокирует внешний документ через inert и не перехватывает фокус. При spinning=false
корень остаётся в DOM с opacity=0 и pointer-events=none; отдельный обычный Spin по-прежнему
использует hidden. Для children сохраняется описанная выше блокировка и восстановление фокуса.

Percent принимает число или auto. Число ограничивается 0–100 для SVG-кольца; дробная часть
сохраняется. При нуле показываются четыре точки; после первого ненулевого percent кольцо
остаётся смонтированным и скрывается при возврате к нулю. Как в upstream, SVG появляется
после mount и отсутствует в SSR. Auto обновляется каждые 200 мс после появления индикатора:
5%, 3% и 1% от остатка до 100 при текущем значении до 30, 70 и 96 включительно.
Значение останавливается на 96.01238963686535; новый цикл видимой загрузки начинает с нуля.
Переход к числу, остановка и unmount освобождают interval. Размер, описание, тема и prefix
не перезапускают auto.

ConfigProvider.spin задаёт indicator, class/style и object/function classNames/styles.
Undefined наследует record целиком; явный объект, включая {}, заменяет родительский.
Локальный indicator имеет приоритет над provider, затем Spin.setDefaultIndicator(snippet).
Статический setter хранит модульный fallback, принимает null/undefined для сброса и сам
не обновляет смонтированные Spin: новое значение читается при следующем обновлении props.
Semantic callbacks получают нормализованные size, spinning, description, fullscreen и
числовой percent. Поддержаны root, section, indicator, description и container.
Provider styles.root → provider style → local styles.root; для standalone затем идут section,
а локальный style применяется последним. RootClassName, native attrs/events, bind:nativeElement
и bind:ref с nativeElement сохраняются при обновлениях; refs очищаются при unmount.

PrefixCls меняет BEM classes; undefined/пустая строка наследуют ConfigProvider.prefixCls
(по умолчанию ant-spin). CSS template из
35 правил закреплённого архива сохраняет namespace переменных и изолирует root defaults.
Component tokens, aliases, algorithm и CSS-variable prefix/key/hash работают через общий
[контекст темы](../theme-context.md#токены-spin).
Сверка 49 Source-профилей и auto timeline принадлежит библиотеке; примеры потребителя
не заменяют эти проверки. Сохранённые native delay/inert/focus/ARIA и reduced motion — явные
отличия от React. Общий ConfigProvider prefix поддержан; React development warnings
ещё не перенесены.

