# UI Architecture

The UI application separates business logic, application use cases, infrastructure,
and presentation.

The application has the following layers.

```text
Domain
  ↑
Application
  ↑          ↑
Presentation Infrastructure
       \     /
       Bootstrap
```

## Dependency Direction

Dependencies point toward the inner layers.

* `Domain` is independent of the other application layers.
* `Application` may depend on `Domain`.
* `Presentation` may depend on `Application` and `Domain`.
* `Infrastructure` may depend on `Application` and `Domain`.
* `Bootstrap` may depend on all layers to assemble the application.

The following dependency directions are prohibited.

```text
Domain         → Application
Domain         → Infrastructure
Domain         → Presentation

Application    → Infrastructure
Application    → Presentation

Presentation   → Infrastructure
Infrastructure → Presentation
```

The application receives infrastructure implementations through explicit ports or
interfaces. `Bootstrap` connects concrete implementations to their abstractions.

## Contract Ownership

Each contract has one primary owner of its exact definition. The owner defines
the signature, format, or set of allowed values. Other representations are
derived and updated alongside it.

This document defines responsibilities and dependency direction. The artifacts
in the table own the exact machine-verifiable contracts. Reference documentation
explains their semantics and shows examples without duplicating their definitions.

Tests verify the owner's observable contract. The table identifies the source
that defines its exact form.

| Contract | Owner of the exact definition | Documentation role |
| --- | --- | --- |
| Domain models and invariants | Domain types, value objects, and pure validation rules | Explains the domain meaning and reasons for constraints |
| Application use cases, ports, and errors | Application interfaces, input and output types, and result types | Describes use cases, guarantees, and error semantics |
| Component props, callbacks, and snippets | The defining component's `$props` or the Props type exported alongside it | Shows usage, accessibility, and lifecycle semantics |
| Presentation model API | The exported factory or interface for the presentation model | Describes observable state, actions, and the model lifecycle |
| Page URLs, query parameters, and HTTP behavior | SvelteKit route loaders and handlers, with reusable invariants owned by Domain rules | Gives a readable reference with formats, statuses, and examples |
| Persisted preference | The consumer that defines the key, version, payload type, and validator | Describes supported behavior, migration, fallback, and constraints |
| npm commands | `scripts` in `package.json` | Describes the purpose and supported workflow of each command |
| Dependency wiring | Bootstrap or the composition root | Shows data flow and implementation choices without duplicating their interfaces |

A mismatch between a derived representation and its owner is a defect. Change
the contract at its owner and synchronize consumers, tests, generated representations,
and documentation in the same task.

## Domain

`Domain` contains business entities, values, rules, and pure domain functions.

Domain code stays independent of the following.

* Svelte imports
* `$state`, `$derived`, `$effect`, and other reactivity mechanisms
* HTTP, WebSocket, `localStorage`, the DOM, and other browser APIs
* API DTO formats
* Presentation state such as `loading`, `selected`, `expanded`, and `modalOpen`

Keep Domain as ordinary TypeScript that can run and be tested without a UI runtime.

## Application

`Application` defines the application's use cases. It contains the following.

* Use cases
* Application services
* Commands and queries
* Ports for external dependencies
* Coordination of several domain operations

Keep Application independent of the component that starts a use case, the HTTP
client that sends a request, where the data is displayed, and how the UI stores
reactive state. Keep Svelte imports in the Presentation layer.

A use case returns its outcome. Presentation owns UI details such as
`loading`, `disabled`, and `modalOpen`.

## Infrastructure

`Infrastructure` implements interactions with external systems.

* HTTP APIs
* WebSocket
* Browser storage
* IndexedDB
* Platform APIs
* External SDKs
* Serialization and deserialization

Keep transport DTOs inside Infrastructure unless another layer needs them.
Infrastructure maps external representations to Application and Domain
representations and back.

Keep `fetch` calls and concrete API client imports out of Svelte components.

## Presentation

`Presentation` displays state and handles user interaction. Svelte serves as
the UI framework only in this layer.

