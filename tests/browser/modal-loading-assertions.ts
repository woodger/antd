import assert from 'node:assert/strict';
import { verifySelectSurfaceEventGraph } from './select-surface-assertions';
import type { ModalLoadingCleanup, ModalLoadingNode, ModalLoadingPoint } from './modal-loading-metrics.mjs';
import type { ModalLoadingSourceCase } from './modal-loading-reference';
type Mode = 'native' | 'source';
type Skeleton = Pick<ModalLoadingPoint, 'nodes' | 'skeletonRows'>;
const attribute = (node: ModalLoadingNode, name: string) => node.attributes?.find(([key]) => key === name)?.[1];
const relative = (node: ModalLoadingNode, root: ModalLoadingNode) => {
  assert(node.box && root.box);
  return {
    x: node.box.x - root.box.x,
    y: node.box.y - root.box.y,
    width: node.box.width,
    height: node.box.height
  };
};
function computed(
  actual: ModalLoadingNode,
  source: ModalLoadingNode,
  role: 'skeleton' | 'paragraph' | 'row',
  label: string,
  applied: Set<string> | undefined,
  mode: Mode
) {
  assert(actual.computed && source.computed);
  assert.deepEqual(
    actual.computed.map(([name]) => name),
    source.computed.map(([name]) => name),
    label + ' complete ordered computed field names'
  );
  source.computed.forEach(([name, value], index) => {
    const observed = actual.computed![index][1];
    if (mode === 'native' && name === 'max-width' && role !== 'paragraph') {
      // Existing Skeleton responsive containment: theme-context.md main guards,
      // Skeleton.svelte physical placeholder and paragraph LI max-width:100%.
      assert.equal(value, 'none', label + ' exact Source containment baseline');
      assert.equal(observed, '100%', label + ' exact existing Native containment');
      applied?.add('existing-skeleton-placeholder-and-li-max-width-containment');
    }
    else if (mode === 'native' && name === 'animation-name' && role === 'row') {
      assert.equal(
        value,
        'css-dev-only-do-not-override-1y106cm-ant-skeleton-loading',
        label + ' pinned Source keyframe'
      );
      assert.equal(observed, 'ant-skeleton-loading', label + ' exact canonical Native keyframe');
      applied?.add('existing-skeleton-source-hashed-native-canonical-keyframe-name');
    }
    else {
      assert.equal(observed, value, label + '/' + name);
    }
  });
}
/** All captured CSS fields and local boxes stay strict; screen placement remains
 * the existing Native centered HTMLDIALOG contract. Neither input is rewritten.
 */
