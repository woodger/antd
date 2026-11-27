export type MaskOwner = 'single-date-mask' | 'single-datetime-mask' | 'range-date-mask'
  | 'single-time-mask' | 'range-time-mask';
export type MaskFamily = 'date' | 'datetime' | 'time';
export type MaskKind = 'single' | 'range';
export type MaskFormatProfile = 'string' | 'object' | 'mask';
export type MaskControlName = 'format-object' | 'restore-authored-value' | 'format-mask';
export type MaskAuthoredDateName = 'initialStart' | 'initialEnd';
export type MaskAction = { type: 'input-open' | 'input-escape'; index: 0 | 1 }
  | { type: 'owner-control'; value: MaskControlName }
  | { type: 'input-key'; key: string; purpose: 'pristine-string' | 'pristine-object'
    | 'typed-object' | 'pristine-mask' | 'typed-mask' }
  | { type: 'input-type'; index: 0 | 1; text: string; keys: string[] }
  | { type: 'mask-edit' | 'incomplete-enter'; index: 0 | 1; anchor: 'text-start'; keys: string[] };
export type MaskSubstepCommand = { type: 'mouse-move-input'; index: 0 | 1; anchor: 'center' | 'text-start' }
  | { type: 'mouse-down' | 'mouse-up'; button: 'left' }
  | { type: 'key-press'; key: string }
  | { type: 'owner-control-click'; value: MaskControlName };
export interface MaskSample extends Record<MaskAuthoredDateName, string> {
  id: MaskOwner; kind: MaskKind; family: MaskFamily;
  plainFormat: string; maskFormat: string; plainText: string; maskDigits: string;
  initialFormatProfile: MaskFormatProfile; actions: MaskAction[];
}
export const samples: MaskSample[];
export function expandAction(action: MaskAction): MaskSubstepCommand[];
export const counts: { owners: number; authoredMacroActions: number; initialAndMacroSettledPoints: number;
  explicitSubsteps: number; keyboardPressCalls: number; inputMouseMoves: number;
  inputMouseDowns: number; inputMouseUps: number; authoredDOMControlClicks: number;
  declaredEscapeReadsAfter1000: number; wholeUnmounts: number; retainedFullPhasePoints: number;
  macroAfterCallReferencesToChildSnapshot: number; distinctRetainedFullReads: number;
  initialClosedSSRProfiles: number; initialClosedSSRSerializations: number };
export const storage: { macroAndLifecycleUIPartsPerCSR: number; substepUIPartsPerCSR: number;
  rawPointPartsPerCSR: number; producerPartsPerCSR: number; totalPartsPerCSR: number;
  serializerPartsPerSSR: number; originalPartsAcrossFourRuns: number };