The presentation structure may follow this layout or an equivalent
feature-oriented structure.

```text
presentation/
  features/
  shared/
  pages/
```

Presentation owns the following.

* Svelte components
* UI state
* Reactive view models
* Handling user actions
* Converting application state into a view
* States such as `loading`, `error`, `empty`, `selected`, and `expanded`

Keep business rules outside `.svelte` components.

## Components

A `.svelte` component primarily describes a view declaratively.

A component may do the following.

* Accept props.
* Display data.
* Store local UI state.
* Compute derived state used only by the view.
* Convert DOM events into user actions.
* Call methods on its own presentation model.

Keep business rules, infrastructure service construction, direct backend API calls,
duplicated application logic, and chains of internal state changes implemented
through `$effect` out of components.

Reusable components should know as little as possible about the application domain.
Use props, callbacks, and snippets as the interfaces for shared UI components
where possible.

## Component Boundaries

A component has one primary responsibility, such as display, user interaction,
or composition of other components.

A component can keep its presentation state local when all of the following apply.

* The state belongs only to the component.
* Independent neighboring components can work without it.
* It does not represent a distinct application use case.

Extract state and behavior into a `*.svelte.ts` presentation model when the component
starts to do any of the following.

* Coordinate several user actions.
* Manage asynchronous scenarios.
* Contain substantial `$state` or `$derived` logic.
* Reuse the same presentation logic.
* Mix markup with nontrivial state logic.

Keep business rules, direct use of Infrastructure, and construction of application
services outside the component. Use a separate presentation model to coordinate
independent use cases.

Container and page components may know about feature models and application use cases.

Low-level and reusable components should depend only on explicit props, callbacks,
snippets, and presentation-neutral types. Components lower in the UI hierarchy
should know less about the application context.

---

## Reactive State

Use Svelte 5 runes only in Presentation or code that directly supports Presentation.

### `$state`

Use `$state` for state owned by the current presentation scope. Give that state
an obvious owner. Move it to the application level only for a genuine application-wide
need beyond access from several components.

### `$derived`

Use `$derived` for a value fully determined by other reactive state.

```ts
let items = $state<Item[]>([]);
let selectedId = $state<string | null>(null);

let selected = $derived(
  items.find((item) => item.id === selectedId) ?? null,
);
```

Keep one source of truth for values that can be derived.

### `$effect`

Use `$effect` to synchronize reactive state with an external system, such as the
DOM, an imperative library, analytics, a browser API, or an external resource lifecycle.

Use ordinary derivation for internal state. An effect used to compute an internal
value produces an extra state update.

```ts
let total = $state(0);

$effect(() => {
  total = price * quantity;
});
```

Use `$derived` for the same calculation.

```ts
let total = $derived(price * quantity);
```

A chain of `$effect → state change → another $effect` suggests unclear ownership.

## Reactive Models

Extract nontrivial feature state and behavior from the `.svelte` component into a
presentation model. Svelte 5 allows reactive models in `.svelte.ts` files.

```text
features/
  item/
    item-view.svelte
    item-model.svelte.ts
```

A presentation model can contain `$state`, `$derived`, UI-specific methods, and calls
to application use cases. It belongs to Presentation even without markup and after
extraction from a component.

## State Ownership

Give each piece of mutable state a defined owner. Prefer this order of ownership.

```text
component
    ↓
feature
    ↓
page
    ↓
application scope
```

Lift state only when several independent consumers genuinely need it. Global
mutable state requires an explicit owner.

## State Management Policy

Give each piece of mutable state a single explicit owner at the lowest possible level.

```text
component
    ↓
feature
    ↓
page
    ↓
application scope
```

Lift state only when several independent consumers need it. Create global state
only when there is a current need.

### Derived State

Use `$derived` or a pure function for data that other state fully determines.
Keep a single copy of the state. Using `$effect` to synchronize two copies
is prohibited.

### Effects

Use `$effect` only to interact with an external imperative system. Keep state
copying, derivation, implicit application use cases triggered by incidental
dependency changes, and chains of reactive side effects outside effects.

