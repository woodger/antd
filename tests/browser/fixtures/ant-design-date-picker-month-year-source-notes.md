# DatePicker month/year Source evidence

Pinned Ant Design 6.6.8, React 18.3.1 and rc-picker 1.12.2. Four public owners:
Single month, Single year, Range month and Range year. The ordinary React parent
accepts actual value/open callbacks; controls change declared public props.

Both independent CSR captures completed 160 actions, 164 initial/settled states,
22 declared Escape +1000ms reads, four full unmount/cleanup/late sequences and
400 original parts. Each contains 2,224 actual disabledDate invocations in
202 contiguous producer chunks. Both SSR captures contain eight initial closed
serializations from fresh DOM-free VMs, using renderToString and renderToStaticMarkup.
CSR uses the fixed Date clock recorded by the protocol. SSR uses its actual VM
wall clock. Actual forbidden SSR resource counts are zero and refs are null.

The source manifest maps all 816 original parts and four original manifests to
528 whole gzip blobs, copied byte-exact and deduplicated by stored SHA-256.
Stored bytes total 38,524,608; the largest blob is 271,894 bytes. Original JSON
argument parts remain whole. Raw/stored sizes and hashes remain in the manifest.
The Node reader decodes one requested complete part at a time; it keeps no corpus
cache and reads only the maintained fixture files and shared authored cases.

`date-picker-month-year-reference.mjs` exposes capture manifests, initial/step/
closed/cleanup observations, complete producer chunks and full SSR serializers.
Step reads preserve before, afterFocusPointer when present, afterCall and settled
observations. Producer chunks preserve all arguments, returns, cursors, indices,
boundary counts and terminal tails. All callback arguments, receivers, Dayjs raw
graphs, temporal fields and original identity/alias annotations remain available.

The semantic-review JSON is an annotation for these captured scenarios. It records
default/localized fields, upper/terminal selection, confirmation, restrictions,
presets and Range ordering. Upper selection can update calendar draft. The observed
Single year upper selection emits two picker-value callbacks with the same candidate
and prior decade mode. Hidden model fields remain meaningful despite short input
formats. These facts must not be replaced by authored expected callback calls.

First/repeat SSR serializer parts are all byte-identical. Of 202 paired CSR producer
parts, 201 are byte-identical. Range month step32 has afterCall count268 versus239;
its complete rows, cursor, settled boundary and final ledger are identical. Selected
semantic annotations differ at two recorded hit-test DOM identities. Both original
values remain available in the variance documents. All 198 paired UI parts differ
as raw bytes; there is no timestamp-only or full-raw equality claim.

Native comparison retains explicit framework boundaries: props-function receiver,
Single calendar info and empty-value arguments, conditional versus retained hidden
popup, default button Snippet and its keyboard/focus contract. Producer invocation
counts are Source observations, not Native count expectations. This evidence covers
the declared month/year cases; other picker modes, multiple, mask, factories and
deprecated APIs remain outside this corpus. Native parity is assessed separately.
