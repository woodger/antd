# Upload / UploadDragger

Upload selects and uploads files. UploadDragger also accepts drag
and drop. `UPLOAD_LIST_IGNORE` excludes a file from the list.

`prefixCls` sets the namespace for Upload, Dragger, the list, and
all states. The empty string inherits `ConfigProvider.prefixCls`.
Canonical variables and the link reset are preserved. Button,
Progress, and Tooltip use their own namespaces. The
`upload-prefix` CSS recipe reproduces the same 91 rules and
keyframes in a scoped template. The comparison covers all list
types, drag and drop, RTL, states, and nested and reset scopes.
Prefix changes preserve wrapper, input, and filename DOM, refs,
focus, and active requests. Completion and removal keep the same
callbacks. Consumer slot classes keep their names.
[Official UMD comparison](../../../tests/browser/fixtures/ant-design-upload-prefix-reference.json)

```svelte
<script lang="ts">
  import { Upload, Button, UPLOAD_LIST_IGNORE, type UploadFile } from '@woodger/antd';
  let files = $state.raw<UploadFile[]>([]);
</script>
<Upload fileList={files} multiple action="/api/upload" name="attachment"
  beforeUpload={file => file.size > 10_000_000 ? UPLOAD_LIST_IGNORE : true}
  onChange={info => { files = info.fileList; }}>
  <Button>Выбрать файлы</Button>
</Upload>
```

`fileList` is controlled through `onChange`. `defaultFileList`
initializes the internal list. An `UploadFile` has stable `uid`
and `name` and optional `status`, `percent`, `url`, `thumbUrl`,
`originFileObj`, `response`, `error`, and `xhr`. The statuses
are `uploading`, `done`, `error`, and `removed`. API types are
parameterized by the response type: `UploadProps<T>`,
`UploadFile<T>`, and `UploadRequestOptions<T>`. Optional
`fileName` and `preview` preserve upstream metadata. The row
label uses `name`, and images use `thumbUrl` or `url`. These
metadata fields alone do not change display.

`bind:this` exposes the same `UploadRef<T>` on Upload and Dragger:
`onBatchStart`, `onProgress`, `onSuccess`, `onError`, the current
`fileList`, and `upload.abort`. `onBatchStart` takes an already
prepared batch and calls `onChange` for each accepted file
without running `beforeUpload` or starting transport.
`parsedFile=null` retains a manual file without `uploading`
status. A callback for an unknown or removed `uid` leaves
the list intact. The owner still accepts controlled
`fileList` changes. `onSuccess` parses a JSON response string,
falling back to plain text on a parse error. Imperative
callbacks change the list independently of transport completion.
A request can still be canceled after a direct `onSuccess` call.

Direct `abort`, `bind:nativeElement`, and `bind:inputElement`
are preserved. The same DOM refs are available through
`bind:this` and clear on unmount. Retained callbacks after
unmount publish no changes. Nested `upload` exposes `abort`.
The base `React.Component` methods and `saveUploader` belong
to the React renderer. [18 raw cases](../../../tests/browser/fixtures/ant-design-upload-ref-reference.json) ·
[Two transport scenarios](../../../tests/browser/fixtures/ant-design-upload-ref-transport-reference.json) · [Browser tests](../../../tests/browser/upload/upload-ref.spec.ts) ·
[SSR tests](../../../tests/package/upload/upload-ref.ssr.test.ts) · [Controller tests](../../../src/lib/upload/upload-controller.engine.test.ts)

If the first `onChange` synchronously unmounts the component,
the rest of the batch stops before additional callbacks, status
changes, and requests. In Ant Design 6.6.8, `onBatchStart`
calls the second callback after unmount. Svelte stops the loop
and preserves its cleanup contract. Browser regression tests
cover ref batches and selecting multiple files.
[Raw observation](../../../tests/browser/fixtures/ant-design-upload-batch-disposal-observation.json)

Supply a `uid` for each item. `onChange({file,fileList,event?})`
proposes the complete new list. The owner can reject the change.
Progress, success, or error for a file already removed by the
owner leaves `onChange` uncalled.

`beforeUpload(file,batch)` can be async. Returning `false` or
rejecting a Promise blocks transport but keeps the file without
`uploading` status. `UPLOAD_LIST_IGNORE` also excludes it from
the list. A Blob or File replaces the payload and preserves
the original UID. `action` and `data` receive the original file.
The batch starts after all `beforeUpload`, `action`, and `data`
processing. For upstream compatibility, a `false` result gives
a native File with UID in `onChange.file`, while its item in
`fileList` has `originFileObj`. The callback type reflects the
difference. `maxCount=1` keeps the last file. Higher counts keep
the first N. `maxCount` limits the list and callbacks and
does not cancel requests by itself.

