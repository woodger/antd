# Documentation policy

> Type: Policy. This document defines Markdown document roles, the structure of `docs`,
> and how to maintain the documentation.

## Purpose

Documentation must be clear, current, and connected to the part of the project it describes.

## Document roles

| Type | Question it answers | Role |
| --- | --- | --- |
| `Navigation` | What should I read next? | Map with no system contract of its own |
| `Policy` | Which rules are mandatory? | Living document that defines rules |
| `Reference` | What format or behavior applies? | Precise description of the current contract |
| `Overview` | How do the parts of the system fit together? | Current high-level map |
| `Design Note` | How does a particular boundary work, and why? | Focused living document |
| `Deployment` | How do I deploy the runtime? | Reproducible instructions |
| `ADR` | Why did we make a long-term decision? | Historical record |
| `Roadmap` | What agreed scope is deferred? | Future work outside the runtime contract |

Give each document one primary role. Current policies and references remain authoritative
when an ADR or roadmap also covers the topic.

An architecture document can define lasting boundaries and dependency direction while
retaining architecture as its primary role. Operational and machine-verifiable contracts
remain with their respective owners.

## Sources of exact contracts

Use Markdown to explain behavior and direct readers to a verifiable source. Keep a single
definition of each interface.

| Contract | Source of the exact definition |
| --- | --- |
| Props, callbacks, snippets, and refs | Source declarations in `src/lib`, which produce the published declarations |
| Public entry points, dependencies, and package metadata | [package.json](../../package.json) |
| Porting coverage and the pinned upstream version | [registry.json](../reference/ant-design-porting/registry.json) |
| Vendored CSS extraction | [CSS recipes](../../tools/ant-design-css-recipes.json) |
| Development CLI command paths, options, and help | [Command definitions](../../tools/cli-core.mjs) and runtime help |

When the public API changes, update its source types, JSDoc, examples, and affected tests.
Use the README to describe usage and limitations. Keep the full list of types and props
in the source. Apply new formatting rules without a mass rewrite of existing documentation.

Use `npm run cli -- --help` and `npm run cli -- <command> --help` for current CLI help.
When a command changes, update its definitions, help, and parser and help tests together.
Use Markdown to explain the workflow and link to help, where the full option list lives.

## Project structure

```text
readme.md                 quick start and main links
CHANGELOG.md              history of notable changes
docs/README.md            documentation map
docs/architecture/        current system boundaries
docs/reference/           exact formats and configuration
docs/deployment/          deployment guides
docs/policy/              binding development rules
```

The root file is intentionally named `readme.md`. The full set of contribution rules lives
in `docs/policy`. The root readme and `docs/README.md` point to the policy index in place
of a separate `CONTRIBUTING.md`.

Create a top-level category in `docs` only for a new, lasting document role. A single
file is insufficient reason to add a category.

## Module documentation

Documentation for a stable reusable or feature module typically includes the following.

1. Purpose and responsibility boundaries.
2. Source location and public entry point.
3. A minimal example.
4. Public behavior and important invariants.
5. Accessibility for UI.
6. State and side effects when they are part of the contract.
7. Tests and the live showcase.
8. Limitations and related documents.

Keep the reference focused on the contract. Private functions and full TypeScript type
definitions belong in the source.

## UI showcase

Keep Markdown content out of application imports and production styles out of the
showcase when synchronizing documentation.

The project uses plain Markdown without a mandatory documentation build. Add VitePress
or another engine only in a separate task that addresses a real publishing, search,
or versioning need.

## Policies

- A policy describes the current binding rule. Record its history elsewhere.
- Keep a policy change minimal and tied to a project rule change or removal of unrelated
  or obsolete context.
- Keep `docs/policy/index.md` as the complete navigation for the policy set.

## Architecture Decision Records

Write an ADR when there are several realistic alternatives and the decision is hard
to reverse, affects several modules, or sets a long-term constraint.

Use living documentation for prop lists, directory structure, current data flow,
deployment steps, and individual component implementations. If the first ADR is needed,
create its directory and index in the same explicitly agreed task.

Preserve accepted ADRs as historical records. Record a new decision in a new ADR and
update the living documentation separately.

## When to update documentation

Update documentation alongside code when any of the following changes.

- Public component API or accessibility behavior
- URL, query, storage, or date formats
- Module ownership or dependency direction
- Environment, scripts, build, or deployment
- A supported workflow
- A policy

A temporary implementation detail can stay with its implementation.

## Links and examples

- Use relative Markdown links to documents the reader should open.
- Keep each example minimal and aligned with the current API.
- Use renderer-specific syntax only when the corresponding documentation renderer is configured.
- Keep secrets, local credentials, and mutable output out of the documentation.
- Update every incoming link in the same change that moves a document.

## Validation

After editing documentation, check local links, a single H1, heading hierarchy, closed
code fences, current paths, and agreement with source code and tests. Run `git diff --check`.
