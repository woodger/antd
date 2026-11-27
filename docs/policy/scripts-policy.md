# Scripts and build policy

> Type: Policy. This document defines constraints for npm scripts, SvelteKit and Vite
> configuration, the test pipeline, and building the npm package.

## Supported commands

The local `package.json` defines these commands.

- `npm run build` uses `svelte-package` to build the npm package into `dist`.
- `npm run dev` builds the package in watch mode.
- `npm run lint` runs Oxlint on source code, tools, and configuration.
- `npm run check` checks Svelte and TypeScript.
- `npm test` runs Vitest for components and tools.
- `npm run cli -- ...` runs the development CLI through `icore`.

The CLI provides package checks and porting tools.

- `npm run cli -- check tests` checks Svelte and TypeScript in tests and fixtures.
- `npm run cli -- test package` builds the public package and runs its SSR checks.
- `npm run cli -- test browser` runs Playwright against the Vite test app.

Fixture type checking, package tests, and the browser test app read the current `dist`.
Their commands build the package before running checks that depend on it. The test app
runs on port `4175` independently of the homepage. The npm archive excludes the test app.
`playwright.config.ts` configures Playwright, its lifecycle, and its browser artifacts.

`registry check`, `registry report`, `registry show <component>`, and `css` maintain the
registry and vendored CSS. `npm run cli -- --help` lists commands and options. These commands
run independently of the consuming application's source code. [Porting reference](../reference/ant-design-porting/readme.md)

## Changing scripts

Change scripts or configuration only when a task explicitly requires a new workflow
or the existing workflow cannot meet its contract.

The following require explicit justification.

- Adding `pre*` or `post*` hooks
- Changing the order of existing steps
- Joining independent checks with `&&`
- Automatically deleting `build`, `.svelte-kit`, or other directories
- Changing the test environment or include pattern
- Disabling SSR, diagnostics, or assertion requirements
- Replacing JavaScript or framework behavior with a shell-specific workaround
- Adding an OS-specific command to a supported script

Add a new script only for a stable responsibility in development or CI. Use a local
command for a one-time task.

## Generated files and build output

- SvelteKit tooling generates `.svelte-kit`.
- `svelte-package` generates `dist`. Regenerate it to make changes.
- Address stale artifacts at their source. Changes to project code or a permanent
  `clean` hook require a demonstrated cause.
- Use a fresh build to validate changed source.

When diagnostics require removing a specific generated output, do so as an explicit
local operation. Adding that operation to a package script requires an explicit change.

## Configuration files

`svelte.config.js`, `vite.config.ts`, `tsconfig.json`, and package metadata connect
the runtime and build. Changes to aliases, adapters, rune mode, test environments,
compiler options, or plugins are compatibility-sensitive.

Resolve application or environment issues at their source. Keep configuration changes
tied to their intended contract.

## Environment

`.env.example`, SvelteKit environment imports, and the deployment environment define
build-time and runtime variables. Package scripts must respect those contracts.

Keep secrets out of scripts, command examples that contain real values, and public
environment variables.

## Validation

After changing scripts or configuration, run each affected command separately and
verify the following.

- Exit status
- Whether it introduces new side effects
- SSR and build output
- Compatibility with local and production workflows
- Whether lint or test scope expanded unintentionally

Explicitly identify any command that you did not run.