The default transport uses XHR and multipart FormData, with
`name='file'`, `method='post'`, and `action=''`. `data` can be an
object or async callback. Arrays are added as `key[]`. Headers,
credentials, and async `action` are supported. Set the
`X-Requested-With` header to `null` to omit the default
`XMLHttpRequest` value. A 2xx response succeeds, and JSON
responses are parsed. HTTP and network errors reach file state.
`customRequest(options,{defaultRequest})` receives `file`,
`action`, `data`, `name` as `filename`, `method`, `headers`,
`withCredentials`, `onProgress`, `onSuccess`, and `onError`.
It can call the supplied `defaultRequest` and return
`{abort()}`. Use `abort(file|uid)` through `bind:this` or
`abort()` to cancel active requests. Unmount cancels them
automatically.

Manual upload follows upstream. Use `beforeUpload={() => false}`,
a controlled list, and a separate button that sends
`originFileObj` with the consumer's transport and updates
`fileList`. Application endpoints, queues, and submission
remain with the consumer.

`onRemove` can return `false` or `Promise<false>` to block removal.
Once accepted, the request is canceled and `onChange` receives
`status='removed'`. Preview and download use `onPreview` and
`onDownload`. Without callbacks, links open `url`. Disabled
hides remove by default and blocks it even with
`showRemoveIcon=true`. Preview and download stay available as
upstream. `showUploadList` takes `false` or an object with
`showRemoveIcon`, `showDownloadIcon`, and `showPreviewIcon` as
booleans or predicates. `extra` is a `Snippet<[UploadFile]>`.
`listType` is `text`, `picture`, `picture-card`, or
`picture-circle`. `previewFile` and `isImageUrl` customize
thumbnails. By default they follow the upstream 200px canvas
preview, including GIF and SVG. Progress appears after 300ms.

A nonempty `thumbUrl` takes precedence over `url`. Empty
`thumbUrl` retains the image and preview from `url` without
calling `previewFile`. Generation runs only with
`thumbUrl === undefined` and `originFileObj`. Changing state
read within `previewFile` alone leaves generation untouched.
Replacing the file or handler still recalculates the preview,
and a stale Promise cannot replace the current thumbnail.
Tests cover picture, card, and circle, empty URLs, other file
types, and updates that preserve the row, input, and external
focus. [Raw measurements](../../../tests/browser/fixtures/ant-design-upload-thumbnail-fallback-reference.json) · [Browser tests](../../../tests/browser/upload/upload-thumbnail-fallback.spec.ts) ·
[SSR tests](../../../tests/package/upload/upload-thumbnail-fallback.ssr.test.ts)

The initial list appears without motion. New text and picture
rows animate height and opacity. Card and circle use upstream
size, margin, and opacity keyframes. A removed row remains
until its own CSS end event or a 2000ms deadline. Returning
the same UID cancels exit and preserves the DOM. Callbacks,
`fileList`, and transport cancellation do not wait on styling.
`theme.token.motion=false` and reduced motion finish immediately.
Tests cover four list types, prefix, RTL, duration tokens,
returning rows, and cleanup. [Raw measurements](../../../tests/browser/fixtures/ant-design-upload-motion-reference.json) ·
[Browser tests](../../../tests/browser/upload/upload-motion.spec.ts) · [SSR tests](../../../tests/package/upload/upload-motion.ssr.test.ts)

Progress appears after 300ms and retains its wrapper and bar
through the upstream fade on completion. Returning to
`uploading` cancels exit without replacing DOM. Motion off,
reduced motion, and unmount clear the transition and deadline.
`'percent' in file` follows upstream. Explicit
`percent: undefined` shows a zero bar, while an absent field
leaves only an empty fade wrapper. Fade uses the shared
`ConfigProvider.prefixCls` independently of local Upload prefix.
Duration inherits global and component aliases. The raw
samples all name the bar explicitly. Svelte retains its native
name fallback. [Raw measurements](../../../tests/browser/fixtures/ant-design-upload-progress-motion-reference.json) ·
[Browser tests](../../../tests/browser/upload/upload-progress-motion.spec.ts) · [SSR tests](../../../tests/package/upload/upload-progress-motion.ssr.test.ts)

