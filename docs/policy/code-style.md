# Code style policy

> Type: Policy. This document defines visual structure, naming, and comment conventions
> for TypeScript, Svelte, CSS, and tests while preserving behavior.

## Main principle

Style should make logical boundaries visible and match the surrounding code. Reformat
code in bulk only when the task explicitly calls for it. Architecture decisions
continue to govern structure.

Handwritten implementation files in `src` use two-space indentation, semicolons,
and single quotes in TypeScript and Svelte scripts. Keep the established format
of configuration, declaration, and generated files.

## Line length and visual structure

Aim for 100 characters including indentation in TypeScript, JavaScript, `<script>`
blocks, and tests. Keep long URLs, paths, regular expressions, and string literals
intact when a line exceeds the target.

Put one independent logical step on each line. Give key construction, lookup,
validation, and field extraction their own statements. Name intermediate values
for their role. Multiple calls are fine when they form one clear operation.
Simple `?.` and `??` preserve the distinction between a missing value and valid
`0`, `false`, or `''`. Use a check when needed and justify any non-null assertion
or cast. Keep state declarations, side effects, and assertions on separate lines
instead of combining statements with semicolons.

Expand data checks, error handling, nested or multiline branches, loops, callbacks,
and lifecycle blocks with several actions. A short form is fine for an obvious local action.

Keep a signature on one line when it fits the target width. In long signatures,
destructuring patterns, objects, and calls, start each field or argument on a
separate line. Keep short, clear literals and arguments compact. Simple ternaries
are allowed. Make complex choices visible in separate statements or branches.

Start `else`, `else if`, and `catch` on the line after the previous closing brace,
at the same indentation. This rule applies to code syntax.

Introducing intermediate variables, extracting a function, and changing a branch
are refactoring. Keep a whitespace-only task limited to spaces and line breaks.
Preserve evaluation order, short-circuit behavior, and Svelte reactivity boundaries.

Account for text nodes and significant spaces between Svelte elements. Preserve
the placement of text and snippet boundaries where it matters. CSS and existing
configuration files keep their own format.

## Function boundaries

The main function should show the sequence of actions and the parts of the result.
An independent operation and its local variables may move into a named local function
even when there is only one caller. For complex collection construction, separate
building an entry from traversing the collection. Use an explicit loop when nested
transformations hide checks or side effects. Keep simple transformations compact.
Avoid chains of trivial functions, generic mechanisms, and new layers added solely
to shorten a method.

Within a function or at module scope, keep `try` blocks out of another `try`, `catch`,
or `finally` block. Extract an operation with its own error handling into a named
function. Preserve the catch boundary, exception propagation, operation order,
and cleanup.

## Vertical spacing

Separate independent logical steps within a function with one blank line.
A multiline call, object, or state declaration forms a visual block.

Use spacing to separate these steps where they exist.

- Reading or preparing state
- Validation and guard clauses
- Data transformation
- Side effects or external calls
- Result handling
- Returning the result

Keep a check adjacent to its immediate action when they form one operation.

## TypeScript

- Prefer clear types at module boundaries and inference inside small implementations.
- Avoid decorative type aliases that only restate an expression.
- Use `unknown` and narrowing for external inputs. Use casts only when they have adequate justification.
- Prefer guard clauses to deep nesting when they keep the lifecycle visible.
- Define each class in one file.
- When practical, assign an instance created with `new` to a named variable before
  passing it into a call, comparing it, or invoking a method on it. Name the variable
  for the instance's role. Preserve the order and conditions of construction.
  A direct `throw new Error(...)` is allowed.
- Preserve side-effect order when adjusting the layout of code.

## Svelte 5

The project uses rune mode.

- Declare props with `$props` and type them at the component boundary.
- Use bindable state only when two-way binding is part of the component API.
- Use `$derived` for computed values without side effects.
- Use `$effect` to synchronize with runtime or external state. Use ordinary
  computation for values that require no synchronization.
- Clean up listeners, timers, Workers, and other resources in the corresponding lifecycle.
- Keep feature orchestration out of markup expressions.
- Preserve reactive reads, `$derived` and `$effect` dependencies, evaluation timing,
  object identity, and bindings when extracting computations.

Use local functions and closures for instance state and resource management.
Keep them in scope when the only reason to move them is formatting. Use `bind`,
`call`, and `apply` when they preserve a native DOM API receiver or another required
contract. Explain a non-obvious reason beside the call.

Follow the local order of `script`, `style`, and markup within each `.svelte` file.
Preserve the order of large blocks in unrelated tasks.

## Markup and accessibility

- Use the appropriate native element before adding ARIA.
- Use `button`, `a`, `input`, or another native control for its intended interaction.
- Treat labels, accessible names, focus state, and keyboard behavior as part of the implementation.
- Hide decorative SVG icons from the accessibility tree and name the interactive control.
- When removing a focus outline, provide an equivalent `:focus-visible` state.

## CSS and layout

