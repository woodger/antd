# Upload / UploadDragger

Upload переносит Ant Design и AjaxUploader/request из @rc-component/upload.
UploadDragger соответствует Upload.Dragger; UPLOAD_LIST_IGNORE — отдельный
экспорт аналога Upload.LIST_IGNORE. React и rc-upload runtime не устанавливаются.
Лицензия rc-upload сохранена в vendor/LICENSE.rc-upload; CSS-рецепт извлекает
91 правило и четыре keyframes из закреплённого antd.css; неиспользуемые collapse
selectors исключены.
Отдельный рецепт `upload-link-reset` добавляет 14 исходных общих правил ссылок
внутри Upload; цвета error rows сохраняют приоритет.
Иконки взяты из закреплённого @ant-design/icons-svg с существующей лицензией.

`prefixCls` задаёт namespace Upload/Dragger, списка и всех состояний; пустая строка
наследует ConfigProvider.prefixCls. Canonical variables и link reset сохранены,
Button/Progress/Tooltip используют свои namespaces. CSS-рецепт upload-prefix
воспроизводит те же 91 правило и keyframes в изолированном шаблоне.
[Сверка с официальным UMD](../../../tests/browser/fixtures/ant-design-upload-prefix-reference.json)
покрывает все list types, drag, RTL, states и вложенные/reset scopes. Смена prefix
сохраняет wrapper/input/filename DOM, refs, фокус и выполняющийся запрос; completion
и remove публикуют прежние callbacks. Consumer slot classes автоматически не переименовываются.

```svelte
<script lang="ts">
  import { Upload, Button, UPLOAD_LIST_IGNORE, type UploadFile } from 'antd-svelte';
  let files = $state.raw<UploadFile[]>([]);
</script>
<Upload fileList={files} multiple action="/api/upload" name="attachment"
  beforeUpload={file => file.size > 10_000_000 ? UPLOAD_LIST_IGNORE : true}
  onChange={info => { files = info.fileList; }}>
  <Button>Выбрать файлы</Button>
</Upload>
```

FileList — controlled prop с onChange; defaultFileList задаёт внутренний список.
Элемент UploadFile имеет стабильный uid, name, optional status/percent/url/thumbUrl,
originFileObj/response/error/xhr. Статусы — uploading/done/error/removed. API типов
параметризован типом ответа: UploadProps<T>, UploadFile<T>, UploadRequestOptions<T>.
Необязательные fileName и preview сохраняют metadata API upstream: подпись строки
использует name, изображение — thumbUrl/url. Эти поля не меняют отображение сами по себе.

`bind:this` предоставляет UploadRef<T>, одинаковый для Upload и Dragger:
onBatchStart/onProgress/onSuccess/onError, актуальный fileList и upload.abort.
`onBatchStart` принимает уже подготовленный batch, публикует onChange для каждого
принятого файла и не запускает beforeUpload или транспорт. parsedFile=null
сохраняет ручной файл без статуса uploading. Callback неизвестного или удалённого
uid не меняет список; controlled fileList по-прежнему принимает владелец.
`onSuccess` разбирает JSON-строку ответа, сохраняя обычный текст при ошибке разбора.
Imperative callbacks меняют список независимо от завершения транспорта, поэтому
после прямого onSuccess активный запрос по-прежнему можно отменить.

Прямой abort и bind:nativeElement/bind:inputElement сохранены. Эти DOM refs также
доступны через bind:this и очищаются при unmount; сохранённые callbacks после
unmount не публикуют изменения. Вложенный upload предоставляет abort; базовые
методы React.Component и saveUploader относятся к привязке React renderer.
[18 raw случаев](../../../tests/browser/fixtures/ant-design-upload-ref-reference.json),
[два transport-сценария](../../../tests/browser/fixtures/ant-design-upload-ref-transport-reference.json),
[browser](../../../tests/browser/upload-ref.spec.ts),
[SSR](../../../tests/package/upload-ref.ssr.test.ts) и
[controller](../../../src/lib/upload-controller.engine.test.ts) защищают lifecycle API.

