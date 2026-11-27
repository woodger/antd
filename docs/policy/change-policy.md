# Change policy

> Type: Policy. This document defines how to make the smallest safe change to the project.

## Decision gate

Make a change only when the current task directly requires it or when it is
necessary for a correct result. Treat existing code and observable behavior as
intentional unless repository evidence indicates otherwise.

Determine the following before editing.

1. Which task requirement the change addresses.
2. How the affected scenario works today and which part of the code owns it.
3. Whether the change affects a public component API, URL, persistence, network boundary,
   SSR or browser behavior, accessibility, or the build pipeline.
4. Whether a smaller, more localized diff can produce the same result.
5. Which tests and documents express the existing contract.

Get the owner's decision before editing if different interpretations would materially affect
runtime, a public contract, stored data, security, or architecture.

## Understand the code before editing

Review the parts that relate to the task.

- Svelte components, controllers, and engines
- Route loaders and server handlers
- Configuration, types, and the public `index.ts`
- Tests and live UI examples
- Relevant documents and policies

Use repository evidence to establish framework behavior, data formats, and dependency
direction whenever it is available.

## Keep changes minimal

The scope includes the code the task directly requires, affected tests and documentation,
and the smallest supporting changes needed for correctness.

The following require a separate justification.

- Broad cleanup or formatting
- Mass renaming
- Redesigning adjacent UI
- Changing dependencies, scripts, Vite or SvelteKit configuration, or deployment
- Changing URLs, storage schemas, or API requests
- Moving files or public exports
- Fixing independent issues along the way

## Local improvements

A small adjacent improvement is allowed only when it meets all of these conditions.

- It directly supports the current task.
- It preserves observable behavior.
- It stays local and testable.
- It introduces no new public contract or architectural boundary.

Describe larger improvements separately. Implement them only when the scope expands.

## UI properties to preserve

Preserve these properties unless the task requires a change.

- SSR and hydration
- Keyboard navigation, focus order, and accessible names
- Native element semantics and ARIA
- Responsive layout and hit targets
- Public props, callback contracts, and value formats
- The order of side effects and network requests
- URL and query semantics
- `localStorage` keys, versions, and fallback behavior
- Handling of loading, error, and disabled states
- Canvas Worker lifecycle and message contracts
- The adapter-node build output and supported npm commands

A visual change affects the UI contract when it changes control accessibility,
navigation, data legibility, or the size of an interactive area.

## Public contracts

Changes to the following are compatibility-sensitive.

- Routes and accepted query parameters
- Server response status and security boundaries
- Exported component, type, and configuration APIs
- Date, table, clipboard output, or persisted JSON formats
- Generated OpenAPI contracts
- Worker messages
- Environment variables
- Package scripts and deployment entry points

Change these contracts only as an explicit part of the task. Update the implementation,
tests, and living documentation together.

## Working in a shared checkout

Run `git status` before editing. Treat existing changes as belonging to the user or
parallel work until you establish their origin.

Preserve other contributors' changes. Keep them out of your reverts, overwrites,
formatting changes, and cleanup. When work overlaps in a file, preserve both changes.
Stop if you cannot combine them safely.

## Cleanup and active code

Code or an asset is active when it has a verified role in the product runtime,
developer showcase, build graph, test graph, or a supported public or internal
contract. Compilation, a barrel export, and a test each need additional evidence
to establish product runtime usage.

Consider each graph separately in a deletion audit.

- The product runtime starts at SvelteKit routes, loaders, and handlers and follows their
  imports, including server boundaries, Workers, and static assets.
- The build graph includes scripts, the lockfile, Svelte, Vite, and TypeScript configuration,
  environment declarations, and generated types.
- The test graph starts at test files and establishes the behavior covered by the tests.
  Establishing product runtime usage requires the product runtime graph.

SvelteKit route conventions, dynamic imports, and `new URL(..., import.meta.url)`
can connect a file without a conventional import. Classify code reachable only from
tests, the showcase, or a barrel export separately. Keep it until its role is established.

Use these audit decisions.

- `keep` applies to verified product, developer, build, or contract code.
- `delete candidate` applies when there is no active graph, framework binding,
  supported API, or documented intent.
- `move to roadmap` applies to agreed future scope with no current consumer.
- `needs owner decision` applies to test-only implementations, barrel-only exports,
  disconnected code, or a significant role without a verified entry point.

Before deciding, inspect imports by path and symbol, the public `index.ts`, route
conventions, dynamic and Worker references, tests and mocks, documentation and the
showcase, scripts, configuration, aliases, CSS and static references, storage and
runtime keys, and the role of generated declarations. A filename search alone is
insufficient.

Limit deletion to the exact targets listed in advance. Preserve behavior, module design,
dependencies, and scripts during the deletion pass. Keep targets requiring an owner's
decision. After deleting the listed targets, check the affected graphs and report
what you removed and how to restore it.

## Environment problems

Keep project code, checks, and scripts independent of container or local machine
problems. Use an equivalent local command if it preserves the purpose of the check
and leaves the project intact. If a required tool is unavailable, report the specific
check affected and the reason.

## Verify the result

Run the narrowest relevant check first, then broaden validation in proportion to the
risk. Use a fresh build to validate changed source whenever a check depends on build output.

Before finishing, verify the following.

- The change satisfies the original requirement.
- It preserves independent properties.
- The scope matches the task.
- Relevant tests and documentation are up to date.
- The diff contains only intended changes.

See the [testing policy](./testing-policy.md) for choosing tests and the
[scripts policy](./scripts-policy.md) for build and script constraints.
