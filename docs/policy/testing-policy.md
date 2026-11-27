# Testing policy

> Type: Policy. This document defines testability, test structure, and test naming requirements.

## Purpose

A test protects an observable contract and addresses a specific risk. It should
fail for an incorrect production algorithm and avoid coupling to incidental
object structure or mirroring the implementation.

> What behavior or boundary does this test protect?

## Current test setup

`npm test` runs Vitest from the repository root with the following settings.

- Environment: `node`
- Includes: `src/**/*.{test,spec}.{js,ts}` and `tools/**/*.{test,spec}.mjs`
- Required assertions: `expect.requireAssertions`
- External network and infrastructure are excluded.

`npm run check` checks types and Svelte templates without SvelteKit.
`npm run cli -- check tests` builds the package and checks the types of tests and browser fixtures.

`npm run cli -- test package` builds the package and runs Vitest for `tests/package`.
`npm run cli -- test browser` builds the package and runs Playwright Chromium for
`tests/browser`. The Vite test app uses the built package's public exports.
The library owns the fixture modules and data. This setup checks DOM behavior,
focus, keyboard interaction, events, themes, RTL, and component lifecycles
independently of the consumer website's source.

Consumers test their own pages and application scenarios. The registry's
`integration:` references define those checks. The local registry check verifies
their identifiers against the registry. Consumers run their scenarios with the
npm package installed.

A successful `npm test` covers the unit test setup. Use the relevant runtime
checks for real DOM and focus behavior, hydration, responsive layout, Canvas
integration, or a production deployment.

Add browser or e2e tooling as a separate dependency and test pipeline change.

Keep checks independent of hidden conditional skips based on a service, browser,
or environment variable. Report an unavailable environment explicitly as a
blocked check.

## Behavior that requires tests

Test new or changed behavior in the following areas.

- Parsing, formatting, validation, and normalization
- Date, time, and time zone boundaries
- URL query contracts and HTTP statuses
- Storage serialization, versions, and fallbacks
- Server allowlists, token handling, and response forwarding
- Chart layout, pan calculations, and drawing primitives
- Table formatting, collapse, and clipboard representation
- Reusable keyboard, list, and calendar engines
- Concurrency guards, fallbacks, and error branches that risk stale or corrupt state
- Regression cases for fixed defects

Test complex pure logic in a reusable component at the engine boundary. Test
the component's DOM accessibility separately.

## Behavior that usually needs no separate unit test

- Trivial Svelte composition without its own logic
- A simple pass-through prop or callback
- CSS declarations or static markup
- Framework boilerplate
- A private helper fully covered through public behavior
- A re-export without transformation
- Generated OpenAPI declarations

Visual or accessibility changes may still require browser smoke tests or manual
inspection. Distinguish automated and manual checks in the final report.

## Test levels

### Pure unit

Prefer this level for `*.engine.ts`, configuration, parsers, and formatters.
Check inputs and outputs independently of the DOM, the Svelte lifecycle, the clock,
and the network.

### Server boundary

Test route loaders and handlers, server Bootstrap, and server Infrastructure
with controlled `fetch` and environment mocks. Assert observable status, data, or
security behavior. Verify mock calls only in support of that behavior.

### Rendering primitives

Canvas drawing functions can use a minimal recording context when the assertions
express the visible primitives and order that the contract requires. A browser
check is required to verify real rendering.

### Component and browser behavior

Focus, keyboard events, popover dismissal, the accessibility tree, hydration, and
responsive behavior require a browser-capable check. A test of a private function
covers only that function's behavior.

For a significant UI risk, run relevant browser tests or report the manual browser
smoke check you performed. Add tools outside the existing setup as a separate change.

## Observable behavior

Prefer assertions on the following.

- Return values
- Thrown or rejected errors
- HTTP responses
- Serialized output
- Public controller state after an action
- Recorded visible draw operations
- Protection against token or private data leaks
- Preservation of a supported side effect

Assert more than mock call counts when the same counts could occur with an incorrect
production result.

## Structure and naming

Use the project's Vitest style.

```ts
describe('resolvePanDelta', () => {
  it('ignores pointer movement below the drag threshold', () => {
    const result = resolvePanDelta(input);

    expect(result).toBe(0);
  });
});
```

Use the top-level `describe` to name the public function, module contract, or
component engine. Use `it` to describe the expected behavior with a direct verb.

- `returns`, `rejects`, `parses`, `formats`
- `preserves`, `normalizes`, `maps`, `builds`
- `ignores`, `prevents`, `keeps`, `does not`

