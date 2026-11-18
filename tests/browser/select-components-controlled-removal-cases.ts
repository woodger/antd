export type ControlledRemovalPhase = 'owned' | 'undefined' | 'null' | 'next';
export type ControlledRemovalEditor = HTMLInputElement | HTMLTextAreaElement;
export interface ControlledRemovalSample {
  id: string; control: 'select' | 'autocomplete'; entry: 'csr' | 'hydrate';
  axis: 'value-checked' | 'value'; tag: 'input' | 'textarea'; defaultValuePresent: boolean;
}
const controls = ['select', 'autocomplete'] as const, entries = ['csr', 'hydrate'] as const;
export const controlledRemovalSamples: ControlledRemovalSample[] = [
  ...controls.flatMap(control => entries.map(entry => ({ id: control + '-input-' + entry,
    control, entry, axis: 'value-checked' as const, tag: 'input' as const, defaultValuePresent: true }))),
  ...controls.flatMap(control => entries.flatMap(entry => (['input', 'textarea'] as const).flatMap(tag =>
    [true, false].map(defaultValuePresent => ({ id: [control, tag, entry, 'value', defaultValuePresent ? 'default-present' : 'default-absent'].join('-'),
      control, entry, axis: 'value' as const, tag, defaultValuePresent }))))),
];
interface ControlledRemovalFrame {
  value: string | null | undefined; defaultValue?: string;
  checked?: boolean | null | undefined; defaultChecked?: boolean;
}
export function controlledRemovalFrames(sample: ControlledRemovalSample) {
  return new Map<ControlledRemovalPhase, ControlledRemovalFrame>((['owned', 'undefined', 'null', 'next'] as const).map(phase => {
    const value = phase === 'owned' ? 'owned' : phase === 'undefined' ? undefined : phase === 'null' ? null : 'next';
    const frame: ControlledRemovalFrame = { value };
    if (sample.defaultValuePresent) frame.defaultValue = 'fallback';
    if (sample.tag === 'input') {
      frame.checked = sample.axis === 'value-checked' ? phase === 'undefined' ? undefined : phase === 'null' ? null : true : true;
      frame.defaultChecked = true;
    }
    return [phase, frame];
  }));
}
export interface ControlledRemovalNode {
  tag: string; value: string; defaultValue: string; checked: boolean | null; defaultChecked: boolean | null;
  attributes: Array<[string, string]>; selection: [number | null, number | null, string | null];
  focused: boolean; connected: boolean; html: string; innerHTML: string; textContent: string | null;
}
export function readControlledRemovalNode(node: ControlledRemovalEditor | null | undefined): ControlledRemovalNode | null {
  const input = node?.localName === 'input' ? node as HTMLInputElement : undefined;
  return node ? { tag: node.tagName, value: node.value, defaultValue: node.defaultValue,
    checked: input?.checked ?? null, defaultChecked: input?.defaultChecked ?? null,
    attributes: [...node.attributes].map(attr => [attr.name, attr.value]),
    selection: [node.selectionStart, node.selectionEnd, node.selectionDirection],
    focused: node.ownerDocument.activeElement === node, connected: node.isConnected,
    html: node.outerHTML, innerHTML: node.innerHTML, textContent: node.textContent } : null;
}
export interface ControlledRemovalOwner {
  phase: ControlledRemovalPhase; ownKeys: string[]; hasOwnValue: boolean; hasOwnDefaultValue: boolean; hasOwnChecked: boolean;
  valueKind: string; checkedKind: string; firstRef: ControlledRemovalNode | null;
  refs: { control: boolean; root: boolean; editor: boolean; authored: boolean };
}
export interface ControlledRemovalCapture {
  read?: () => ControlledRemovalOwner;
  readRefs?: () => { editor: ControlledRemovalEditor | undefined };
  update?: (phase: ControlledRemovalPhase) => void;
  onCommit?: () => void;
}
export interface ControlledRemovalPoint {
  node: ControlledRemovalNode | null; owner: ControlledRemovalOwner | null;
  sameParsedEditor: boolean | null; sameMountedEditor: boolean | null;
}
declare global {
  interface Window {
    controlledRemoval: {
      ready: boolean; initialize(sample: ControlledRemovalSample, body: string): ControlledRemovalPoint;
      start(): ControlledRemovalPoint; read(): ControlledRemovalPoint; tick(): Promise<void>;
      focus(): void; update(phase: ControlledRemovalPhase): ControlledRemovalPoint; dispose(): Promise<ControlledRemovalPoint>;
      firstCommit?: ControlledRemovalPoint;
    };
  }
}