Если первый onChange синхронно размонтирует компонент, оставшийся batch
останавливается до следующих callbacks, изменений статуса и отправки запросов.
В Ant Design 6.6.8 цикл onBatchStart вызывает второй callback уже после unmount;
[raw observation](../../../tests/browser/fixtures/ant-design-upload-batch-disposal-observation.json)
сохраняет это поведение отдельно. Native прекращает цикл и сохраняет прежний
cleanup contract; browser-регрессия проверяет и ref batch, и выбор нескольких файлов.

Передавайте uid для каждого элемента списка. Callback onChange({file,fileList,event?})
предлагает полный новый список; владелец может отклонить изменение. Progress/success/error
файла, уже исключённого владельцем из списка, не вызывают onChange.

BeforeUpload(file,batch) может быть асинхронным. Возврат false или rejected promise
останавливает отправку, но сохраняет файл без uploading-статуса. UPLOAD_LIST_IGNORE
исключает его и из списка. Blob/File заменяет отправляемое содержимое с исходным
uid; action/data получают исходный файл. Batch стартует после обработки всех
beforeUpload/action/data. Для совместимости с upstream onChange.file при false —
нативный File с uid, а элемент fileList содержит originFileObj; тип callback отражает
это различие. MaxCount=1 сохраняет последний файл; большее значение — первые N.
MaxCount ограничивает список и callbacks, но сам по себе не отменяет запросы.

Стандартный транспорт использует XHR и multipart FormData: name='file', method='post',
action='' по умолчанию; data может быть объектом или async callback, массивы
добавляются как key[]. Поддержаны headers/withCredentials и async action. Заголовок
X-Requested-With=XMLHttpRequest можно отключить значением null. 2xx означает успех,
JSON-ответ разбирается; HTTP/network errors передаются в состояние файла.
CustomRequest(options,{defaultRequest}) получает file/action/data/name как filename,
method/headers/withCredentials и onProgress/onSuccess/onError. Он может вызвать
предоставленный defaultRequest и вернуть {abort()}. Bind:this.abort(file|uid) либо
abort() отменяет активные запросы; unmount отменяет их автоматически.

Ручной запуск устроен как в upstream: beforeUpload={() => false}, контролируемый
список и отдельная кнопка потребителя, которая отправляет originFileObj через
свой транспорт и обновляет fileList. Компонент не добавляет прикладных endpoints,
очередей или нового метода submit. Галерея показывает локальную демонстрацию
такого сценария без сетевой отправки файлов.

OnRemove может вернуть false/Promise<false> для запрета удаления; после разрешения
запрос отменяется, onChange получает status='removed'. Preview/download доступны
через onPreview/onDownload; без callbacks ссылки открывают url. Disabled скрывает
remove по умолчанию и блокирует его даже при showRemoveIcon=true; preview/download
остаются доступны как в upstream. ShowUploadList принимает false или объект
showRemoveIcon/showDownloadIcon/showPreviewIcon (boolean либо predicate), extra —
Snippet<[UploadFile]>. ListType: text, picture, picture-card, picture-circle;
previewFile/isImageUrl настраивают thumbnail. По умолчанию thumbnails повторяют
исходный 200px canvas preview, включая GIF/SVG. Progress появляется через 300 ms.

Непустой `thumbUrl` имеет приоритет над `url`. Пустой `thumbUrl` сохраняет
изображение и preview по `url`, но не запускает `previewFile`: генерация нужна
только при `thumbUrl === undefined` и наличии `originFileObj`.
Изменение состояния, прочитанного внутри `previewFile`, само по себе не запускает
генерацию повторно. Замена файла или обработчика сохраняет обычный пересчёт
миниатюры; результат устаревшего Promise не заменяет актуальную миниатюру.
[Raw-замеры](../../../tests/browser/fixtures/ant-design-upload-thumbnail-fallback-reference.json),
[browser](../../../tests/browser/upload-thumbnail-fallback.spec.ts) и
[SSR](../../../tests/package/upload-thumbnail-fallback.ssr.test.ts) проверяют picture/card/circle,
пустые URL, не-изображения и обновления без потери строки, input и внешнего фокуса.

