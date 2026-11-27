# Dependency policy

> Type: Policy. This document defines when to add or update the project's npm dependencies.

## Main principle

Add a dependency only when it solves a recurring, nontrivial problem better than a local
implementation and justifies its maintenance cost.

The project supports npm as its only package manager. Its `package-lock.json`
makes installation reproducible and must be updated alongside `package.json`.

## Decision gate

Review the following before adding a dependency.

1. Whether the platform, SvelteKit, or an existing package already provides the feature.
2. Whether the package belongs to the runtime or only to development.
3. Compatibility with the current Svelte, Vite, SSR, and Node versions.
4. Whether the package enters the browser bundle and what it costs in bundle size and runtime.
5. Whether the package is maintained and has a clear license and security history.
6. Whether a project-owned facade can contain the external API.

## Appropriate dependencies

- A maintained library for a complex accessibility, format, or protocol problem
- An official framework adapter or plugin required at runtime or build time
- A typed client for a supported external contract
- A UI icon set behind a local facade
- A testing or tooling package for a newly approved validation workflow

## Dependencies to avoid

- A package for a single simple function
- A wrapper over a native browser or Node API with no new responsibility
- A second tool that duplicates an existing lint, test, or build tool
- A large UI framework for one control
- A browser package without SSR support or a designed isolation boundary
- A package whose only benefit is shorter syntax
- A dependency for future use with no current consumer

## Runtime boundary

Contain an external API when doing so protects a project contract. In particular,
keep provider-owned types from spreading through reusable UI without a defined boundary.

Add a facade when a dependency has several consumers or its API should stay outside
the project's own contract. A facade is optional for other dependencies.

## Updates

Apply patch and minor updates in a separate task after reviewing the release notes,
peer ranges, and actual dependency graph. Apply major updates separately and explicitly
check the migration guide and runtime and build behavior.

Combine a dependency update with a feature or visual change only when that change
requires the update.

Check the following after updating dependencies.

- `npm install` and lockfile consistency
- `npm run lint`
- `svelte-check`
- `npm test`
- `npm run build`
- A relevant runtime smoke test
- `npm audit` at the agreed audit level

Use `overrides` for a specific compatibility or security case. Explain and verify any
override that affects incompatible major versions in the dependency graph.