Avoid `works`, `handles correctly`, `test ...`, and repeating the subject in
every case name.

Nest `describe` blocks only when the subject has several distinct public
operations. Keep the hierarchy focused on those operations.

## Arrange, Act, Assert

Separate the three phases with blank lines when they are distinct. Short tests
can omit `Arrange/Act/Assert` comments.

Group assertions that express a single outcome or invariant. Give independent
failure conditions their own cases.

## Test data

Use the smallest data set that realistically represents the contract.

- Show behavior-critical inputs inside `it`.
- Include only fields that participate in the scenario.
- Control any random value or use of the current clock.
- Share a large fixture only for a stable boundary shape when local repetition reduces clarity.
- Derive expected values independently of the production algorithm.

For matrix and time-series tests, choose the smallest data set that exposes the
alignment, boundary, or null behavior.

Use owned data and explicit dependencies in synthetic unit fixtures. Keep operational
configuration, production defaults, and deployment identities out of tests for
unrelated parsers, resolvers, or engines.

A separate conformance check may read the real artifact that it tests, such as an
npm package, declarations, a CSS recipe, or the registry. Name that artifact in
the suite or test name. Read it unchanged and keep it out of fixtures for unrelated
scenarios. Verify its current contract independently of file moves or renames.

Browser fixtures and local lifecycle helpers can isolate a scenario while keeping
important inputs, state, and expected results visible. Each test creates its own data
and runs independently of other scenarios' state.

## Isolation

Run tests independently of external networks and services, production credentials,
test file order, mutable globals from another suite, the uncontrolled current date
or time zone, and stale `build` or `.svelte-kit` output. Use real `localStorage`
only in browser integration tests.

Restore changed environment variables, timers, spies, and globals after each case
or suite.

## Async and concurrency

Await the promise under test. Control the promise or timer when possible instead
of waiting with an arbitrary `setTimeout`.

When implementing latest-request-wins logic, check that a late response from an
older request leaves newer state intact if that behavior is observable at the
test boundary.

Control timers and time through the existing runner in unit tests. When testing
an application delay in the browser, control time or operation completion. Wait
for observable DOM state. Clean up test clocks and interceptors.

When verifying that a late callback stays suppressed, progress past the point at
which it would have run. Advance the controlled clock or complete the deferred
operation after reset or unmount. Check actual CSS animations in the browser.

## Error and boundary cases

Choose the cases that apply to the module's contract.

- Empty or missing input
- Minimum and maximum allowed values
- Invalid dates or formats
- Duplicate query parameters
- Range or window overflow
- Null, NaN, or flat data in chart calculations
- Repeated calls and cleanup
- Unavailable or disabled branches
- Storage version mismatches and malformed JSON
- Missing private tokens and unknown proxy paths

## Regression tests

A regression test protects correct current behavior. Name the outcome it protects.
Add a short comment on the historical context only when it explains an otherwise
unclear scenario.

When removing supported behavior, remove tests and fixtures dedicated to it.
Keep tests for historical API names when an active compatibility contract requires them.

Deprecated Ant Design props, aliases, and adapters remain part of the public
contract while the library supports them. Keep their regression tests for as
long as the corresponding behavior is supported.

## Snapshots and visual assertions

Use a snapshot only for a stable output contract when narrower assertions express
the intent less clearly. Prefer semantic assertions for large Svelte DOM trees.

Pixel screenshots and visual regression testing require approved browser tooling
and a deterministic environment. Report a one-off screenshot as a manual check.

## Scope and validation

Limit a test diff to the affected behavior. Rewriting adjacent suites, changing
Vitest configuration, and introducing another test framework require explicit scope.

Run the narrow test file first, then `npm test`. Add lint, `svelte-check`, a build,
and smoke checks in proportion to the change.

Report a pass only after the command runs successfully.

## Test comments

Start with a clear test name and test data. Add a comment only when the test's
structure cannot express a production risk, regression context, non-obvious
fixture, or the reason for an expected value.

Use comments to explain the following when needed.

- A time zone or local date invariant, or unusual valid upstream input
- The formula for a non-obvious expected value
- A limitation of a mock Canvas, `fetch`, or browser API
- An adjacent responsibility that the test deliberately leaves outside its scope
- A fixture whose important value is null, zero, duplicated, or out of range

Short tests can omit `Arrange`, `Act`, `Assert`, `create mock`, `call function`,
and `check result` comments. Use `Given`, `When`, and `Then` only in long
integration-style scenarios when they help readers navigate.

Write comments in English. Describe the current risk and make the comment useful
across implementation changes that preserve behavior.
