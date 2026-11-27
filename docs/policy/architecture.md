# Architecture policy

> Type: Policy. This document defines library boundaries, dependency direction, file placement,
> and when to extract an abstraction.

The library lives in `src/lib` and is independent of application source code and SvelteKit.
The route and application-layer rules below govern consumers of the library. They define
no additional modules in this repository. [Architecture overview](../architecture/overview.md)

## Boundary map

```text
src/routes
├── URL, SSR loaders, page composition
└── same-origin HTTP handlers
        │
        ▼
Presentation ──► Application ──► Domain
Infrastructure ──► Application / Domain
Bootstrap ──► Presentation / Application / Infrastructure / Domain
```

## `src/routes`

Routes own the path and query contract, SSR loading and HTTP status, SvelteKit page and
layout composition, same-origin HTTP endpoints, and the conversion from route input
to feature input.

Keep feature calculations and shared UI logic in their owning modules. Project-specific
server validation may live in `+page.server.ts` when it belongs to the URL or HTTP boundary.

Keep `+page.server.ts`, `+server.ts`, server Bootstrap, and server Infrastructure out of
browser component imports.

## Feature modules

Each feature module owns one user scenario and its orchestration.

Use these roles when splitting a feature.

- `*.svelte` contains composition, markup, and local view styles.
- `*.model.svelte.ts` contains reactive presentation state and explicit use case calls.
- `*.engine.ts` contains pure calculations, parsing, and normalization.
- `config.ts` contains deterministic defaults and limits.
- `types.ts` contains feature-level contracts.

Create only the files a component needs. A feature module may depend on reusable UI and
shared utilities. Keep route files and private server environment outside its dependencies.

## Reusable UI

Library components live in `src/lib` and are independent of the application domain and
specific routes. General-purpose composition controls live in `src/lib/layout`.

A reusable component has a domain-neutral API, preserves native semantics and
accessibility, and stays independent of feature-specific network or storage side
effects and feature, route, or server modules.

Extract complex keyboard, calendar, or filtering logic into an engine only when that
simplifies the component and allows the behavior to be tested independently.

## Shared utilities

`src/lib/utils` is for general-purpose browser-aware or framework-aware mechanisms with
one clear responsibility, such as versioned storage.

Keep business rules, component markup, API request orchestration, and one-off helpers
in their owning modules. A function's reuse potential alone is insufficient justification
for placing it in `utils`.

## Server boundary

- Keep private tokens out of the browser bundle and page data.
- SSR may call a server client directly.
- Keep private environment variables out of feature components.
- Regenerate generated declarations to change them.
- Adapt provider types at the boundary when an internal module needs a narrower, stable contract.

## SSR and browser-only code

Code using `window`, `document`, `localStorage`, Canvas, Worker, or the Clipboard API must
account for SSR.

Use the Svelte lifecycle when an API is needed only after mount, `browser` from
`$app/environment` in a framework-aware utility, or an explicit server-only file for
private runtime behavior.

Resolve SSR issues at their architectural boundary. A `try/catch`, dynamic import,
or disabling SSR requires an architectural justification.

## State and side effects

- Keep local view state in the component.
- A controller can own reusable reactive feature state.
- Keep pure calculations and parsing in an engine where practical.
- Define URLs in the route contract or a dedicated query utility.
- Use `localStorage` only for UI preferences and versioned client state.
- Give network requests a clear owner and guard against stale results when requests can overlap.

Keep side effects with their owners. Test convenience alone is insufficient reason
to move a side effect into an engine.

## Public boundaries

The following contracts are architecturally significant.

- Exports from a module's `index.ts`
- Props and callback semantics of reusable components
- URLs, query parameters, and HTTP status
- Storage keys and serialized formats
- Worker messages
- Environment variables
- npm scripts and the adapter-node entry point

Changes to these boundaries require explicit scope, tests, and updates to the living
documentation.

## Extracting abstractions

An abstraction must represent a stable responsibility and simplify the current code.
A few identical lines or a hypothetical future use is insufficient justification.

Review the following before extracting an abstraction.

1. Whether the same behavior recurs beyond similarities in code shape.
2. Whether the new module has a clear name and one owner.
3. Whether its consumers become simpler.
4. Whether the abstraction obscures important differences in UI, state, or side effects.
5. Whether the public API can verify the reusable behavior.

As a heuristic, one use usually stays local, two warrant evaluating the concept's
stability, and repeated stable behavior may justify extraction. Use judgment instead
of a numerical threshold.

A neutral UI control, a pure engine for calendar, navigation, layout, or formatting,
a controller for related feature state, versioned storage, an icon facade, and a typed
API wrapper can be appropriate abstractions.

Avoid `utils.ts`, `helpers.ts`, or `common.ts` without a cohesive responsibility, a
wrapper over one line of a standard API with no new contract, a base component for
one shared CSS fragment, a generic engine whose options reproduce the original
implementation, a controller for one local boolean, an abstraction with no current
consumer, and a shared UI API that uses feature-specific terminology.

Separate the view from the engine when the component mixes markup with nontrivial
deterministic logic. Keep the engine independent of the DOM, Svelte state, and the
network when a pure function can express its responsibility. Test coverage alone is
insufficient reason to extract a simple calculation.

Preserve observable consumer behavior, test the new logic's stable contract, and
remove the old duplication in the same task. Add public exports only for actual
consumers and API options only for established needs.

## File placement and naming

Identify a file's owner before creating it. The owner may be a route, feature,
reusable UI, visualization, shared utility, server boundary, generated type,
documentation, or static asset.

Follow the existing patterns.

- `PascalCase.svelte` for a Svelte component
- `*.model.svelte.ts` for a rune-based presentation model
- `*.engine.ts` for nontrivial pure logic
- `*.test.ts` for a Vitest test
- `config.ts`, `types.ts`, and `index.ts` when the file has the corresponding role
- SvelteKit `+page`, `+layout`, and `+server` files only in the route tree

Define each class in one file. Create a directory for a stable responsibility.
A one-off helper belongs with its owner.

## Moves and architectural refactoring

Move code when its current owner is wrong or the task explicitly changes the boundary.
Shorter imports, directory symmetry, and aesthetic preferences are insufficient reasons.

Combine file moves, export renames, public API changes, changes to runtime behavior,
and test or build configuration rewrites only when they are necessary together.

Ask the owner for an architectural decision if the code and documentation cannot
establish the right owner.