Upload keeps one native file input across list types. With
empty `children`, the select card stays hidden and retains the
input and selected files. Hidden or disabled input loses its
ID. Dragger adds no second select trigger in card or circle.
The card and circle trigger skips initial appear, preserves
the input across hide and return, and uses upstream leave and
enter keyframes. During transition, `pointer-events:none`
precedes user `style`. Explicit `pointer-events` and `display`
retain precedence. Tests cover controls, identity, and cleanup.
[16 raw structure cases](../../../tests/browser/fixtures/ant-design-upload-trigger-structure-reference.json) · [Six motion scenarios](../../../tests/browser/fixtures/ant-design-upload-trigger-motion-reference.json)
· [Browser tests](../../../tests/browser/upload/upload-trigger.spec.ts) · [SSR tests](../../../tests/package/upload/upload-trigger.ssr.test.ts)

In `diffKeys` from `@rc-component/motion` 1.3.3, reordering
`[a, __proto__]` to `[__proto__, a]` returns duplicate keys.
The same occurs with `constructor`. Svelte uses `Map` and
keeps one row per UID. The original results are retained, and
the dependency license is included. [Upstream results](../../../tests/reference/ant-design-upload-motion-keys-reference.json)
· [rc-motion license](../../../src/lib/vendor/LICENSE.rc-motion)

UploadDragger accepts `height` and defaults to
`hasControlInside=false`. Its trigger uses `role=button` and
opens the chooser with the keyboard. Ordinary Upload expects
a native control inside its children Snippet by default. Pass
local `disabled` to that control as well. Upload inherits
`Form.disabled` and `ConfigProvider.componentDisabled`. Explicit
`disabled` overrides context.

`openFileDialogOnClick=false` keeps drop without opening the
chooser. `multiple`, `accept`, and `capture` pass to the hidden
input. Native selection usually relies on browser filtering.
Drop uses `accept`. `accept={format,filter:'native'|predicate}`
is supported. In rc-upload 1.1.1, single drop selects the
first original file without accept filtering. This is
preserved. The input resets after selection so the same file
can be chosen again. Disabled or missing children removes
the ID so a label cannot open the chooser. Native and input
bindings supply DOM elements without starting transport in
SSR.

`ConfigProvider.theme.components.Upload` applies
`actionsColor`, `pictureCardSize`, aliases, and algorithms to the
wrapper, list, and Dragger. `actionsColor` colors regular actions.
Cards keep the original white icons over the dark overlay.
Button, Progress, and Tooltip receive their own component
tokens. `style` stays on the select or drop area. Local CSS
variables, including a different `cssVar.prefix`, override
calculated theme values on that area.

Theme updates preserve the controller, requests, `fileList`,
native input, and focus. Canonical icon classes apply
upstream action dimensions and colors. The error Tooltip
wrapper keeps the full card height. The fixture
`?fixture=upload-theme` covers 16 official UMD themes and
list states. SSR starts neither uploads nor browser timers.
[UMD theme reference](../../../tests/browser/upload/upload-theme.spec.ts) · [SSR tests](../../../tests/package/upload/upload-theme.ssr.test.ts)

In styles shared with upstream, `pictureCardSize: 0` overlaps
cards. The first card's center can hit the next card's preview.
The reference retains the observation under
`zero-metrics.interactions`. This edge case is open.
[Theme reference](../../../tests/browser/fixtures/ant-design-upload-theme-reference.json)

Error Tooltip text uses the upstream order: nonempty string
`response`, `error.statusText`, `error.message`, and
`locale.uploadError`. A controlled error accepts string metadata
alongside Error and ProgressEvent. Empty fields are skipped. A
response object leaves the error message intact. Updating
metadata for an open tooltip preserves the row and file input.
The logic tests also cover locale fallback.
[Ten upstream cases and four transitions](../../../tests/browser/fixtures/ant-design-upload-error-message-reference.json) ·
[Browser tests](../../../tests/browser/upload/upload-error-message.spec.ts) · [SSR tests](../../../tests/package/upload/upload-error-message.ssr.test.ts) · [Logic tests](../../../src/lib/upload/upload.engine.test.ts)

`showUploadList.previewIcon`, `downloadIcon`, and `removeIcon` are
Snippets receiving `(file)` for standard action content. They
leave visibility predicates, locale labels, status and disabled
rules, and callbacks `onPreview`, `onDownload`, and `onRemove`
intact. An omitted Snippet retains the original SVG. An empty
Snippet leaves empty content and numeric zero renders. Preview
is used in card and circle, and download only for `done`.
Disabled removal remains blocked.

