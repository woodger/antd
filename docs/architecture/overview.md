# @woodger/antd architecture

This repository contains a standalone Ant Design library for Svelte 5 and TypeScript.
You can develop and test the library independently of the consuming application.

## Structure

```text
src/lib/        library components and shared subsystems
tests/package/  SSR checks for the built public package
tests/browser/  component browser checks and their fixtures
tests/reference/ shared reference data for tests
tools/          coverage registry and CSS extraction
docs/           documentation, policies, and registry data
dist/           svelte-package output, excluded from Git
.upstream/      local Ant Design reference and npm archives, excluded from Git
```

Svelte components sit alongside their types, internal modules, and unit tests.
`DatePicker`, `RangePicker`, `TimePicker`, and `TimeRangePicker` share input and panel
implementations in `picker/`. Modules used by multiple components live in directories
named for their role, such as `theme/`, `popup/`, and `virtual-list/`.

Package checks in `tests/package` and browser specs in `tests/browser` also follow component
and subsystem boundaries. The browser Vite test app uses `tests/browser/fixtures` as its root.

`package.json` declares the root entry point for components and types, the `locale/*` dictionaries,
and `styles.css`. The porting registry lives in this repository for CLI commands and checks.
Library components are independent of SvelteKit APIs, application routes, and application models.

Tabs follows upstream's split between Tabs and TabNavList. `Tabs.svelte` owns selection and panels,
and `TabsNav.svelte` owns headers, the indicator, overflow, and keyboard interaction. The private
navigation API lets callers restore focus from a panel being hidden to its header. Panel content stays
independent of the navigation instance.

The registry resolves local files relative to this repository. Stable `integration:` references
identify evidence owned by consumers. Their file paths and browser fixture directories belong to
the consumer's repository. Consumers validate these references against the installed npm package
metadata. Test execution is checked separately.

The library tests component behavior in its own Playwright and Vite test app, which imports the
built public package and its own fixtures. The consumer owns application models, the gallery,
and its scenarios. `tools/test-boundaries.test.mjs` enforces the test app's import boundaries.

`src/lib/architecture.test.ts` enforces the runtime import boundaries. See
[UI architecture](ui.md) for dependency direction, the [readme](../../readme.md) for commands,
and the [development policies](../policy/index.md) for repository rules.
