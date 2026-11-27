export interface SelectSurfaceProducerCall {
  index: number;
  kind: string;
  side: string;
  argument: unknown;
  result: unknown;
  rawArgument: unknown;
  rawResult: unknown;
  [key: string]: unknown;
}
export interface SelectSurfaceRecorder {
  register<Value>(value: Value, role: unknown): Value;
  encode(value: unknown): unknown;
  raw(value: unknown): unknown;
  own(value: object): Array<Record<string, unknown>>;
  identity(value: object): number;
  calls: SelectSurfaceProducerCall[];
  record<Value>(kind: string, side: string, argument: unknown, result: Value,
    extra?: Record<string, unknown>): Value;
}
export function createSelectSurfaceRecorder(): SelectSurfaceRecorder;