Where possible, let user actions start use cases explicitly.

```ts
function submit() {
  model.submit();
}
```

The handler starts the use case directly. Effects remain reserved for external
synchronization.

### Shared State

Expose shared feature state through an explicit API.

```ts
feature.select(...)
feature.reload()
feature.state
```

Keep arbitrary mutable `$state` fields private. A global mutable singleton is
allowed only for truly application-wide state with a defined lifecycle.

---

## Context

Use Svelte Context to provide dependencies or state to a limited component tree.
Keep it scoped to that tree.

Expose a typed API.

```ts
provideItemContext(...)
useItemContext()
```

Keep string keys and direct `getContext` calls behind that API.
Use Application dependency injection to connect application dependencies.

## Async State

Represent asynchronous operation state explicitly.

```ts
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'error'; error: AppError };
```

The exact shape can vary. Choose a representation that prevents impossible
combinations of independent boolean fields.

```text
loading = true
data != null
error != null
```

## Errors

Infrastructure converts its errors into errors understood by Application.
Presentation decides how to display those errors to the user.

Keep interpretation of HTTP status codes and transport-specific error shapes out
of UI components. This example belongs outside the `.svelte` component.

```ts
if (error.response.status === 404) {
  ...
}
```

## Bootstrap

Construct concrete dependencies in one place.

```text
ApiClient
    ↓
ItemRepository
    ↓
LoadItem
    ↓
ItemModel
    ↓
ItemView
```

Bootstrap or the composition root chooses concrete implementations and passes
them to components through props, factories, or context. Components receive
the assembled dependency chain.

## Feature Boundaries

Group code primarily by user capability and domain. A feature-oriented layout
keeps code for one capability together.

```text
features/
  items/
    components/
    item-model.svelte.ts
    ...
  chart/
    components/
    chart-model.svelte.ts
    ...
```

Global directories organized by technical file type can grow into collections
of unrelated code.

```text
components/
models/
helpers/
services/
```

Extract shared code when actual shared usage exists.

## Feature Structure

A feature is the smallest vertical unit of a user capability. Group feature code
by purpose. The recommended layout is as follows.

```text
features/
  item-search/
    components/
      item-search.svelte
      item-result.svelte

    item-search-model.svelte.ts
    item-search.types.ts
```

A feature can contain the following.

* Components
* Presentation models
* Presentation-specific types
* Feature-local formatting and mapping
* Feature-local utilities

Keep infrastructure implementations, application-wide use cases, domain
entities, and generic UI primitives in their owning layers.

A feature can use these dependencies.

```text
Presentation shared code
Application
Domain
```

Keep neighboring features independent. When two features need the same behavior,
move it into a shared Presentation abstraction, provide it through Application,
or express it in Domain. Keep imports of the neighboring feature's internals
out of either feature.

A page is a composition boundary. It can combine several features and
coordinate their interaction. Keep the following dependency out of feature
implementations.

```text
feature A → feature B
```

Compose through the page.

```text
feature A
    ↓
   page
    ↑
feature B
```

Create shared code after actual reuse appears. Keep code local until it has a
current shared use.

---

## Shared UI

Keep `shared` for domain-independent UI primitives and shared presentation utilities.

```text
Button
Input
Modal
Spinner
Tabs
```

A component that knows about a specific business entity belongs with that
entity's Presentation code, even when two places use it.

## Framework Boundary

Svelte is a Presentation implementation detail. Keep Svelte API imports inside
Presentation.

```text
domain/**         → no svelte imports
application/**    → no svelte imports
```

The boundary also applies to `.svelte.ts`. Rune support outside components
does not expand the role of Application or Domain.

## Architectural Test

For new code, answer these four questions.

1. Who owns this state?
2. Which layer owns this behavior?
3. Which dependencies may this layer use?
4. Can Svelte be removed without rewriting Domain or Application?

If the last answer is no, check whether Presentation has crossed a boundary into
the inner layers.