A Snippet corresponds to React content or Fragment, with
presence based on the Snippet itself. ReactElement inspection,
cloning, and copying its `onClick` onto the button are outside
this adaptation. Handlers on its nested DOM retain native
event order, as for other opaque render Snippets. Tests cover
content, retained controls and input DOM, and keyboard removal.
[21 upstream variants, actions, and transitions](../../../tests/browser/fixtures/ant-design-upload-action-icons-reference.json) ·
[Browser tests](../../../tests/browser/upload/upload-action-icons.spec.ts) · [SSR tests](../../../tests/package/upload/upload-action-icons.ssr.test.ts)

`ConfigProvider.upload` supplies shared `class`, `style`,
`classNames`, `styles`, `accept`, `customRequest`, and `progress`.
An omitted record inherits. Nested `upload={{}}` replaces it
in full. Classes accumulate with local slots. Style layers
follow the upstream order: provider styles, provider `style` on
the trigger, local styles, and local `style` on the trigger.
Local `accept`, including the empty string, overrides shared
`accept`. `customRequest` uses the local handler if available,
otherwise the shared handler. Semantic callbacks see the
original local `accept` rather than its inherited value.

Progress merges field by field over the shared object. A
local `{}` keeps provider progress settings. Without a provider,
`{}` still uses Progress defaults. A new request handler
applies to subsequent files. Active requests, `fileList`, and
input DOM are preserved. [13 cases, four progress samples, and request events](../../../tests/browser/fixtures/ant-design-upload-config-reference.json)
· [Browser tests](../../../tests/browser/upload/upload-config.spec.ts) · [SSR tests](../../../tests/package/upload/upload-config.ssr.test.ts)

In rc-upload 1.1.1, a synchronous `onSuccess` can finish a
request before it enters internal storage. The next unmount
calls abort on the completed request. The same reference
retains `rawRequests` and `rawUnmountEvents`. It separately
measures `publicRequests` with delayed completion after the
raw cases. Svelte preserves its completed transport safeguard.
An unfinished request is canceled.

`classNames` and `styles` define four semantic slots: `root`,
`list`, `item`, and `trigger`. Class names and CSS styles
are strings. Both props take a callback with `{props}` containing
supplied props and resolved `listType`, `type`, `multiple`,
`hasControlInside`, `disabled`, and `showUploadList`. The
callback gets the original `prefixCls` and does not receive
bindable DOM refs.

`root` styles the wrapper. `item` styles the inner row, including
inside an error Tooltip and in `itemRender`'s `originNode`. Plain
`style` stays on the trigger and overrides `styles.trigger`.
`class` and `rootClassName` remain on the wrapper.
`styles.root` variables pass to the trigger through the theme
bridge. The trigger's own semantic and plain style variables
take precedence. Slot changes preserve the controller, wrapper,
item, trigger, and input DOM, and external drafts, focus, and
selection. [16 upstream cases and five transitions](../../../tests/browser/fixtures/ant-design-upload-semantic-reference.json) ·
[Browser tests](../../../tests/browser/upload/upload-semantic.spec.ts) · [SSR tests](../../../tests/package/upload/upload-semantic.ssr.test.ts)

`progress` configures line Progress in an uploading row. If
omitted, it uses `size=[-1,2]` and `showInfo=false`. An explicit
object, including `{}`, replaces these defaults in full and
uses Progress defaults for omitted fields. The percent comes
from UploadFile. `type` and deprecated line `strokeWidth` are
outside `UploadListProgressProps`. Use `size` for thickness.

The existing Svelte Progress receives size, colors and
gradient, success and status, steps, format, semantic slots,
and ARIA. `UploadFile['aria-label']` and `['aria-labelledby']`
name a file's progress, and progress props take precedence.
Without an explicit name, the localized name includes
the filename. Display is still delayed by 300ms. SSR creates
no bar or browser timer. Prop and percent updates preserve
the item, input, progress root, and external editor.
[16 upstream cases and six transitions](../../../tests/browser/fixtures/ant-design-upload-progress-reference.json) ·
[Browser tests](../../../tests/browser/upload/upload-progress.spec.ts) · [SSR tests](../../../tests/package/upload/upload-progress.ssr.test.ts)

`UploadFile.linkProps` supplies filename link attributes as an
object or JSON with native Svelte keys such as `class`,
`onclick`, and CSS string `style`. Defaults are
`target="_blank"`, `rel="noopener noreferrer"`, and
`title=file.name`. `linkProps` can override them. `href` always
comes from `file.url`. Attributes apply only to the linked name,
excluding the thumbnail, preview action, and names without a URL.