export function verifyModalLoadingSkeleton(
  actual: Skeleton,
  source: Skeleton,
  label: string,
  applied?: Set<string>,
  mode: Mode = 'native'
) {
  const root = actual.nodes.skeleton, original = source.nodes.skeleton;
  assert.equal(Boolean(root), Boolean(original), label + ' placeholder presence');
  assert.equal(actual.nodes.skeletonTitle, null, label + ' no Skeleton title');
  assert.equal(source.nodes.skeletonTitle, null);
  if (!original) {
    assert.equal(actual.nodes.skeletonParagraph, null);
    assert.deepEqual(actual.skeletonRows, []);
    return;
  }
  assert(root && root.connected && original.connected);
  assert.equal(root.name, 'DIV');
  const sourceClasses = attribute(original, 'class')!.split(/\s+/), actualClasses = attribute(
    root,
    'class'
  )!.split(/\s+/);
  for (const name of ['ant-skeleton', 'ant-skeleton-active', sourceClasses.find(name => name.endsWith('-body-skeleton'))!]) {
    assert(name);
    assert(sourceClasses.includes(name));
    assert(actualClasses.includes(name), label + ' physical placeholder class ' + name);
  }
  const paragraph = actual.nodes.skeletonParagraph, originalParagraph = source.nodes.skeletonParagraph;
  assert(paragraph && originalParagraph);
  assert.equal(paragraph.name, 'UL');
  assert.equal(actual.skeletonRows.length, 4);
  assert.equal(source.skeletonRows.length, 4);
  assert(actual.nodes.body && source.nodes.body);
  assert.deepEqual(
    relative(root, actual.nodes.body),
    relative(original, source.nodes.body),
    label + ' placeholder relative to body'
  );
  assert.deepEqual(
    relative(paragraph, root),
    relative(originalParagraph, original),
    label + ' paragraph local rect'
  );
  assert.deepEqual(root.client, original.client, label + ' placeholder client/scroll metrics');
  assert.deepEqual(
    paragraph.client,
    originalParagraph.client,
    label + ' paragraph client/scroll metrics'
  );
  computed(root, original, 'skeleton', label + '/placeholder', applied, mode);
  computed(paragraph, originalParagraph, 'paragraph', label + '/paragraph', applied, mode);
  source.skeletonRows.forEach((row, index) => {
    const observed = actual.skeletonRows[index];
    assert.equal(observed.name, 'LI');
    assert.equal(observed.connected, true);
    assert.deepEqual(
      observed.inlineStyle,
      row.inlineStyle,
      label + '/row' + index + ' ordered inline CSS'
    );
    assert.equal(observed.cssText, row.cssText);
    assert.deepEqual(
      relative(observed, root),
      relative(row, original),
      label + '/row' + index + ' local rect'
    );
    assert.deepEqual(observed.client, row.client, label + '/row' + index + ' client/scroll metrics');
    computed(observed, row, 'row', label + '/row' + index, applied, mode);
  });
}
function callbacks(
  actual: ModalLoadingPoint['owner'],
  source: ModalLoadingPoint['owner'],
  label: string
) {
  assert.deepEqual(actual.events, source.events, label + ' complete zero-argument caller signals');
  assert.equal(actual.rawEvents.length, source.rawEvents.length);
  for (const [index, event] of actual.rawEvents.entries()) {
    verifySelectSurfaceEventGraph(
      event,
      source.rawEvents[index],
      label + '/raw-event' + index
    );
  }
}
function lifecycle(
  actual: ModalLoadingPoint['owner'],
  source: ModalLoadingPoint['owner'],
  label: string
) {
  for (const slot of ['owner', 'body', 'editor', 'footer']) {
    for (const event of ['attach', 'detach', 'mount', 'unmount']) {
      assert.equal(
        actual.lifecycle.filter(row => row.slot === slot && row.event === event).length,
        source.lifecycle.filter(row => row.slot === slot && row.event === event).length, label + '/' + slot + '/' + event);
    }
    for (const events of [['attach', 'detach'], ['mount', 'unmount']]) {
      const rows = actual.lifecycle.filter(row => row.slot === slot && events.includes(row.event));
      rows.forEach((row, index) => assert.equal(
        row.event,
        events[index % 2],
        label + '/' + slot + ' alternating actual lifecycle'
      ));
    }
  }
  assert(actual.lifecycle.every(row => ['owner', 'body', 'editor', 'footer'].includes(row.slot)));
  for (const row of actual.lifecycle.filter(row => row.event === 'attach')) {
    assert(
      row.observation?.connected && row.observation.name === (row.slot === 'editor' ? 'INPUT' : row.slot === 'footer' ? 'BUTTON' : 'SECTION'),
      label + ' real connected authored ref'
    );
  }
  for (const kind of ['body-render', 'footer-render']) {
    assert.equal(actual.activity.filter(row => row.kind === kind).length,
      actual.lifecycle.filter(row => row.slot === (kind === 'body-render' ? 'body' : 'footer') && row.event === 'mount').length,
      label + ' actual Svelte setup belongs to a mounted child');
  }
  assert(actual.activity.every(row => ['body-render', 'footer-render'].includes(row.kind)));
}
export function verifyModalLoadingPoint(
  actual: ModalLoadingPoint,
  source: ModalLoadingPoint,
  initial: ModalLoadingPoint,
  label: string,
  previous?: ModalLoadingPoint,
  applied?: Set<string>,
  mode: Mode = 'native'
): string[] {
  const failures: string[] = [];
  const check = (part: string, fn: () => void) => {
    try {
    fn();
  }
  catch (error) {
    failures.push(label + '/' + part + ': ' + String(error));
  }
  };
  check('owner', () => {
    for (const key of ['alive', 'open', 'loading', 'footer', 'prefixCls'] as const) {
      assert.equal(
        actual.owner[key],
        source.owner[key],
        key
      );
    }
    assert(
      actual.owner.props && actual.owner.rawProps,
      'Complete actual public props/definition graphs retained'
    );
    assert.deepEqual(actual.browserOwnedResourceCounters, source.browserOwnedResourceCounters);
    callbacks(actual.owner, source.owner, label);
    lifecycle(actual.owner, source.owner, label);
    if (source.owner.loading && previous) {
      assert.deepEqual(
        actual.owner.activity,
        previous.owner.activity,
        'Loading must not invoke body/footer'
      );
    }
    applied?.add('react-child-render-vs-svelte-setup-and-layout-vs-onMount-ref-order-raw-retained');
  });
  check('chrome', () => {
    for (const role of ['dialog', 'header', 'title', 'close', 'body'] as const) {
      assert(actual.nodes[role] && initial.nodes[role] && source.nodes[role]);
      assert.equal(
        actual.nodes[role]!.identity,
        initial.nodes[role]!.identity,
        role + ' actual DOM retained'
      );
      assert.equal(actual.initialIdentity[role], true);
      assert.equal(source.initialIdentity[role], true);
    }
    assert.equal(actual.nodes.title!.text, source.nodes.title!.text);
    assert.equal(
      attribute(actual.nodes.close!, 'disabled'),
      attribute(source.nodes.close!, 'disabled')
    );
    if (mode === 'native') {
      const shells = actual.allElements.filter(node => node.name === 'DIALOG');
      assert.equal(shells.length, 1);
      const shell = shells[0], title = actual.nodes.title!, id = attribute(title, 'id');
      assert(shell.connected && id);
      assert.equal(title.name, 'H2');
      assert.equal(attribute(shell, 'data-ant-modal-prefix'), source.owner.prefixCls);
      assert.equal(attribute(shell, 'aria-labelledby'), id);
      assert.equal(actual.allElements.filter(node => attribute(node, 'id') === id).length, 1);
      assert.equal(attribute(shell, 'open') !== undefined, source.owner.open);
      assert.equal(id, attribute(initial.nodes.title!, 'id'));
      applied?.add('existing-native-dialog-centering-heading-and-generated-title-id');
    }
  });
  check('children', () => {
    for (const role of ['authoredBody', 'editor', 'footer', 'authoredFooter'] as const) {
      assert.equal(
        Boolean(actual.nodes[role]),
        Boolean(source.nodes[role]),
        role + ' presence'
      );
    }
    if (source.nodes.editor) {
      const editor = actual.nodes.editor!;
      assert.equal(editor.name, 'INPUT');
      assert.equal(editor.connected, true);
      assert.equal(editor.value, source.nodes.editor.value);
      assert.equal(editor.defaultValue, source.nodes.editor.defaultValue);
      assert.deepEqual(editor.attributes, source.nodes.editor.attributes);
      assert.equal(actual.nodes.authoredBody!.name, 'SECTION');
      assert.deepEqual(actual.nodes.authoredBody!.attributes, source.nodes.authoredBody!.attributes);
      assert.equal(actual.nodes.authoredBody!.text, source.nodes.authoredBody!.text);
      for (const role of ['editor', 'authoredBody', 'authoredFooter', 'footer'] as const) {
        if (source.nodes[role] && source.initialIdentity[role] === false) {
          assert.notEqual(
            actual.nodes[role]!.identity,
            initial.nodes[role]!.identity,
            role + ' recreated after loading'
          );
        }
      }
    }
    if (source.nodes.footer) {
      assert.deepEqual(actual.nodes.footer!.children!.filter(node => node.nodeType === 1).map(node => node.name),
        source.nodes.footer.children!.filter(node => node.nodeType === 1).map(node => node.name), 'Complete direct physical footer controls');
      applied?.add('existing-native-default-footer-locale-and-snippet-anchor-raw-retained');
    }
    if (source.nodes.authoredFooter) {
      assert.equal(actual.nodes.authoredFooter!.text, source.nodes.authoredFooter.text);
      assert.deepEqual(
        actual.nodes.authoredFooter!.attributes,
        source.nodes.authoredFooter.attributes
      );
    }
  });
  check('skeleton', () => verifyModalLoadingSkeleton(actual, source, label, applied, mode));
  return failures;
}
export function verifyModalLoadingCleanup(
  actual: ModalLoadingCleanup,
  late: ModalLoadingCleanup,
  source: ModalLoadingSourceCase,
  label: string,
  applied?: Set<string>
): string[] {
  try {
    assert.deepEqual(actual, late, label + ' full actual cleanup-to-late quiescence');
    assert.equal(actual.owner.alive, false);
    assert.equal(actual.owner.open, false);
    assert.equal(actual.owner.loading, true);
    callbacks(actual.owner, source.cleanup.owner, label);
    lifecycle(actual.owner, source.cleanup.owner, label);
    assert.deepEqual(actual.refs, source.cleanup.refs);
    assert(Object.values(actual.refs).every(Boolean));
    assert.equal(actual.ownerCount, 0);
    assert.equal(actual.dialogCount, 0);
    assert(actual.retained.length > 0 && actual.retained.every(node => !node.connected));
    assert(actual.retained.every(node => !['BODY', 'HTML'].includes(node.name)));
    assert.deepEqual(
      actual.browserOwnedResourceCounters,
      source.cleanup.browserOwnedResourceCounters
    );
    applied?.add('source-inline-umd-vs-native-module-resource-timing-raw-retained');
    return [];
  }
  catch (error) { return [label + ': ' + String(error)]; }
}
export function verifyModalLoadingDiagnostics(
  errors: readonly unknown[],
  diagnostics: ReadonlyArray<{ type: string }>,
  requestFailures: readonly unknown[],
  label: string
): string[] {
  try {
    assert.deepEqual(errors, []);
    assert.deepEqual(requestFailures, []);
    assert.deepEqual(
      diagnostics.filter(row => ['warning', 'error'].includes(row.type)),
      [],
      label + ' browser warnings/errors'
    );
    return [];
  }
  catch (error) { return [label + ': ' + String(error)]; }
}