- Put at most one CSS property declaration on each line.
- Keep component-specific styles scoped to the component.
- Use `:global` only for an explicit boundary with a child component or document-level styling.
- Share recurring theme values through existing CSS variables or configuration when they
  genuinely represent shared behavior.
- Check responsive rules near the affected breakpoint.
- Use a fixed size when it is part of a known control or canvas contract. Check that it
  works in narrow viewports.
- Limit a local visual change to the affected part of the style block.

## Tests

Separate Arrange, Act, and Assert with blank lines when they are distinct phases.
Keep related assertions for one result together.

Test code follows the same TypeScript rules. Small local fixtures and mocks are
allowed when they make a scenario clear.

## Naming

Choose names that express roles using established project terminology and reflect
actual architectural or runtime behavior.

- Use `camelCase` for variables, functions, callbacks, and exported constants.
- Use `PascalCase` for types, interfaces, classes, Svelte components, and component files.
- Use `kebab-case` for ordinary module files, URL segments, CSS classes, and
  project-owned runtime keys.
- Use `SCREAMING_SNAKE_CASE` for external contracts, primarily environment variables
  and stable external symbolic values.

Keep external contract names, SvelteKit filenames, and framework exports verbatim.
Preserve the names of published props, callbacks, and exports, including
`UPLOAD_LIST_IGNORE` and `TREE_SELECT_SHOW_*`, when changing style. Keep names in
generated declarations. Adapt external types to project-owned types at the boundary
when needed.

Use these conventions for components and functions.

- Name a component with a noun, such as `DateTimePicker`.
- Prefix DOM handlers with `handle` and callback props with `on`.
- Prefer `is`, `has`, or `can` for a boolean prop or state, or name the state directly
  in positive terms.
- Use `parse`, `format`, `resolve`, `normalize`, `build`, `create`, `get`, `is`,
  `has`, and `can` according to the function's contract.
- Use generic names such as `process`, `data`, `item`, and `helper` only when the
  context makes their meaning unambiguous.

Use distinct local names for record IDs, indexes, request revisions, cancellation
controllers, and state when they occur in the same operation.

A role suffix must match the file's contents. Use `*.engine.ts` for nontrivial
pure logic, `*.model.svelte.ts` for rune-based presentation models, `*.draw.ts` for
Canvas rendering, and `*.test.ts` for Vitest tests. Create `utils.ts`, `helpers.ts`,
or `common.ts` only for a clear, cohesive responsibility.

URL and storage keys, serialized fields, and Worker messages are compatibility-sensitive.
Treat changes to them as contract changes. Keep established API terms in code and documentation.

Use this policy for necessary renames. Check imports, exports, tests, docs, CSS
selectors, storage and URL keys, and dynamic references.

## Comments

Explain a reason, invariant, lifecycle constraint, or external limitation that
names and code structure cannot make clear on their own. Keep comments focused on
the current code. Leave syntax explanations, summaries of obvious lines, and
refactoring history outside code comments.

Comments are appropriate for SSR and browser boundaries, time zone and
serialization contracts, stale request protection, Canvas and Worker invariants,
accessibility and browser workarounds, compatibility fallbacks, and an
intentional absence of a side effect. Obvious handlers outside utility modules,
simple guards, state assignments, markup, and CSS declarations usually speak for themselves.

At the top of a nontrivial production module, describe its responsibility,
boundaries, and essential invariants. Simple re-exports, obvious types, and
trivial composition can omit the module comment.

Give published props and component configuration a short JSDoc comment describing
their purpose. Document non-obvious fields, callbacks, and methods, including
defaults, priority between local and inherited values, controlled and default
behavior, events, ref constraints, and differences from the Ant Design API.
Write these comments on the original declarations so they appear in the package
declarations. Keep that single source when re-exporting them.

In utility modules, tools, and test support modules, document every function
and method before its declaration, including local operations, returned handlers,
and object methods. Explain the purpose, constraints, side effects, or local state.
Use the module's purpose to determine its role. For other exported and internal APIs,
add JSDoc when names and types leave input limits, side effects, errors, lifecycle,
or a guarantee unclear. Obvious internal types and helpers outside utility modules
can omit formulaic comments.

Add a Svelte markup or CSS comment only for a non-obvious accessibility, layout,
or browser boundary.

A TODO must name the current limitation and the condition for revisiting it.
Write comments in English. Regenerate generated code and its comments from their sources.

After a behavior change, verify that comments in the affected area are still current.
Keep change history in Git, the changelog, or an ADR.

## Exceptions

Exclude the following from mechanical formatting.

- Generated code
- Declaration files with an established framework style
- Large string literals and expected text output
- Data matrices and fixtures whose shape matters to a test
- Existing configuration files with a distinct local style
- User changes outside the task's scope

Explain any other deviation in a comment near the code. Name the rule and the reason
following it here would make the code worse or break a contract. Cases a rule already
allows need no separate justification.

## Style-only changes

A style-only task preserves names, imports, statement order, types, and behavior.
Commit mechanical formatting separately from structural refactoring. In a feature
task, format only the code directly involved in the change.
