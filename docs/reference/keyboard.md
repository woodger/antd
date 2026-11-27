# Keyboard and focus

## Form controls and value selection

Checkbox uses a native input. Clicking its label or pressing Space toggles it.
The mixed state is exposed through `aria-checked="mixed"`. FormItem passes id,
name, required, errors, and description to the input itself.

CheckboxGroup groups native inputs in a named fieldset. FormItem passes the group
name, description, and errors. An array rule checks the required state.

RadioGroup uses native input[type=radio], a named radiogroup, arrow keys, and Space.
Tab follows the native order. FormItem directs focus to the selected enabled option
or the first enabled option.

Switch uses a native button with role=switch. Space and Enter toggle the state.
ArrowLeft and ArrowRight set it to false and true. The disabled and loading states
take the button out of the Tab order. Its name remains constant, and aria-checked
reports the checked state.

InputNumber uses an input with role=spinbutton. Arrow keys change the number and
Enter commits the draft. The increment and decrement buttons keep focus in the input.

Slider uses a native range input with arrow keys, Home and End, PageUp and PageDown,
a label, and visible focus on the thumb. The track adds no separate Tab stop.

Select exposes a combobox and listbox. Arrow keys move the active option and skip
disabled options. Home and End go to the first and last option in the open list,
Enter confirms, Escape closes, and Tab continues normal navigation. Single mode
without search supports typing and clearing with Backspace and Delete. In multiple
mode, Backspace removes the last available item when the search is empty. Text
editing and IME keep their normal behavior.

The list has aria-multiselectable. Remove buttons are reachable by Tab and
activate with Enter. Give the field a label using a matching id, FormItem, or
aria-label. Clicking the field, arrow, or padding opens the list. See how to
set its position and container. [Popup container](popup-settings.md#container)

## Menus, tabs, and navigation

Dropdown uses role=menu and native button or a elements with role=menuitem, one
active tabindex, and separators. Arrow keys and typeahead move through available
actions. Escape closes the menu before a containing Modal, and Tab follows
natural navigation.

Menu uses ul and li with role=menu and role=menuitem, native buttons for headers,
and real links in labels. Arrow keys, Home, and End move through available items
according to the mode. Enter opens a submenu. Escape restores focus to the
popup's parent item.

Tabs uses a tablist, native buttons with role=tab, and associated tabpanels.
Aria-selected reports selection. Arrow keys move focus without activating a tab.
Tab skips hidden panels. More uses a listbox with native options and close
buttons. Escape closes its popup before the containing Modal. Focus in a portal
is taken into account when hiding the outer panel.

Collapse places native buttons inside headings and uses aria-expanded,
aria-controls, and the normal Tab order. Extra stays outside the header button.
Tab skips hidden content. Named regions are limited to small groups and
accordions. Focus is restored when a focused panel is hidden or removed.

Steps uses a named ordered list and native selection buttons. Aria-current marks
the current step, and the button description reports status and content. Focus
is kept when steps reorder and restored when a step is removed or disabled.
The process owner handles transitions and panel focus. Steps has no live region.

Pagination uses nav with a list of native buttons and `aria-current="page"`.
Tab moves focus, and Enter and Space select a page. Unavailable transitions
are skipped. If a focused navigation button disappears, focus returns to the
current page. Set the navigation name with `aria-label`.

## Dialogs and popups

Tooltip uses role=tooltip and aria-describedby on the main child control.
Focus stays on the current control, including when Escape dismisses the tooltip.

Popover provides a named non-modal dialog with accessible buttons and fields.
Aria-controls and aria-expanded connect the trigger to the dialog. Escape restores
focus from the content, and Tab continues natural navigation.

Popconfirm uses the same dialog with a confirmation name and description.
Its buttons leave the surrounding form alone. While a promise is pending,
aria-busy announces the wait. Popconfirm handles Escape before a containing
Modal and stays open during that wait.

Drawer uses a named modal dialog, a native close button, and natural Tab
navigation. The background is inert. Escape closes the top surface, and closing
returns focus to the opener. The dialog remains modal during its exit animation.

Modal calls `dialog.showModal()` after mount. The browser manages modality,
focus, and the inert state of the rest of the page. Escape, the backdrop,
and the close button call onCancel and reset bind:open. ConfirmLoading blocks
user-initiated closing. An onOk callback controls confirmation and closing when
provided. Otherwise, the confirmation button closes the dialog. SSR keeps the
dialog hidden until hydration. For asynchronous confirmation, the owner manages
confirmLoading, handles errors, and resets open on success.

## Messages and loading

Alert provides alert or status semantics, atomic announcements, and decorative
icons. A native button closes it, and the accessibility tree excludes the exiting
alert. Focus moves from a removed alert to an available adjacent control.

Message uses passive status or alert semantics and adds neither Tab stops nor
focus changes. Modal or Drawer owns closing the host dialog. Hidden contexts
pause the queue and its timers.

Notification supports interactive actions in the normal Tab order and a native
close button. Focus inside pauses the timer. When controls are removed, focus
is restored to an available adjacent control in the current context.

Progress provides a named progressbar with a value and localized status.
The existing Tab and focus order stays in effect. Progress adds no live
announcements of its own.

Spin announces a separate status and immediately blocks its children with inert
and aria-busy. Temporarily moving focus to the wrapper adds no Tab stop. Focus
restoration accounts for control replacement, unmounting, and the user's choice.

Skeleton replaces children with a decorative placeholder and announces a
separate status. Focus from removed content stays on the persistent group.
After loading, Tab enters the new controls. The new children receive no automatic focus.

Empty uses a decorative inert image and ordinary footer controls. It adds neither
a live region nor autofocus. Removing focused actions restores available focus
and preserves the owner's choice.

Result provides a native heading at the selected level, a decorative icon,
and ordinary action and detail controls. The outcome is available without an
automatic announcement. Focus restoration after action removal uses the same
mechanism as Empty.

## Tables, tags, and avatars

Table preserves native table, thead, tbody, th, and td elements and
`scope="col"`. Use a caption or aria-label to name it. Sortable headers contain
native buttons. Enter and Space change the order, and `aria-sort` reports the
active direction. Tab reaches the scroll container, and arrow keys scroll it.

Tag uses ordinary text and a native close button with a description. OnClose
can cancel the action. Removing the tag preserves available focus. CheckableTag
is a controlled toggle button with aria-pressed and native keyboard behavior.
Both hide decorative icons and add no live region of their own.

Badge preserves interactive children when the indicator changes or hides.
The full value is available as ordinary text. DescriptionId associates it with
the owning control. Badge adds neither automatic announcements nor extra
Tab stops.

Avatar preserves the full name in its fallback and while fitting text. A string
src and unnamed icon or children are decorative. Icon and children are inert.
An src snippet retains its own controls. The named root is a group, and explicit
aria-hidden makes it inert.

AvatarGroup reveals hidden members in a named Popover through a native button.
Removing the overflow control or group preserves available focus and the owner's choice.