Начальный список появляется без анимации. Новые строки text/picture раскрываются
по высоте и opacity; card/circle используют исходные keyframes размера, margin
и opacity. При удалении строка сохраняется до собственного CSS end event или
deadline 2000 ms; возврат того же uid отменяет уход и сохраняет DOM. Callbacks,
fileList и отмена транспорта не задерживаются до конца оформления.
`theme.token.motion=false` и reduced motion завершают переход сразу.
[Raw-замеры](../../../tests/browser/fixtures/ant-design-upload-motion-reference.json),
[browser](../../../tests/browser/upload-motion.spec.ts) и
[SSR](../../../tests/package/upload-motion.ssr.test.ts) охватывают четыре list types,
prefixCls, RTL, duration tokens, возврат строки и cleanup.

Progress появляется через 300 ms и сохраняет wrapper/полосу до конца исходного
fade при завершении загрузки. Возврат в uploading отменяет уход без замены DOM;
motion=false, reduced motion и unmount очищают переход и его deadline.
Проверка `'percent' in file` повторяет upstream: явный `percent: undefined`
показывает нулевую полосу, отсутствие поля оставляет только пустой fade wrapper.
Fade использует общий `ConfigProvider.prefixCls`, независимо от локального
Upload prefixCls; duration наследует глобальные и компонентные aliases.
[Raw-замеры](../../../tests/browser/fixtures/ant-design-upload-progress-motion-reference.json),
[browser](../../../tests/browser/upload-progress-motion.spec.ts) и
[SSR](../../../tests/package/upload-progress-motion.ssr.test.ts) защищают эти границы.
Во всех raw samples имя полосы задано явно; прежний Native fallback имени сохранён.

Upload хранит один native file input во всех list types. При пустом children
карточка select остаётся скрытой, сохраняя input и его выбранные файлы; id у
скрытого/disabled input удаляется. Dragger не добавляет второй select в card/circle.
Card/circle trigger пропускает начальный appear, сохраняет input при hide/return
и использует исходные leave/enter keyframes. Во время перехода pointer-events:none
идёт до пользовательского style; явный pointer-events/display сохраняет приоритет.
[16 raw случаев структуры](../../../tests/browser/fixtures/ant-design-upload-trigger-structure-reference.json)
и [шесть motion-сценариев](../../../tests/browser/fixtures/ant-design-upload-trigger-motion-reference.json),
[browser](../../../tests/browser/upload-trigger.spec.ts) и
[SSR](../../../tests/package/upload-trigger.ssr.test.ts) проверяют controls, identity и cleanup.

В `diffKeys` @rc-component/motion 1.3.3 перестановка `[a, __proto__]` в
`[__proto__, a]` возвращает дубликаты ключа; то же происходит с `constructor`.
[Исходные результаты](../../../tools/fixtures/ant-design-upload-motion-keys-reference.json)
сохранены без исправлений. Svelte использует `Map` и сохраняет одну строку на uid.
Лицензия зависимости уже включена в [vendor/LICENSE.rc-motion](../../../src/lib/vendor/LICENSE.rc-motion).

UploadDragger принимает height и по умолчанию hasControlInside=false: его trigger
имеет role=button и открывает chooser клавиатурой. Обычный Upload по умолчанию
ожидает native control внутри children snippet; локальный disabled нужно передавать
и этому control. Form.disabled и ConfigProvider.componentDisabled наследуются компонентом;
явный disabled перекрывает контекст.
OpenFileDialogOnClick=false оставляет drop без открытия chooser. Multiple/accept/capture
передаются скрытому native input; native выбор обычно фильтрует сам браузер, drop
использует accept. Поддержан accept={format,filter:'native'|predicate}. В rc-upload
1.1.1 single drop выбирает первый исходный файл, не применяя accept-фильтр;
это поведение сохранено. Input сбрасывается после выбора для повторного файла.
Id удаляется при disabled/отсутствии children, чтобы label не открывал диалог.
Bind:nativeElement/inputElement дают DOM-элементы, без запуска транспорта при SSR.

