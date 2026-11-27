# Component catalog

Choose a component for your task. Each reference covers configuration, examples,
and limitations. Import components and their types from `@woodger/antd`.

## Component references

### Application configuration

- Theme, language, text direction, and component size. [ConfigProvider](../themes.md) · [CSS class prefixes](../config-provider.md)
- Messages, notifications, and dialogs through `App.useApp()`. [App](app.md)

### Actions and navigation

- Action button or link. Set `htmlType="submit"` to submit a form. [Button](button.md)
- Floating actions and back-to-top navigation. [FloatButton, FloatButtonGroup, and FloatButtonBackTop](float-button.md)
- Navigation menus and dropdown actions. [Menu](menu.md) · [Dropdown](dropdown.md)
- Navigation within a page and through a page hierarchy. [Anchor](anchor.md) · [Breadcrumb](breadcrumb.md)
- Switch tabs or navigate through steps. [Tabs](tabs.md) · [Steps](steps.md)
- Navigate pages and choose a page size. [Pagination](pagination.md)
- Step-by-step guidance attached to UI elements. [Tour](tour.md)

### Forms and input

- Form models, field labels, validation rules, and submission. FormList manages
  arrays of fields, and FormErrorList displays their errors. [Form and FormItem](../forms.md) ·
  [FormList](../forms.md#formlist) · [FormErrorList](../forms.md#formerrorlist)
- Single-line and multiline text input. [Input](input.md) · [TextArea](text-area.md)
- Password entry, search queries, and one-time codes. [InputPassword](input-password.md) ·
  [InputSearch](input-search.md) · [InputOTP](input-otp.md)
- Enter a number or choose a value or range on a scale. [InputNumber](input-number.md) · [Slider](slider.md)
- Select one or more values, search, and create tags. AutoComplete suggests options for
  free text. [Select](select.md) · [AutoComplete](auto-complete.md)
- Show suggestions after a prefix such as `@`. [Mentions](mentions.md)
- A single checkbox or a group for selecting several options. [Checkbox](checkbox.md) ·
  [CheckboxGroup](checkbox-group.md)
- Select one of several options. [Radio, RadioButton, and RadioGroup](radio.md) · [Segmented](segmented.md)
- Toggle between two states. [Switch](switch.md)
- Select a date or a date range. [DatePicker](date-picker.md) · [RangePicker](range-picker.md)
- Select a time or a time range. [TimePicker](time-picker.md) · [TimeRangePicker](time-range-picker.md)
- Select a path across levels or choose options from a tree. [Cascader and CascaderPanel](cascader.md) · [TreeSelect](tree-select.md)
- Move selected items between two lists. [Transfer](transfer.md)
- Choose a color, set a rating, or upload files. [ColorPicker](color-picker.md) ·
  [Rate](rate.md) · [Upload and UploadDragger](upload.md)

### Layout

- Header, main content, footer, and sidebar. [Layout](layout.md)
- Responsive grids, alignment along an axis, spacing, and control grouping.
  [Row and Col](grid.md) · [Flex](flex.md) · [Space, SpaceCompact, and SpaceAddon](space.md)
- Columns for items of different heights. [Masonry](masonry.md)
- Panels with adjustable width or height. [Splitter](splitter.md)
- Labeled separators and elements that stay fixed while scrolling. [Divider](divider.md) · [Affix](affix.md)

### Data display

- Rows and columns with sorting, filtering, and pagination. Descriptions displays
  label and value pairs. [Table](table.md) · [Descriptions](descriptions.md)
- Data trees, directory navigation, and a virtualized grouped list.
  [Tree and DirectoryTree](tree.md) · [Listy](listy.md)
- Cards, collapsible panels, and slides. [Card, CardGrid, and CardMeta](card.md) ·
  [Collapse](collapse.md) · [Carousel](carousel.md)
- Headings, paragraphs, links, and text actions. [Typography](typography.md)
- A calendar and a sequence of events. [Calendar](calendar.md) · [Timeline](timeline.md)
- Number formatting and timers. [Statistic and StatisticTimer](statistic.md)
- Tags and tag selection. [Tag, CheckableTag, and CheckableTagGroup](tag.md)
- Counts, statuses, and ribbons. [Badge](badge.md) · [BadgeRibbon](badge-ribbon.md)
- Images and initials for individual people or groups. [Avatar](avatar.md) · [AvatarGroup](avatar-group.md)
- Image previews and navigation between images. [Image](image.md) · [ImagePreviewGroup](image-preview-group.md)
- A QR code, watermark, and animated border. [QRCode](qr-code.md) · [Watermark](watermark.md) · [BorderBeam](border-beam.md)

### Feedback and overlays

- An inline alert, brief action feedback, and a notification. [Alert](alert.md) ·
  [MessageHolder and createMessage](message.md) · [NotificationHolder and createNotification](notification.md)
- A dialog and a sliding panel. [Modal](modal.md) · [Drawer](drawer.md)
- A tooltip, popup card, and action confirmation. [Tooltip](tooltip.md) · [Popover](popover.md) · [Popconfirm](popconfirm.md)
- A loading indicator, content placeholder, and progress indicator. [Spin](spin.md) · [Skeleton](skeleton.md) · [Progress](progress.md)
- An empty state and an operation outcome. [Empty](empty.md) · [Result](result.md)
