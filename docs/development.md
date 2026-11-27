# Developer guide

## Library development

- Repository structure. [Architecture](architecture/overview.md)
- Dependency direction and contract ownership. [UI architecture](architecture/ui.md)
- Coverage tracking and style extraction. [Registry and CSS tools](reference/ant-design-porting/readme.md)
- Source code for comparison. [Local Ant Design source](reference/ant-design-porting/upstream.md)
- Repository rules. [Development policies](policy/index.md)
- [Changelog](../CHANGELOG.md)

## Local development

### Installation, build, and checks

Run these commands from the repository root to install dependencies, check the source
and tests, and build the package.

```sh
npm ci
npm run lint
npm run check
npm run cli -- check tests
npm test
npm run build
npm run cli -- test package
```

- `npm ci` installs dependencies from the lockfile.
- `npm run lint` lints source code, tests, and tools.
- `npm run check` checks types and Svelte components.
- `npm run cli -- check tests` builds the package and checks the types of tests and browser fixtures.
- `npm test` runs tests for the source code and tools.
- `npm run build` builds the package into `dist`.
- `npm run cli -- test package` builds the package and runs its SSR tests.

`npm run build` uses the official `@sveltejs/package` to produce Svelte components,
JavaScript modules, `.d.ts` declarations, CSS, and licenses for vendored code in `dist`.
`npm run dev` updates that directory in watch mode. The npm archive excludes tests.

`cli -- check tests` uses the standard TypeScript engine in `svelte-check`. The optional
`--tsgo` mode resolves some package self-references incorrectly in this setup. The standard
check keeps the same strict settings and covers the same files.

### Browser checks

The component browser tests live in `tests/browser`, and the SSR tests for the built public
package live in `tests/package`. Each uses its own fixtures. Install Chromium for the browser tests.

```sh
npm exec -- playwright install chromium
npm run cli -- test browser
```

Playwright builds the current package and starts the Vite test app on `127.0.0.1:4175`.
Pass test runner options after the `--` separator in the CLI command.

```sh
npm run cli -- test package -- --maxWorkers=1
npm run cli -- test browser -- --workers=1 tests/browser/typography/typography.spec.ts
```

### Packaging

After installing dependencies, run these commands from the repository root.

```sh
npm run build
npm pack --ignore-scripts
```

`npm pack` writes `woodger-antd-<version>.tgz` to the current directory and prints its
filename. Install the archive in an application with `npm install`.

### Development CLI

The CLI runs package checks and works with the coverage registry and CSS extracted
from Ant Design.

```sh
npm run cli -- --help
npm run cli -- registry check
npm run cli -- registry report
npm run cli -- registry show avatar
npm run cli -- css all --check
```

- `--help` lists available commands and options.
- `registry check` validates the registry, local evidence, and the generated summary.
- `registry report` updates the generated coverage summary.
- `registry show avatar` prints the Avatar entry. Substitute another component name to see its entry.
- `css all --check` compares the extracted styles with the repository files for each recipe.
  The check needs a local Ant Design archive. [CSS extraction](reference/ant-design-porting/readme.md#css-extraction)

`integration:` references identify checks that consumers run separately. Porting metadata
lives in the [repository registry](reference/ant-design-porting/registry.json).