`ConfigProvider.theme.components.Upload` применяет actionsColor/pictureCardSize,
aliases и algorithms к wrapper, списку и Dragger. ActionsColor задаёт цвет обычных
действий; в карточках сохраняются исходные белые иконки поверх затемнения.
Button, Progress и Tooltip получают свои component tokens. Style остаётся на
области выбора/drop; локальные CSS variables, включая другой cssVar.prefix,
перекрывают вычисленную тему именно на этой области.

Обновления темы сохраняют controller, запросы, fileList, native input и фокус.
Канонические классы иконок подключают исходные размеры/цвета действий;
обёртка Tooltip ошибки сохраняет полную высоту карточки. 16 тем официального UMD
и состояния списка — [upload-theme](../../../tests/browser/upload-theme.spec.ts),
`?fixture=upload-theme`; [SSR](../../../tests/package/upload-theme.ssr.test.ts) не запускает
загрузку и browser timers.

В общих с upstream стилях `pictureCardSize: 0` приводит к наложению карточек:
центр первой карточки может попасть на preview соседней. Исходное наблюдение
сохранено в `zero-metrics.interactions` [эталона](../../../tests/browser/fixtures/ant-design-upload-theme-reference.json).
Этот крайний случай требует отдельного решения.

Текст Tooltip ошибки следует исходному порядку: непустой string response,
затем error.statusText, error.message и locale.uploadError. Controlled error
принимает строковые metadata наряду с Error/ProgressEvent; пустые поля пропускаются,
response object не подменяет сообщение ошибки. Обновление metadata открытого
Tooltip сохраняет строку и file input.
[Десять исходных случаев и четыре transitions](../../../tests/browser/fixtures/ant-design-upload-error-message-reference.json),
[browser](../../../tests/browser/upload-error-message.spec.ts) и
[SSR](../../../tests/package/upload-error-message.ssr.test.ts) проверяют этот порядок;
[чистая логика](../../../src/lib/upload.engine.test.ts) также защищает locale fallback.

`showUploadList.previewIcon/downloadIcon/removeIcon` — snippets `(file)`
для содержимого стандартных действий. Они не меняют show*Icon predicates,
locale labels, status/disabled rules или onPreview/onDownload/onRemove.
Отсутствующий snippet сохраняет исходный SVG; пустой оставляет содержимое пустым,
числовой 0 отображается. Preview icon используется в card/circle, download —
только для done; disabled remove остаётся заблокированным.

Snippet соответствует React content/Fragment, а не возвращаемому falsy значению
render function. ReactElement inspection/clone и перенос его onClick на кнопку
не воспроизводятся: собственные handlers вложенного DOM имеют нативный порядок
событий. Это та же opaque Snippet boundary, что у остальных render hooks.
[21 исходный вариант, действия и transitions](../../../tests/browser/fixtures/ant-design-upload-action-icons-reference.json),
[browser](../../../tests/browser/upload-action-icons.spec.ts) и
[SSR](../../../tests/package/upload-action-icons.ssr.test.ts) проверяют содержимое,
сохранение controls/input DOM и клавиатурный запуск remove.

`ConfigProvider.upload` задаёт общие class/style, classNames/styles, accept,
customRequest и progress. Незаполненный record наследуется; вложенный upload={{}}
заменяет его целиком. ClassNames накапливаются с локальными slots, CSS-слои идут
в исходном порядке: provider styles, provider style на trigger, local styles,
local style на trigger. Локальный accept, включая пустую строку, перекрывает общий;
customRequest использует локальный handler либо общий. Callback semantic slots
видит исходный локальный accept, а не унаследованное значение.

Progress объединяется поверх общего объекта по полям. Поэтому локальный `{}`
сохраняет provider progress; без provider `{}` по-прежнему использует defaults
самого Progress. Новый request handler применяется к следующим файлам;
выполняющийся запрос, fileList и input DOM сохраняются.
[13 случаев, четыре progress samples и события запросов](../../../tests/browser/fixtures/ant-design-upload-config-reference.json),
[browser](../../../tests/browser/upload-config.spec.ts) и
[SSR](../../../tests/package/upload-config.ssr.test.ts) защищают наследование и приоритеты.

