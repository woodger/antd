// Numeric MiniDecimal fallback for runtimes without BigInt. Retains the original text and limits
// the result to the safe range.
import { getNumberPrecision, isEmptyDecimal, numberToString } from './decimal-format.engine';
import type { DecimalValue, MiniDecimal } from './mini-decimal.engine';

/** The original mini-decimal fallback for runtimes without BigInt. */
export class NumberDecimal implements MiniDecimal {
  origin = '';
  number?: number;
  empty?: boolean;

  // Distinguishes empty input from invalid numbers and retains the original text of nonempty input.
  constructor(value: DecimalValue) {
    if (isEmptyDecimal(value)) {
      this.empty = true;
      return;
    }

    this.origin = String(value);
    this.number = Number(value);
  }

  // Returns a new instance with the opposite sign.
  negate() {
    return new NumberDecimal(-this.toNumber()!);
  }

  // Accounts for both addends' precision and the safe number range. An invalid addend leaves the
  // current value unchanged.
  add(value: DecimalValue): NumberDecimal {
    if (this.isInvalidate()) {
      return new NumberDecimal(value);
    }

    const target = Number(value);
    if (Number.isNaN(target)) {
      return this;
    }

    const number = this.number! + target;
    if (number > Number.MAX_SAFE_INTEGER) {
      return new NumberDecimal(Number.MAX_SAFE_INTEGER);
    }
    if (number < Number.MIN_SAFE_INTEGER) {
      return new NumberDecimal(Number.MIN_SAFE_INTEGER);
    }

    const precision = Math.max(getNumberPrecision(this.number), getNumberPrecision(target));

    return new NumberDecimal(number.toFixed(precision));
  }

  // Exposes empty input as a separate state.
  isEmpty() {
    return this.empty;
  }

  // Identifies invalid numbers while keeping empty strings distinct.
  isNaN() {
    return Number.isNaN(this.number);
  }

  // Checks whether the instance can be used in an arithmetic operation.
  isInvalidate() {
    return this.isEmpty() || this.isNaN();
  }

  // Compares numeric representations without coercing different types.
  equals(target: MiniDecimal | null | undefined) {
    return this.toNumber() === target?.toNumber();
  }

  // Compares the sign of the difference using the same rounding as add.
  lessEquals(target: MiniDecimal) {
    return this.add(target.negate().toString()).toNumber()! <= 0;
  }

  // Returns the stored number or undefined for empty input.
  toNumber() {
    return this.number;
  }

  // Raw mode retains the user's representation, while safe mode normalizes the number.
  toString(safe = true) {
    if (!safe) {
      return this.origin;
    }
    if (this.isInvalidate()) {
      return '';
    }

    return numberToString(this.number!);
  }
}
