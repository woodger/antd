# Numeric mask: independent initial React hydration observation

Preparation only. Root reviews and freezes this proposal before either actual run.
The failed/released mask production v1, all original Source captures and all Native
callers remain unchanged. This is evidence for the current mask commit only.

## Bounded matrix

Five original public owners (`single-date-mask`, `single-datetime-mask`,
`range-date-mask`, `single-time-mask`, `range-time-mask`) times the three original
initial format profiles (`string`, `object`, `mask`) give 15 closed profiles per
run. Two independently launched browsers, each with 15 fresh page contexts, give
30 independent hydrations. There are zero authored input/owner-control actions,
zero keyboard/mouse calls, zero caret assignments, and zero new SSR renders.

Both runs hydrate the exact same 15 original SSR-first `renderToString` HTML
strings. Original packets, gzip bindings, full hidden model/Date/reference state,
and original `htmlSha256` are pinned. `renderToStaticMarkup` and SSR-repeat remain
unchanged original evidence; they are not silently treated as hydration inputs.
The exact existing React 18.3.1 / ReactDOM 18.3.1 / Ant Design 6.6.8 factory and
shared recorder are referenced without edits. Only the original public authored
`initialFormatProfile` override is supplied, as in the original SSR capture.

Each whole profile packet retains nine observations: `parsed` before library
scripts, `preHydrate` after script loading, `afterHydrateCall` synchronously in the
same JavaScript call as real `hydrateRoot`, `mounted` after the original factory's
real useEffect reports alive, `settled`, `beforeUnmount`, `afterUnmountCall`,
`cleanup`, and `late1000`. Thus 135 snapshots/run and 270 across both runs are
retained. An immediate snapshot can honestly have no committed factory state.
The mounted/settled snapshots do not overwrite the immediate observation.

## Actual observations

Each snapshot retains native input value/defaultValue, selectionStart/End/
Direction, focused state, value attribute, all attributes, outerHTML, connectivity,
input IDs and actual DOM identities. Saved parsed owner, picker root and input
JavaScript references are compared with the current nodes directly. Saved parsed
inputs are also observed after unmount. Owner/root/document HTML is preserved.
Actual public owner/control/root refs and the unmodified recorder's complete
owner state, callback arguments, Date/reference graphs and producer ledger are
retained once the original factory has rendered. DOM observation identity uses a
separate namespace and does not replace original recorder IDs.

Document capture listeners only observe real focus, selection, pointer, keyboard,
input and composition events. They never dispatch an event or assign a property.
The runner does not call focus/blur, select, setSelectionRange, root.render,
flushSync, callbacks, picker internals, model setters or format controls.
`hydrateRoot` has an onRecoverableError observer; React 18 has no recover:false
option, and none is claimed. Recoverable errors, page errors, console diagnostics
and network failures are retained and make the capture fail.

Viewport 1440x1000, en-US, UTC, deviceScaleFactor 1 and the original Date-only
fixed browser clock (2024-06-10T08:23:45.678Z, real timers/RAF) match the existing
Source browser environment. The original SSR actual VM wall-clock fields are
retained unchanged. Script loading is local; no browser permissions are changed.

Settling uses real two-RAF plus 25ms drains and four successive stable closed DOM/
owner/producer/event observations, bounded to 70 drains. No predicted caret,
defaultValue or node-reuse outcome is asserted. The observation itself is not a
comparison with Source CSR or a claim about opening/input behavior.

Each profile is genuinely unmounted. Immediate unmount, cleanup after real RAFs,
and a further actual 1000ms late observation retain lifecycle/callback/producer/
events/node state. Observer removal follows the late observation. Page contexts
and browser.close are awaited in finally. A failure stops the run; partial packet
and manifest are retained, and a fresh output name is mandatory. No automatic retry.

## Root lifecycle

Preparation command (Node-only metadata/static work):

    node .upstream/artifacts/date-picker-mask-hydration-source-proposal-v2/protocol.mjs prepare

Root reviews the authored matrix and all input pins, then supplies a separate
exclusive browser lease and exact reviewed proposal SHA:

    node .upstream/artifacts/date-picker-mask-hydration-source-proposal-v2/protocol.mjs freeze ROOT_LEASE REVIEWED_PROPOSAL_SHA256

Root executes the frozen commands strictly sequentially, with actual terminal 0,
complete manifest, browser close and unchanged pins required before run two:

    node .upstream/artifacts/date-picker-mask-hydration-source-proposal-v2/capture.mjs first REVIEWED_FREEZE_SHA256 ROOT_LEASE
    node .upstream/artifacts/date-picker-mask-hydration-source-proposal-v2/capture.mjs repeat REVIEWED_FREEZE_SHA256 ROOT_LEASE

Root records actual process terminals and releases the lease only after both have
finished and all application processes are closed. There is no server or build
phase. Raw profile packets and manifest are written losslessly as JSON plus gzip;
the original SSR packet and HTML hash binding are included in every profile.
Only after both actual captures may a separate read-only Node comparison report
per-field/phase facts and run-to-run stability. It must preserve all differences;
no automatic helper boundary or production v2 change is authorized by this plan.