В rc-upload 1.1.1 синхронный onSuccess может завершить запрос до его записи во
внутреннее хранилище. Следующий unmount вызывает abort уже завершённого запроса.
Raw requests/rawUnmountEvents сохранены в том же эталоне; publicRequests с
отложенным completion измерены отдельно после raw cases. Svelte сохраняет
существующую защиту завершённого транспорта; незавершённый запрос отменяется.

`classNames` и `styles` задают четыре semantic slots: root, list, item, trigger.
ClassNames содержит строки классов, styles — CSS-строки. Оба prop принимают
callback с `{props}`: переданные props и resolved listType/type/multiple/
hasControlInside/disabled/showUploadList. PrefixCls в этом объекте остаётся
исходным; bindable DOM refs в callback не передаются.

Root оформляет wrapper; item — внутреннюю строку, в том числе внутри error
Tooltip и originNode itemRender. Обычный style по-прежнему относится к trigger
и перекрывает styles.trigger. Class/rootClassName сохраняются на wrapper.
Переменные styles.root наследуются trigger через theme bridge; его собственные
semantic/style variables имеют приоритет. Смена slots сохраняет controller,
wrapper/item/trigger/input DOM, внешний draft/focus/selection.
[16 исходных случаев и пять transitions](../../../tests/browser/fixtures/ant-design-upload-semantic-reference.json),
[browser](../../../tests/browser/upload-semantic.spec.ts) и
[SSR](../../../tests/package/upload-semantic.ssr.test.ts) защищают эту границу.

`progress` настраивает line Progress в uploading-строке. Без prop применяются
size=[-1,2] и showInfo=false. Явный объект, включая `{}`, заменяет эти defaults
целиком и использует defaults самого Progress для пропущенных полей.
Percent принадлежит UploadFile; type и deprecated line strokeWidth не входят
в UploadListProgressProps. Используйте size для толщины полосы.

Передаются size, цвета/gradient, success/status, steps, format, semantic slots
и ARIA существующего Svelte Progress. Поля UploadFile['aria-label'] и
['aria-labelledby'] задают имя прогресса файла; progress props имеют приоритет.
Без явного имени сохраняется прежнее локализованное имя с filename.
Показ по-прежнему отложен на 300 ms; SSR не создаёт полосу и browser timer.
Обновления props/percent сохраняют item/input/progress root и внешний editor.
[16 исходных случаев и шесть transitions](../../../tests/browser/fixtures/ant-design-upload-progress-reference.json),
[browser](../../../tests/browser/upload-progress.spec.ts) и
[SSR](../../../tests/package/upload-progress.ssr.test.ts) защищают эти границы.

`UploadFile.linkProps` задаёт атрибуты ссылки имени файла: объект либо JSON
с теми же нативными Svelte keys (`class`, `onclick`, строковый `style`).
По умолчанию target="_blank", rel="noopener noreferrer", title=file.name;
linkProps может их перекрыть. Href всегда берётся из file.url. Атрибуты не
передаются thumbnail, preview action или имени без url.

Обработчик linkProps.onclick вызывается перед onPreview. Если он вызвал
preventDefault(), preview не запускается; return false и stopPropagation()
сами по себе preview не отменяют. Невалидный JSON выбрасывает SyntaxError,
как исходный renderer. Обновления атрибутов сохраняют ссылку и input DOM.
[19 исходных случаев и пять transitions](../../../tests/browser/fixtures/ant-design-upload-link-props-reference.json),
[browser](../../../tests/browser/upload-link-props.spec.ts) и
[SSR](../../../tests/package/upload-link-props.ssr.test.ts) сверяют эту границу.

`iconRender` — snippet `(file, listType)`, заменяющий видимую иконку файла
во всех list types и статусах. Пустой snippet сохраняет пустое содержимое;
числовой 0 отображается. Готовая image thumbnail сохраняет приоритет над иконкой.
Без prop работают прежние loading/file/picture/paper-clip defaults.
Смена renderer сохраняет строку, filename и input DOM, а также фокус editor.
[25 исходных вариантов](../../../tests/browser/fixtures/ant-design-upload-icon-render-reference.json),
[browser](../../../tests/browser/upload-icon-render.spec.ts) и
[SSR](../../../tests/package/upload-icon-render.ssr.test.ts) проверяют видимое содержимое;
Snippet не воспроизводит side effects вызова React render function.