`linkProps.onclick` runs before `onPreview`.
`preventDefault()` cancels preview. Returning `false` and
`stopPropagation()` alone do not cancel it. Invalid JSON
throws `SyntaxError` as upstream. Attribute changes preserve
link and input DOM. [19 upstream cases and five transitions](../../../tests/browser/fixtures/ant-design-upload-link-props-reference.json)
· [Browser tests](../../../tests/browser/upload/upload-link-props.spec.ts) · [SSR tests](../../../tests/package/upload/upload-link-props.ssr.test.ts)

`iconRender` is a Snippet receiving `(file, listType)` that
replaces the visible file icon across all list types and
statuses. An empty Snippet leaves empty content, and numeric
zero is displayed. A ready image thumbnail keeps precedence.
Without the prop, the existing loading, file, picture, and
paperclip defaults apply. Changing the renderer preserves
row, filename, and input DOM and editor focus. Tests check
visible content. Snippets do not reproduce the side effects
of calling a React render function.
[25 upstream variants](../../../tests/browser/fixtures/ant-design-upload-icon-render-reference.json) · [Browser tests](../../../tests/browser/upload/upload-icon-render.spec.ts) ·
[SSR tests](../../../tests/package/upload/upload-icon-render.ssr.test.ts)

`itemRender` is a Snippet receiving
`(originNode, file, fileList, actions)`. `originNode` contains the
usual row and error Tooltip. It can be wrapped, replaced, or
left unrendered. The outer list item container remains.
`fileList` is the current readonly list in original order.
`actions.preview`, `download`, and `remove` are bound to the file.
Preview accepts an optional MouseEvent and cancels its default
action when `onPreview` is supplied. Custom renderer actions
remain available when disabled, as upstream. Standard control
disabled state is independent.

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

A Snippet is opaque to the consumer. ReactElement introspection
and cloning are outside the port. Changing the renderer can
replace inner DOM according to the renderer. The containers,
file input, file order, and external focus and selection are
preserved. [19 upstream variants and actions](../../../tests/browser/fixtures/ant-design-upload-item-render-reference.json) ·
[Browser tests](../../../tests/browser/upload/upload-item-render.spec.ts) · [SSR tests](../../../tests/package/upload/upload-item-render.ssr.test.ts)

`directory=true` enables folder selection and traversal of
nested files on drop or paste. The input receives `directory`
and `webkitdirectory`. `multiple` keeps its value because
folder mode handles all accepted files even at `multiple=false`.
Traversal is breadth-first, and the directory reader is
read in batches until exhausted. `accept` also applies to
folder selection. The path is available in
`File.webkitRelativePath` to `beforeUpload` and in
`fileList[*].originFileObj`. An existing nonempty path is
preserved. Directory prop changes preserve input and trigger
refs and focus. SSR serializes `webkitdirectory` as a boolean
attribute. The browser preserves the upstream values.

A directory read error ends its enumeration as upstream.
For a file read error, rc-upload 1.1.1 has no error callback.
The Promise remains pending and blocks other files. Svelte
skips an unreadable file and continues traversal. The reference
keeps the raw case and a separate public upstream sample with
the remaining readable file. If reading finishes after disable
or unmount, it leaves `beforeUpload` uncalled.
[Directory measurements](../../../tests/browser/fixtures/ant-design-upload-directory-reference.json) · [Browser tests](../../../tests/browser/upload/upload-directory.spec.ts) ·
[SSR tests](../../../tests/package/upload/upload-directory.ssr.test.ts) · [Traversal tests](../../../src/lib/upload/upload-directory.dom.test.ts)

`pastable=true` enables file paste on the document as in
AjaxUploader 1.1.1 and defaults to `false`. UploadDragger
inherits the prop. Files cancel ordinary paste. Text without
files is left to the browser. Multiple paste uses `accept`.
Single paste and drop keep the upstream first-file selection
before filtering. Files pass through normal `beforeUpload`,
`fileList` and `onChange`, and `customRequest`. Paste and
disabled updates and unmount update the listener while
preserving input and trigger refs.

Local and inherited disabled state blocks paste. The original
6.6.8 document handler lacks this guard and still calls
`beforeUpload` and `onChange`. The raw reference keeps the
disabled observation separately. Browser tests cover callbacks,
document events, external editor focus and selection, transport,
and cleanup. SSR creates no browser listeners.
[Raw measurements](../../../tests/browser/fixtures/ant-design-upload-paste-reference.json) · [Browser tests](../../../tests/browser/upload/upload-paste.spec.ts) ·
[SSR tests](../../../tests/package/upload/upload-paste.ssr.test.ts)

ConfigProvider upload locale, local `locale`, Russian and English,
RTL, and theme variables are supported. The registry tracks
React.Component and renderer refs, ReactElement cloning, and
event forwarding separately. React Upload coverage is partial.
