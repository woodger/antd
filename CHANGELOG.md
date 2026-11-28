# Changelog

All notable changes to this project are documented in this file.

The format follows Keep a Changelog, and the project follows Semantic
Versioning. [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

### Added

- Image supports controlled progress placeholders, default and custom rendering,
  and progress semantic styles.
- `ConfigProvider.image` supplies Image defaults. Image and ImagePreviewGroup
  support semantic classes and styles on the viewer and callback resolvers.
- Image and ImagePreviewGroup support `preview.getContainer` and inherit
  `ConfigProvider.getPopupContainer`.
- Image and ImagePreviewGroup expose reusable preview buttons through
  `actionsRender` and support the upstream artwork selection rules.
- Image and ImagePreviewGroup support named preview motion, thumbnail-based
  transform origins, and visibility callbacks after the animation.
- Image and ImagePreviewGroup support `preview.alt`. ImagePreviewGroup also
  accepts a preview source shared by all items.
- `ConfigProvider.useConfig()` exposes the inherited size and disabled settings
  to Svelte components.
- `ConfigProvider.theme.zeroRuntime` uses prebuilt component styles and keeps
  scoped theme variables active.
- Form publishes value and field changes from explicitly wired control events
  and FormList operations. FormProvider coordinates changes and successful
  submissions across named forms.
- Form, FormItem, and validation rules support configurable validation events.
  FormItem can revalidate from edits to its declared field dependencies.
- Form and FormItem support field value retention. Form can clear a detached
  model and restore its initial values on reattachment.
- Form exposes reactive field and selector watches and access to the nearest
  form model.
- Form accepts external field records through `fields` and preserves pending
  validation when `onFieldsChange` feeds the field snapshots back.
- FormItem maps editor properties and events through the `control` snippet
  and supports synchronous normalization before a control edit reaches the store.
- FormItem supports `shouldUpdate` and dependency-selected snapshots in a
  `render` snippet.
- Form creates a model when none is supplied and accepts reactive
  `initialValues` for initialization and reset.
- Form supports custom hosts, `bind:ref`, and a `render` snippet for the full
  store. Native resets call `onreset` after restoring values. Attached models
  and refs accept `submit()` to run the form's callbacks.
- Form provides mounted refs to descendants, render snippets, and FormProvider
  callbacks for imperative submission.
- FormItem animates connected validation messages and reserves space through
  their exit while the field description follows current validation state.

### Fixed

- Modal restores focus and completes close callbacks when its container is
  removed during closing. Moving an open Modal preserves its original opener.
- Modal completes an unanimated close when its container changes in the same update.
- The ordinary Modal footer resets the inherited disabled setting.
- The public `UploadDragger` declarations pass strict TypeScript checking.
- TypeScript resolves stylesheet imports with strict side-effect import checking.
- Form includes CSS scroll margins when scrolling to a field or to the first error.
- FormItem passes native attributes, events, and Grid settings to the inner row.
- Form scrolls to Upload and UploadDragger fields and connects their file inputs
  to field labels and validation messages.

## [0.1.1]

### Changed

- Translated the README, developer guides, component references, changelog,
  and porting report into English.
- Added a `prepack` hook to build the library when running `npm pack` or
  `npm publish` from the repository.

## [0.1.0]

First release of `@woodger/antd` for Svelte 5. The porting summary lists
implemented features and differences from Ant Design.
[Porting summary](docs/reference/ant-design-porting/status.md)

### Fixed

- `Form.getFieldsValue` distinguishes the full form from a partial
  selection in TypeScript. Requesting an empty name list skips field traversal.
- In `tags` mode, Select event types account for an empty object when a
  tag has no source option.
- `classNames` and `styles` callbacks in `ConfigProvider.timePicker` account
  for single values, ranges, multiple selection, and the adapter date type.
- Table preserves rows with an active custom filter without `onFilter`.
- Table processes each child branch once with multiple active filters.
- Generated RangePicker infers `value` and `onChange` from the adapter in
  Svelte templates.
- Manual time input in generated RangePicker preserves the edited endpoint date.
- Calendar year and month selectors fit on one row on narrow screens.
- Select retains the selected option's label and data when the owner
  accepts selection and removes the option in the same update.
- AutoComplete's `components.input` editor preserves height with a nonempty value.

### Changed

- Renamed the package to `@woodger/antd`. Imports and public subpaths use
  the new name.

### Added

- Modal and Drawer accept `zIndex` and pass the layer to nested dialogs,
  Dropdown, Menu, Tooltip, Popover, and Popconfirm.

- Select, AutoComplete, TreeSelect, Cascader, Mentions, and pickers use
  the inherited layer for popups.

- Tour, ColorPicker, FloatButton, image preview, and Table filters use
  the shared `z-index` context.

- Table accepts static content in `filterIcon` and `filterDropdown`.

- Table accepts rich column titles, a caption, and labels for selection commands.

- Table filters accept numeric and rich labels. Menu supports arrays in `label`.

- Table accepts numeric column keys and derives omitted keys from the field or position.

- Table accepts DOM attributes and a `caption` Snippet.

- Table supports conditional cell content updates through `column.shouldCellUpdate`.

- Table inherits `rowKey` and `scroll` from ConfigProvider. `scroll.x` accepts `true`.

- Table accepts Spin options in `loading`, including delay, description, and progress.

- Table supports replacing table, header, and body elements through `components`.

- Table accepts `components.body` for a custom scroll body and synchronizes
  it with the header and fixed summaries.

- Table accepts `getPopupContainer` for filters, submenus, and the row selection menu.

- Table accepts a local `locale` for the empty cell, filters, sorting, expansion,
  and selection commands.

- Table places Pagination above and below through `pagination.placement`.
  Both pagers share the page and page size.

- Table supports `classNames`, `styles`, and `rootClassName`, including
  `ConfigProvider.table` styles and Pagination slots.

- Table column titles accept numbers and Svelte Snippets with sort and filter state.

- Table accepts custom filter panels, Dropdown settings, `filterIcon`,
  and `filterOnClose`.

- Table supports nested filter options, `filterMode`, and `filterSearch`.

- Table supports initial and controlled column filters, `filtered` indication,
  and resetting a draft to `defaultFilteredValue`.

- Table accepts shared column properties through `column`.

- Table shows a sort tooltip and accepts `showSorterTooltip` on the table
  and individual columns.

- Table supports column `sortDirections`, `sortOrder`, `defaultSortOrder`,
  and `sortIcon`, and sorting with multiple priorities.

- Table reads nested `dataIndex` paths and supports `ellipsis`,
  `minWidth`, and `tableLayout`. The virtual header and body use the minimum
  in their shared grid.

- Table accepts data and header row attributes and handlers through
  `onRow` and `onHeaderRow`.

- Table supports custom `expandIcon`, expanded row classes, and
  `forceRender` to retain editors when collapsing details.

- Table positions selection and expansion columns using
  `Table.SELECTION_COLUMN` and `Table.EXPAND_COLUMN`. `rowSelection`
  customizes the selection header, content, and cell attributes.

- Table supports Radio, Shift selection, selection commands, and retaining
  records across data updates through `rowSelection`.

- Table renders summary rows through `Table.Summary` and fixes the header,
  summaries, and additional horizontal scrollbar with `sticky`.

- Table spans header and data cells, including in virtual mode. `onCell`
  and `onHeaderCell` supply individual cell attributes.

- Table builds multi-row headers from `columns.children` and changes
  top-level column visibility through `responsive`.

- Table supports virtual rows, `scrollTo`, and a scroll event.

- Table expands nested rows, sorts and filters branches, and links parent
  and child selection through `rowSelection.checkStrictly`.

- All 73 Ant Design 6.6.8 dictionaries are available through
  `@woodger/antd/locale/<code>` and applied using `ConfigProvider.locale`.

- DatePicker and RangePicker support `prefix`, `classNames`, and `styles`
  for the field and calendar. Shared slots, suffix, and clear settings come
  from `ConfigProvider.datePicker`. Updates preserve the open calendar and focus.

- DatePicker supports `multiple` for dates and periods, confirmation,
  `tagRender`, and responsive tag limits.

- DatePicker and RangePicker support controlled `mode`. Each range endpoint
  controls its own panel. Mode changes preserve fields, drafts, and focus.

- DatePicker, RangePicker, TimePicker, and TimeRangePicker accept a custom
  editor and confirmation button through `components.input` and `components.button`.

- Pickers accept Snippets for eight panel modes. Slots use the standard draft,
  navigation, and confirmation logic. Calendar navigation icons can be replaced.

- Dropdown supports `ConfigProvider.dropdown` styles, `rootClassName`,
  `openClassName`, and `bind:ref` for the trigger DOM node. Controlled
  `open` keeps visibility when the owner rejects a request.

- Dropdown accepts `popupRender`, `forceRender`, `destroyOnHidden`, and
  `transitionName`. Custom panels retain state after close by default.
  The standard animation honors placement and motion settings.

- Dropdown supports `contextMenu`, side placements, `align`,
  `arrow.pointAtCenter`, and per-axis overflow settings. Context menus
  follow the pointer position and account for container width.

- Dropdown uses Menu for commands, groups, nested panels, and selection.
  It supports `menu.activeKey`, `autoFocus`, and local `classNames` and `styles`.

- Menu reports hover on rows, titles, and entire submenu branches, including
  nested popups in separate containers. Item `data-*` attributes reach the DOM.

- Menu animates inline and popup submenus on open and close. `motion` sets
  custom phases, honoring theme and reduced-motion settings.

- Menu shows Tooltip on collapsed items. Tooltips support controlled visibility,
  trigger settings, slots, and an external popup container.

- Menu supports a trailing `itemIcon` after label and extra content,
  configurable on the menu, branch, or item.

- Menu supports `builtinPlacements` and `popupOffset` for popup submenus.
  The map also applies to the overflow list. Updates preserve open submenu
  DOM and focus.

- Menu supports `popupRender` on the menu and individual submenus.
  The default list can be wrapped or replaced, and its rows can be
  reordered while retaining selection and keyboard navigation.

- Horizontal Menu moves overflowing items into an ellipsis submenu.
  The indicator can be replaced and overflow disabled. Focus follows
  the active item between the row and submenu as width changes.

- DatePicker, RangePicker, TimePicker, and TimeRangePicker support object
  `format` and numeric segment masks. Incomplete input stays separate from
  the calendar value. Enter uses the validated Day.js object, and format
  changes preserve pending ranges.

- AutoComplete supports `optionRender`, `labelRender`, and upstream's
  no-op `tagRender` in combobox mode. Raw editor value, closed option cache,
  absolute virtual indices, and custom input behavior are retained.

- Select and AutoComplete support pure `popupRender`, `prefix`, semantic
  `classNames` and `styles`, and shared `ConfigProvider.select`. CSS objects
  preserve shorthand and longhand update order. Custom popup state persists
  after close and isolates FormItem and Compact context.

- Select and AutoComplete support measured virtualization, `virtual`,
  `listItemHeight`, `showScrollBar`, `scrollTo`, refs, and nullable
  `onActive`. `listHeight` bounds the inner viewport, with zero removing
  the cap. Native `onPopupScroll` receives viewport events. Forms,
  controlled search on close, typeahead and ArrowUp, and synchronous blur remain.

- TreeSelect accepts inherited `onPopupVisibleChange`, `popupStyle`,
  `choiceTransitionName`, and `direction` with the current upstream no-op behavior.
  It consumes them before DOM and custom slots and retains their original values
  in semantic callbacks. `onOpenChange`, semantic styles, and provider RTL retain
  precedence. Semantic callbacks also run in custom-root SSR without applying
  generated styles to the slot. Native HTML `dir` and slot attributes remain intact.

- TreeSelect with custom input and responsive tags follows the upstream Overflow
  layout for the constrained absolute suffix, height, overflow, hit targets, RTL,
  and the cached popup anchor on resize, scroll, and container movement. Independent
  React layout and SSR references, strict hydration, and measurement cleanup were checked.

- TreeSelect supports `components.root` and `components.input` as Svelte Snippets
  with DOM and composite ref registration. Root replaces the selector and input
  keeps tags, affixes, and search. Custom attributes and callbacks merge in
  upstream order. Textarea, live replacement, sizing, form association, and
  strict hydration are supported. Ordinary Div and Input ref types remain.

- TreeSelect supports `tokenSeparators` for search, IME, and pasted line breaks.
  Splitting clears search and closes the panel while preserving tree values.
  Inherited `showScrollBar` is accepted with the pinned React runtime's no-op
  behavior.

- TreeSelect toggles by pointer with upstream single, multiple, and search rules,
  focus, mousedown, and click order, and delayed close after clear. Tests cover
  touch, canceled gestures, controlled open, and preserving the field.

- Form feedback works with Cascader, AutoComplete, Mentions, Transfer, and
  single and range date and time controls with upstream context and suffix rules.
  DatePicker and RangePicker support `suffixIcon` and shared
  `ConfigProvider.datePicker.suffixIcon`. SSR, hydration, live updates,
  metadata, toggling, reset, and cleanup were compared with React 6.6.8.

- Form feedback works with Input, TextArea, InputNumber, and Select, including
  InputPassword and InputSearch. Upstream suffix order, nested scopes, field
  retention on updates, and reset and remount are preserved. Calendar clears
  only in-form-item on its header Select. ColorPicker panel and Mentions
  `popupRender` isolate feedback and status. Tests covered 128 React cases and
  strict hydration of four base controls.

- FormItem supports `hasFeedback`. Form supports `feedbackIcons` with local
  overrides, noStyle inheritance, and validated success. TreeSelect shows
  feedback with upstream icons, Form prefixes, and custom Snippets. Updates
  preserve the field, SSR, and hydration. Support for more controls is ongoing.

- TreeSelect supports `showAction`, `autoFocus`, `tabIndex`, the input key hook,
  and root focus, keyboard, and mouse callbacks. Native handlers keep input
  targets and cancellation. Holding Enter selects once until keyup or blur.
  SSR and hydration preserve native focus.

- TreeSelect supports declarative `TreeSelect.TreeNode`, named
  `TreeSelectTreeNode`, and static checked strategies. Icons, switchers, classes,
  styles, and row attributes work with declarations and `treeData`.
  SSR and keyed list reordering account for declarations.

- TreeSelect virtualizes popup rows and provides `scrollTo` via `bind:this`.
  It supports `virtual`, `listItemHeight`, `listItemScrollOffset`,
  `ConfigProvider.virtual`, and `ConfigProvider.popupMatchSelectWidth`.

- TreeSelect supports object and function `classNames` and `styles`,
  `ConfigProvider.treeSelect`, `placeholder` content, `switcherIcon`, and
  `treeLine.showLeafIcon`. Styling updates preserve focus and drafts in the open panel.

- TreeSelect supports `popupRender`, `prefix`, `suffix`, `suffixIcon`,
  `removeIcon`, and an `allowClear` object with a custom icon and accessible name.
  The custom panel retains drafts between openings and allows focus on nested fields.
  Clearing resets the query and reports it through `onSearch`.

- TreeSelect returns `treeTitleRender`-bound Snippets in `onChange` and
  `maxTagPlaceholder`. Retained labels can render after unmount and use the
  render site's context. New labels reflect renderer updates immediately and
  preserve callback data, native tooltips, and accessible remove names.

- TreeSelect supports `maxTagTextLength`, numeric and responsive `maxTagCount`,
  `maxTagPlaceholder`, and `tagRender` Snippets with upstream metadata and
  close order. Full values, labels, FormData, refs, focus, and shared Select
  Unicode, NaN, and overflow fixes are preserved. SSR and hydration create
  no measurement resources on the server. Reopening and unmount cancel pending
  custom close.

- TreeSelect supports `maxCount` with upstream wrapper, strategy, and strict
  rules, checked and missing values, and callback order. Limits retain raw
  data, payload refs, and check propagation without truncating initial sets.
  The upstream single-mode block and stale parent disabled cache are recorded
  separately. Svelte preserves single selection and refreshes limits on new data.

- TreeSelect supports `treeExpandAction=false/'click'/'doubleClick'` through
  Tree, with upstream expansion and selection order and modifier guards.
  Title actions retain expanded keys until children arrive and work during
  search. Refs, focus, active IDs, and one pending load are preserved. Upstream
  duplicate loading is recorded separately. SSR starts no loads or timers.

- TreeSelect supports `fieldNames` and `treeDataSimpleMode`, generic data
  without an index signature, literal label arrays and null, and schema
  updates. Selection, filter, and render callbacks retain raw payload.
  `loadData` receives canonical state. The 32 UMD and SSR scenarios record
  upstream behavior. Upstream array mutation and raw renderer issues are
  recorded separately. Svelte preserves input data and passes the full node.

- Tree and DirectoryTree support collapse and appear motion from rc-tree 1.4.0
  and rc-motion 1.3.3: custom phase names and hooks, async prepare, group
  measurement, deadlines, virtual ranges, and semantic configuration. Svelte
  preserves neighboring controls, honors reduced motion, and invalidates
  stale callbacks on data change and unmount.

- Tree and DirectoryTree support HTML5 drag and drop with draggable predicates,
  handle Snippets, `allowDrop`, cross-level and RTL indicators, callbacks,
  delayed expansion, and virtual windows. Generic raw data, canonical state,
  native focus and refs, and controlled keys are retained. Six upstream
  defects are recorded separately. Svelte checks current restrictions and
  descendants and cleans up drag resources on end and unmount.

- Tree and DirectoryTree support measured virtual windows, `scrollTo` by key
  or index, both scroll axes, function offsets, and `ConfigProvider.virtual`.
  Listy shares the calculations. Upstream RTL, stale estimate, and active ARIA
  issues are recorded separately. Svelte preserves direction and accessibility.

- Tree and DirectoryTree support five semantic slots and `ConfigProvider.tree`
  with object and function defaults and replacement of nested records.
  Native root style, generic props, DOM, focus, refs, and an independent
  TreeSelect are retained. The upstream default icon's cache defect is recorded
  separately. Svelte updates its styling.

- Tree and DirectoryTree accept generic records and `fieldNames` throughout
  data, selection, check, load, and renderer callbacks. Original objects,
  canonical keys and event state, and node title Snippet precedence over
  `titleRender` are retained. The upstream issue on changing only
  `fieldNames` is recorded separately. Svelte updates the schema.

- `createTree` ports `Tree.useTree` and `getPath` with generic entities,
  source data, `fieldNames`, and a stable getter across data and schema
  changes. The upstream inherited prototype-key error is recorded separately.
  Svelte returns an empty path.

- Tree supports per-node `switcherIcon`, `showLeafIcon` Snippets, and node
  hover callbacks. Upstream loading and renderer precedence, computed
  `isLeaf` for icons, source event data, and native DOM, focus, and refs remain.

- DirectoryTree ports folder and file icons, Ctrl, Meta, and Shift selection,
  and upstream `Tree.DirectoryTree` defaults. Native refs, Tree themes, and
  controlled keys are retained. The upstream issue when leaving controlled
  mode is documented separately and corrected in Svelte.

- Tree supports `expandAction=false/'click'/'doubleClick'`, modifier guards,
  and title expansion with upstream callback order and a before-action node
  snapshot.

- UploadFile exposes optional upstream `fileName` and `preview` metadata.
  Row display still uses `name` and `thumbUrl` or `url`.

- Upload and Dragger expose UploadRef with batch, progress, success, and error
  callbacks, current `fileList`, native refs, and `upload.abort`. Direct `abort`
  remains. Callbacks use the current controlled list and skip updates after
  unmount.

- Upload card and circle retain trigger and native input through hiding and
  showing, and follow upstream enter and leave keyframes with user styles
  taking precedence.

- Upload progress ports upstream fade after 300ms, retains DOM through
  completion, and cancels exit on return to `uploading`. It ports a separate
  shared fade namespace, duration aliases, and the distinction between
  missing and undefined percent. Accessible names, reduced motion, cleanup,
  and neighboring theme scopes are preserved.

- Upload retains rows through upstream appear, leave, and collapse motion.
  Text and picture use height and opacity, and card and circle use inline
  keyframes. Retention order, returning UIDs, deadline, and motion token are
  ported. Initial rows skip animation, and reduced motion and cleanup remain.
  The `diffKeys` issue with prototype-named UIDs is recorded separately.

- Upload `showUploadList` accepts `previewIcon`, `downloadIcon`, and
  `removeIcon` Snippets with the current file. Visibility, status, disabled
  rules, locale labels, callbacks, and controls and input DOM are preserved.
  Empty and zero Snippets correspond to React Fragment content.

- `ConfigProvider.upload` provides shared classes and styles, semantic slots,
  `accept`, `customRequest`, and `progress`. Record inheritance and reset and
  local precedence are ported. Updates retain DOM and active transport.
  Upstream abort after synchronous completion is recorded separately.
  Svelte retains the existing safeguard.

- Upload and UploadDragger support `classNames` and `styles` for `root`,
  `list`, `item`, and `trigger`, including callbacks, upstream trigger
  `style` precedence, and root CSS variable inheritance. Updates preserve
  the controller and DOM.

- Upload `progress` configures line Progress through existing Svelte size,
  color and gradient, success and status, steps, format, semantic slots,
  and ARIA. The distinction between defaults and an empty object and the
  300ms delay are retained. Updates preserve item, input, and progress DOM.
  Deprecated line `strokeWidth` is excluded.

- `UploadFile.linkProps` sets filename link attributes through an object or
  JSON. The file URL retains precedence. `onclick` can cancel preview and
  attribute updates preserve the link and file input.

- Upload `itemRender` receives an `originNode` Snippet, file, current list,
  and preview, download, and remove actions. It can wrap or replace the row,
  including with empty content, while retaining containers, input, and
  file-bound actions.

- Upload `iconRender` replaces a file icon with a Snippet receiving file and
  list type. Default icons, image thumbnail precedence, and empty or zero
  renderer content are preserved. Renderer changes retain item, filename,
  and input DOM and external focus and selection.

- Upload and UploadDragger support `directory` with folder selection,
  breadth-first traversal of dropped or pasted entries, batched reading, and
  `webkitRelativePath`. An unreadable file is skipped while traversal
  continues. Callbacks are skipped after disable or unmount.

- Upload and UploadDragger support `pastable`. Pasted files go through the
  existing accept, beforeUpload, controller, and customRequest paths.
  Prop changes update the listener and unmount removes it. Disabled blocks
  paste, and the missing upstream guard is recorded in raw data.

- Masonry columns and gutters and responsive Pagination use global
  `theme.token.screen*`. Queries update without remounting and preserve
  editors, focus, selection, Masonry refs, and the Pagination page. The raw
  stale upstream observer is recorded separately from a public fresh mount.

- Descriptions uses global `theme.token.screen*` for responsive columns and
  spans, replaces media queries after token changes, and removes listeners on
  unmount. The raw stale upstream observer and public fresh mount are kept separately.

- Table supports local and shared `prefixCls` and a separate filter-list
  `dropdownPrefixCls`. Prefix updates preserve controls, sort and selection,
  open filters, expanded row drafts and focus, and fixed scrolling. Component
  tokens keep canonical names.

- DatePicker, RangePicker, TimePicker, and TimeRangePicker support local and
  shared `prefixCls` for fields, date and time panels, and popups. Button and
  internal affix namespaces remain independent. Drafts, caret, focus, refs,
  IDs, and pending datetime remain, with value and format changes still
  synchronizing the field.

- Calendar supports local and shared picker `prefixCls` for root, cells,
  and renderers. Header Select and Radio keep independent namespaces. DOM,
  refs, IDs, date selection, timestamp precision, focus, selection, and
  the existing mode-button wrapping restriction are preserved.

- ColorPicker supports local and shared `prefixCls` with separate popup,
  field, and preset namespaces. It keeps incomplete HEX input, caret, focus,
  color, preset expansion, and custom containers and triggers. The upstream
  child selector cache issue is recorded separately.

- Cascader and CascaderPanel support local and shared `prefixCls` for fields,
  tags, columns and checkboxes, and popups. Canonical tokens, native input
  width, and callbacks are retained. Raw local upstream popup padding is
  recorded separately from the public comparison.

- TreeSelect supports local and shared `prefixCls` for the Select control,
  tags, and popup, preserving the shared native Tree adapter, query, selection,
  focus, refs, IDs, and form. The upstream mismatch between local tree classes
  and style hooks is recorded separately.

- AutoComplete supports local and shared `prefixCls` through Select CSS and
  retains the nested Input and TextArea namespace. Prefix changes preserve
  the editor, refs, IDs, query, selection, focus, FormData, and open popup.

- Select supports local and shared `prefixCls` for controls, tags, and popup,
  with a separate namespace for internal CSS variables. Native forms and
  reset, compact geometry, search, text selection, focus, and the open popup
  are preserved, including with an external container.

- Transfer supports local and shared `prefixCls`, with separate namespaces
  for internal Checkbox, Input, Button, and Pagination. Canonical tokens,
  semantic precedence, query, selection, focus, refs, moves, and pagination
  drafts are retained.

- Tree supports local and shared `prefixCls` for nodes, checkboxes, switchers,
  and lines. Canonical tokens, native focus, ARIA IDs, selection and checks,
  and pending load are retained. TreeSelect keeps its CSS adapter. The raw
  readonly selection and public comparison are recorded separately.

- Upload and UploadDragger support local and shared `prefixCls` for trigger,
  list, and states. Canonical tokens, the link reset, and independent Button,
  Progress, and Tooltip namespaces remain. DOM, refs, focus, and active
  requests are preserved.

- NotificationHolder and App.notification support local and shared
  `prefixCls` across placements and card slots. Canonical tokens and status
  backgrounds, native viewport and motion, DOM and ARIA IDs, draft, focus,
  selection, queue, and deadlines persist. The stale upstream status classes
  are recorded before and after refresh.

- MessageHolder and App.message support local and shared `prefixCls` for
  the list, messages, and icons. Native popover, queue, handles, deadlines,
  and external focus persist. Upstream stale status classes are recorded
  before and after refresh.

- Modal and contextual confirmations support local and shared `prefixCls`.
  The Button namespace and canonical tokens are independent. The open
  dialog, drafts, selection, focus, IDs, and callbacks persist. The extra
  upstream Confirm header with a local prefix is recorded in raw and
  matched cases. Svelte keeps one title.

- Drawer supports local and shared `prefixCls` for panel, mask, placements,
  and content slots. Native dialog, motion, backdrop, drafts, focus,
  selection, IDs, and scroll persist. Button namespace and canonical tokens
  remain independent.

- Pagination supports local and shared `prefixCls`, CSS, and private metric
  namespaces. Native buttons, active colors, wireframe, separate Select,
  bindings, current page and active DOM, and jumper draft, focus, and
  selection persist.

- Menu supports local and shared `prefixCls` in all modes, items, and
  submenus. Scoped themes, canonical tokens and link reset, DOM, refs,
  selection, open state, and focus persist. The upstream dashed Divider's
  missing owner prefix is recorded in raw and matched cases.

- Dropdown supports local and shared `prefixCls` for trigger, popup, internal
  menu, arrows, and states. Button namespace and canonical tokens stay
  independent. The open popup, commands, focus, typeahead, and native
  binding and callbacks persist.

- `Image.previewPrefixCls` sets an independent full viewer prefix, including
  the empty string. CSS is included for the custom namespace. The upstream
  omission is recorded with and without public styles. Prefix changes
  preserve the open dialog, image and action DOM, zoom, and focus.

- Image supports local and shared `prefixCls` for thumbnail and preview.
  `ImagePreviewGroup.previewPrefixCls` sets an independent viewer base
  prefix. Canonical tokens, DOM, refs, open viewer, zoom, current frame,
  and focus persist.

- Mentions supports local and shared `prefixCls` for editor and mirror,
  variants and status, and popup and menu. Internal input variables use
  the shared namespace. Text trigger prefix, native value and IME, refs,
  query, popup, focus, selection, and FormData persist.

- Tour supports local and shared `prefixCls` for panels, mask, placements,
  and arrows. Button selectors and internal Tooltip variables use an
  independent shared prefix. Step, portal DOM, drafts, focus, selection,
  and callbacks persist. Upstream shared-class caching with missing
  Button margins is recorded in raw and fresh cases.

- Listy supports local and shared `prefixCls` for raw and virtual modes,
  groups, sticky headers, and the scrollbar. Canonical tokens, link reset,
  native focus, reduced motion, refs, row measurements, and scroll persist.

- Rate supports local and shared `prefixCls` for root, states, and star
  layers, including the character context. Canonical tokens, Tooltip
  composition, native keyboard and buttons, value, DOM, refs, and focus
  persist on prefix updates.

- Form, FormItem, and FormList support local and shared `prefixCls`.
  Form media CSS uses global `screen*Max` tokens with scoped rules.
  Store, validation, reset, submit, field DOM, refs, focus, and selection
  persist. ErrorList keeps native List priority and styled Item and
  noStyle fallbacks. Upstream cache issues are recorded.

- Col supports local and shared `prefixCls` with responsive CSS and an
  independent private namespace. FormItem retains layout through span and
  breakpoint attributes and display styling. Upstream shared-class flex
  caching is recorded in raw and fresh cases. DOM, refs, drafts, focus,
  selection, and the existing default Form layout persist.

- InputNumber supports local and shared `prefixCls` with styles for both
  modes, variants, affixes, actions, and Compact. Native geometry, decimal
  arithmetic, drafts, selection, refs, keyboard, and canonical FormData persist.

- InputOTP supports local and shared `prefixCls` for group, cells, separators,
  and mask. Upstream tokens apply to the group. Global Input namespace,
  existing values, keyboard interaction, refs, and focus remain. The upstream
  mask prefix defect is recorded in raw and matched cases.

- InputSearch supports independent Search and Input prefixes and shared
  Button and internal namespaces. Upstream tokens apply to the Search root.
  DOM, refs, value, search, selection, and focus persist. Upstream Compact
  and cache observations are recorded separately.

- InputPassword supports independent `prefixCls` and `inputPrefixCls`
  and the shared prefix. Its icon retains upstream styling for any name
  combination. React's missing icon styles are recorded in raw and
  matched cases. Visibility, refs, and focus remain.

- Input and TextArea support local and shared `prefixCls` for the leaf,
  affixes, variants, clear, count, and Compact. Native value and IME,
  resize and autoSize, refs, forms, focus, and selection persist.
  Separate Password, Search, and OTP prefix APIs remain in progress.

- Switch supports local and shared `prefixCls` for root, handle, labels,
  and loading. Bindings, keyboard interaction, native forms, refs, checked
  state, and focus persist.

- Checkbox and CheckboxGroup support local and shared `prefixCls` with
  a separate Row namespace. Mixed and disabled states, selection, forms,
  refs, and focus persist. The stale upstream Row selector is recorded
  in raw and fresh measurements.

- Radio, RadioButton, and RadioGroup support local and shared `prefixCls`
  and a separate Badge namespace. Native fieldset and input, checked state,
  forms, refs, and focus persist. The upstream defaultChecked wrapper
  observation is retained in raw and matched cases.

- RadioButton CSS restores upstream Group and Badge rules for vertical
  button width, neighboring border overlap, and the count layer across prefixes.

- FloatButton, Group, and BackTop support local and shared `prefixCls`
  with Group inheritance. Progress and animation use the shared namespace.
  DOM, refs, the open menu, scroll, and focus persist. Upstream owner and
  cache observations are separate.

- Button supports local and shared `prefixCls` for variants, sizes, shapes,
  icon, loading, and Compact. Internal variables use a shared namespace
  independently of the local class. Themes, style precedence, DOM, refs,
  focus, and native form actions persist.

- Card, Grid, and Meta support local and shared `prefixCls` and owner
  inheritance. Typography and Tabs namespaces are independent. Direct
  Grid detection, DOM, refs, active tab, drafts, selection, focus, and
  FormData persist. The upstream missing child prefix and shared class
  cache are recorded in raw, matched, and fresh measurements.

- Tabs supports local and shared `prefixCls` for navigation, panels, More,
  and motion. DOM, refs, the active tab, and drafts, selection, and focus
  in the panel and open popup persist. Canonical theme markers and shared
  slide keyframes keep their names.

- Descriptions supports local and shared `prefixCls` for all parts and cells,
  including Table expanded-row selectors with an independent shared prefix.
  Responsive layout, semantic props, DOM, refs, drafts, selection, focus,
  and FormData persist. The upstream missing local prefix inside Table is
  recorded separately. Svelte retains styling.

- Carousel supports local and shared `prefixCls` for wrapper, RTL and vertical
  CSS, and duration keyframes. Shared Radio and Checkbox selectors are
  independent of the local wrapper. Prefix changes preserve the current
  slide, DOM, refs, drafts, selection, and focus.

- Typography supports local and shared `prefixCls` for text, headings,
  decorations, actions, ellipsis, and the editor. DOM, drafts, selection, focus,
  and copy success persist. Stale upstream action classes are recorded in
  raw and fresh cases. Svelte updates actions with the root.

- Row supports local and shared `prefixCls` for root, wrap, alignment,
  justification, and RTL. Responsive gutters, layout, child context, refs,
  drafts, selection, focus, and FormData persist. Col and related FormItem
  namespace rules are tracked separately.

- Breadcrumb supports local and shared `prefixCls`, including separators
  and item menus. Lost upstream separator margins with a local prefix
  are recorded in raw and matched measurements. DOM, focus, baseline, link
  decorations, and navigation remain.

- Space, SpaceCompact, and SpaceAddon support local and shared `prefixCls`.
  The Badge selector and internal Addon variables use the shared prefix
  independently of local layout classes. Upstream shared-class caching is
  recorded separately. Keyed DOM, refs, drafts, selection, focus, and
  existing Compact behavior persist.

- Anchor supports local and shared `prefixCls` and an item override. Links
  inherit the owner prefix. Upstream's missing inheritance is recorded in
  raw and matched measurements. Spacing, indicator, link decorations, DOM,
  focus, and history remain.

- Splitter supports local `prefixCls` and shared `ConfigProvider.prefixCls`
  for all slots and the lazy preview namespace. Changes preserve panels,
  editor and focus, and an active drag. The upstream shared-local-class
  cache issue is recorded separately. Svelte scopes styles by class and namespace.

- Masonry supports local `prefixCls` and shared `ConfigProvider.prefixCls`
  for item and motion classes and the internal width namespace. Updates
  preserve layout, DOM, focus, selection, and active motion. The upstream RTL
  alias collision is recorded in raw and fresh-page cases. Svelte preserves direction.

- BorderBeam inherits `ConfigProvider.prefixCls` for classes and internal CSS
  variables. Local class and namespace are isolated. The upstream
  shared-local-class cache issue is recorded in raw and fresh-page cases.
  DOM, focus, and reduced motion remain.

- Tooltip, Popover, Popconfirm, and both Slider modes inherit
  `ConfigProvider.prefixCls`. Handle Tooltip and outer Popover prefixes are
  independent of the owner's local prefix. Updates preserve open surfaces,
  DOM, focus, and Slider keyboard behavior.

- Alert, Collapse, and Affix inherit `ConfigProvider.prefixCls`. Prefix
  changes preserve the fixed node, expanded panels, fields, and focus.
  Affix is unfixed during SSR.

- Avatar and Group, Badge and Ribbon, Tag, CheckableTag and its Group,
  Empty, Skeleton and its primitives, Spin, Progress, and Result inherit
  `ConfigProvider.prefixCls`. ScrollNumber and Ribbon CSS use the shared
  prefix independently of the local one. Native wrappers, classes, spacing,
  DOM, focus, and Badge digit reduced motion are retained.

- Divider, Flex, and Segmented inherit `ConfigProvider.prefixCls` with local
  precedence. Changes preserve DOM, selection, FormData, callbacks, and focus.

- Statistic and Timer, QRCode, Timeline, and Steps inherit
  `ConfigProvider.prefixCls`. Local prefix takes precedence, and Steps within
  Timeline gets the shared prefix separately. Theme, SSR, DOM, focus, and
  selection are preserved on updates.

- `ConfigProvider.prefixCls` supplies an inherited class prefix for App,
  Layout, and its sections, with local priority and upstream theme CSS
  variable fallback. Changes preserve DOM and focus. The legacy namespace
  and pending families are tracked separately.

- `Select.open`, `defaultOpen`, and `bind:open` support controlled requests,
  SSR, the selected active option, and disabled transitions. Empty popups
  are hidden for `null`, `false`, and empty string. Numeric zero remains
  visible and the upstream exception is recorded.

- `Select.optionRender` accepts a Snippet with source data, key, value,
  label, and current index. Filtering, sorting, synthetic tags, `maxCount`,
  and selected labels remain.

- App and `App.useApp()` and `useApp()` provide a shared Message,
  Notification, and Modal context, built-in holders, nested App inheritance,
  reactive defaults, HTML root or fragment, local prefix,
  `ConfigProvider.app`, and `nativeElement`.

- `createModal` and ModalHolder provide five contextual confirmations,
  `update`, `destroy`, an awaitable result, manual and async callbacks,
  loading, and retry. Theme, locale, RTL, native modality, and focus persist.
  Upstream's pending await on destroy is recorded separately. Removing an
  open Modal restores focus after DOM removal.

- Modal supports optional title and children, scalar and Snippet titles,
  and explicit ARIA names. Native dialog, centering, focus, and callbacks
  remain. Upstream's lost `title=0` and ignored ARIA props are recorded
  and corrected in Svelte.

- Select supports a `tagRender` Snippet with ordinary and summary metadata,
  typed values, a label Snippet, and `onClose`. Custom mousedown and close
  order, focus, native Tag composition, renderer updates, and responsive
  overflow remain. The raw disabled upstream open request is recorded.

- Select allows omitted `options` as upstream. The default empty list
  preserves single and multiple defaults, free tags, remote cache, and
  native forms.

- Select supports `maxTagCount="responsive"` with shared Cascader measurement,
  dynamic input width, inert hidden tags, and observer and frame cleanup.
  It keeps fitting tags visible regardless of an oversized custom summary.
  The upstream defect is recorded.

- Select supports numeric `maxTagCount` and scalar or Snippet
  `maxTagPlaceholder`. Full hidden values remain in forms, reset, and
  Backspace. A remove button being hidden moves focus to the input.
  Svelte retains the list for `NaN`.

- Select supports `maxTagTextLength` with full titles, remove names, and
  form values. Shared Cascader logic follows rc-select and keeps UTF-16
  pairs intact. Original Unicode issues are retained in raw references.

- Select supports `maxCount` in multiple and tags modes for option
  availability, input, `tokenSeparators`, and live limits. Existing values
  are preserved. Svelte closes the recorded limit bypass through controlled
  queries on Enter or blur.

- Select supports `showSearch.filterSort` with current `searchValue`,
  stable ordering for ties, and synthetic tags. The options array, selection
  order, controlled query, focus, and input DOM are preserved.

- Select supports array and function `tokenSeparators` in multiple and
  tags modes, multiline paste, and deferred IME splitting. Controlled
  search, callback order, and native forms and events remain. Upstream
  disabled and blank cases are recorded separately and corrected in Svelte.

- Select supports `mode="tags"` with free strings, Enter, blur, Escape,
  selected-option cache, typed numeric and string values, native forms,
  and readonly defaults. Added `showSearch.optionFilterProp` and
  `autoClearSearchValue`. Existing single and multiple defaults remain.
  Whitespace-only implicit tags are skipped and the upstream case is retained.

- LayoutHeader, LayoutContent, and LayoutFooter support literal `prefixCls`,
  shared names, and fallback to the default class. Sections keep their
  styling, inherited variables, and controls across prefix changes.
  Upstream misapplied container styles are retained in paired measurements.

- Layout and LayoutSider support independent local `prefixCls`. The
  `layout-prefix` CSS recipe reproduces 35 rules. Token namespace,
  native SSR Sider detection, states, IDs, ARIA, themes, and keyed DOM remain.
  Upstream prefix collisions, cache leaks, and section prefix defect are
  kept in raw data.

- `ConfigProvider.layout` supplies shared `class` and `style` for Layout
  containers only. Local precedence, nested replacement, sections, themes,
  native RTL, DOM, drafts, selection, focus, and Sider collapse state
  remain across configuration changes.

- Steps supports local `prefixCls` for root, layout, slots, and progress.
  The `steps-prefix` recipe reproduces 137 rules and retains token namespace,
  IDs, native keyboard and focus, mapped Icon, and isolation of nearby Steps.

- Timeline supports local `prefixCls` for root, slots, placement and color,
  and layout states. The `timeline-prefix` recipe reproduces 43 source rules.
  Steps namespace, theme variables, `titleSpan`, and keyed root remain.

- `ConfigProvider.steps` supplies shared classes and semantic styles and
  callbacks. Local and item precedence and native behavior remain. Inside
  Timeline, Steps receives plain `class` and `style` only, and semantic
  callbacks are skipped.

- `ConfigProvider.timeline` supplies shared classes and semantic styles and
  callbacks. Local and item precedence, `titleSpan`, reverse, `ol` and `li`,
  refs, and focus remain. A nested record replaces its parent and reactive
  configuration keeps the root.

- QRCode supports local `prefixCls` for root, cover, and status classes.
  The `qrcode-prefix` recipe reproduces 11 upstream rules and retains
  canvas and SVG, statuses, themes, refs, keyboard refresh, and isolation
  of nearby QRCodes.

- Statistic and StatisticTimer support local `prefixCls`, empty-string
  fallback, live slot namespace changes with the same root DOM, and
  scoped CSS. The `statistic-prefix` recipe reproduces 14 pinned rules.
  Semantic styling, themes, compact defaults, and nearby statistics remain.

- `ConfigProvider.statistic` supplies shared classes, styles, and semantic
  callbacks for Statistic and StatisticTimer. Local precedence, callback
  defaults, nested scopes, native RTL and loading, formatting, and timers
  are preserved. Configuration and prop updates retain root DOM.

- `Form.validateMessages`, `ConfigProvider.form.validateMessages`, and
  `locale.Form.defaultValidateMessages` configure shared strings and
  template functions, including upstream printf, group precedence,
  reactive scopes, and `messageVariables`. Native Russian defaults
  remain. An undefined result or thrown template callback produces an
  ordinary field error without the upstream console or page errors.

- `FormItem.messageVariables` and rule message strings support one-pass
  substitution of label, name, and rule parameters, including nested
  fields and escaping. Native defaults and literal `setFields` metadata
  remain. Upstream issues with a zero label, inherited variables, and
  nested object context are corrected.

- Form rules support nested `fields` and `defaultField`, readonly child
  rule arrays, and recursive schemas. Root bindings, transform, validator
  snapshots, `validateFirst`, and async and reset guards remain. Upstream
  issues with nested `warningOnly`, sparse arrays, transformed arrays,
  and inherited field names are corrected.

- FormRule supports `(form) => rule` factories in createForm and FormItem.
  They receive the current model, resolve required state and constraints
  before validation, and capture settings before debounce. Object rules
  and the native validator API remain. The required marker works during
  SSR, and a factory error clears validating state.

- Rule `type` adds `enum`, `email`, `url`, `hex`, `tel`, and `pattern`.
  Patterns accept strings or RegExp. Strict enum, readonly choices,
  and caller RegExp state remain. Four upstream URL IPv6 and port
  issues are corrected. Malformed patterns produce validation errors
  without console or page exceptions. The full type union has 17 values.

- `ValidationRule.type` supports primitive `string`, `number`, `integer`,
  `float`, `boolean`, `array`, `object`, `date`, `regexp`, `method`, and
  `any` with upstream constraints and empty-value handling. Untyped
  rules retain their behavior. Upstream scientific-notation integer
  classification is corrected. BigInt and Symbol produce rule errors
  without console or page errors.

- Form rules support `len` and `whitespace`. Exact length counts Unicode
  code points and array elements, takes precedence over min and max,
  and checks empty arrays. `whitespace` rejects nonempty whitespace-only
  strings. Transform, `warningOnly`, source values, and existing rules
  without the new props remain.

- `ValidationRule.transform` changes the value only for one rule's
  validation, preserving the store, native FormData, submit payload,
  and reset defaults. A thrown transform becomes a validation error
  and retains `warningOnly`. The upstream 6.6.8 success after an
  exception is recorded separately.

- `FormItem.noStyle` keeps the field binding without layout and collects
  errors and warnings in the nearest styled FormItem. Local status,
  keyed FormList rows, reset, native focus, and selection remain.
  Control descriptions reference the actual message list. NoStyle
  and help changes and field removal release messages, addressing two
  verified upstream 6.6.8 defects.

### Removed

- Removed Modal `maskClosable`. Configure backdrop dismissal through
  `mask.closable`. Native dialog, pointer origin, callbacks, and focus
  restoration remain.

- Removed `popupClassName`, `popupStyle`, `dropdownClassName`,
  `showToday`, direct `disabledHours`, `disabledMinutes`, and
  `disabledSeconds`, legacy `clearIcon` including timePicker config,
  `addon`, `onSelect`, and the deprecated second `onKeyDown` argument
  from DatePicker, RangePicker, TimePicker, and TimeRangePicker.
  Removed locale `dayFormat`. Current `classNames.popup.root`, semantic
  styles, `showNow`, `disabledTime`, `allowClear.clearIcon`,
  `renderExtraFooter`, `onCalendarChange`, and `cellDateFormat` remain.

- Removed Cascader's legacy popup callbacks, root `clearIcon` and
  `showArrow`, popup and dropdown class, style, and renderer aliases,
  and column styles. `onOpenChange`, `allowClear.clearIcon`,
  `suffixIcon`, `popupRender`, and semantic slots remain. AutoComplete
  and TreeSelect use `classNames.popup.root` in place of `popupClassName`.
  TreeSelect extra removed `preValue`, `checked`, and `selected`.
  `triggerValue`, `onSelect`, and `onDeselect` remain.

- Removed root `expandedRowKeys`, `defaultExpandedRowKeys`, `onExpand`,
  and `onExpandedRowsChange` from Table. Current fields are inside
  `expandable`. Removed `onBeforeChange` from Slider range, the
  deprecated textarea ref from Mentions, and `includeMargin` from
  public low-level QRProps. Current callbacks, `nativeElement`, and
  `marginSize` remain.

- Removed Image `wrapperStyle` and `preview.rootClassName`, including
  group preview. Wrapper styles use `styles.root`, and viewer classes
  use `classNames.popup.root`. `class` and `style` still apply to `img`.

- Removed deprecated top-level search options on Select, AutoComplete,
  TreeSelect, and Cascader. The `showSearch` object, controlled query,
  callbacks, remote selection cache, filtering, and unfiltered mode
  remain.

- Removed Timeline `pending`, `pendingDot`, item `label`, `children`,
  `dot`, and `position`, `mode="left"/"right"`, and `TimelinePosition`.
  `title`, `content`, `icon`, `placement`, `mode=start/end/alternate`,
  and loading items remain.

- Removed Breadcrumb `routes`, item `breadcrumbName` and `children`,
  the old menu item name, and their adapter. `items`, `title`, `menu`,
  `path`, `params`, `itemRender` with original items, and native links
  remain.

- Removed Progress `trailColor`, `width`, `gapPosition`, and
  `strokeWidth` for line and steps. `railColor`, `size`,
  `gapPlacement`, and circle and dashboard `strokeWidth` remain.

- Removed Steps `direction`, `labelPlacement`, `progressDot`,
  `item.description`, and the progressDot type and renderer.
  `orientation`, `titlePlacement`, `type="dot"`, `iconRender`, and
  `content` remain.

- Removed Slider `vertical`, `count`, `onAfterChange`,
  `handleStyle`, `trackStyle`, and `railStyle` from both modes.
  `orientation`, `range.minCount` and `maxCount`, `onChangeComplete`,
  semantic styles, native forms, focus, and gestures remain.

- Removed Tabs `tabPosition`, `indicatorSize`, `popupClassName`,
  and root and item `destroyInactiveTabPane`. Also removed
  `ConfigProvider.tabs.indicatorSize`. `tabPlacement`, `indicator`,
  semantic `popup.root`, `destroyOnHidden`, and the pinned rc-tabs
  `renderTabBar` API remain.

- Removed root Alert `message`, `closeText`, `closeIcon`, `onClose`,
  and `afterClose`, plus `ErrorBoundary.message` and
  `ConfigProvider.alert.closeIcon`. Current `closable` with
  `closeIcon`, `onClose`, and `afterClose` remains. Removed Spin `tip`,
  `wrapperClassName`, and semantic `tip` and `mask` aliases.
  `description`, `root`, and lifecycle remain.

- Removed `FloatButton.description` including Group and BackTop,
  Transfer `operations`, `listStyle`, and `operationStyle`, and
  `Pagination.selectComponentClass`. `content`, actions, semantic
  styles, and `components.sizeChanger` remain.

- Removed `addonBefore` and `addonAfter` from Input, Password, Search,
  and InputNumber, along with internal wrappers, the context adapter,
  and CSS selectors. `prefix`, `suffix`, the Search button, and
  SpaceCompact and SpaceAddon composition remain.

- Removed `bordered` from Input, TextArea, Password, Search, InputNumber,
  Select, TreeSelect, Cascader, AutoComplete, and date and time pickers.
  Style uses `variant`. Local, Form, component or fallback, and global
  precedence is retained.

- Removed `destroyTooltipOnHide`, `getTooltipContainer`,
  `overlayClassName`, `overlayStyle`, and `overlayInnerStyle` from Tooltip,
  Popover, Popconfirm, and consumers, including Slider, Typography,
  AvatarGroup, and ColorPicker. `destroyOnHidden`, `getPopupContainer`,
  and current semantic styles remain.

- Removed deprecated component token aliases from Button, Menu, Layout,
  Skeleton, Steps, Carousel, Splitter, and Popover, the `pink` seed,
  `controlTmpOutline`, and legacy `blue-1` palette keys. Current tokens,
  the `pink` UI preset, and CSS palettes remain.

- Removed `middle` and `default` from the relevant size APIs. Ordinary
  `ComponentSize` and the ConfigProvider fallback now use `medium`.
  `Row.align="middle"` and `Skeleton.shape="default"` remain.

- Removed Card `bordered`, `headStyle`, and `bodyStyle`,
  `CardTabItem.tab`, and root and item Descriptions `labelStyle`
  and `contentStyle`. `variant`, `label`, and semantic styles retain
  current precedence.

- Removed Calendar's legacy date and month CellRender and FullCellRender,
  `Carousel.dotPosition`, Splitter `layout` and `collapsibleIcon`,
  Space `direction` and `split`, and `SpaceCompact.direction`.
  Current `cellRender`, `fullCellRender`, `dotPlacement`, `orientation`,
  `collapsible.icon`, and `separator` remain.

- Removed AvatarGroup `maxCount`, `maxStyle`, `maxPopoverPlacement`,
  and `maxPopoverTrigger`. Current `max` settings remain.

- Removed `Button.iconPosition`, `Empty.imageStyle`, `Tag.bordered`
  and Tag colors ending in `-inverse`, `Divider.type`,
  `Divider.orientationMargin`, and label placements in
  `Divider.orientation`. Current replacements and the Divider
  component token with the same name remain.

- Removed public `AnchorLink`, its type, and `Anchor.children`.
  Nested links remain available through `items[].children`.

- Removed deprecated `Collapse.Panel`, children composition,
  `expandIconPosition`, and `destroyInactivePanel`. `items` remains.

- Removed deprecated List, ListItem, and ListItemMeta, their types,
  configuration, tokens, CSS recipe, separate tests and fixtures,
  and the List branch of `renderEmpty`. Listy remains. The shared link
  reset is scoped to Listy and checked against its own UMD.

- Removed deprecated StatisticCountdown and `Statistic.valueStyle`.
  Use StatisticTimer `type="countdown"` for countdowns and
  `styles.content` for value styling.

- Removed deprecated ButtonGroup and InputGroup, their types,
  Button.Group size context, separate CSS rules, and fixtures.
  SpaceCompact provides composition. Button size resolves from the
  local prop, Compact, and ConfigProvider.

- Removed deprecated BackTop and BackTopProps, component tokens, runtime
  CSS, separate tests and fixtures, and documentation. FloatButtonBackTop
  and its shared scroll and motion mechanisms remain.

### Added

- Form exposes `useFormItemStatus` with reactive `status`, `errors`, and
  `warnings` getters for custom controls. Nested Form, Item, and OTP
  boundaries, SSR, and reset are ported. The API leaves refs intact.

- FormItem supports `initialValue`, including store and Form default
  precedence, SSR, updated future reset values, and dirty validation.
  Value copies, touched state, and binding are preserved. Nested
  defaults follow mount order, and FormList scenarios were compared
  with upstream.

- FormItem supports `validateStatus` with explicit empty values and
  automatic validating and success. Status works without `name`, and
  errors remain accessible across styling changes. Upstream classes and
  colors, themes, and controls were compared.

- FormItem allows layout rows to omit `name`. Controls outside a field
  binding and its rules retain local state on model reset. Required
  marks, explicit `htmlFor`, Form styles, and switching to a named field
  follow upstream.

- FormItem supports rich `help` with numbers, arrays, and Svelte Snippets,
  local state reset, and isolation of auxiliary controls. Zero is included
  in the field description. Error and warning precedence and semantic
  `help` and `helpItem` styles are retained.

- FormItem supports tooltip content and options, a custom icon, and Form
  and ConfigProvider defaults. Tooltip is included in a custom
  requiredMark. Label clicks, upstream geometry, RTL, themes, and native
  field state remain. Arrays render as content. Decorative SVG adds no
  icon name to the field's accessible name.

- Form supports `scrollToFirstError` and `ConfigProvider.form.scrollToFirstError`
  with local priority, options, and opt-in focus. The existing default
  autofocus remains. Stale submits, reset, model changes, and unmount
  skip scrolling to old controls.

- Form supports `size`, inheritance from Form and ConfigProvider, and
  passing size to nested controls and Compact. Small and large use upstream
  label and control heights. Local prop precedence, isolation of neighbors,
  semantic callbacks, and native field state remain.

- Form supports semantic `classNames` and `styles` for `root`, `label`,
  `content`, `help`, `helpItem`, and `extra`, with callbacks and
  `ConfigProvider.form` defaults. Fields and ErrorList inherit slots.
  CSS order, native help and ARIA, and focus persist on styling updates.

- Form and FormItem support `rootClassName`, inline field styles, and
  `ConfigProvider.form.class` and `style`. Class accumulation, CSS
  precedence, nested record replacement, and `component=false` were
  compared. Styling updates preserve DOM, focus, and metadata.

- FormItem labels accept numbers, arrays, and Svelte Snippets with upstream
  renderability, title and colon behavior, and requiredMark arguments.
  Reset clears local label content state. Rich labels name composite
  controls while preserving custom ARIA.

- FormItem supports an optional text label and `label=null` with upstream
  alignment across Form columns. Explicit offsets and native validation
  remain. Numeric responsive shorthand preserves span and offset where
  upstream loses them.

- Form and FormItem support `labelCol` and `wrapperCol` through existing
  Row and Col, with responsive sizing, local priority, and reset of nested
  field columns. Tests cover upstream metrics, RTL, all three layouts, and
  preservation of native controls, focus, and metadata.

- FormItem's `validateDebounce` delays automatic validation, replaces stale
  timers, and cancels on reset and unmount. Explicit validation and submit
  run immediately. `validateOnly` retains pending visible validation.

- Form supports `requiredMark=true/false/'optional'/Snippet` and
  `ConfigProvider.form` defaults. Upstream classes, precedence, colon
  handling, `locale.Form`, and locale group replacement remain. The mark
  leaves native required state, validation, and values intact.

- Form and FormItem support `colon`, `labelAlign`, Form `labelWrap`, and
  `ConfigProvider.form` defaults. Added Form and Item precedence, record
  reset, RTL, trimming the final colon from display text, and preservation
  of title and native label association. Live updates retain DOM, values,
  focus, selection, and metadata.

- FormItem `extra` accepts text, numbers, arrays, and Snippets. It displays
  with errors and warnings and is included in `aria-describedby`.
  Zero, renderability, external descriptions, focus, selection, and existing
  help precedence remain.

- FormItem `hidden` hides the entire block while retaining binding, value,
  refs, and local state. Hidden fields participate in validation, submit,
  and FormData, and Tab skips their controls. Reset retains existing remount,
  and showing the field restores available errors.

- Form supports `layout=inline` with upstream spacing, wrapping, and
  component tokens. `FormItem.layout` allows a local horizontal or vertical
  override. Desktop, mobile, RTL, compact, and zero spacing were compared.
  Vertical default, control DOM, focus and selection, values and metadata,
  native submit and reset, and `component=false` remain.

- FormItem supports `validateFirst` for sequential stopping and the first
  parallel failure. By default, rules run in parallel and keep message
  order. Errors precede `warningOnly`, so an early warning waits for
  blocking checks. Upstream submit success before a late error is recorded
  separately. Silent validation, `outOfDate`, reset and unmount, native
  focus, and selection remain.

- Form supports `getFieldInstance`, `focusField`, and `scrollToField` with
  automatic control refs, custom `controlRef`, native ID fallback, exact
  NamePaths, and FormList and reset lifecycle. Scroll boundaries, alignment,
  smooth and custom behavior, and optional focus are supported. Verified
  upstream ref collisions and scroll-margin drift are recorded separately.
  Programmatic scrolling does not yet include CSS margins.

- Form `resetFields` accepts a list of exact NamePaths. Selected FormItems
  and FormList rows remount, and a full reset clears local state in ordinary
  controls. Neighbor DOM, focus, and drafts persist. Added empty and root
  paths, list `initialValue` precedence and conflicts, and stale-validation
  guards. The confirmed stale upstream input is recorded separately.
  The Svelte field display follows the store.

- Form supports `setFields` for batched values, errors, warnings, and
  manual touched and validating state without automatic validation.
  Metadata for fields without rules, native inputs, error projection, and
  snapshot guards remain. Upstream stale errors and undefined touched
  are recorded separately and corrected.

- Form supports `getFieldsValue` projection by bindings and paths, full
  store reads, and a nullable metadata filter. Lists and validated lifecycle
  were compared with current upstream. Deprecated `strict` is outside
  the port. Model and touched rules remain.

- Form supports `isFieldsTouched` and `isFieldsValidating`, including
  `allTouched`, path groups, lists, and empty selections. Model-only
  rules remain, and metadata queries are read-only. Upstream exceptions
  for empty paths and undefined names are recorded separately.

- Form `validateFields` accepts `validateOnly`, `recursive`, and `dirty`
  in combination. Silent validation retains UI metadata, recursive matching
  respects path segments, and dirty includes defaults, validation, writes,
  and reset. Concurrent calls were compared with upstream. The full
  snapshot and touched rules remain. A second argument after `undefined`
  applies, correcting the recorded upstream defect.

- FormErrorList supports FormList errors and warnings, help precedence,
  Snippets, `fieldId`, themes, list `prefixCls`, and a visibility callback.
  Clear delay and leaving-row order remain, and unmount cancels motion
  and timers. The upstream repeated `toString` text issue is recorded
  separately. Svelte avoids the extra messages.

- Form supports `warningOnly`, `getFieldWarning`, and warnings in
  `getFieldsError` and FormList metadata. Warnings leave submit, required
  state, and `aria-invalid` unaffected, with errors taking precedence.
  Late validation cannot restore warnings after reset, a value change,
  or local field removal. Starting the next validation clears old warnings
  as upstream.

- FormList supports nested lists, `initialValue`, add, remove, move, stable
  keys, custom validation, and reset. Controls, focus, and field errors
  survive reordering. Async validation does not restore removed-row errors.
  Fractional move indices are ignored, correcting confirmed upstream row loss.

- Form supports nested NamePaths, `getFieldValue`, `getFieldsError`,
  `FormItem.rules`, and `errorFields`. Dotted strings remain literal keys.
  `setFieldsValue` merges objects and replaces arrays. `createForm`, value
  isolation, native submit and reset, and stale validation guards remain.

- Breadcrumb supports shared class, style, and semantic defaults, separator,
  and dropdown icon through ConfigProvider with upstream nullish precedence
  and full-record replacement. Callbacks receive the resolved separator.
  Native params defaults, itemRender types, links, focus, and open menu
  behavior remain.

- Anchor supports ConfigProvider class, style, and object or function semantic
  defaults, upstream root style layers, and full-record replacement. The
  indicator updates after semantic changes while preserving DOM, focus, and
  callbacks. The upstream stale geometry is recorded separately.

- Descriptions supports ConfigProvider class, style, and object or function
  semantic defaults with nested record replacement, upstream root layers,
  and legacy and item precedence for cells. Card and Meta share the flat
  semantic engine. Native callback defaults remain alongside a separate
  raw upstream observation.

- Card and CardMeta support ConfigProvider class, style, and object or
  function semantic defaults, independent records with nested replacement,
  and the four upstream root style layers. Header and body semantic styles
  override legacy styles. Editors, focus, selection, FormData, tabs, and
  callbacks remain. A separate raw upstream observation compares native
  callback defaults without changing the contract.

- ConfigProvider and Form share `variant` with upstream local, bordered,
  Form, component, fallback, and global precedence for all consumers
  including Card and Pagination. Added variant-only Select, TreeSelect,
  DatePicker, Card, and Mentions configuration. Search keeps separate
  field fallback and button settings. ColorPicker's format Select retains
  upstream explicit borderless.

- `Form.component=false` provides context without a native wrapper for
  nested forms. An undefined variant on the nearest Form resets the outer
  Form style. Default form, validation, submit and reset, and bindings remain.

- Select supports local outlined, filled, borderless, and underlined variants
  and legacy `bordered=false`, with explicit variant taking precedence.
  Changes preserve search, focus, selection, DOM, and FormData. Single and
  multiple modes were compared with the official 6.6.8 UMD.

- `TableColumn.hidden` updates visible cols, headers, cells, and fixed
  offsets while keeping sort and filter state. With all data columns hidden,
  selection and expansion or the default empty column remain. Neighboring
  editors and expanded content are retained.

- `TableColumn.rowScope` uses native `th` with `scope=row/rowgroup`, upstream
  header colors, selection and hover, and fixed columns. Scope updates
  preserve editor, focus, and selection. Ordinary cells, column headers,
  and expanded rows retain their semantics.

- `TableColumn.className` sets header and cell classes for a column,
  retaining sort, fixed, and selection classes and editor DOM on updates.

- Grid's global screen tokens control the Row observer and scoped Col
  media CSS, including SSR without JavaScript, nested and sibling themes,
  and updates after mount. Upstream `screen*` and `screen*Min` thresholds,
  reset classes, and local style priority remain. Stale upstream layout
  on theme update is recorded separately.

- Grid Row and Col use shared component aliases, algorithms, and scoped
  variables during SSR, including typography, nested providers, and custom
  CSS prefix. Gutter, flex, and style precedence, refs, and slot contents
  remain. Upstream's component media variable limits are recorded
  separately. Global breakpoint tokens are pending at this stage.

- Table supports `showHeader` defaulting to true, upstream no-header
  corners, and retained caption, panels, and row state. With the header
  hidden, fixed offsets use `tbody` and update after data replacement or
  emptying. Added UMD, SSR, and browser checks.

- Table supports string or callback `rowClassName` and `rowHoverable`
  defaulting to true. Classes supplement row state, and hover clears
  immediately on prop change. UMD class and color comparisons and SSR
  and browser tests were added. Stale upstream hover is recorded
  separately. Legacy styles remain.

- Table title and footer Snippets receive current-page records after
  sorting and filtering, including empty data and manual server mode.
  Upstream panel structure and footer tokens are checked against 84 UMD
  states. Caption, editor DOM, drafts, focus, and controls persist.

- Table adds 37 upstream component defaults, aliases and algorithms, and
  reactive theming for cells, selection and expansion columns, sort and
  hover, expanded rows, and filters. Added 15 UMD profiles, upstream
  caret icons, and unit, SSR, and browser checks. Updates retain controls,
  drafts, focus, selection, and fixed offsets. Legacy theme and local
  style precedence remain.

- Notification adds seven component defaults, aliases and algorithms, and
  reactive holder and notice theming, with 17 UMD themes and unit, SSR,
  and browser tests. Actions follow upstream structure. Legacy layout,
  editor DOM, focus, viewport styles, and deadlines remain. Explicit
  status colors work when equal to a global alias or under another
  `cssVar` prefix. Upstream issues and `width:undefined` are recorded
  separately, and native guards remain.

- Message adds three component tokens, aliases and algorithms, and scoped
  variables, including notice and holder style precedence and a custom
  prefix. Added 16 UMD themes and unit, SSR, and browser checks. Updates
  retain viewport styles, queue, handles, and timer deadlines. The
  upstream icon height is restored, and existing long-word wrapping
  remains. Upstream overflow is recorded separately.

- Modal adds public and internal component tokens, aliases, algorithms,
  wireframe, portal theme synchronization, and the upstream close icon
  wrapper. Added 19 UMD themes and unit, SSR, and browser checks. Native
  modality, drafts, selection, focus, width, callbacks, and legacy styles
  remain. Static confirm is pending at this stage.

- Drawer adds component tokens, aliases, and algorithms on the native
  dialog, including portal synchronization and local CSS variable
  precedence. The title inherits the upstream panel color. Added 16 UMD
  themes and unit, SSR, and browser checks. Updates retain modality,
  editor DOM, drafts, selection, focus, and legacy styling.

- Upload and Dragger add two component tokens, aliases and algorithms, and
  local CSS variables on the selection and drop region. Added 16 UMD themes
  and unit, SSR, and browser checks. The link reset, canonical icon classes,
  and full-height error cards are restored. Theme updates retain the list,
  input, focus, and requests. A zero-size card is recorded as an upstream case.

- Mentions uses shared Input and component tokens, aliases, and algorithms
  on the textarea and popup. Added 16 UMD themes with sizes, variants,
  disabled and error styles, and nested contexts. Updates preserve drafts,
  caret, focus, and active option. The native button reset preserves the
  upstream active suggestion background. Added unit, SSR, and browser checks.

- Tour adds nine upstream CSS defaults, alias overrides, and algorithms for
  panel, close, and primary controls, with an independent Button theme.
  Updates keep the step, portal and editor DOM, and focus. Added 15 UMD
  themes and unit, SSR, and browser checks. The upstream runtime
  `zIndex=1001` priority over the CSS token is recorded separately.

- ColorPicker adds alias overrides and algorithms and separate Popover,
  Collapse, and field themes. Theme updates keep popup position, HEX
  draft and focus, and presets. Restored the upstream body reset, field
  flex sizes, and bright state from global `colorBgElevated`. Added 15 UMD
  themes, 120 scope sets, 60 popup measurements, and SSR and browser tests.

- DatePicker, RangePicker, TimePicker, and TimeRangePicker share component
  tokens through `components.DatePicker`, aliases and algorithms, and
  independent popup themes. Updates keep drafts, focus, selection, and
  original column scroll. Restored the datetime header, empty selection,
  and omission of an empty footer. Added 15 UMD themes, focus and popup
  CSS comparisons, and unit, SSR, and browser checks.

- Calendar adds six public tokens, 21 internal picker panel defaults,
  aliases and algorithms, and independent header themes. Upstream
  minimum-width controls retain intrinsic text at small sizes without
  changing public Select defaults. Added 17 UMD themes, 136 sets,
  mobile measurements, and unit, SSR, and browser checks.

- Transfer adds six component tokens, alias overrides and algorithms,
  independent internal Checkbox and Pagination themes, and the upstream
  Pagination CSS scope. Search drafts, selection, focus, pages, and move
  callbacks remain. Added 17 UMD themes, 136 CSS measurement sets, and
  unit, SSR, and browser checks. Existing native remove-button font
  inheritance is recorded separately.

- Tree adds component tokens, alias overrides and algorithms, and an
  independent theme for TreeSelect's internal tree. Native style, DOM,
  focus, active descendant, checks, and pending load persist on updates.
  Added 14 UMD themes, 112 CSS measurement sets, and unit, SSR, and browser
  checks.

- Listy adds component tokens, alias overrides and algorithms for raw and
  virtual lists, the upstream row height estimate, and live cache updates.
  Semantic precedence, input, focus, refs, and sticky `scrollTo` remain.
  Added 16 UMD themes, 128 CSS and window measurement sets, and unit, SSR,
  and browser checks.

- List adds 11 component tokens and font, color, and spacing aliases and
  algorithms. Upstream root, container, and Col scopes are restored.
  Theme updates retain keyed rows, input, focus, and pagination. Added
  17 UMD themes, 136 measurement sets for grid, empty, and narrow layouts,
  and unit, SSR, and browser checks.

- Typography adds heading margins, alias overrides, and algorithms for
  text and editor. Style precedence, drafts, selection, focus, and pending
  async copy remain. Added 15 UMD themes, 120 measurement sets for text,
  headings, links, and textarea, and unit, SSR, and browser checks.

- Form and FormItem add 11 component tokens, alias overrides, and algorithms.
  `labelHeight` sets vertical height as upstream. Native model, validation,
  submit and reset, labels, focus, and internal Row and Col scopes remain.
  Added 17 UMD themes, 170 CSS measurement sets, and unit, SSR, and browser checks.

- FloatButton, Group, and BackTop add component theming with alias
  overrides, algorithms, inheritance, and custom `cssVar` prefix.
  Button tokens, configuration, semantic and local style precedence,
  native refs, focus, and forms remain. Added 15 UMD themes, 225
  measurement sets, and unit, SSR, and browser checks.

- `ConfigProvider.getTargetContainer` supplies a shared Window or
  HTMLElement target for Affix and Anchor, with nested inheritance and
  local priority. Target changes keep DOM, fields, and focus. Anchor
  registrations survive a simultaneous `href` update. Upstream ShadowRoot
  errors and stale Affix position are recorded separately. Svelte updates
  position immediately.

- Affix ports `ConfigProvider.affix` classes and styles and local
  `prefixCls`. Full-record inheritance, local style priority, and independent
  CSS variables remain. Prefix and configuration updates preserve fixed DOM,
  fields, and callbacks. Scoped CSS clears on reset and unmount. Added an
  official UMD comparison.

- `ConfigProvider.space` supports size, class and style, and object or function
  root, item, and separator slots, with upstream precedence and nested record
  replacement. Space receives alias tokens and algorithms without a typography
  reset. Compact and Addon retain independent settings. Upstream, SSR, and
  browser checks cover gaps, scopes, callbacks, and retention of keyed DOM,
  drafts, selection, and focus.

- Segmented supports local `prefixCls` with pinned CSS, independent defaults,
  and existing CSS variables. Live changes retain radio controls, selection,
  focus, and refs, cancel the old thumb, and clear the stylesheet on unmount.

- `ConfigProvider.segmented` supplies class and style and semantic slots with
  object or function callbacks, upstream precedence, and nested replacement.
  Native callback defaults, binding, radio, focus, refs, and isolated scopes
  remain. Added upstream, SSR, and browser checks.

- Popover and Popconfirm support ID and fallback, `forceRender`, `fresh`,
  and local `zIndex` through `AvatarGroup.max.popover`. Hidden title and content,
  slots and ID, and buttons follow upstream caching. Opaque Snippet captures
  stay reactive. Forced render prepares the portal and retains SSR and
  the hidden shell. ARIA ID reference ownership, drafts, focus, selection,
  widget reset, and pending Promise are checked separately. Added 52 UMD
  scenarios, 399 frames, and SSR and browser tests.

- Popover and Popconfirm support `bind:ref` with shared PopoverRef, current
  trigger and popup DOM, and `forceAlign` on the existing positioning
  controller. Native div shell, SSR and unmount cleanup, popup and trigger
  replacement, portal, drafts, focus, selection, and pending Promise remain.
  The call adds no dependencies to the caller's effect. Added eight UMD
  lifecycle and manual alignment cases, batched calls, and package tests.

- Popover and Popconfirm support `align`, `builtinPlacements`, and
  `onPopupAlign` through `AvatarGroup.max.popover`. Upstream offsets,
  points, overflow, region, arrow and class selection, and semantic
  precedence remain, alongside native tracking, DOM, drafts, focus,
  selection, and SSR cleanup. Added 84 UMD scenarios. React's delay after
  prop changes is recorded separately.

- Popover and Popconfirm support independent `showAction` and `hideAction`,
  `focusDelay` and `blurDelay`, touch fallback, and upstream outside and
  popup focus actions through `AvatarGroup.max.popover`.
  `Popover.disabled` retains raw open and callbacks. Uncontrolled open
  survives prop updates, with native binding and focus, Promise safeguards,
  and SSR cleanup. Added 67 UMD scenarios, 389 frames, and six cleanup
  traces for events and confirmation buttons.

- Tooltip supports independent `showAction` and `hideAction`, empty and reactive
  sets, `focusDelay` and `blurDelay`, upstream touch fallback, and outside
  dismissal for explicit actions. Settings reach Typography ellipsis.
  Native defaults, controlled and bindable open, and SSR cleanup remain.
  Added 54 UMD scenarios and 310 frames for callback timing, popup hover,
  and delayed work cancellation on unmount.

- Tooltip supports `disabled` with raw open and pending events,
  `id` with fallback and fresh cache, `forceRender` for hidden content
  and portal, and explicit `zIndex` with upstream style precedence.
  Settings pass to Slider and Typography. Native shell, SSR, ARIA
  ownership, drafts, focus, and selection remain. Added 19 UMD scenarios,
  four consumer traces, and SSR and browser checks. Shared upstream
  z-index context is pending at this stage.

- Tooltip supports `align`, `builtinPlacements`, and `onPopupAlign`
  with upstream map precedence, offset and targetOffset, overflow,
  htmlRegion, dynamicInset, and autoArrow. Settings pass to Typography
  and single and range Slider. Semantic styling retains precedence.
  `forceAlign` batches calls in a microtask as rc-trigger. Native
  tracking, hidden shell, SSR, DOM, focus, and selection remain.
  Added 38 UMD scenarios, numeric, SSR, and browser tests, with explicit
  limits for CSS transforms and scroll-container clipping.

- TooltipRef supports `bind:ref`, current `nativeElement` and
  `popupElement`, and `forceAlign` on the shared position controller.
  Native shell, SSR, tracking, cleanup, focus, and selection remain.
  Calling it adds no dependencies to the caller's effect. Added four
  UMD ref and lifecycle cases and browser checks with paused frames,
  trigger replacement, and moving a popup to body.

- Tooltip supports legacy `overlay` with upstream `title=0` precedence,
  boolean and array content, and the fresh cache of content and inner
  container semantic class and style. Settings pass to Typography
  and Slider. Native eager SSR, hidden shell, whitespace handling,
  binding, ARIA, and local child state remain. Added 24 UMD cases
  and 80 cache frames. Opaque Snippets remain reactive according to
  Svelte, which limits full React.memo equivalence.

- Collapse.Panel supports compound children, direct SSR, `items` precedence,
  context prefix and slots, nativeElement and ref, and remount on key change.
  The shared renderer keeps native controls, the hidden lifecycle, nested
  panels, and focus recovery. Added item HTML attributes and events,
  headerClass, callback refs, 119 UMD cases, capture, bubble, focus, and
  ref traces, lifecycle, and hydration of an open panel. Implicit keys,
  native events, and ref boundaries are documented separately.

- Collapse supports numeric and index keys, scalar and array content, legacy
  aliases, `ConfigProvider.collapse`, object and function semantic slots,
  item overrides, a custom `expandIcon` Snippet, local `prefixCls` and
  `rootClassName`, refs, and data and ARIA attributes. Added ten tokens,
  aliases and algorithm, and 49 CSS rules. Native heading and button,
  keyboard and focus, hidden lifecycle, and independent extra remain.
  Added official UMD comparisons, callback traces, and SSR and browser tests.

- Alert.ErrorBoundary is a compound Svelte component with `title`, `message`,
  `description`, and `id`. It retains errors until remount and propagates
  fallback errors to the parent boundary. Healthy children stay unwrapped.
  SSR errors still throw. Default description uses JavaScript `Error.stack`
  in place of React componentStack. Added 19 UMD cases, upstream SSR,
  lifecycle and nesting evidence, and hydration tests.

- Alert supports scalar and array content, legacy aliases,
  `ConfigProvider.alert`, object and function semantic slots,
  local `prefixCls` and `rootClassName`, refs, and root and close data
  and ARIA. Added four component tokens, aliases and algorithm, and
  37 CSS rules. The upstream theme uses the original fitted viewport
  of five status icons. The legacy viewport remains. Added 110 UMD
  scenarios, native SSR baseline, callback traces, and SSR and browser tests.

- Result supports four component tokens, aliases and algorithm,
  `ConfigProvider.result`, object and function semantic slots,
  local `prefixCls` and `rootClassName`, refs, and data and ARIA.
  Scalar and array content and three static image components are ported.
  Native headings, decorative inert icons, responsive behavior, and focus
  remain. Tooling reproduces all 20 CSS rules. Added 81 official UMD
  scenarios and SSR and browser tests.

- `ConfigProvider.renderEmpty` applies to Select, TreeSelect, Cascader
  and its Panel, Mentions, Transfer, Table, and Table filters. List
  retains its integration, and AutoComplete remains excluded. Upstream
  falsy and nullish presets and Transfer side arrays are ported, with
  native defaults without a callback and local zero for Select and
  TreeSelect. Select stays open when focus enters custom content.
  Added 151 UMD scenarios, an interaction trace, a fresh native baseline,
  and SSR and browser tests.

- Empty supports URL and scalar content, `PRESENTED_IMAGE_DEFAULT`,
  `PRESENTED_IMAGE_SIMPLE`, `ConfigProvider.empty`, object and function
  semantic slots, local `prefixCls`, `rootClassName`, `imageStyle`, and
  refs. Added Empty aliases and algorithm and upstream SVG colors,
  retaining native mode, inert and ARIA, `image=false`, responsive
  behavior, and focus. Added all 15 CSS rules, 57 official UMD
  scenarios, and SSR and browser tests.

- The main Skeleton supports `ConfigProvider.skeleton`, object and
  function semantic slots, local `prefixCls`, `rootClassName`,
  nativeElement and ref, and nested class and prefix props.
  Native host, existing class and style, status and focus, layout,
  and normalization remain. Added 34 official UMD scenarios, SSR,
  and lifecycle checks.

- `Skeleton.Avatar`, `Button`, `Input`, `Image`, and `Node` and their
  matching named Svelte exports support upstream size context, shapes,
  block, object root and content styles, local prefix, and active state.
  Eight shared tokens also apply to the main Skeleton, retaining its
  native host, status, focus, and normalization. Added 48 CSS rules,
  116 UMD scenarios, and SSR and browser checks for style precedence,
  live changes, and Node Snippet state.

- Progress circle and dashboard add gap placement and degree, success
  segments, circle steps, conic gradients, and small-circle Tooltip
  from `@rc-component/progress` 1.0.3. Native bounds, ARIA, clipping,
  and numeric SVG attributes remain. CSS geometry, status icons, and
  rapid update transitions are compared with 81 UMD cases and a trace.
  Tokens and semantic styles apply to the SVG markup.

- Progress line adds steps and rounding, gradients, success segments
  and `percentPosition`, formatter Snippets, and upstream aliases.
  Added `ConfigProvider.progress`, semantic slots, local `prefixCls`,
  nativeElement, and six tokens with aliases and algorithm. Native
  percent, dimensions, ARIA, and external label clipping remain. Status
  icons use the original SVG area. Added 40 CSS rules, 70 UMD cases,
  and a prior clipping baseline. Circle and dashboard SVG are tracked
  separately at this stage.

- Spin adds fullscreen, percent and auto, `ConfigProvider.spin`, semantic
  slots, deprecated aliases, local `prefixCls`, and static
  `setDefaultIndicator`. Added four tokens, aliases and algorithm, and
  SSR variables. Native delay, inert, focus, ARIA, and reduced motion
  remain. Extracted 35 CSS rules and added 52 official UMD scenarios,
  the auto timeline, and unit, SSR, and browser checks for state,
  scoped styling, refs, and cleanup.

- Flex supports a custom Svelte component with generic props and
  optional nativeElement forwarding, local `prefixCls`, and
  ConfigProvider.flex vertical, class, and style. Component aliases
  and algorithm leave typography intact. Children, native events, gap
  and style precedence, refs, focus, selection, and custom state remain.
  Added 36 UMD scenarios and a prefix template from 32 pinned CSS rules.
- Divider supports local `prefixCls` and `ConfigProvider.divider` with
  class and style and object and function semantic slots. Style precedence,
  nativeElement, normalized callbacks, and inline spacing remain.
  Nested records replace their parent. Extracted 33 CSS rules and added
  28 official UMD scenarios.
- Divider supports `textPaddingInline`, `orientationMargin`, and
  `verticalMarginInline` through `ConfigProvider.theme.components.Divider`,
  including aliases and algorithm, CSS variable prefix, and SSR.
  Native separator, sizes, default spacing, and semantic and user
  style precedence remain. Added official UMD comparisons for 15 themes.
- Slider supports local `prefixCls` for both modes and their BEM classes.
  Empty values use `ant-slider`. Tooltips get the upstream owner class
  independently of their Tooltip prefix. Extracted 54 CSS rules and added
  37 UMD cases and SSR and browser tests for prefix changes, portals,
  scope isolation, and reduced motion. Native inputs, refs, FormData,
  focus, presets, and disabled Tooltip policy remain.
- Single Slider supports marks, dots, `step=null`, included and track,
  semantic configuration shared with range, deprecated styles and
  vertical, handle ARIA and disabled arrays, autofocus, and numeric
  `onChange` before binding updates. Native numeric grid without marks,
  forms and reset, focus, completion, and cancellation remain. Added 31
  UMD styling and transition scenarios and SSR and browser checks for
  keyboard and pointer, RTL, nested configuration, and live marks.
  Divisions use range palette styling even without an upstream theme.
  Plain Slider keeps its native colors.
- Tooltip and Popconfirm support `destroyOnHidden` and legacy
  `destroyTooltipOnHide` with modern false taking precedence, nested
  state reset, and lazy SSR. This also covers Typography ellipsis and
  three Slider tooltip modes. Native shell, ARIA, and default lifetime
  remain. Added 44 UMD scenarios and SSR and browser tests, including
  Popover, portals, and a pending Popconfirm Promise.
- Typography ellipsis, copy, and edit tooltips inherit triggers and
  delays from `ConfigProvider.tooltip`, with local precedence including
  zero and empty arrays, click and context menu, and combinations.
  Semantic callbacks receive resolved defaults. Native measurement,
  lazy SSR, DOM, and focus remain. Added 23 UMD cases and 21 event traces
  for raw open on untruncated text, controlled open, nested providers,
  and input within the popup.
- Tooltip, Popover, and Popconfirm support local `prefixCls` with upstream
  popup, slot, and color classes and trigger `openClassName`. Added CSS
  templates of 58, 72, and 11 rules and 123 UMD scenarios. AvatarGroup,
  Slider, and Typography Tooltip are supported. DOM, focus, viewport
  limits, and caller classes remain. Typography passes color and semantic
  styles to the shared popup. SSR leaves Snippets opaque and applies
  the open class after hydration.
- Tooltip, Popover, and Popconfirm support preset and CSS colors,
  upstream RGB contrast and inverse classes, and semantic and legacy
  style precedence. Colors pass to AvatarGroup overflow and single,
  pinned range, and active range Slider. Extracted 65 CSS rules and
  added 129 UMD cases, 12 nested surfaces, and engine, SSR, and browser
  checks. Native palette, DOM, drafts, and focus remain. Internal
  contrast is scoped per popup.
- `ConfigProvider.tooltip`, `popover`, and `popconfirm` supply arrow,
  trigger, and delay defaults, class and style, and semantic callbacks,
  with nested replacement and upstream isolation of Tooltip from
  Popover and Popconfirm. Added click and context menu to Tooltip,
  context menu to Popover, trigger and delays to Popconfirm, and legacy
  semantic aliases. Native defaults without configuration, popup DOM,
  input, and focus remain. Sixty UMD cases and 18 event traces cover
  these settings, including Slider and AvatarGroup.
- Tooltip, Popover, Popconfirm, AvatarGroup, and Slider tooltips support
  local `arrow.pointAtCenter` and object `autoAdjustOverflow` with
  upstream points, tokens, flip and shift, and numeric `adjustX` and
  `adjustY` rules. Active and pinned range tooltips are supported.
  Boolean defaults remain. Added 84 UMD references and unit, SSR,
  and browser tests, including DOM, draft, selection, and focus retention.
- Tooltip, Popover, Popconfirm, AvatarGroup overflow, and Slider tooltips
  support all 12 physical placements. Corners use shared upstream
  `useAlign`, `visibleFirst`, dynamic inset rounding, and flip caching
  until close. Four existing native placements remain. Added 99 UMD
  references and unit, SSR, and browser tests, including input and
  selection retention across placement changes.
- AvatarGroup accepts Svelte Popover settings in `max.popover`, with
  custom title and content, controlled or default open, callback,
  container getters, native ARIA, classes, and styles. Popover adds
  `destroyOnHidden` and its legacy alias. Group destroys content by
  default and can keep it on request. SSR remains lazy. Added 33 UMD
  lifecycle cases. Another rejected opening calls the callback again.
- AvatarGroup supports deprecated `maxCount`, `maxStyle`,
  `maxPopoverPlacement`, and `maxPopoverTrigger`, with upstream truthy
  `max` taking precedence. Limit normalization, DOM, focus, and an open
  list remain. Added 20 UMD references and SSR and browser checks.
- Avatar and AvatarGroup support local `prefixCls` and upstream root,
  string, group, and popover classes with a 24-rule template. The shared
  reset is scoped to the prefix. Neighbor tokens, text fitting, DOM,
  refs, and open overflow remain. Added 37 UMD references.
- Avatar supports `ConfigProvider.avatar` class and style, `rootClassName`,
  native DOM attributes and events, `onClick` and `onclick`, and
  `bind:nativeElement`. AvatarGroup has `rootClassName` and a div ref.
  Internal item fields stay out of the DOM. Added 31 UMD references
  and SSR and browser checks.
- Tag, CheckableTag, and CheckableTagGroup support local `prefixCls`
  with upstream classes, a 90-rule CSS template, and SSR head styles.
  Prefix updates preserve DOM, focus, and native themes. Cleanup is
  scoped to the instance. Added 60 UMD references.
- CheckableTagGroup supports single and multiple selection, controlled
  and default values, typed options, root and item semantics,
  `ConfigProvider.tag`, and a native div ref. The gap comes from upstream
  CSS. Added 34 UMD cases for selection, callbacks, and prop updates.
- Tag supports native `href` and `target`, DOM attrs and refs,
  `closable`, and context close icon and closable settings. Ported
  upstream precedence, scalar and Snippet glyphs, ARIA, keyboard repeat
  handling, and canceled navigation on close. Link reset is scoped to
  Tag. Native close, focus, and content removal remain. Added 55 UMD
  references and SSR and browser tests.
- Tag adds CSS colors with upstream HSL and alpha arithmetic, inverse
  and bordered aliases, semantic classes and styles, and
  `ConfigProvider.tag`. Added Tag tokens and upstream reactive style
  diffing. CheckableTag inherits context class and style. Existing
  Snippets, native close and focus, and controlled callbacks remain.
- CheckableTag ports upstream click and keyboard callbacks, cancellation
  and Space repeat handling, native aliases, DOM attrs, and
  `bind:nativeElement`. Native button, controlled checked, Enter, and
  focus recovery remain. Added 12 UMD cases and SSR and browser tests.
- Badge supports local `prefixCls` with its own CSS and upstream
  `scrollNumberPrefixCls` classes for superscript, custom count, and
  digits. Shared ScrollNumber CSS linkage, active zoom and cache, DOM,
  refs, focus, and caller state remain. Styles live with Badge. Added
  31 UMD variants, six motion sequences and 30 frames, and SSR and
  browser cleanup tests.
- CSS extraction supports portable ES modules with a default CSS string
  export. Preview all retains CSS output. Hash, rule, and keyframe
  checks and explicit writing remain. Added a verified Badge prefix
  template with 59 rules and six keyframes.
- Badge accepts numeric, boolean, and null text with upstream zero and
  presence rules, string offsets with parseFloat and CSS units, and
  deprecated `size="default"`. Numeric normalization, BadgeContext,
  and existing layout without the new API remain. Raw offsets use DOM
  style setters, including invalid reactive updates. Added 58 UMD
  references and unit, SSR, and browser tests.
- Badge supports `ConfigProvider.badge`, root and indicator semantic
  callbacks, CSS colors and gradients, upstream style precedence, and
  ScrollNumber inset border. Added `rootClassName`, native span
  attributes and events, and `bind:nativeElement`. Existing native
  style, count, and accessibility contracts and custom count state
  remain. Added 49 UMD references and unit, SSR, and browser tests.
- Badge CSSMotion ports enter and leave, count, dot and title caching,
  exit interruption, own end events and deadline, custom count, and
  standalone and status paths. Ported four CSS rules and four keyframes.
  SSR, focus, immediate accessible-description updates, and reduced
  motion remain. Added 17 UMD sequences, 87 frames, and SSR and browser
  cleanup tests.
- Badge SingleNumber ports scroll paths, keys by position from the
  right, absolute-count direction, fast updates, NaN and signs, and a
  1000ms fallback with cleanup. SSR, hydration, focus, reduced motion,
  and immediate numeric offset remain. Added 18 UMD sequences, 68
  frames, and engine, SSR, and browser tests.
- Badge `count` accepts strings, booleans, null, and Snippets with
  upstream custom-root attributes. Ported string overflow and zero rules,
  static character slots, custom positioning and RTL, SSR, and independent
  Snippet interactivity. Numeric BadgeContext and native behavior remain.
  Added 46 UMD references and unit, SSR, and browser tests.
- BadgeRibbon ports Badge.Ribbon 6.6.8 with scalar and Snippet content,
  preset and CSS colors, logical placement and RTL, semantic callbacks,
  `ConfigProvider.ribbon`, and a native ref. Original Badge aliases and
  algorithm and 27 extracted CSS rules apply. Added UMD references and
  SSR and browser tests for state, focus, and cleanup.
- `Avatar.src` accepts a Svelte Snippet with upstream precedence and
  its own attributes, events, and state. Image and preview work inside
  AvatarGroup overflow. Ported the upstream Image CSS rule. A nested
  dialog retains its parent popup and handles keyboard input first.
  Added 14 UMD references and SSR and browser tests. String images,
  icon and children, accessibility, and fallback remain.
- Responsive `Avatar.size` supports seven upstream breakpoints, sparse
  maps with zero and undefined, upstream font sizing, `screen*` tokens,
  and style, AvatarGroup, and ConfigProvider precedence. SSR, DOM,
  focus, fallback, text fitting, and overflow remain. Added 20 UMD
  references with 274 measurement sets, upstream subscription lifecycle,
  and unit, SSR, and browser checks.
- Modal and Drawer support `getContainer` with false, a selector, DOM
  node, DocumentFragment or ShadowRoot, and ConfigProvider fallback
  with upstream arguments. Native dialog and SSR, state preservation
  for the same target, focus, inert, scroll lock, and lifecycle remain.
  Changing target recreates content. Added 36 UMD references and SSR
  and browser tests. Upstream Drawer inline geometry is pending.
- Menu supports a local container getter and ConfigProvider with
  upstream explicit-undefined precedence, ShadowRoot, force render,
  and hidden inline copies. Moved submenus retain native refs, focus,
  selection, theme variables, hover, and keyboard. A different
  container recreates popup contents as upstream. Added 32 UMD
  references and SSR and browser checks. More overflow is pending.
- Date, time, and range pickers support local and global container
  fallback, ShadowRoot, the upstream root trigger, and `defaultOpen`
  based on getter arity. Restored the 4px gap, floor rounding,
  selector min-width, and RTL placement default. Native refs, Day.js
  and confirmation, and conditional panel lifecycle remain. Added
  54 UMD references and SSR and browser tests for geometry, state,
  focus, and cleanup.
- Mentions supports local `getPopupContainer` and `popupRender` with
  the default menu Snippet. The absence of a provider fallback, prefix
  trigger, and custom-state reset on close or container change follow
  upstream. ShadowRoot, FormItem and SpaceCompact isolation, native
  refs, SSR, and cleanup are supported. Added 22 UMD references and
  SSR and browser tests for focus, selection, and live updates.
- TreeSelect and Cascader support local container getters, provider
  fallback, and ShadowRoot with the upstream trigger, including
  Cascader custom children. Native refs, search, lazy load, themes,
  keyboard, and SSR remain. Restored the 4px popup gap. CascaderPanel
  stays inline. Added 40 UMD references and SSR and browser checks.
  Ancestor variables leave the controller's width intact.
- Select and AutoComplete support local `getPopupContainer`,
  provider inheritance and ShadowRoot, the upstream DOM trigger,
  and calling only after open. Moving preserves search, keyboard,
  focus and selection, FormData, and Select tokens. Native default
  placement remains. Added 32 UMD references and SSR and browser
  tests. AutoComplete internal DOM refs persist on spread prop
  updates, with public `bind:nativeElement` and `bind:inputElement`.
  Reopening Select clears old lists from the original DOM branch.
- Tooltip, Popover, Popconfirm, Dropdown, Slider, and Typography
  tooltips support local and legacy getters, provider fallback, and
  upstream Slider precedence. The shared portal preserves DOM, state,
  and focus with the same container, its own theme variables, and
  native SSR and cleanup. Added 52 UMD references and SSR and browser
  checks. Native placement without a getter remains.
- `ConfigProvider.getPopupContainer` is inherited by Tabs and ColorPicker
  with upstream local prop and undefined precedence. Shared portals
  support ShadowRoot, retaining state with the same container and
  pointer and keyboard events and focus inside the shadow popup.
  Tour retains its container API. Added 30 UMD references and
  SSR and browser tests. Other consumers are still being ported.
- Tabs More supports `arrow`, `align`, `alignPoint`, `placements`,
  `builtinPlacements`, and `onPopupAlign` with upstream offsets,
  regions, flip, shift, dynamic inset, and CSS precedence. Shared
  numeric `useAlign` extends while preserving Tour behavior. Native
  top layer, border-box measurement, state, focus, and cleanup remain.
  Added unit, SSR, and browser tests and 51 UMD references.
- Tabs More supports raw overlay, `autoDestroy` after leave end,
  `openClassName`, upstream slide, `transitionName` and `animation`,
  independent show and hide actions, and touch. Separate OperationNode
  and Trigger states with `visible=undefined`, lifecycle on reversal,
  native inert and SSR, and portal cleanup remain. Added 33 UMD
  references and unit, SSR, and browser tests.
- Tabs supports `renderTabBar` with default navigation as a Snippet,
  upstream props and overrides, per-tab children and attributes, and
  Svelte attachments. Custom bars affect only navigation, retaining
  panels, drafts, state, focus, and root ref. Added the default bar's
  callback ref, `getTabsItemId` for ARIA, 35 UMD references, and SSR
  and browser tests.
- Tabs supports per-panel `className` and `style` in upstream
  semantic, item, and motion order. Added eight UMD cases and SSR
  and browser checks for header isolation, RTL, force render, and
  updates retaining DOM, state, drafts, selection, and focus.
- Tabs supports animated inkBar and tabPane, upstream switch and
  custom CSS motion, prepare, phase styles, end and deadline, and
  visibility callbacks. Exiting panels retain DOM, state, and FormData
  until leave ends. Reversal cancels destruction. Native focus,
  reduced motion, and cleanup remain. Added 33 UMD cases and unit,
  SSR, and browser tests.
- Tabs supports semantic `classNames` and `styles`,
  `ConfigProvider.tabs`, `rootClassName`, native attributes and events,
  and `bind:nativeElement`. Upstream CSS layers, callback props, icon
  and indicator precedence, and nested configuration replacement
  remain. Added 23 UMD references, unit, SSR, and browser tests, and
  live updates retaining DOM and focus.
- Tabs theming uses upstream defaults and aliases, card-height-derived
  padding, component algorithms, CSS variable prefix and hash, and
  inheritance in the More popup. Added UMD, SSR, and browser comparisons
  for 15 themes, 10 variants, LTR and RTL, zero and undefined, and
  updates preserving DOM, drafts, focus, and selection. Native-only
  themes remain.
- Tabs supports deprecated `destroyInactiveTabPane` on root and items,
  with the current name taking precedence at the same level. Native
  item-before-root precedence, force render, lazy lifecycle, local
  state, FormData, and focus recovery remain. Added 12 UMD scenarios
  and SSR and browser tests covering two documented precedence differences.

- Tabs supports `indicator.size` and `indicator.align`, deprecated
  `indicatorSize`, and `onTabScroll` with upstream physical directions.
  Added 64 UMD indicator references, eight scroll cases, and unit, SSR,
  and browser checks for fractional sizing, RTL, precedence, retaining
  DOM, focus, and More, and cleanup. Scrolling stays native.
- Tabs More uses the upstream visible range, hidden-tab listbox,
  trigger, icon and locale, `popupRender`, controlled visibility,
  portal, and removal through `onEdit`. Add retains its DOM node
  when moved to the operations area. Added a CSS recipe, 35 UMD
  references, and unit, SSR, and browser tests for keyboard, RTL,
  focus, nested popups, and lifecycle.
- Tabs supports upstream `size=medium` and deprecated physical
  `tabPosition`. `tabPlacement` takes precedence and native mobile
  fallback remains. Added unit, SSR, and browser tests for RTL, size
  inheritance, and DOM and focus retention.
- Tabs supports `centered`, `tabBarGutter`, and `tabBarStyle` with
  upstream logical and vertical spacing, zero and fractional values,
  separate header styles, and a CSS recipe. Added 31 official UMD
  references and SSR and browser tests for live layout, scroll,
  indicator, focus, and retained panels.
- Tabs supports editable cards with `onEdit`, `hideAdd`, closable
  and closeIcon, add and remove icons, and accessible action names.
  Delete, Backspace, and middle-click retain upstream requests and
  neighboring focus. The owner updates items and selection. Added
  native add and remove buttons, exact SVG, a CSS recipe, UMD
  comparisons, and SSR and browser tests for sizing, RTL, focus,
  callbacks, FormData, and panel retention.
- Pagination theming uses upstream defaults and aliases, quick-jump
  Input tokens, a separate Select scope, algorithms, CSS prefix and
  hash, and wireframe from upstream `bordered.ts`. Added UMD, SSR,
  and browser checks for sizes, states, LTR and RTL, and updates
  preserving native nav and buttons, drafts, focus, bindings, and
  callback order.
- Steps and Timeline theming uses upstream defaults and aliases,
  component algorithms, a shared scope from Steps to Timeline,
  CSS prefix and hash, and user style precedence. Added UMD, SSR,
  and browser tests for variants, RTL, and updates preserving DOM,
  focus, and native step selection. Legacy tokens unused by upstream
  CSS remain unused.
- Breadcrumb theming uses upstream defaults and aliases and component
  algorithms, CSS prefix and hash, separate text and menu arrow colors,
  and overlay padding and margins. Added UMD, SSR, and browser tests
  for LTR and RTL, custom icons, semantic styling, focus, and navigation.
  Dropdown links use automatic height independently of ancestor link height.
- Dropdown theming uses upstream defaults and aliases, a separate Menu
  scope, upstream padding and box sizing, arrow offsets and gap,
  algorithms, and CSS prefix and hash. Added UMD, SSR, and browser
  tests for metrics, hover, arrow position, and updates keeping DOM,
  focus, native links, and popup position. Native-only themes and the
  Svelte callback API remain.
- Menu theming uses upstream defaults, aliases and deprecated mappings,
  separate algorithms, CSS prefix and hash, and sizes and light and dark
  styling for items, inline lists, and popups. Added UMD, SSR, and
  browser checks for metrics, style precedence, RTL, and updates keeping
  DOM, focus, selected and open keys, and popup position. Native-only
  themes remain.
- Anchor theming uses upstream defaults and aliases for ordinary and
  nested links, compact padding, separate algorithms, hash, and CSS prefix.
  Link styling uses regular, hover and active, and focus tokens. Added UMD,
  SSR, and browser checks for metrics, precedence, RTL, and updates retaining
  links, focus, scroll, history, and callbacks. Native-only themes and
  indicator lifecycle remain.
- Cascader theming uses upstream defaults and a shared Select and Cascader
  scope for the field and dropdown. Standalone Panel takes Cascader
  tokens only. Added UMD, SSR, and browser checks for sizes, rows,
  checkboxes, responsive tags, and updates preserving DOM, search,
  selection, focus, and position. Native-only themes and semantic popup
  style precedence remain.
- TreeSelect theming uses upstream defaults and a shared Select and
  TreeSelect scope for field and dropdown, including node dimensions,
  colors and checkboxes, and alias order. Added UMD, SSR, and browser
  tests for updates preserving tree, search, selection, focus,
  FormData, and panel position. Native-only themes remain.
- AutoComplete theming uses the shared Select scope for field, clear,
  and popup, upstream option and group metrics, and separate custom
  Input tokens. Added UMD, SSR, and browser tests. Theme updates
  keep popup position, DOM, input, selection, focus, and form values.
  Native-only themes remain.
- Select theming prepares upstream tokens and aliases for selector,
  dropdown, tag and option sizes, arrow and clear, and focus styles.
  Added UMD, SSR, and browser tests for zero, undefined, algorithms,
  prefix, and theme changes keeping DOM, search, selection, focus,
  callbacks, and forms. Native-only styles and existing Svelte API remain.
- Overlay theming prepares upstream Tooltip, Popover, and Popconfirm
  tokens, arrow paths and offsets, wireframe padding, deprecated aliases,
  and nested style hook order. The upstream gap uses global tokens.
  Native-only panels remain. Added UMD, SSR, and browser tests for theme
  updates preserving position, editor, focus, and pending confirmation.
- Avatar, AvatarGroup, and Badge theming uses upstream tokens, sizes,
  colors, outlines, group spacing, and Badge shadow. Native-only themes,
  numeric Avatar size, and style precedence remain. Added SSR, UMD, and
  browser checks. Popover resets Avatar aliases to provider values,
  while hidden avatars retain their own tokens.
- DatePicker, RangePicker, TimePicker, and TimeRangePicker footers use
  shared Button as upstream PickerButton. Confirmation inherits Button
  configuration, component tokens, Wave, and scalar locale text with
  autoInsertSpace. Native forms, disabled state, focus, and existing
  Day.js callbacks and precision remain.
- Wave ports upstream capture and frame triggers and the default effect
  for Button, Checkbox, Radio, RadioButton, Switch, interactive Tag,
  and Steps. `ConfigProvider.wave` includes disabled, showEffect,
  triggerType, and full GlobalToken. Upstream targets, colors, durations,
  deadlines, native forms and focus, SSR, and cleanup remain. Added Tag
  onClick and onclick and a reproducible eight-rule Wave CSS recipe.
- Radio and Switch theming prepares upstream tokens, Checkbox aliases,
  groups and RadioButton, separate algorithms, unitless dimensions,
  and SSR scopes. Explicit undefined inherits a CSS variable without
  restoring vendor defaults. Native-only themes remain.
- Control theming prepares upstream Button, Input, TextArea, and
  InputNumber tokens, SpaceAddon aliases, CSS roots in composed controls,
  and nested alias isolation. Variables and scope rules are available
  during SSR. Native-only themes remain.
- ConfigProvider adds upstream token and algorithm inheritance, reactive
  `theme.useToken`, full component token types and overrides in GlobalToken,
  upstream hash and CSS variable calculations, and SSR scope. Applying
  all ComponentToken values to CSS is ongoing.
- Theme adds upstream seed, map, and alias algorithms and static
  `getDesignToken`, default, dark, and compact chains, custom mappers,
  and overrides. The full UMD reference covers 25 settings.
  ConfigProvider integration is ongoing.
- Switch supports `value`, `defaultValue`, upstream click, change, and
  arrow events, semantic settings, refs, and focus aliases. Native
  forms, reset, and onclick remain. The `switch` CSS recipe reproduces
  the existing 47 rules from Ant Design 6.6.8 byte for byte.
- Checkbox supports children and context, skipGroup, rich options,
  semantic settings, callbacks, refs, and autoFocus. Children retain
  upstream raw state and callback filtering. Existing options, FormData,
  reset, and indeterminate behavior remain, and Table selection is isolated.
- Radio supports rich options, semantic settings, upstream callbacks
  and click bubbling protection, vertical alias, focus and blur refs,
  and autoFocus. Native forms, reset, and disabled behavior remain.
  RadioGroup restores typed selection when a function binding rejects it.
- InputNumber supports stringMode with upstream mini-decimal arithmetic,
  spinner, variants, prefix and suffix and legacy addons, semantic
  settings, refs, wheel, hold, Shift, and callbacks. Native number
  behavior, FormData, and reset remain. Numeric mode and shared theme
  differences are documented in the README and registry. Added a CSS
  recipe and the mini-decimal MIT license.
- ColorPicker ports the original Color model, RGB, HSB, and alpha
  precision, single and gradient modes, palette, editable gradient
  points, presets, semantic settings and locale, and native popup.
  Added internal slider hooks, InputNumber formatter and parser, a
  CSS recipe, and upstream MIT license. Remaining token, trigger,
  and motion features are tracked in the registry.
- Slider range ports upstream multiple handles, marks and dots, push
  and cross, fixed disabled anchors, editable mode with minCount and
  maxCount, draggableTrack, callbacks, semantic settings, and refs.
  Native single behavior remains. Range uses native inputs and form
  integration and a separate CSS recipe. Added rc-slider MIT and
  engine, public SSR, and browser checks. Remaining single and Tooltip
  APIs are documented in the README.
- Carousel ports upstream geometry and clones, finite and infinite
  modes, rows, fade, native swipe, autoplay, lazy loading, responsive
  behavior, callbacks, typed refs, and custom renderers. Added
  configuration and locale, themes and RTL, a CSS recipe, react-slick
  MIT, and unit, package SSR, and browser checks. Svelte Snippet and
  React instance boundaries are documented in the README.
- Tour supports controlled and default steps, target, mask, gap, all
  12 placements and center, upstream flip and shift and arrow,
  keyboard and IME, custom panels, actions and indicators, semantic
  config and locale, and live theme portals. Added a CSS recipe, MIT
  licenses for rc-tour, trigger, and portal, and unit, package SSR,
  and browser checks. The README documents z-index and token engine
  limits and the native Modal and Drawer adaptation.
- Typography, Text, Title, Paragraph, and Link port upstream
  decorations, copying with Clipboard API and document fallback,
  controlled editing, CSS and JavaScript ellipsis, expansion and
  collapse, semantic config, locale, native refs, themes and RTL, and
  a CSS recipe. Added unit, package, and browser checks. Opaque Snippet
  adaptation and SSR limits are documented in the README.
- Listy supports grouping with upstream indices, sticky headers,
  measured virtualization, scrollTo, native wheel, touch and selection
  dragging, and a scrollbar. Added `ConfigProvider.listy` and `virtual`,
  refs, a CSS recipe, licenses, and unit, SSR, package, and browser
  checks. Raw and virtual differences and native focus across reordering
  remain.
- List, ListItem, and ListItemMeta support upstream pagination and
  server pages, responsive grid, Meta, actions and extra, semantic
  settings, loading and empty states, native refs, themes, and RTL.
  Added `ConfigProvider.renderEmpty` for List, a CSS recipe, and unit,
  SSR, package, and browser checks. Svelte children arrays and opaque
  Snippet SSR are documented separately.
- Pagination supports simple and readonly, quick jumper and confirmation,
  alignment and responsive, upstream jump windows, itemRender and
  icons, locale aliases, semantic and provider slots, a custom size
  changer, and a deprecated adapter. Bindings, normalization, sorted
  sizes, and accessible mobile size changer remain. Transfer shares
  the engine. Added a CSS recipe and unit, SSR, package, and browser checks.
- Transfer ports controlled target keys and selection, upstream move
  order, search, Shift and header selection, one-way removal,
  independent simple and normal pagination, custom lists, footer and
  actions, semantic settings and locale, themes and RTL, and native
  checkboxes. Added a CSS recipe, rc-pagination license, unit, SSR,
  package, and browser checks, and a separate fixture. The README
  describes React callbacks and Snippets and API limits.
- Cascader and CascaderPanel support single and multiple paths,
  checkbox propagation and strategies, search and highlighting,
  custom fields, loadData with upstream option lifecycle, columns,
  controlled and default state, native keyboard and refs, Snippets,
  responsive tags, semantic settings, themes and RTL, and deprecated
  popup aliases. Added a CSS recipe, rc-cascader license, unit, SSR,
  package, and browser checks, and a separate fixture.
- TimeRangePicker ports TimePicker.RangePicker with two fields,
  separate confirmation and calendar draft, sorting, allowEmpty and
  disabled, dependent time restrictions, hover and scroll, pickerValue,
  mixed range and time settings, and Snippets. Shared RangePickerCore
  keeps the calendar API. Narrow panel and arrow positioning and
  deferred focus with cleanup are ported. Added unit, SSR, package,
  and browser checks including UTC, RTL, and native forms and refs.
- TimePicker uses shared SinglePicker, time columns, strict formats,
  draft and confirmation, controlled state, hover and scroll selection,
  restrictions, locale and config, semantic slots, and Snippets.
  Day.js UTC and precision and existing DatePicker and RangePicker
  contracts remain. Added unit, SSR, package, and browser checks.
  Multiple and mask format are pending at this stage.
- Calendar supports full and mini date and month panels, controlled value
  and mode and display state, upstream events and date restrictions,
  header and cell Snippets, week numbers, semantic settings and locale,
  generic date adapter, native refs, and an accessible grid. Added a
  CSS recipe and unit, SSR, package, and browser checks.
- RadioButton and button-style RadioGroup support children and options,
  optionType, size, outline and solid, block and vertical, Badge,
  themes, and native refs. Existing binding, reset and FormData, and
  fieldset semantics remain. Added a CSS recipe and SSR, package, and
  browser checks as the basis for the Calendar header.
- QRCode ports the rc-qrcode and Nayuki encoder, canvas and SVG,
  segmentation, ECC and boost, quiet zone, icon and CORS, statuses,
  locale, and semantic and configuration API. SSR, DPR, native
  attributes and ref, fallback, and cleanup remain. Added licenses,
  a CSS recipe, 226 reference matrices, and unit, SSR, package,
  and browser checks.
- Splitter ports panel sizing and constraints, mouse and touch drag,
  lazy preview, controlled callbacks, collapse and restoration,
  destroyOnHidden, motion, semantic settings, themes, RTL, and SSR.
  Typed items and Snippets replace React Panel declarations. Added a
  CSS recipe and unit, SSR, package, and browser checks.
- Masonry ports measured layout with responsive columns and gutters,
  fresh, keyed items, Snippets, onLayoutChange, and the semantic and
  configuration API. Empty SSR root, upstream CSS appear and leave,
  and observer and frame cleanup remain. Reordering restores native
  focus and selection. Added a CSS recipe and engine, SSR, DOM,
  public package, and isolated browser tests.
- BorderBeam ports CSS border decoration with phased beams, gradients,
  size and outset, radius inheritance, config, and reduced motion.
  Explicit target replaces the React child ref without a wrapper.
  Layers clear on container changes. Added a CSS recipe, unit and SSR
  tests, package tests, and isolated browser checks.

### Changed

- Documented the Splitter accessibility limit. A collapsed panel with
  retained DOM keeps descendants in Tab order, as in Ant Design 6.6.8.
  Added official UMD comparisons for both orientations, motion, and
  destroyOnHidden, preserving behavior.

- Completed the agreed Tag and CheckableTag v1 audit. The registry
  describes retained native controls, DOM, and Snippet boundaries.
  React DOM coverage remains partial.
- Extracted Tabs navigation into private TabsNav at the upstream
  TabNavList boundary. Selection and panels stay in Tabs. Native
  keyboard behavior, overflow, sizing, and focus recovery are preserved.

- Applied line-length and single-step rules to source and tests.
  Public props, config, and API limits are documented in JSDoc at their
  declarations. Calculation order, Svelte markup, names, and component
  behavior are preserved.

- Merged local and remote `develop` while preserving both histories.
  Rate, Watermark, extended TextArea, and Watermark inheritance in
  Modal and Drawer moved to an independent npm package. Examples and
  browser tests belong to homepage.
- Clarified TextArea reduced-motion CSS precedence in the npm build
  for ordinary, disabled, and mouse-active states.
- Extended Input with changes from `woodger/ant-design@cf3e20c` for
  prefix, suffix and addons, clear, count and IME, variants, semantic
  slots, `ConfigProvider.input`, native refs, focus, and Enter.
  String `bind:value`, `onValueChange`, and native events remain.
- Consolidated tooling under `npm run cli -- ...` using `icore`,
  including `registry check`, `registry report`, `registry show`,
  and `css`. Output formats, error code 1, SHA-256 validation, and
  explicit download and write flags are preserved. The CLI remains a
  development tool.
- Split the library and site into independent Git repositories.
  Library documentation, policies, porting tools, and upstream cache
  moved to the library.
- Registry schemaVersion 2 separates local paths from stable
  `integration:` contracts. Consumers check their evidence through
  npm metadata at `antd-svelte/porting/registry.json`. Neighbor project
  source files are left unread.

- Pulled the library into `antd-svelte` and the gallery, examples,
  and browser fixtures into `homepage`. The site uses public package
  `antd-svelte` through `file:../antd-svelte`. Updated paths for tests,
  type checks, registry, and CSS tools. The library builds through
  `@sveltejs/package` into `dist` with type declarations. Publication
  was deferred. Exported `getTableData` and `getPaginationState` for
  table examples and prepared the `createMessage` return type for
  declaration generation.

### Fixed

- AutoComplete retains options during delayed close and upstream
  query and active order after direct click, click after hover, and
  Enter. Outer `title` remains on the root. Custom input gets the default
  class, and controlled textarea synchronizes defaultValue with display.

- Select and AutoComplete preserve actual template Snippet labels.
  Select retains the close callback when a focused field is removed
  without reading the destroyed prop owner.

- TreeSelect clears the active keyboard node on pointer movement over
  a row. Tree uses the upstream `icon__customize` class for custom icons.

- Tree viewport height changes retain scroll when the active key remains
  the same.

- Tree preserves upstream switcher centering. The native button reset
  preserves vendor text-align, and row content keeps inherited alignment.

- Upload stops its batch if the first onChange synchronously unmounts the
  component. Remaining files skip status updates and callbacks after disposal.

- UploadDragger card and circle omit the extra select trigger, input,
  and button. Upload with empty children preserves the hidden input
  and selected files as upstream.

- Upload uses `file.url` for thumbnails and preview with empty
  `thumbUrl`, as in Ant Design 6.6.8. Empty `thumbUrl` still disables
  `previewFile`. SSR and list updates keep existing behavior.

- Modal and Drawer handle `getContainer` changes, including during
  Drawer exit with `destroyOnHidden`. Head-style anchors stay outside
  the keyed dialog so the portal keeps its parent and the theme observer
  avoids observing the dialog itself.

- Upload checks `error.statusText` before `error.message` for Tooltip
  as in Ant Design 6.6.8. Types accept controlled string metadata.
  Empty fields and Error or ProgressEvent retain the fallback and lifecycle.

- Date and time pickers avoid extra whitespace between Snippets, head
  stylesheet, field root, and hidden popup. Neighboring text is retained.

- Date and time picker and Calendar prefix CSS retains native defaults
  after late head insertion. Focus shadow, dark background, and compact
  cell dimensions match canonical `ant`. Upstream overrides retain priority.

- Prefix and theme styles avoid extra whitespace around component and
  ConfigProvider roots. Inline composition retains width. Text inside
  controls and Snippets and author-supplied whitespace are preserved.

- Button avoids text nodes before the native button or anchor with
  default and local prefixes. The markup preserves inline action and
  Tour panel widths.

- Input and TextArea prefix styles avoid whitespace text nodes around the
  native control. Input in rich help has empty `textContent` again. SSR
  preserves this with canonical and custom prefixes.

- Editable and custom Tabs scroll the whole selected cell into view,
  including remove. Seeing the inner text alone does not put an active
  tab in More.

- Dropdown retains uncontrolled visibility and focus on spread prop
  updates. `defaultOpen` remains initial-only. Removing external `open`
  retains the fallback, binding, and callbacks.

- Select and Cascader overflow measure their own tags, summary, and
  input. An input inside `maxTagPlaceholder` leaves selected tags visible
  when they fit.

- Standalone Layout sections receive fallback variables and border-box
  before hydration, including legacy light, dark, and compact. Inside
  Layout, inherited variables and owner overrides remain. Local styles
  apply last.

- Sider restores focus with updated props and when collapsing content
  to zero width. Focus lifecycle uses the actual DOM body and respects
  the owner's explicit control focus.

- Transfer passes model error `aria-invalid` and description to the root,
  including manual success, validating, and empty FormItem statuses.

- Form disabled state reaches controls without FormItem. Nested
  ConfigProvider and explicit control props retain upstream priority.
  Values, selection, and submit blocking remain.

- FormItem controls in label, extra, and tooltip are isolated from the
  primary field binding. Removed duplicate IDs and names, unnecessary
  required and error ARIA, and touched updates from helper blur.
  `getFieldInstance` returns the primary control. Form settings and
  explicit props remain.

- FormItem `resetFields` resets local extra state for the selected field,
  as for label and tooltip and in upstream. Neighbor slots, values,
  and focus remain.

- FormItem removes an extra error class from the help container, as
  upstream. Individual message classes, colors, and alert and status
  roles remain.

- Form skips transient validating state for fields without rules.
  A single-field query accounts for all bindings with the selected
  name, as upstream.
- FormList retains new control registrations and validation rules
  after full reset and focuses the first invalid field on submit.

- Form `isFieldTouched` includes touched descendants of a parent path
  and distinguishes literal and numeric or string paths. `[]` safely
  checks the model. The upstream crash is recorded in raw data.

- The Segmented thumb test under scale waits for the root CSS
  transform to finish before selecting again. It retains geometry
  comparison, thumb pause, and the 1px tolerance.

- Descriptions theme update tests wait for the field before reading
  initial colspan. Cell comparisons, DOM, focus and selection, and
  theme isolation remain.

- Affix tests wait for all scroll targets before scrolling in the
  configured-owner removal case. Prefix CSS cleanup and unfixing
  checks remain.

- Typography browser scenarios wait for lazy fixtures before checking
  autofocus. Focus, selection, async copy, and the shared time limit remain.

- The TimeRangePicker Now test resets the clock before `pauseAt` so fixture
  load does not put the target time in the past. Expected UTC values,
  precision, and callbacks remain.

- The Statistic browser timer and countdown test waits for both lazy fixture
  nodes before reading refs and text. Clock control and identity checks remain.

- Shared Input and Select browser integration uses its own route with
  BasicFixtures and shared controls. Keyboard, search, disabled behavior,
  numeric values, and FormData are checked without loading the full gallery.

- Affix fixtures wait for all scroll targets to mount before scrolling.
  ConfigProvider checks the existing Select, Modal, and shared controls
  on a separate route. Assertions and timeouts are preserved.

- TimePicker and TimeRangePicker confirm the first selected option when
  autoscroll moves the second click or double-click from the cell to
  the column. Empty space does not confirm the preceding selection.
  Separate range confirmations and callbacks without `onOk` remain.

- FloatButtonBackTop uses the upstream linear fade and preserves custom
  transform. Enter and leave are checked at an intermediate UMD frame.

- The Progress circle browser test freezes the clock for rapid and
  spaced updates. The 20ms and 150ms intervals are independent of DOM
  action time.

- DatePicker and RangePicker datetime restore panel, input, and locale
  format precedence, fallback columns for date-only format, and 12-hour
  inference. Added 40 raw UMD measurements and unit, SSR, browser,
  UTC, and precision checks. Upstream handling of literal `[Hours]`
  is recorded separately.

- List and Listy restore upstream link reset, colors, and decorations for
  normal, hover, active, and focus states. Meta colors, inline priority,
  native focus, navigation, and external link styling remain. CSS comes
  from the 6.6.8 pin.

- Portals preserve empty and guaranteed-invalid CSS variables, including
  cleared Tabs tokens. Vendor defaults stay cleared after moving.
  `var()` fallback differences are checked without CSS Typed OM as well.

- TimePicker and TimeRangePicker double-click confirms the first selected
  option even when autoscroll moves the column between clicks. Keyboard,
  callbacks, UTC and precision, and separate range confirmations remain.
  The upstream defect is recorded using real pointer events on the pinned UMD.

- Portals copy a single theme variable snapshot without recomputing popup
  styles on every write. Computed `var()` values, removal of stale variables,
  component overrides, DOM, focus, and selection remain, including TimePicker
  in ShadowRoot.

- Affix applies component `zIndexPopup` and alias and algorithm overrides
  to the fixed node. Theme changes retain geometry, placeholder, refs, and
  fields without extra `onChange` calls. Normal flow and legacy defaults remain.

- Watermark Canvas defaults and z-index use global upstream tokens.
  Seed, alias, and algorithm changes retain wrapper, mark, refs, and focus,
  including inherited Modal and Drawer. Explicit options and legacy CSS
  defaults remain. Tests compare real Canvas rendering, PNG, and scoped
  layer styles against the UMD.

- BorderBeam alias tokens and algorithms apply to decorative layers.
  External targets receive the owner's theme and CSS overrides. Updates
  retain layers, focus, selection, and the measured border. Added upstream,
  SSR, and browser checks for precedence, scopes, updates, and observer
  and listener cleanup.

- BorderBeam ports local `prefixCls`, including empty values, selectors
  and pseudo-elements, supports and media rules, and reduced motion.
  Prefix updates retain layers and focus. Dynamic stylesheets clear on
  reset and unmount.

- Masonry uses alias tokens and algorithms and global
  `theme.token.motion`. Fresh measurements retain DOM, drafts, selection,
  and focus. Disabling motion completes the current transition. Removal
  proceeds when no real animation exists. The missing upstream CSS marker
  and stuck zero-duration leave are recorded separately. Upstream CSS
  and geometry are compared through public `rootClassName` without
  modifying the source.

- Layout and Sider receive 16 current component tokens and three deprecated
  aliases, with variable inheritance for sections and retained style
  precedence. Added upstream, SSR, and browser checks for scopes, geometry,
  collapse, focus, and refs. Standalone sections get variables. Their
  upstream omission is recorded separately.

- Image connects six component tokens to its thumbnail and shared
  ImagePreviewGroup viewer. `preview.zIndex` and wrapperStyle precedence,
  native dialog stack, transforms, current frame, focus, and refs remain.
  Added Ant Design 6.6.8 comparison, SSR, and browser tests. Duration is
  checked as a variable, and a progress API remains pending.

- The registry records `integration:result` for the existing consumer
  check, aligning the manifest with package metadata.

- QRCode alias tokens and algorithms use the shared theme. Canvas and
  SVG use global `colorText` with upstream fallback and `color` precedence.
  The background cover uses absolute alpha 0.96, including with translucent
  `colorBgContainer`. Added upstream, SSR, and browser checks for geometry,
  color, scopes, and reactive redraws.

- Rate connects six component tokens and upstream focus width calculation.
  Added Ant Design 6.6.8, SSR, and browser checks for sizing, colors,
  algorithms, scopes, styles, rating, and focus retention. Nonprimitive
  `starHoverScale` retains native `scale(1.1)`. The lost upstream CSS
  variable is recorded separately.

- Splitter connects three current tokens and deprecated `resizeSpinnerSize`.
  In token themes the bar inherits configured aliases. Native hover fallback
  remains. Added Ant Design 6.6.8, SSR, and browser checks for geometry,
  provider scopes, precedence, and lazy preview changes during drag.

- Segmented removes extra text whitespace between icon and label. An
  empty string omits the empty padded span, and numeric 0 remains.
  An icon-only control with an empty label uses title as its native accessible name.

- Segmented connects all eight component tokens, including `trackPadding`
  and selected, hover, and active colors. Native themes, radio selection
  and focus, semantic styles, and thumb cancellation on resize remain.
  Added Ant Design 6.6.8, SSR, and browser comparisons for CSS declarations,
  geometry, and states.

- Statistic applies `titleFontSize` and `contentFontSize` through the
  shared component theme in both Timer modes. Native compact and semantic
  styles, nested providers, Snippets, and intervals survive token changes.
  Added CSS and style comparisons with Ant Design 6.6.8, SSR, and browser.

- Descriptions connects all ten component tokens to the shared theme.
  Bordered and size precedence, responsive columns and spans, semantic and
  item styles, and focus survive live updates. Added Ant Design 6.6.8
  comparisons for horizontal and vertical layouts, sizes, RTL, algorithms,
  nested providers, and SSR.

- Carousel applies component tokens to its wrapper through the shared
  theme. Seven current tokens, deprecated `dotWidthActive` and its
  precedence, vertical geometry, RTL, nested and reset providers, and
  inner slider style remain. Added Ant Design 6.6.8, SSR, and browser
  comparisons for CSS declarations and geometry.

- Card connects all 13 component tokens to root CSS. Body and header
  padding, header height and background, and actions background use
  `ConfigProvider.theme.components.Card`. Aliases, component algorithms,
  nested scopes, and reactive updates are matched against UMD 6.6.8.
  Semantic and user style precedence, Grid and Meta, loading, tabs,
  and focus remain.

- Menu restores scoped link reset in standard and cssVar themes,
  including inline and popup submenus. Custom decoration tokens, inline
  styles, item colors, href, selection, and keyboard remain. Added a
  CSS recipe and 39 UMD cases.

- Typography geometry tests compare actions with an isolated DOM and CSS
  snapshot of Ant Design 6.6.8. Chromium and Headless Shell font metric
  differences no longer cause a false failure. Precision and exact
  two-line text bounds are retained.

- Pagination active, hover, and disabled colors apply to native buttons
  without cssVar as well. Custom CSS variable colors and inline
  itemRender, sizes, binding, keyboard, and callbacks remain.

- Anchor and Breadcrumb restore scoped link reset in the standard theme
  without cssVar. Normal, hover, active, and focus use upstream link
  decoration tokens. Inline overrides, focus outline, navigation, and
  external links remain. Added Ant Design 6.6.8 comparisons for both
  theme modes, items and legacy inputs, and custom links.

- `theme.components.Slider` applies all 18 upstream tokens to single and
  range modes in both orientations. `railSize` changes track thickness,
  and native input focus styles the visible handle. Native-only themes,
  hit targets, and user style precedence remain. Added 14 UMD themes
  and SSR, live update, provider isolation, theme removal, keyboard,
  and cleanup checks.
- Tooltip, Popover, and Typography with `trigger=[]` and no component
  configuration keep programmatically opened panels visible on hover
  leave and blur. Native defaults, geometry, Escape and outside click,
  and callbacks remain. Added 10 UMD sequences and browser regressions,
  including Popconfirm and AvatarGroup.
- Mentions container getters declaring a parameter wait for the DOM
  prefix as in rc-trigger. Preliminary undefined applies only to
  zero-argument functions. Added UMD regressions for regular and custom popups.
- Dropdown pointer leave keeps an externally opened menu visible when
  trigger omits hover. Click and manual control retain their event mode.
- Menu submenu `theme` affects only its popup. Nested default submenus
  again use root Menu's theme. CSS `@scope` limits light and dark rules
  within native popovers while preserving DOM, keyboard, and focus.
  Base styles remain a fallback without `@scope`.
- Cascader search with a selected path preserves field height and text
  color. Typing again keeps selection.
- AutoComplete `onOpenChange` reports local popup opening and closing
  and requests with controlled `open=false`. Comparison uses the state
  before the update.
- Anchor's CSS recipe normalizes the scope of spacing variables.
  Horizontal, vertical, and nested spacing is restored. The first
  horizontal link retains zero padding-inline. RTL and indicator work.
- Breadcrumb's Dropdown wrapper aligns to the baseline of neighboring
  items while keeping fonts. Tests cover links, native buttons,
  itemRender, wrapping, RTL, and native and upstream themes.
  Focus restoration with custom itemRender adds no Tab stop, and
  standalone Dropdown alignment remains.
- CalendarHeader fits both Selects and the mode switch in 300px and
  360px desktop mini calendars. On mobile, year and month are side by
  side above the switch. Only local header wrappers change. Select
  and RadioGroup, keyboard, dropdown, full and mini, month and year,
  themes, and RTL remain.
- Native compact aligns fontSize, lineHeight, fontHeight, and controlHeight
  with compactAlgorithm, and applies Button, Input, TextArea, and
  InputNumber font and padding metrics without upstream colors.
  Medium controls are 28px and large are 35px. Small Input, Select, and
  InputNumber keep the 22px minimum, and small Button is 21px.
  Native colors, nested providers, overrides, SSR, and focus remain.
- TimePicker in RTL retains upstream time column order and RTL
  direction inside columns through the PickerPanel marker.
- TreeSelect skips a removed active node on Enter and clears stale ARIA
  after data updates. Controlled search restores `searchValue` after
  an owner's rejection. Tags for removed nodes can still be removed.
- Steps navigation arrows inherit the active light or dark theme's
  disabled color. A direct CSS variable override remains.

- Compact spacing uses the pinned Ant Design size map for padding, margin,
  and content aliases. Nested `compact=false` restores normal spacing,
  and inline overrides remain.
- The Layout example automatically hides the sidebar below md and
  keeps the external toggle available in a narrow viewport.
- StatisticTimer preserves the upstream distinction between formatting
  an omitted value as 0 and passing the absent target to callbacks.
- Divider retains default spacing without explicit size or componentSize
  and inherits explicit size through nested ConfigProviders. The Flex
  reference clarifies preset and custom gap precedence, and the gallery
  count is updated to 39 components.
- Production pages use a local SVG favicon, avoiding the missing
  `/favicon.ico` request on gallery load.

### Added

- ImagePreviewGroup supports registration and items, controlled current
  and open, upstream callbacks, previous and next and keyboard navigation,
  counts, and shared preview. Image order and upstream transform lifecycle
  remain. Added unit, SSR, and browser checks, gallery, and fixture.

- Image supports native thumbnail, fallback, and placeholder, controlled
  preview, upstream zoom, rotate, flip, wheel, drag, and touch, mask, focus,
  scroll, and Snippet render hooks. Added a CSS recipe, official icons,
  Russian and English labels, gallery, fixture, and unit, SSR, and browser
  checks. Expanded semantic and configuration APIs and motion are tracked
  separately.

- Mentions supports prefix and split, search and upstream insertion at
  the caret, rich options and loading, callbacks, getMentions, autoSize
  and resize, native popup, forms, and themes. Added a CSS recipe, gallery,
  fixture, and unit, SSR, and browser checks. Shared popup supports the
  upstream gap for text suggestions and keeps other component defaults.

- AutoComplete supports free text and options or groups, controlled and
  default value and open, upstream change, search, and select, keyboard
  and backfill, a custom input or textarea Snippet, and native popup.
  Added gallery, fixture, unit, SSR, and browser checks and registry
  coverage. Select public modes remain.

- Menu supports items, groups, dividers, and submenus, controlled and
  default selected and open keys, single and multiple selection and
  upstream callbacks, horizontal, vertical, and inline modes, native
  links, keyboard, Sider collapse, themes, RTL, Compact, and native
  popups. Added a CSS recipe, gallery, fixture, and unit, SSR, and
  browser checks. Horizontal overflow, upstream motion, and advanced
  APIs are tracked for later work at this stage.

- TreeSelect supports single and multiple, labelInValue, upstream check
  strategies and propagation, search retaining ancestors, loadData and
  expanded and loaded keys, and native popup. Added Form with raw
  values, themes, RTL, Compact, gallery, fixture, and unit, SSR, and
  browser checks. Advanced APIs and virtualization are tracked separately.

- Tree supports treeData, controlled and default expansion and selection,
  checkable and checkStrictly with upstream propagation, async loadData
  and loadedKeys, retry, keyboard, and ARIA. Added showLine, icons and
  title Snippets, themes, RTL, Form disabled state, gallery, an isolated
  fixture, and unit, SSR, and browser checks.

- Upload and UploadDragger support controlled and default lists,
  beforeUpload and LIST_IGNORE, manual upload, multipart XHR and
  customRequest, drop and accept, statuses, preview, and removal with
  veto and abort. Ported upstream CSS, icons, and thumbnails. Added
  gallery, isolated fixture, and unit, SSR, and browser checks.

- Date and datetime RangePicker supports a Day.js pair, linked calendars,
  upstream confirmation and focus transitions, constraints and from,
  allowEmpty, presets and hover, and Form. Added gallery, separate
  fixture, and unit, SSR, and Chromium checks including UTC in
  different browser timezones.

- Single DatePicker for date and showTime supports `Dayjs | null`,
  strict input, calendar, time, confirmation, constraints, callbacks,
  and locales. Ported the date adapter and upstream time step alignment.
  Added a Day.js peer dependency, CSS recipe, gallery, and SSR, keyboard,
  and UTC checks across browser timezones. Advanced API is a separate stage.

- Select supports controlled remote search, filter bypass or predicate,
  loading, empty, and error content, and popup scroll callback. Selected
  label and disabled state persist on result changes. Added an example
  with debounce, abort, stale result guards, pagination, and retry, a
  dedicated fixture, and unit, SSR, and Chromium tests.

- TextArea supports native multiline input, bindings, constraints,
  selection ref, IME-aware Enter, FormItem, status, RTL, and sizes.
  Added an isolated fixture, gallery, and SSR and browser tests.
  Porting priorities were recorded.

- FloatButton, Group, and BackTop support native actions, Badge and
  Tooltip, click, hover, and controlled menus, physical placement,
  scroll targets, and progress. Added a CSS recipe, unit, SSR, and
  Chromium checks, an isolated fixture, and gallery example. Button
  semantic callbacks can return undefined as upstream.

- Button and Group support color, variant, ghost, href, semantic slots,
  icon placement, delayed loading and custom icon, native refs, and
  Button config. Forms, Compact, and native disabled loading remain.
  Added unit, SSR, and Chromium tests, a dedicated fixture, and gallery.

- Timeline supports items, mode and placement, pending, loading, reverse,
  colors, titleSpan, horizontal layout, and semantic styles on shared
  Steps. Passive ol and li, SSR, native content, and keyed focus remain.
  Added a CSS recipe, tests, and gallery.

- Steps supports dot, inline, navigation, and panel, outlined styling,
  initial, maxCount, percent, ellipsis, semantic slots, item callbacks,
  iconRender, and legacy aliases. Base APIs, native buttons, and focus
  remain. Tooltip supports a Snippet title for rich inline content, and
  the recipe reproduces all Steps CSS.

- Anchor and AnchorLink support nested items, horizontal mode, Affix,
  scroll tracking, offsets, highlight mapping, push and replace history,
  and cancellable cubic animation. Added semantic styles, CSS recipe,
  unit, SSR, and Chromium tests, a dedicated fixture, and gallery.

- Affix supports top and bottom, window and custom targets, onChange,
  updatePosition and cancel, ResizeObserver, and cleanup. SSR, native
  content, and upstream geometry remain. Added a CSS recipe, unit,
  SSR, and Chromium tests, dedicated fixture, and gallery.

- Space, Compact, and Addon support keyed Snippet items, orientation,
  align and wrap, gaps, separator and split, compact joins and control
  sizing, nesting, Addon variants and status, and popup context isolation.
  Added CSS recipes and DOM, focus, RTL, and production gallery checks.
- Breadcrumb supports items and legacy routes, path and params, separators,
  itemRender Snippets, semantic styles, themes, RTL, and menus. Dropdown
  supports native href, target, and rel items with Enter, Space, disabled
  behavior, and navigation cancellation. Added CSS recipe and tests.
- Card, Grid, and Meta support slots, variants, loading with focus
  retention, automatic Grid detection, tabs, and semantic styles. Tabs
  adds left and right extra content and numeric labels. Added a CSS
  recipe, unit, SSR, and Chromium checks, and gallery.
- Descriptions supports items and Snippets, responsive column, span,
  and filled, both table orientations, bordered style, semantic styles
  with upstream precedence, themes, and RTL. Added a CSS recipe, unit,
  SSR, and Chromium checks, dedicated fixture, and gallery.
- Layout, Header, Content, Footer, and Sider use native sections, nested
  contexts, hasSider and SSR CSS fallback, collapsed and zero-width
  states, an accessible trigger, and responsive callbacks with cleanup.
  Added theme and locale, a CSS recipe, unit, SSR, and Chromium checks,
  and gallery.
- Grid Row and Col support 24 columns, xs through xxxl responsive props,
  CSS and numeric gutters, align and justify, flex, and nested contexts.
  Added createBreakpoint with cleanup, a reproducible CSS recipe, unit,
  SSR, and Chromium tests, a dedicated fixture, and gallery.

- Segmented supports typed options and value, defaultValue and onChange,
  native radio, keyboard, sizes, block and round, semantic slots, themes,
  and RTL. Added a Web Animations API thumb with cancellation, resize,
  and reduced motion, and option.tooltip using existing Tooltip,
  including disabled options and block and scale geometry. Added a CSS
  recipe, unit, SSR, and Chromium checks, a dedicated fixture, and gallery.
- StatisticTimer supports countup and countdown, duration format,
  onChange and onFinish, a stable SSR placeholder, cleanup, and stale
  callback protection. Added unit, SSR, and Chromium checks, a dedicated
  fixture, and a gallery timer. The registry records core Statistic coverage.
- Statistic supports string-based numeric formatting with precision
  without rounding, separators and formatter, title, prefix, and suffix
  Snippets, valueRender, semantic slots, and Skeleton loading. Added
  a CSS recipe, unit, SSR, and Chromium checks, an isolated fixture,
  and gallery example. Timer is pending at this stage.
- Flex supports directions, align and justify, wrap, preset, numeric,
  and CSS gaps, and flex shorthand with direct children. Added native
  `component` and `bind:nativeElement`, a CSS recipe, SSR and Chromium
  checks, an isolated fixture, and gallery.
- Divider supports horizontal and vertical modes, string, number, or
  Snippet labels, titlePlacement, RTL, sizes, plain, dashed and dotted,
  and compatibility aliases. Added semantic slots, bind:nativeElement,
  a reproducible CSS recipe, SSR and Chromium tests, an isolated fixture,
  and gallery example.
- Ant Design porting tools include a versioned registry of 73 families,
  a coverage summary, link and export checks, and pilot audits for
  Avatar, Select, and DatePicker. Avatar, AvatarGroup, and Badge CSS
  extraction uses the pinned npm bundle with SHA-256 verification
  and explicit preview, check, and write. Added 37 isolated fixture
  routes while keeping the shared page, and unit and Chromium checks
  for tooling and isolation.
- AvatarGroup supports typed keyed items, shared size and shape, overlap,
  max.count, and a native +N button with a lazy Popover list. Added locale,
  themes, compact mode, RTL, focus recovery, unit, SSR, and Chromium tests,
  and gallery additions, removals, and reordering. Avatar retains image
  failure when reordered with the same src and srcSet. Popover ignores
  blur after destruction.
- Avatar supports src and srcSet images, icon and children fallback,
  onError, circle and square, context or numeric size, gap, and automatic
  text fitting. Added Ant Design 6.6.8 styles, a stable accessible name,
  themes, compact mode, RTL, ResizeObserver and listener cleanup,
  unit, SSR, and Chromium checks, and a member gallery with Badge,
  image and initials choice, and profile saving in Drawer.
- Badge supports numeric count, overflow, showZero, dot, five statuses,
  13 preset colors, string and Snippet text, medium and small, offset,
  and a complete accessible value. Added Ant Design 6.6.8 styles,
  locale, themes, compact mode, RTL, reduced motion, unit, SSR, and
  Chromium tests, and a notification gallery with Drawer. Count derives
  from messages. Reading preserves records, focus, and the opener.
- Tag and CheckableTag support preset and status colors, filled,
  outlined, and solid, Snippets, cancellable onClose, disabled state,
  native buttons, and focus recovery. Added Ant Design 6.6.8 CSS,
  themes, compact mode, RTL, reduced motion, SSR, and Chromium checks.
  The gallery shows protected tags, adding, removing, and recreating them,
  and filtering a separate Table through controlled checked state.
- Steps supports controlled current and onChange, stable items, four
  statuses, title, subTitle, content, and icon Snippets, horizontal and
  vertical, and medium and small. Added Ant Design 6.6.8 styles, locale,
  themes, compact mode, RTL, reduced motion, responsive behavior, native
  keyboard, and focus recovery. The gallery runs Form through validation
  and submit to Result, keeping fields and retry and canceling pending
  work on reset or unmount. Added unit, SSR, and Chromium tests.
- Result supports seven statuses, official icons and 403, 404, and 500
  illustrations, string and Snippet title and subTitle, extra and
  children, and a semantic heading. Added Ant Design 6.6.8 styles,
  themes, compact mode, RTL, shared Empty focus recovery, SSR, and
  Chromium tests. The gallery runs Form through success or error to
  editing and retry without losing data and cancels late completion
  on reset or unmount. Routes and HTTP statuses remain.
- Empty supports default and simple SVG, image and description Snippets,
  hidden parts, actions, and focus recovery on removal. Added Ant
  Design 6.6.8 styles, locale, themes, compact mode, RTL, SSR, and a
  gallery for creating a first record, empty search, and filter reset.
  Table uses simple Empty while retaining colspan, translations, empty
  Snippet precedence, and loading. Added SSR and Chromium checks.
- Skeleton supports loading, active, round, avatar, title and paragraph
  settings, widths and row count, replacement of children, accessible
  status, and temporary focus. Added Ant Design 6.6.8 styles, themes,
  compact mode, RTL, reduced motion, SSR, a gallery for first load
  and Spin refresh preserving drafts, error and retry, cancellation
  and reset, and unit, SSR, and Chromium tests.
- Spin supports standalone and retained children, spinning and delay,
  three sizes, description and indicator Snippets, immediate inert and
  aria-busy, and focus recovery. Added Ant Design 6.6.8 styles, locale,
  themes, RTL, reduced motion, Table integration, a gallery with
  cancellation, errors and retry, and unit, SSR, and Chromium tests.
- Progress supports line and circle, percent normalization, explicit
  and automatic statuses, sizes, colors, labels and format, accessible
  values, and locale. Added Ant Design 6.6.8 styles, SVG arc, themes,
  RTL, reduced motion, gallery, and unit, SSR, and Chromium checks.
  The Notification export example shows progress stages, cancellation,
  and retry. A separate model cancels timers and guards late results.
- Notification adds createNotification and NotificationHolder, four
  statuses, title, description, and actions Snippets, six placements,
  keys and updates, duration, hover and focus pausing, maxCount, and
  dismissal. Added keyboard access, focus recovery, SSR, ConfigProvider,
  Modal and Drawer, themes, RTL, reduced motion, a CSV export and retry
  example, and unit, SSR, and Chromium tests. Message and Notification
  share internal queue and DOM visibility logic.
- Message adds createMessage and MessageHolder, five types, strings
  and Snippets, keys and updates, duration and hover pause and
  maxCount, destroy, and callable and thenable handles. Added SSR
  isolation and ConfigProvider context, native popover inside Modal and
  Drawer, themes, RTL, reduced motion, an example going from loading
  to success or error, and unit, SSR, and Chromium tests.
- Alert supports success, info, warning, and error, title, description,
  icon, and action Snippets, outlined and filled, banner, closable
  callbacks, animation, and reduced motion. Added Ant Design filled
  icons under MIT, accessible announcements, focus transfer, themes,
  RTL, mobile actions, an example, and SSR and Chromium checks.
  Remote Table load failures use Alert with the existing retry and query.
- Drawer uses a native modal dialog with bind:open, callbacks, four
  placements and sizes, title, extra, and footer Snippets, animation,
  and reduced motion. Added lazy and retained content, forceRender
  and destroyOnHidden, keyboard and focus restoration, Ant Design
  6.6.8 styles, themes, RTL, Modal, a Table row editor with Form,
  Tabs, and Collapse, and unit, SSR, and Chromium tests.
- Collapse supports typed items and Snippets, extra, bind:activeKey,
  defaults and callbacks, independent and accordion panels, header,
  icon and disabled options, and sizes. Added lazy retained panels,
  forceRender and destroyOnHidden, native headings with keyboard and
  focus recovery, Ant Design 6.6.8 styles, themes, RTL, nesting,
  Modal, a questionnaire example, and unit, SSR, and Chromium tests.
- Tabs supports typed items and Snippets, bind:activeKey, defaults
  and callbacks, manual keyboard activation, line and card,
  four placements, and sizes. Added lazy retained panels, forceRender
  and destroyOnHidden, focus recovery, Ant Design 6.6.8 styles, themes,
  RTL, scrolling, Modal, a profile example, and unit, SSR, and Chromium tests.
- Dropdown supports typed flat menu.items with icons, disabled and
  danger state, and dividers, bind:open, click and hover, keyboard and
  typeahead, Tab and Escape, and focus restoration. Added Ant Design
  6.6.8 styles, six placements, flipping, themes, RTL, Modal, a Table
  row actions example, and unit, SSR, and Chromium tests.
- Popconfirm supports title, description, and icon Snippets, confirm
  and cancel, bind:open, disabled state, button settings, Promise and
  loading, errors and retry, and duplicate and stale-result safeguards.
  Added Ant Design 6.6.8 styles, locale, themes, RTL, Modal and Tooltip,
  a Table row removal example, and unit, SSR, and Chromium tests.
- Popover supports strings and Svelte Snippets, bind:open, defaults,
  click, hover, and focus, interactive fields and buttons, native Tab,
  Escape, and focus restoration. Added Ant Design 6.6.8 styles, four
  placements, overflow flipping, Tooltip and Modal, themes, RTL,
  a gallery profile editor, and SSR and Chromium checks.
- Tooltip supports text and numeric zero, bind:open, defaults, hover and
  focus, delays, Escape, four placements, arrow, automatic flipping,
  aria-describedby, and native popover in Modal. Added formatted
  Slider tooltips, Ant Design 6.6.8 styles, themes, RTL, gallery,
  and unit, SSR, and Chromium tests.
- Single-handle Slider supports bind:value, min, max, and step, mouse,
  touch, keyboard, onChangeComplete, orientation, reverse and RTL,
  disabled, FormItem, FormData, and reset. Added Ant Design 6.6.8
  styles, themes, cancellation of active interactions, an InputNumber
  example, and unit, SSR, and Chromium checks.
- InputNumber supports bind:value with number and null, defaultValue,
  numeric drafts, min and max, fractional step, precision, buttons,
  keyboard, disabled and readonly, FormItem, FormData, and reset.
  Added Ant Design 6.6.8 styles, themes, RTL, locale, a price calculation
  example, and unit, SSR, and Chromium tests.
- Switch supports bind:checked, defaults, loading, disabled, two sizes,
  state Snippets, keyboard, FormData, and FormItem. Added Ant Design 6.6.8
  styles, themes, RTL, reduced motion, an async save example with rollback,
  duplicate request and late response guards, and unit, SSR, and Chromium tests.
- Radio and RadioGroup support typed single selection, native arrow keys
  and Space, neighboring Radio synchronization, independent group names,
  required, and cancellable reset. Added official Ant Design 6.6.8
  styles, FormItem, orientation, themes, RTL, examples using 0 and false,
  and unit, SSR, and Chromium checks.
- CheckboxGroup supports typed string, numeric, and boolean arrays,
  options, disabled, native checkboxes and FormData, cancellable reset,
  and FormItem. The permissions gallery uses count validation and select
  all. Added unit, SSR, and Chromium checks including RTL and mobile.
- Multiple Select supports `mode="multiple"`, typed arrays, search,
  removal, keyboard, repeated FormData entries, native reset, required,
  themes, and RTL. Form supports flat arrays, count constraints, and
  independent copies of defaults and snapshots. Added examples and
  unit, SSR, and Chromium checks.
- Expandable Table rows support typed expandedRowRender, rowExpandable,
  bind:expandedRowKeys, defaults, and distinct callbacks. Keys persist
  across pages. Added accessible buttons, fixed expand column, RTL,
  SSR, and examples with keyboard, row selection, server mode, and
  mobile scrolling checks.
- Table fixed header and columns support scroll.y, column.fixed start
  and end, rowSelection.fixed, width measurement, RTL, opaque
  backgrounds, and keyboard scrolling. Narrow layouts disable column
  fixing when columns no longer fit. Added examples and unit, SSR,
  and Chromium checks.
- Table server mode supports external total, remote sorting and filters
  without reprocessing the page, and retained selected keys. Added
  a loading model with cancellation, stale response guards, errors
  and retry, and page correction when total falls, a gallery demo API,
  and unit, SSR, and Chromium tests.
- Table column filters support single and multiple selection,
  bind:filters and defaultFilters, apply and reset, and filter,
  sort, then paginate order. They retain hidden selection, localization,
  RTL, keyboard, and native popover.
- Table v1 for Svelte 5 supports typed columns and Snippets, stable
  sorting, local pagination, row selection by key, loading, and empty
  data. Added Ant Design 6.6.8 styles, themes, RTL, keyboard scrolling,
  examples, and unit, SSR, and Chromium checks.
- Checkbox and Pagination for Svelte 5 support mixed state, boolean
  Form fields, native reset and FormData, page navigation, size
  selection, ranges, locale, and RTL. Added official 6.6.8 styles,
  examples, and unit, SSR, and Chromium tests.
- Added a separate Playwright Chromium suite with `npm run test:e2e`,
  an isolated component test app, production gallery checks, reporting,
  and diagnostics.
- Added the first Ant Design 6.6.8 components on Svelte 5 and TypeScript,
  including ConfigProvider, Button, Input, Select, Modal, Form, and FormItem.
  Added a source package and examples at `/ant-design`.
- Added switchable themes, typed form validation with stale-result
  safeguards, and component unit and SSR checks.
- Added a minimal SvelteKit, Svelte 5, and TypeScript scaffold with a
  starter page.
- Added Oxlint, Svelte and TypeScript checks, Vitest, and architectural
  dependency checks.
- Added production builds with adapter-node and documentation for
  running with systemd.

### Fixed

- Select opens when the arrow or control padding is clicked.
- FormItem applies the form's vertical or horizontal layout and positions
  field labels correctly.