`itemRender` — snippet `(originNode, file, fileList, actions)`. OriginNode содержит
обычную строку и Tooltip ошибки; его можно обернуть, заменить или не отрисовать.
Внешний list-item-container сохраняется. FileList — текущий readonly список
в исходном порядке; actions.preview/download/remove привязаны к данному файлу.
Preview принимает необязательный MouseEvent и отменяет его default action,
если задан onPreview. Действия custom renderer остаются доступны при disabled,
как в upstream; disabled стандартных controls задаётся отдельно.

```svelte
<Upload fileList={files} onPreview={file => console.log(file.name)}>
  {#snippet itemRender(originNode, file, fileList, actions)}
    <div data-file-count={fileList.length}>
      {@render originNode()}
      <button type="button" onclick={actions.preview}>Открыть {file.name}</button>
    </div>
  {/snippet}
</Upload>
```

Snippet непрозрачен для потребителя: ReactElement introspection/clone не переносится.
Смена renderer может заменить внутренний DOM по выбору renderer; контейнеры,
file input, порядок файлов и внешний focus/selection сохраняются.
[19 исходных вариантов и действия](../../../tests/browser/fixtures/ant-design-upload-item-render-reference.json),
[browser](../../../tests/browser/upload-item-render.spec.ts) и
[SSR](../../../tests/package/upload-item-render.ssr.test.ts) защищают эту границу.

`directory=true` разрешает выбор папки и обход вложенных файлов при drop/paste.
Input получает directory/webkitdirectory; multiple сохраняет своё значение,
потому что режим папки обрабатывает все принятые файлы и при multiple=false.
Обход идёт в ширину, directory reader читается порциями до конца, accept действует
и для выбора папки. Путь доступен в File.webkitRelativePath у beforeUpload и в
fileList[*].originFileObj; существующее непустое значение не перезаписывается.
Смена directory сохраняет input/trigger refs и фокус. SSR канонизирует
webkitdirectory как boolean attribute; в браузере сохраняются значения Source.

Ошибка чтения каталога завершает его перечисление, как upstream. Для ошибки файла
в rc-upload 1.1.1 отсутствует error callback: Promise остаётся pending и блокирует
остальные файлы. Native пропускает нечитаемый файл и продолжает обход. Raw case
и отдельный public Source sample с оставшимся читаемым файлом сохранены в
[замерах directory](../../../tests/browser/fixtures/ant-design-upload-directory-reference.json).
После disable/unmount завершившееся чтение не вызывает beforeUpload.
[Browser](../../../tests/browser/upload-directory.spec.ts),
[SSR](../../../tests/package/upload-directory.ssr.test.ts) и
[обходчик](../../../src/lib/upload-directory.dom.test.ts) защищают эти границы.

`pastable=true` включает paste файлов в документе, как AjaxUploader 1.1.1;
по умолчанию false. UploadDragger наследует этот prop. Наличие файлов отменяет
обычную вставку; текст без файлов не перехватывается. Multiple использует accept,
а single paste/drop сохраняет исходный выбор первого файла до фильтрации.
Файлы проходят обычные beforeUpload, fileList/onChange и customRequest.
Смена pastable/disabled и unmount обновляют listener, сохраняя input/trigger refs.

Локальный и наследуемый disabled блокируют paste. В исходной 6.6.8 document handler
не имеет этого guard и всё равно вызывает beforeUpload/onChange; это поведение
не перенесено. [Raw-замеры](../../../tests/browser/fixtures/ant-design-upload-paste-reference.json)
сохраняют disabled observation отдельно. [Browser](../../../tests/browser/upload-paste.spec.ts)
проверяет callbacks, документ, focus/selection внешнего editor, транспорт и cleanup;
[SSR](../../../tests/package/upload-paste.ssr.test.ts) не создаёт browser listeners.

Locale/upload из ConfigProvider, собственный locale, RU/EN, RTL и theme variables
поддержаны. React.Component/ref renderer internals и ReactElement clone/event
forwarding остаются отдельными границами реестра. Данный этап
не заявляет полного покрытия React Upload.

