export type HydrationOwnershipOwnerKey = 'A' | 'B';
export type HydrationOwnershipTag = 'input' | 'textarea';
export interface HydrationOwnershipControl {
  id: 'select-multiple-input' | 'ac-textarea'; control: 'select' | 'autocomplete';
  initialTag: HydrationOwnershipTag; replacementTag: HydrationOwnershipTag;
}
export interface HydrationOwnershipEnvironment {
  id: 'independent-document-roots' | 'open-shadow-target' | 'closed-shadow-target';
  kind: 'document' | 'shadow-open' | 'shadow-closed';
  owners: HydrationOwnershipOwnerKey[]; hydrationOrder: HydrationOwnershipOwnerKey[];
}
export interface HydrationOwnershipPrehydrateState {
  id: 'clean-focused' | 'dirty-focused-backward'; dirty: boolean;
  value?: string; selection?: [number, number, 'backward'];
}
export type HydrationOwnershipAction = { type: 'controlled-query'; value: string }
  | { type: 'real-keyboard-replace'; text: string } | { type: 'outside-focus' }
  | { type: 'intrinsic-tag-replacement' } | { type: 'target-dispose'; lateMilliseconds: number };
export type HydrationOwnershipUpdate = Extract<HydrationOwnershipAction, { type: 'controlled-query' | 'intrinsic-tag-replacement' }>;
export interface HydrationOwnershipScenario {
  id: string; control: HydrationOwnershipControl; environment: HydrationOwnershipEnvironment;
  prehydrate: HydrationOwnershipPrehydrateState; actions: HydrationOwnershipAction[];
}
export interface HydrationOwnershipOwnerSample {
  scenarioId: string; ownerKey: HydrationOwnershipOwnerKey; controlKey: HydrationOwnershipControl['id'];
  control: HydrationOwnershipControl['control']; initialTag: HydrationOwnershipTag; replacementTag: HydrationOwnershipTag;
  publicId: string; initialQuery: string; initialValue: string | string[];
  frame: {
    position: 'absolute';
    left: number;
    top: number;
    width: number;
    fontFamily: 'initial';
    fontSize: number;
    lineHeight: 'normal'
  };
  editorStyle: { width: number; fontSize: number };
}
export const ownershipControls: HydrationOwnershipControl[];
export const ownershipEnvironments: HydrationOwnershipEnvironment[];
export const ownershipPrehydrateStates: HydrationOwnershipPrehydrateState[];
export const ownershipActions: HydrationOwnershipAction[];
export const ownershipScenarios: HydrationOwnershipScenario[];
export const ownershipGeometry: { viewport: { width: number; height: number } };
export function ownershipOwnerSample(
  scenario: HydrationOwnershipScenario,
  ownerKey: HydrationOwnershipOwnerKey
): HydrationOwnershipOwnerSample;
