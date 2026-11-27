# Local Ant Design source

Find the coverage summary, CSS recipes, and separate browser fixture routes in
the [coverage registry and porting tools](readme.md).

The port uses the official React repository as its reference. The project keeps
a separate Git clone in `.upstream/ant-design`, excluded by the root `.gitignore`.
The checkout is pinned to commit `984592267de88fbf9cdaecc96a56629e721c709d`.
[Ant Design 6.6.8](https://github.com/ant-design/ant-design/tree/984592267de88fbf9cdaecc96a56629e721c709d)

Restore the checkout from the repository root.

```sh
mkdir -p .upstream
git clone --depth 1 --single-branch --branch 6.6.8 https://github.com/ant-design/ant-design.git .upstream/ant-design
git -C .upstream/ant-design rev-parse HEAD
```

The clone contains the release files with shallow Git history. You can read the source
without installing dependencies. Choose a new target version separately from porting
an individual component.

In `components/<component>/`, find the implementation and types, the `style/`,
`demo/`, and `__tests__/` directories, and `index.en-US.md`. The main files for Button
and Avatar are `components/button/Button.tsx` and `components/avatar/Avatar.tsx`.
Shared code lives in `components/_util/`, theme tokens and algorithms in
`components/theme/`, and translations in `components/locale/`.

Include the ignored checkout explicitly when searching.

```sh
rg --files --hidden --no-ignore .upstream/ant-design/components/avatar
```

Before porting a component, review its source, props, demos, and edge cases in tests.
Then implement the Svelte API, document its supported scope, and check it with our
unit, SSR, and Chromium tests. Ant Design delegates some behavior to `@rc-component/*`
packages, so check the source at the corresponding package version too. The styles
in `vendor/` come from the published npm archive. The checkout provides the source
and tests alongside it.
