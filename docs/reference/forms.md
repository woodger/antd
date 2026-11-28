# Forms and validation

`createForm()` stores form values and errors. `Form` manages submission.
`FormItem` associates a field with its label and messages, and `FormList`
handles arrays of fields.

## Contents

- [Values and fields](#values-and-fields)
- [Control adapters](#control-adapters)
- [Conditional rendering](#conditional-rendering)
- [Watching values](#watching-values)
- [Validation](#validation)
- [Change events and FormProvider](#change-events-and-formprovider)
- [External field state](#external-field-state)
- [Submission](#submission)
- [Reset](#reset)
- [Field arrays with FormList](#formlist)
- [List messages with FormErrorList](#formerrorlist)
- [Advanced validation settings](#advanced-validation-settings)
- [Form state and methods](#form-state-and-methods)
- [Layout and accessibility](#layout-and-accessibility)

## Values and fields

### Values and paths

Create the model inside a component or presentation model to give each form and
SSR request its own state. The profile in these examples stores a name and city.

```ts
import { createForm } from '@woodger/antd';

const form = createForm({
  initialValues: { profile: { name: 'Anna', city: 'Tomsk' } }
});

form.setFieldValue(['profile', 'name'], 'Irina');
form.setFieldsValue({ profile: { city: 'Omsk' } });

form.getFieldValue('profile'); // { name: 'Irina', city: 'Omsk' }
```

`setFieldValue(name, value)` replaces the value at the specified path.
`setFieldsValue` recursively merges plain objects, so updating the city preserves
the name. It replaces arrays in full. Read values through `values` and `errors`.
When a value changes, `setFieldValue` clears errors and warnings for that field
and its descendants. `setFieldsValue` clears messages for affected fields.

`FormItem.name` accepts a string, number, or array of path segments, such as
`['users', 0, 'name']`. The string `"user.name"` represents one key. When an
intermediate container is missing, a numeric segment creates an array and
the string `"0"` creates an object. The nested HTML element's `name` joins path
segments with `_`. Supply a custom name when needed.

`FormItem.rules` sets field rules. Without local rules, the field uses its
`createForm` rules. `createForm.rules` accepts top-level fields only. Use
`FormItem.rules` or nested rules for a nested path. Model rules apply even
without a FormItem in the DOM. Unmounting the field removes local rules and
keeps the value by default. When `name` changes, errors and `touched` from model rules
stay associated with the old name. In FormList, local field state follows the
row's `key`. [Nested rules](#nested-rules)

Store the model in `$state` if you need to replace it. Fields register with the
new instance, and validation results from the old model leave the new state
alone. Creation, field updates, validation, and reset copy plain objects and
arrays. This keeps model containers independent of supplied data and validation
snapshots. Class instances, including Day.js values, retain identity. Pass a
new instance through a model method to update one.

### Initial values

`FormItem.initialValue` fills in a missing value before rendering the field,
including SSR. The model's `initialValues` takes precedence, including
`null`, `false`, `0`, and `''`. An `undefined` value falls back to the field's
`initialValue`. A field that appears later leaves an existing value intact.
Initial values leave `touched` unset and count in validation with `dirty`.
Connect `value` and `onValueChange` to the model explicitly.

Changing `initialValue` leaves the current value in place. Reset uses the
field's current `initialValue` if the exact path has no value in the original
model `initialValues`. Objects and arrays are copied. `Date`, Day.js, and other
class instances are preserved. When several fields specify `initialValue`
for one path, the first mounted field fills it. Reset leaves conflicting
field defaults unresolved. With overlapping parent and descendant paths,
mount order also affects the initial values.

Initialize a `FormList` array through the list's `initialValue` or the model's
`initialValues`. A list field's `initialValue` applies when it is created.
Resetting just that field does not restore the list field default. Resetting
the entire list remounts rows and reapplies their initial values.

### Field retention and form disposal

`Form.preserve` defaults to `true`. A `FormItem` can override it. With
`preserve={false}`, removing a field restores that path from the model's
`initialValues`. If the model has no default for the path, a top-level field
becomes `undefined` and a nested field is removed from its container. A field's
own `initialValue` fills the path again when the field mounts. Changing
`name` releases the previous path while keeping the editor. Another mounted
field at the exact same path keeps the current value.

Direct fields inside a list row keep the value owned by the list operations.
For a nested field in a row that remains in the list, `preserve={false}` removes
the field value at the row's current index. Removing a row through `FormList`
also removes its values. A top-level `FormList` inherits `Form.preserve` and
restores its model default when it unmounts with retention disabled.

Discarding a field may revalidate fields that depend on it in the mounted form.
It does not send `onValuesChange`. In Svelte the discard follows the flush that
removes the field, so other registrations and list moves in that update are
already visible.

`clearOnDestroy` defaults to `false`. With it enabled, a `Form` clears all
values, including unregistered ones, when it is the last owner to detach from
its `createForm` model. Detaching can also happen when the `form` prop switches
to another model. Reattaching a cleared model restores its initial values and
applies any writes made while it was detached. Pending validation and
submission state from the cleared attachment cannot affect the next one.

The pinned React build uses the initial `clearOnDestroy` value at unmount,
can empty a model still used by another form, and can clear a neighboring
row when it releases a field after a move. Svelte uses the current option,
tracks mounted model owners and resolves removed fields using their row keys.
[React observations](../../tests/browser/fixtures/ant-design-form-lifecycle-observation.json)

### Nameless fields

A `FormItem` without `name` can lay out a label, description, and columns.
It registers neither `rules` nor `initialValue` with the model. `required`
sets the label marker. Set `required`, `name`, `id`, and ARIA attributes
on the nested element yourself. Associate a label through `FormItem.htmlFor`
and the element's `id`, or give the element an accessible name.

These rows stay out of `getFieldsValue` and `getFieldInstance`. Model reset
preserves their DOM, local state, focus, and selection. Adding or removing
`name` remounts the content. Changing one name to another preserves it.

### Hidden fields

`FormItem.hidden` hides the field and preserves its DOM, value, ref, and local
state. It defaults to `false`. A hidden field still participates in validation,
submission, and FormData, so a required error can block submission. Hidden
field elements stay out of Tab navigation and the accessibility tree. Reset
remounts their contents just as it does for visible fields.

## Control adapters

The `control` snippet connects a named FormItem to an editor inside a Form
backed by `createForm`. Spread `editor.props` on the editor and forward the
original callback arguments to `editor.emit`. The snippet takes precedence
when both `control` and `children` are supplied.

```svelte
<FormItem
  name="code"
  label="Code"
  validateTrigger="onBlur"
  normalize={(value: string) => value.trim()}
>
  {#snippet control(editor)}
    <Input
      {...editor.props}
      onChange={(event) => editor.emit('onChange', event)}
      onBlur={(event) => editor.emit('onBlur', event)}
    />
  {/snippet}
</FormItem>
```

- `valuePropName` defaults to `'value'`. Set it to `'checked'` for a Checkbox.
  `getValueProps` can supply a different set of editor props from the stored
  value. Mapping runs during SSR and follows model changes on the client.
- `trigger` defaults to `'onChange'` and selects the event that writes to the
  store. `getValueFromEvent` receives all the forwarded arguments. The default
  extractor reads the configured property on the first argument's target
  when present and otherwise takes the first argument itself.
- `normalize` receives the extracted value, previous field value, and full
  previous store, including unregistered values. It runs synchronously before
  the write. Explicit `changeFieldValue` calls can also normalize an already
  extracted value. Initial values and programmatic setters use the values
  they were given.
- `validateTrigger` selects validation events independently of the write
  event. Forward each configured event through `emit`, including blur.
  Call your own handler after `emit` when it needs the committed value.

Editors sharing a path use the adapter of the editor that emitted the event.
Validation requested by that editor checks the registered rules at the
shared path. [React observations](../../tests/browser/fixtures/ant-design-form-control-adapters-observation.json)

## Conditional rendering

A nameless FormItem can render a section from a selected snapshot of the
form. The `render` snippet receives `values` for that display and `form` for
actions on the live model.

```svelte
<FormItem noStyle shouldUpdate={(previous, current) => previous.delivery !== current.delivery}>
  {#snippet render({ values })}
    {#if values.delivery === 'courier'}
      <FormItem name="address" label="Delivery address">
        {#snippet control(editor)}
          <Input {...editor.props} onChange={(event) => editor.emit('onChange', event)} />
        {/snippet}
      </FormItem>
    {/if}
  {/snippet}
</FormItem>
```

`shouldUpdate={true}` accepts all store notifications. A function receives
the previous and current store values in write order. Its third argument
has `source: 'internal'` for a control write and `source: 'external'` for
`setFieldsValue`. A batch of `setFields` records shares one previous snapshot
and supplies each intermediate store. The rendered section uses the final
snapshot when any record in the batch is accepted. Metadata-only records
and validation completion can notify a predicate with the same store.

Use `dependencies` instead of a predicate to refresh a section when the form
notifies those paths of a control edit. The first changed external store can
also refresh a nameless section when its touched metadata first changes.
Named fields keep their usual value bindings. Accepted updates refresh the
mapped properties of a named field's `control` editor.

The initial snapshot includes all current values during SSR and hydration.
Ordinary updates preserve the rendered nodes. Full reset recreates the
section and restores the initial snapshot. Resetting another field keeps the
section mounted. [React observations](../../tests/browser/fixtures/ant-design-form-item-update-observation.json)

## Watching values

`useFormWatch` observes a field path or a selector. Call it during component
initialization and read its `value` getter in markup, `$derived`, or `$effect`.
With no explicit model, it uses the nearest `Form`. `useFormInstance()` gives
access to that model through its `current` getter, including after the form
receives another model.

```svelte
<script lang="ts">
  import { useFormInstance, useFormWatch } from '@woodger/antd';

  type Fields = { profile: { name: string }; draft?: string };

  const owner = useFormInstance<Fields>();
  const name = useFormWatch<Fields, readonly ['profile', 'name']>(['profile', 'name']);
  const draft = useFormWatch(
    (values) => values.draft ?? '',
    { get form() { return owner.current; }, preserve: true }
  );
</script>

<p>{name.value ?? ''}</p>
<p>{draft.value}</p>
<button type="button" onclick={() => owner.current?.resetFields()}>Reset the form</button>
```

The observed values come from `getFieldsValue()` by default. This includes
registered fields and their projected paths. Set `preserve: true` to select
from the full model, including values without a mounted field. Omitting the
path, or passing `[]`, observes the whole chosen projection. The option is
independent of field retention through `Form.preserve`.

Pass a model directly or through the `form` option. Reactive getters for
`form`, `preserve`, and a first argument of the form `{ get path() { … } }`
allow those selections to change in place. A path can be a literal key or an
array of typed segments. Selectors should be pure and accept a partial model.

Watches follow edits, programmatic writes, reset, field registration, list
reordering, and model disposal. Equal object and array results keep the
previous selection. Opaque objects such as class instances retain their
identity. Outside a form, `useFormInstance().current` is `undefined`.

During SSR and the first hydration pass, a path reads `undefined` and a
selector reads an empty object. The watch publishes the current selection
after mount.

In the pinned React build, changing models can leave a watch connected to
the old model, and changing the watch's `preserve` option can leave a stale
selection until another write. JSON comparison also conflates some distinct
selections, including opaque instances and `undefined` versus `null` in
arrays. Svelte follows the current options and compares values structurally,
with identity for class instances. [React observations](../../tests/browser/fixtures/ant-design-form-watch-observation.json)

## Validation

### Rules

Inside `<Form {form}>`, give FormItem the name path and pass the entered value
to the model through `onValueChange`. In this example, an empty name blocks
submission. A one-letter name produces a warning and still allows saving.

```svelte
<FormItem
  name={['profile', 'name']}
  label="Name"
  rules={[
    { required: true, message: 'Enter a name.' },
    { min: 2, warningOnly: true, message: 'Check the spelling of this short name.' }
  ]}
>
  <Input
    value={form.values.profile.name}
    onValueChange={(name) => form.setFieldValue(['profile', 'name'], name)}
  />
</FormItem>
```

Rules include `required`, `min`, `max`, `len`, `whitespace`, `pattern`, and a
synchronous or asynchronous `validator(value, values)`. Min, max, and len count
Unicode code points in strings, compare numeric values, and count array entries.
An empty array is an empty value. An array containing `0` or `false` is
nonempty. Pattern checks scalars. Use validator to check array contents.

Empty optional values skip built-in checks and still reach validator. Len
checks empty arrays and whitespace-only strings and skips optional null,
undefined, and the empty string. Len specifies an exact length or number and
takes precedence over min and max, including `len: 0`. Pattern and validator
still run after a successful length check.

`whitespace: true` rejects a nonempty string made of spaces, tabs, or line
breaks while keeping the model value intact. An empty optional string is
allowed. Required rejects empty strings, whitespace-only strings, and empty
arrays.

### Errors and manual validation

`validateFields()` returns a value snapshot or rejects with
`FormValidationError`. The error includes `values`, `outOfDate`, and
`errorFields`. Each errorFields entry has the field path and messages.
Paths passed to `validateFields(names)` limit which fields are checked.
The snapshot still contains the complete model.

Pass the name path to `form.validateFields()` to check only the profile name.
For example, a Check name handler can focus a field with a validation error.
[Profile model](#values-and-paths)

```ts
import { FormValidationError } from '@woodger/antd';

async function checkName() {
  const path = ['profile', 'name'] as const;

  try {
    await form.validateFields([path]);
  }
  catch (error) {
    if (!(error instanceof FormValidationError)) {
      throw error;
    }

    if (!error.outOfDate) {
      form.focusField(path);
    }
  }
}
```

`getFieldError(name)` and `getFieldsError(names?)` return field errors.
`errors` holds top-level errors. `getFieldWarning(name)` returns warnings,
and `getFieldsError` combines errors and warnings. In aggregate validation,
errorFields also includes warnings for erroneous fields. A rule with
`warningOnly: true` allows validation and submission to proceed and leaves
the field optional. New validation immediately clears previous warnings,
including while awaiting an asynchronous validator.

FormItem puts errors before warnings, with errors taking priority. A warning
contributes to the accessible description and leaves aria-invalid unset. Stale
validation results stay discarded after an edit, reset, or field removal.
Controls using `setFieldValue` with neither configured validation events nor
dependencies retain the original behavior. Blur marks a field touched, and
writes revalidate touched fields.

### Validation triggers and dependencies

`Form.validateTrigger` configures the default validation events for its fields.
`FormItem.validateTrigger` replaces that setting for one field. The default
event for controls wired with `changeFieldValue` is `onChange`. Pass an event
name or a list of names. `false` and `[]` disable control-triggered validation.
Each rule can restrict its own events with `validateTrigger`. Validation from
`validateFields`, submission, or a dependency checks all the field's rules.

Form-aware controls such as Input report blur to the enclosing FormItem. With
`validateTrigger="onBlur"`, changing the value still updates the store and
sends change notifications. Blur starts validation without marking an
untouched field touched. A custom control can pass an event name as the third
argument to `changeFieldValue`, or call `validateFieldOn(name, event)` for an
event that does not change the value.

```svelte
<Form {form} validateTrigger="onBlur">
  <FormItem name="password" label="Password">
    <InputPassword
      value={form.values.password}
      onValueChange={(value) => form.changeFieldValue('password', value)}
    />
  </FormItem>
  <FormItem
    name="confirmation"
    label="Confirm password"
    dependencies={['password']}
    rules={[{
      validator: (value, values) => {
        if (value !== values.password) return 'Passwords do not match.';
      }
    }]}
  >
    <InputPassword
      value={form.values.confirmation}
      onValueChange={(value) => form.changeFieldValue('confirmation', value)}
    />
  </FormItem>
</Form>
```

Dependencies are full paths from the form root, including numeric indices
inside a list. A change along a dependency path revalidates the dependent
field after it has been edited, validated, or initialized with a defined value.
Chains stop at pristine fields. A `FormList` operation changes the list path,
and editing one row changes that row's field path. Programmatic setters do
not trigger dependency validation.

Dependent fields enter validation before `onValuesChange`. Their rules run
after the UI has applied changes from the edit, without waiting for the event
debounce. Svelte snippets can read reactive model values directly when they
only need to update the UI.

The pinned React build can apply an error from a blur check after the
user's blur handler has replaced the value. In a dependency cycle, it
also invokes the edited field's already superseded validator a second time.
Svelte cancels both obsolete checks. [React observations](../../tests/browser/fixtures/ant-design-form-validation-trigger-observation.json)

## Change events and FormProvider

Connect a control's value event to `form.changeFieldValue(name, value)` to
publish user edits. It marks the field touched and applies the configured
validation triggers and debounce.

```svelte
<FormProvider onFormFinish={(name, { values, forms }) => {
  if (name === 'editor') forms.summary?.setFieldValue('title', values.title);
}}>
  <Form
    form={editor}
    name="editor"
    onValuesChange={(changed, all) => updateDraft(changed, all)}
    onFieldsChange={(changed, all) => updateFieldStatus(changed, all)}
  >
    <FormItem name="title">
      <Input
        value={editor.values.title}
        onValueChange={(title) => editor.changeFieldValue('title', title)}
      />
    </FormItem>
    <Button htmlType="submit">Save</Button>
  </Form>

  <Form form={summary} name="summary">
    <FormItem name="title">
      <Input value={summary.values.title} readonly />
    </FormItem>
  </Form>
</FormProvider>
```

`onValuesChange` receives the changed path and the values of the form's
registered fields, with the edited path included in both. Nested paths retain
their object or array structure. `onFieldsChange` receives the changed field
snapshots and the form's field snapshots. Each includes the path, value, touched
and validation flags, errors, and warnings. The changed entries are also
entries of the second array.

For the edit itself, `onValuesChange` precedes `onFieldsChange`. Dependent
validation can start before both. Validation start and completion publish
field metadata as well. Explicit `validateFields` also
publishes field events, including a `validateOnly` check that leaves metadata
unchanged. Superseded results stay out of the callbacks. `FormList` operations
publish their array path, and automatic list validation waits for keyed rows to
settle. Initialization, reset, `setFields`, `setFieldValue`, and `setFieldsValue`
are silent.

`FormProvider` adds no element to the DOM. Its `onFormChange` and
`onFormFinish` receive the form name and the named models mounted inside that
provider. Empty and omitted names still send events. Registration names change
with the `Form` name or its model, and models leave the registry when the form
unmounts. A name shared by several mounted forms points to the most recent
registration. When that registration leaves, the previous live form is restored.

Events reach the nearest provider first, then enclosing providers, then the
form's own callback. Successful submission uses the same values snapshot for
these callbacks, including any unregistered values kept by the Svelte model.
Calling `form.submit(onFinish)` on a mounted model also notifies providers and
uses the supplied callback. Validation errors and obsolete results leave
`onFormFinish` uncalled.

The source comparison covers nested scopes, empty names, asynchronous
validation, and registration changes. Ant Design 6.6.8 can report an older
validator's rejection for a newer field value, and it drops a live registry
entry when an independently mounted form with the same name unmounts. The
Svelte model discards the stale result and releases only the departing
registration. [React observations](../../tests/browser/fixtures/ant-design-form-events-observation.json)

## External field state

Pass `fields` when an external store owns the form's values or field metadata.
Each record is a `FormFieldData` patch. Form applies the patches in order
after the client registers its fields. SSR and initial hydration use the
model's defaults. An empty array or an omitted prop supplies zero patches.

```svelte
<script lang="ts">
  import { createForm, Form, FormItem, Input, type FormFieldData } from '@woodger/antd';

  const form = createForm({ initialValues: { username: 'Anna' } });
  let fields = $state<readonly FormFieldData[]>([{ name: 'username', value: 'Anna' }]);
</script>

<Form {form} {fields} onFieldsChange={(_, allFields) => { fields = allFields; }}>
  <FormItem name="username" label="Username" rules={[{ required: true }]}>
    <Input
      value={form.getFieldValue('username')}
      onValueChange={(value) => form.changeFieldValue('username', value)}
    />
  </FormItem>
</Form>
```

External patches are silent and use the same omitted-property and unregistered
path semantics as [setFields](#updating-fields-in-a-batch). Reusing unchanged
records in a new array leaves local edits in place. Replacing a record or
editing a reactive record reapplies the batch. When the `form` model changes,
the current batch is applied to that model.

Passing `allFields` back directly preserves the validator that produced the
snapshot. To take control of `validating`, supply a new record with that flag.
The pinned React build can publish an error for the earlier value after a
replacement, and feeding that snapshot back replaces the external error. Form
keeps the newer external message when the obsolete validation settles.
[React observations](../../tests/browser/fixtures/ant-design-form-controlled-fields-observation.json)

## Submission

`form.submit(onFinish)` prevents duplicate submission and returns an object
with status `success`, `invalid`, `failed`, or `busy`. Invalid and failed
results also contain error. Editing values during validation makes that
result stale and prevents onFinish from running. An onFinish that already
started continues running.

A button outside the form can call this method to save the profile in the
browser. If the required name is empty, the model returns
`{ status: 'invalid', error }` and localStorage keeps the previous entry.

```ts
const result = await form.submit(({ profile }) => {
  localStorage.setItem('profile', JSON.stringify(profile));
});
```

Submitting with `<Button htmlType="submit">` inside Form calls onFinish after
successful validation. Field errors go to onFinishFailed. Errors from
onFinish go to onError and appear in a shared message. Form sets novalidate
so its own rules control validation. Implement server-side validation in the
application.

## Reset

`resetFields(names?)` restores initial values at the selected paths.
Omitting the argument resets the entire model. An empty array changes
nothing. `[[]]` restores all values without selecting the state of named
fields. An unknown path receives undefined without registering a field.

To undo an edit to the name and keep the new city, pass a list with one path.
The outer brackets describe the field list and the inner brackets the name path.

```ts
form.setFieldsValue({ profile: { name: 'Irina', city: 'Omsk' } });

form.resetFields([['profile', 'name']]);

form.getFieldValue('profile'); // { name: 'Anna', city: 'Omsk' }
```

That reset also clears touched state and errors for the name field.
`form.resetFields(['profile'])` restores all original profile values and
keeps the touched state and errors of nested fields. Repeating a path in the
list resets it once.

Reset remounts a selected FormItem's content and local state. A full reset
remounts all fields. Neighboring fields retain DOM, drafts, focus, and
selection. The associated HTML control regains focus after remount if it
stays on the page and the user has not moved focus. Unassociated elements
leave focus alone.

Resetting a FormList remounts its rows. The model's initialValues takes
precedence over the current initialValue of the root list. When several lists
set initialValue for the same path, reset leaves conflicting defaults unresolved.

## FormList

`FormList` works with an array in the nearest form. It renders without a DOM
wrapper and passes fields, operations, and list errors to children.

```svelte
<script lang="ts">
  import {
    ConfigProvider,
    Form,
    FormItem,
    FormList,
    FormErrorList,
    Input,
    createForm
  } from '@woodger/antd';

  const form = createForm<{ users: { name: string }[] }>({
    initialValues: { users: [] }
  });
</script>

<ConfigProvider>
  <Form {form}>
    <FormList name="users">
      {#snippet children(fields, { add, remove }, meta)}
        {#each fields as field (field.key)}
          <FormItem name={[field.name, 'name']} label="Name" rules={[{ required: true }]}>
            <Input
              value={form.getFieldValue(['users', field.name, 'name']) ?? ''}
              onValueChange={(value) => form.setFieldValue(['users', field.name, 'name'], value)}
            />
          </FormItem>
          <button type="button" onclick={() => remove(field.name)}>Delete</button>
        {/each}
        <div class="ant-form-item">
          <FormErrorList errors={meta.errors} warnings={meta.warnings} />
        </div>
        <button type="button" onclick={() => add({ name: '' })}>Add</button>
      {/snippet}
    </FormList>
  </Form>
</ConfigProvider>
```

`field.name` is the current index, and `field.key` is the stable row key. Key the
`{#each}` by field.key so moving or removing neighboring rows preserves the
remaining elements, focus, selection, and errors. New rows get new keys. An
external array replacement retains keys by index. For a sparse array, fields
includes only existing entries with their original indexes.

FormItem and nested FormList names are relative to the nearest list.
`setFieldValue` and `getFieldValue` take full paths from the form root.
A nested independent form starts a new path. The array in model initialValues
takes precedence, including []. A missing array can use list initialValue.
Reset uses model initialValues or the list's current initialValue. Unmounting
a list removes its local rules and preserves its values by default.

`add(defaultValue, insertIndex)` inserts a row at the supplied index or appends
when the index is missing or invalid. Remove takes an index or an array of
indexes. Duplicates and absent indexes leave unrelated rows intact. Move
moves a row with its key and ignores fractional indexes.

List rules support custom `validator(value, values)`. Errors go to meta.errors,
and warningOnly warnings go to meta.warnings. Validation that resolves after
a row is removed or reset leaves the removed field's errors cleared.

A list's prefixCls sets the prefix of the nested FormErrorList and leaves
neighboring FormItem prefixes alone. Empty or undefined inherits the
ConfigProvider prefix, ant-form by default.

## FormErrorList

Pass the list's `meta.errors` and `meta.warnings` to FormErrorList, as in the
preceding example. Add ant-form-item to the wrapper for message styles. With a
custom prefix, use the matching `<prefix>-item`. FormErrorList presents
messages without registering a field or changing form values.

Errors precede warnings. Messages can be strings, numbers, nested arrays, and
snippets. Any help value other than null or undefined replaces both lists,
including false, 0, and the empty string. HelpStatus sets the status class.
FieldId sets id to `${fieldId}_help`. Class adds a container class. The
container is omitted when there are no messages.

Clearing errors and warnings waits 10 ms so a brief intermediate empty list
can keep the messages visible. Enter and exit are animated. Motion={false}
and the system's reduced-motion setting disable animation.
OnVisibleChanged runs after entry or exit, excluding the initial empty list
and unmount. Reinsertion during exit cancels the previous callback. Duplicate
messages get separate keys, and reordering text messages preserves their DOM.

Help and helpItem inherit the form's classNames and styles. A list prefix takes
priority over FormItem. Without a list, the prefix comes from FormItem through
noStyle, then ConfigProvider.

## Advanced validation settings

### Rule types and formats

`ValidationRule.type` supports `string`, `number`, `integer`, `float`,
`boolean`, `array`, `object`, `date`, `regexp`, `method`, `any`, `enum`, `email`,
`url`, `hex`, `tel`, and `pattern`. The union is exported as
`ValidationRuleType`.

An explicit string type checks length, pattern, and whitespace. Numeric types
and array check range and len. Date checks a timestamp after standard
JavaScript conversion. Boolean, object, regexp, method, and any skip these
constraints. Regexp accepts a regular expression or input from which one can
be created. Object excludes arrays, and method denotes a function.

For string, whitespace counts as content. `whitespace: true` rejects a
whitespace-only string. For array, range also checks an empty array, and
required rejects it. Number treats the empty string as missing. Integer and
float treat it as an invalid type. Any with required only checks for a
non-null and non-undefined value. Integer accepts 1e21, and float rejects it.
Numeric rules and date reject BigInt and Symbol.

A custom validator replaces built-in checks for an explicit type. It receives
the value after transform and before date or number coercion. Returned and
transformed values leave the model intact. Default messages are in Russian.
Set shared templates through validateMessages.

`type: 'enum'` checks enum with strict equality. The number 0 and string '0'
are distinct, and NaN never matches NaN. The allowed array may be readonly.
Enum adds validation only with type='enum'. Optional null and undefined skip
validation. The empty string is tested against the list.

Pattern accepts a string or RegExp. `type: 'pattern'` checks only required and
the expression. A passed RegExp retains its lastIndex, including with g.
An invalid pattern string becomes a validation error.

Email, hex, tel, and url check type and format and skip range, pattern, and
whitespace. Email allows up to 320 characters, tel up to 32, and url up to
2048. Hex accepts three or six digits with an optional #. Url accepts
addresses such as `https://example.com`, `//example.com`, and `www.example.com`.
Enclose IPv6 addresses in brackets. The model retains the original address.

### Rule factories

`FormRule` accepts a ValidationRule object or a ValidationRuleFactory, a pure
function `(form) => rule`. Factories work in createForm.rules and FormItem.rules
and receive the current form model. The factory runs before each validation
and before validateDebounce. Its returned settings are captured for that run.
Reading values, errors, or touched leaves the factory alone. IsFieldRequired
and the required marker evaluate it separately, including in SSR.
WarningOnly leaves the field optional.

```ts
const form = createForm({
  initialValues: { password: '', confirmation: '' },
  rules: {
    confirmation: [
      (form) => {
        const password = form.getFieldValue('password');

        return {
          validator: (value) => value === password ? undefined : 'The passwords do not match.'
        };
      }
    ]
  }
});
```

Return a rule object without changing the form. A local factory requires a
nearest Form to supply the required marker. Explicit required and rule
objects still apply without it. A thrown factory error rejects validateFields
and clears validating. A later call can retry validation.

### Nested rules

`fields` specifies child rules for `type: 'object'` or `'array'`. Each key is a
literal property name, including 'a.b', and its value is a rule object or an
array of rules. DefaultField checks existing array entries after fields if the
parent and explicit fields have passed. For an object, it applies to own keys
with no override in fields. A missing optional parent skips the nested schema.
Errors and warnings are stored on the parent field without creating separate
model fields.

```ts
const form = createForm({
  initialValues: { profile: { name: '' } },
  rules: {
    profile: [
      {
        type: 'object',
        fields: {
          name: { required: true, message: 'Enter a name.' }
        }
      }
    ]
  }
});
```

A nested `validator(value, values)` receives the full form snapshot. The parent's
transform runs before child rules and leaves the model intact. The schema is
captured before the parent's asynchronous validator. ValidateFirst controls
the root rule list. A schema collects all its child results. A nested warning
leaves later root errors visible. Fields results follow completion order, and
array defaultField follows index order. A root warningOnly converts all its
schema's messages to warnings.

Nested warningOnly allows submission. DefaultField checks existing indexes
in a sparse array and works with transformed arrays. Fields uses own object
properties. Repeating a schema and value pair within a branch produces a cycle
error. Independent branches can reuse the same object.

### Value transformation

`ValidationRule.transform(value)` synchronously transforms input for its own
rule before required, min, max, pattern, and validator. Other rules get
the original value. The transform leaves model state, FormData, submitted
values, and initial values intact. For example,
`{ transform: value => String(value).trim(), min: 3 }` checks length without
leading and trailing whitespace while preserving the entered text.

Keep input objects intact because callbacks in the current validation share
one snapshot. It copies plain objects and arrays and preserves class instances.

A thrown transform error becomes a rule error. Message takes priority, then
Error.message, then the default message. WarningOnly keeps its effect.

### Message templates

String rule messages support `${label}`, `${name}`, and rule parameters such as
`${min}` or `${enum}`. FormItem.messageVariables overrides those values for its
field. Label comes from a string label or field name, and name is the full
dot-separated path. In nested rules, name and rule parameters refer to the
child rule. Label and explicit messageVariables still come from FormItem.
Without FormItem, the path is the label.

```svelte
<FormItem
  name="title"
  label="Title"
  messageVariables={{ min: 'three' }}
  rules={[{ min: 3, message: '${label} needs at least ${min} characters.' }]}
>
  <Input
    value={form.values.title}
    onValueChange={(value) => form.setFieldValue('title', value)}
  />
</FormItem>
```

Substitution runs once. Inserted text stays literal. A backslash before
`${label}` keeps it literal. Escape the backslash in a JavaScript string as
`'\\${label}'`. An unknown key gives the text undefined. Variables are captured
before delay and async validation. The next run reads updated props.
Substitution applies to string validator results and leaves messages from
setFields and submission-handler errors intact.

Form.validateMessages sets shared required, enum, whitespace, types, len, min,
max, range, and pattern.mismatch templates. The same settings are available in
ConfigProvider.form.validateMessages and locale.Form.defaultValidateMessages.
Rule.message takes priority over form, provider, and locale. Locale and provider
merge nested template groups. Form replaces a supplied group in full. A nested
ConfigProvider's form setting, including {}, replaces the parent setting.
Missing templates use the Russian defaults, including with built-in ruRU and enUS.

```svelte
<Form {form} validateMessages={{ string: { min: '${label} needs at least ${min} characters.' } }}>
  <FormItem name="title" label="Title" rules={[{ min: 3 }]}>
    <Input
      value={form.values.title}
      onValueChange={(value) => form.setFieldValue('title', value)}
    />
  </FormItem>
</Form>
```

ValidateMessage accepts a string or a zero-argument function that returns a string.
The template runs only when its rule fails. Printf formatting (%s, %d, %j, %%)
runs before `${variables}` substitution and receives the field path followed by
rule parameters. Rule.message interprets only `${...}`. An invalid date uses
types.date, and a timestamp range uses number. Date.format, date.parse, and
date.invalid are available in the types and add no checks. The default template
supplies a custom error without Error.message. String validator results and
manually supplied errors take priority.

Settings are captured before delay or async validation. Prop changes apply on
the next run and leave old errors intact. SSR does not run validation.
CreateForm without Form uses default messages. An undefined result or a
throw from a template callback falls back to the regular message and keeps
the field invalid.

### Validation order and delay

FormItem.validateFirst controls the rules for one field.

- The default false runs rules in parallel and collects messages in rule order,
  regardless of completion order.
- True runs rules sequentially and stops at the first message.
- "parallel" runs rules in parallel and returns the first error that completes,
  without waiting for the others. If none fail, it waits for every blocking rule.
  The first warning is chosen by completion order.

Blocking rules precede warningOnly rules without changing the original rules
array. In sequential mode, a warning stops remaining warnings only after every
blocking rule passes. Changes to validateFirst take effect on the next run.
Late results after completion leave messages intact. ValidateOnly uses the
selected mode without changing visible field state.

FormItem.validateDebounce delays control validation by the given number of
milliseconds. Undefined or 0 starts it immediately. The waiting period counts
as validating. Restarting replaces the timer and keeps stale values from
validator. Rules, validateFirst, and the delay are captured for the run.
Prop changes apply next time. ValidateFields, submit, and dependency checks
bypass the delay.
ValidateOnly starts immediately and leaves pending visible validation running.
Reset, manually setting value or validating, and unmount cancel delayed
validation. Started runs guard against stale results.

### validateFields options

`validateFields(options)` and `validateFields(names, options)` accept
FormValidateOptions. Flags default to false and can be combined.

```ts
await form.validateFields([['users']], {
  recursive: true,
  dirty: true,
  validateOnly: true
});
```

ValidateOnly returns rule results and leaves errors, warnings, touched, and
validating intact. Existing visible messages remain. An untouched field stays
clean. Field focus and values are unchanged. Recursive selects the registered
descendants of a path, including the field itself. Overlapping paths run each
field's rules once. Dotted strings stay literal. Numeric and string segments
remain distinct.

Dirty selects touched fields, edited fields, and fields that have run regular
validation. It also includes fields with initialValues or initialValue,
excluding undefined. An empty string, 0, false, and null are supplied initial
values. SetFieldValue makes a known field dirty even when writing the same
value. SetFieldsValue does so when contents change. Plain objects and arrays
are compared by content, and class instances by identity. Reset clears edit
history and still includes defined initial values in filtering. Writing alone
leaves touched unchanged.

A new validation marks the previous result outOfDate. ValidateOnly leaves visible
validation running. Its messages and validating update independently of the
state-free validation result.

Options also apply to `validateFields(undefined, options)`.

## Form state and methods

### Interaction and validation flags

`touchField(name)` marks a field touched and dirty and revalidates touched fields.
`isFieldRequired(name)` checks for a blocking required rule and skips warningOnly.

`isFieldTouched(name)` checks the field and its descendants. The empty path []
checks whether the model has any touched field. The query neither creates
fields nor changes their state.

`isFieldsTouched()` asks whether any field is touched.
`isFieldsTouched(true)` checks all registered fields, excluding the FormList
roots as blockers. A name list defines groups by path prefix.
`isFieldsTouched(names, true)` requires one touched field per group. For
example, `isFieldsTouched([['user']], true)` returns true after a user
interacts with one field under user. Pass both full paths to check both fields.

The method considers FormItem, FormList, createForm rule fields, and model
fields explicitly marked touched. InitialValues keys without UI or rules
stay out of the all-fields check. An empty list returns false, and
isFieldsTouched([], true) returns true. IsFieldsTouched(undefined, true)
matches isFieldsTouched(true). The path list [[]] selects the model as one group.

`isFieldsValidating(names?)` checks whether any selected field is running
regular validation. Without a list, it checks all model fields. Names match
exactly and leave descendants out. An empty list selects no fields. ValidateOnly
leaves validating and visible validation alone. A field without rules has no
validating flag. IsFieldValidating(name) checks one field.

### Getting values

`getFieldsValue()` returns registered field values. Unfiltered
`getFieldsValue(true)` returns all model values. In the example, the profile
stores a name and city, and the page only renders the name field.

```ts
form.getFieldsValue();     // { profile: { name: 'Irina' } }
form.getFieldsValue(true); // { profile: { name: 'Irina', city: 'Omsk' } }
```

A list of paths selects those fields and their descendants.
`getFieldsValue([['profile']])` includes the registered profile fields. If the
path has no registered fields, it returns the model value itself. An empty
list returns {}, and [[]] selects all values.

Unfiltered getFieldsValue(true) and getFieldsValue([[]]) retain the full form
type. Selecting paths or filtering allows undefined in field types. A FormList
row or a field within the row can be missing.

FormItem, FormList, and fields with createForm rules count as registered.
The touched flag alone leaves a field out. Pass the filter after the list or
true, or use { filter }. It receives FormFieldMeta with touched, validating,
errors, warnings, name, and validated. An explicitly selected unregistered
path supplies null. True with a filter selects registered fields. Validated
becomes true after regular validation or a value change through setFieldsValue.
ValidateOnly leaves it intact.

For FormList, this returns row fields and supplies an empty array for a missing
list root. Roots stay out of the filter. For example,
`getFieldsValue({ filter: () => false })` returns `{ people: [] }` for people.
Unfiltered getFieldsValue(true) returns all values, including those without
UI elements. Use true during SSR as well, before fields register in the DOM.

### Updating fields in a batch

`setFields(entries)` applies entries in order without validation. An entry can
set value, errors, warnings, touched, and validating. If the server reports
that a profile name is taken, pass its message to the registered field. The
entered name stays in the form for the user to fix.

```ts
form.setFields([{ name: ['profile', 'name'], errors: ['This name is already taken.'] }]);
```

An empty message array or explicit undefined clears errors and warnings.
`value: undefined` writes an absent value. Omitting `value` leaves the field
value intact. Values can be changed without UI elements. State for an unregistered
path is ignored without deferring it until registration. CreateForm rule
fields work without UI. An explicit validated field leaves the computed flag
alone. Validating: false sets validated: true without running rules. Undefined
for touched and validating becomes false.

Validation skips fields without rules. Manually set errors, warnings, and
validating remain and do not by themselves block validateFields or submission.
Validation of a field with rules can replace temporary messages. An explicit
validating value takes over that flag. If the value changes, a stale validator
result leaves newer messages intact.

## Layout and accessibility

### Field layout

`Form.layout` arranges fields. Vertical puts the label above the field.
Horizontal puts it beside the field on wide screens, and inline lays fields
out in a wrapping row. The default is vertical. A local FormItem.layout
(horizontal or vertical) takes precedence. Undefined restores inheritance.
Layout changes preserve field DOM, values, state, focus, and selection.

### Size and disabled state

`Form.size` sets small, medium, or large for the form and its components.
Undefined inherits the nearest Form or ConfigProvider size. A local component
size and SpaceCompact size take precedence. Small and large also affect label
and field container height. Size changes preserve elements, values, state,
focus, and selection.

`Form.disabled` reaches all nested Ant Design components, including those
without FormItem. Undefined inherits ConfigProvider or the outer form.
False enables components even under an outer disabled={true}. A nested
ConfigProvider.componentDisabled overrides the form for its subtree, and a
component's local disabled takes precedence. An associated field also
disables while asynchronous onFinish is pending, unless its own disabled
is explicitly false.

### Labels and columns

Form.colon, labelAlign, and labelWrap inherit from ConfigProvider.form.
Colon defaults to true, labelAlign to right, and labelWrap to false.
Local FormItem.colon and labelAlign take precedence over Form. When adding
a colon, the last `:` or `：` and surrounding spaces are removed from
the label text. Its original title is kept. LabelWrap allows wrapping,
and labelAlign accounts for text direction, including RTL.

ConfigProvider.form also sets requiredMark. A nested provider configuration
replaces the outer configuration in full, including an empty {}. Undefined
inherits it. A nested Form uses its own settings and the provider settings
independently of local settings on the outer form.

Form.labelCol, wrapperCol, and the matching field props accept Col settings
including span, offset, order, push, pull, flex, responsive sizes, class,
and string style. A FormItem object replaces the form setting in full.
An empty object clears it. Nested FormItem can set its own columns and does
not inherit column settings from the parent field.

FormItem.label is optional. Undefined, false, and an empty string omit the
label. A whitespace-only string retains the container. Null also omits the
label and adds a content offset based on Form.labelCol when span is below 24.
Local labelCol or wrapperCol, including {}, disables this calculation.
An explicit offset is preserved. Give a field without a visible label
aria-label or aria-labelledby.

Labels also accept numbers, nested arrays, and Svelte snippets. Numeric 0
is visible. True, an empty array, and an empty snippet retain the container.
RadioGroup, CheckboxGroup, InputOTP, Slider, and the standard ColorPicker
control get an accessible name from a composite label through aria-labelledby.
Explicit aria-label and aria-labelledby take precedence.

Form.requiredMark inherits ConfigProvider.form.requiredMark and defaults to
true. False hides the asterisk. 'optional' marks optional fields. A Svelte
snippet receives (label, { required }) and renders the entire label contents.
The marker controls appearance. Native required, validation, and FormData
keep their own contracts. The 'optional' label comes from locale.Form.optional
and falls back to English when empty or missing.

FormItem.tooltip accepts text, a number, an array, a Svelte snippet, or Tooltip
settings. Form.tooltip and ConfigProvider.form.tooltip supply defaults and
leave icon visibility to the field. Settings merge by prop in provider, form,
and field order. An empty field object enables the inherited title. Undefined,
null, false, and the empty string hide the icon. Icon takes precedence over
children, followed by the standard question icon. A custom requiredMark
snippet receives the label with its tooltip.

The icon stays out of Tab navigation, and a click leaves field focus alone.
The tooltip goes into body by default. Set getPopupContainer to choose another
container.

### Field descriptions

FormItem.extra sets a persistent description displayed with errors and warnings.
Strings, numbers, arrays, and Svelte snippets are supported. Null, undefined,
false, and the empty string hide it. Zero is visible. True, an empty array, and
an empty snippet retain the container. Extra gets its own id and is appended
after messages in aria-describedby. Existing control descriptions are preserved.

FormItem.help accepts the same content types. Errors and warnings take the
place of help, and extra stays visible. Numeric 0 renders and appears in
aria-describedby. Updating help or extra preserves the field and focus.
Reset remounts descriptions and their local state.

Elements inside label, extra, help, and tooltip inherit form disabled, size,
and variant. They are independent of the main field value and do not receive
its id, name, status, error ARIA attributes, or ref. Input in an auxiliary
control leaves the main field value and touched intact.

### Status and feedback icons

FormItem.validateStatus accepts success, warning, error, validating, and the
empty string. An explicit value sets appearance, and the empty string disables
the automatic visual status. Otherwise, pending validation comes first, then
errors, warnings, and success for a touched field. State is read by exact name.
Descendants do not affect it. This also works on a FormItem without name.

Status changes leave validation, errors, and warnings alone. A model error
remains in the accessible description and aria-invalid even with another
visual status. On Input and Select, the visual error status also sets
aria-invalid in the absence of model errors.

FormItem.hasFeedback enables a status icon. Form.feedbackIcons supplies a
function `({ status, errors, warnings }) => ({ success, error, warning, validating })`.
HasFeedback={{ icons }} overrides it for one field. Values are content or
Svelte snippets. False hides the icon. Null, undefined, 0, and the empty string
use the standard icon. An empty object uses standard icons in place of the
form configuration. A validated, untouched field gets success only when
hasFeedback is enabled.

NoStyle without its own hasFeedback inherits the parent icon. Local false
disables it. A nested form resets the icon and visual status and preserves
the nearest field state.

Feedback icons are supported on input and selection controls, including Input,
TextArea, InputNumber, Select, TreeSelect, Cascader, AutoComplete, Mentions,
Transfer, and date and time pickers. Depending on the component, a custom suffix
may appear beside the icon or replace it. For date and time pickers it replaces
the icon entirely. Toggling hasFeedback may replace an Input or TextArea wrapper
and lose focus. In Mentions, it may also replace the text field and close the
suggestion list. A custom Input in AutoComplete can show both icons. Some form
animations remain outside the current support.

### useFormItemStatus

Use `useFormItemStatus()` to read field state in a custom component. Call it
during initialization of a FormItem child and read status, errors, and warnings
from the returned object. They update through getters. Destructuring captures
a snapshot. Message arrays are read-only.

```svelte
<script lang="ts">
  import { useFormItemStatus } from '@woodger/antd';

  const field = useFormItemStatus();
</script>

{#each field.errors as error}
  <p>{error}</p>
{/each}
```

An untouched field returns status: ''. Outside FormItem, status is undefined.
A nested FormItem reads its own state. Label and extra read the outer context
because field state is available only inside its content. A nested Form resets
status to undefined and preserves errors and warnings from the nearest outer
field. The function works during SSR.

### FormItem.noStyle

FormItem.noStyle omits styling, label, and descriptions and preserves field
binding, rules, ref, and reset. Errors and warnings go to the nearest styled
FormItem. Help={false} disables forwarding. Hidden keeps its hidden wrapper
even with noStyle. Without a styled parent, messages stay in the model and
useFormItemStatus without a separate DOM list.

The parent shows its own messages first, then noStyle field messages in order
of appearance. Identical names merge. FormList rows keep their messages when
reordered. The parent's status and useFormItemStatus describe its own field.
NoStyle inherits the parent's visual status when it has no status, errors,
warnings, pending validation, or touched state of its own.

### Styles and themes

Form and FormItem accept rootClassName. FormItem also accepts string style.
ConfigProvider.form.class and style apply to the form root. Provider classes,
local class, and rootClassName merge. Local style follows the provider style.
Component={false} supplies form context without a form element or a field
layout container.

Form.classNames, Form.styles, and the matching ConfigProvider.form settings
accept an object or callback for root, label, content, help, helpItem, and
extra. Root styles the form, and the other slots style fields and messages.
Provider and form classes merge, and styles are CSS strings. Root style order
is component theme, config.styles.root, config.style, Form.styles.root, then
Form.style. Other slots merge provider and form styles. The callback receives
form props. An undefined result leaves the preceding layer in place.

Theme.components.Form configures label color and size, required markers,
height, and spacing. It supports nested themes, algorithms, and a custom
CSS variable prefix. LabelHeight also sets vertical label height when
verticalLabelHeight is omitted. In inline layout, inlineItemMarginBottom
sets the bottom margin, and the shared margin sets the gap between fields.
Responsive boundaries use global screen tokens.

Form, FormItem, and FormList resolve prefixCls independently. A nonempty
local value takes precedence, and an empty or undefined value inherits
ConfigProvider. Set the prefix on both the form and its fields to share a
local prefix. The FormList prefix takes precedence for its FormErrorList.

### Focus and scrolling

`getFieldInstance(name)`, `focusField(name)`, and
`scrollToField(name, options?)` use a registered field control. Built-in
input and selection controls register automatically. If a component exposes
bind:ref, getFieldInstance returns it. Otherwise, it returns an object with
nativeElement and supported methods, or the HTML element itself.

Form.scrollToFirstError scrolls to the first error after onFinishFailed.
The form setting replaces ConfigProvider.form.scrollToFirstError in full.
Undefined inherits the provider setting. False disables scrolling and focus.
True scrolls to the nearest edge when needed and leaves focus in place.
An object accepts FormScrollOptions, including block, behavior, and
focus: true. If both settings are omitted, the form automatically focuses
the first erroneous field.

For a custom field, pass its ref to FormItem.controlRef. It takes precedence
over automatic registration and is returned as supplied. Use an HTML element,
a Svelte bind:this with an exported focus method, or an object with
nativeElement and focus.

```svelte
<script lang="ts">
  import { Form, FormItem, Input, createForm } from '@woodger/antd';

  const form = createForm({ initialValues: { title: '' } });
  let controlRef = $state<HTMLInputElement>();
</script>

<Form {form}>
  <FormItem name="title" label="Title" {controlRef}>
    <Input
      value={form.values.title}
      onValueChange={(value) => form.setFieldValue('title', value)}
      bind:inputElement={controlRef}
    />
  </FormItem>
</Form>
<button onclick={() => form.scrollToField('title', { block: 'center', focus: true })}>
  Show title
</button>
```

GetFieldInstance returns undefined before the field appears, after removal,
or without registration. Without a ref, focus and scrolling use the associated
id. Set htmlFor for custom HTML. GetFieldInstance queries the current state
without subscribing to future fields. The Instance type parameter declares
the expected result type and has no runtime check.

ScrollToField uses nativeElement from the ref or the associated element.
By default, it scrolls to the nearest edge if needed. It supports block,
inline, scrollMode, behavior, boundary, skipOverflowHiddenElements, and focus.
A custom callback can handle scrolling. A promise it returns is left unawaited.
An unknown path leaves the page alone. The methods are safe during SSR
without DOM controls. CSS scroll-margin remains outside the scroll calculation.
