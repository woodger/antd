// Normalizes values for the browser snapshots, including values JSON cannot represent faithfully.
import type { FormValueProjection } from '@woodger/antd';

export interface WatchSampleValues extends Record<string, unknown> {
  title: string;
  hidden?: string;
  profile?: { name: string; age?: number };
  'profile.name'?: string;
  rows?: { label: string }[];
  opaque?: WatchToken;
  vector?: (null | undefined)[];
}

/** Two different tokens have the same JSON serialization. */
export class WatchToken {
  #label: string;

  /** Keeps the observable label outside the enumerable value shape. */
  constructor(label: string) {
    this.#label = label;
  }

  /** Reads the label associated with this instance. */
  label() {
    return this.#label;
  }
}

/** Returns a new object so tests can observe retained selection identity. */
export function selectProfile(values: FormValueProjection<WatchSampleValues>) {
  return { name: values.profile?.name ?? 'empty' };
}

/** Reports whether an unregistered value is visible to the selector. */
export function selectHidden(values: FormValueProjection<WatchSampleValues>) {
  return { hidden: values.hidden ?? 'empty' };
}

/** Distinguishes missing values from null and exposes the opaque token's current identity. */
export function describeSelection(data: unknown) {
  return JSON.stringify(data, (_, value) => {
    if (value === undefined) return { missing: true };
    if (value instanceof WatchToken) return value.label();
    return value;
  });
}
