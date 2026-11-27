// Stores the MiniDecimal sign, integer part, and fractional part separately. A common scale is used
// only for arithmetic.
import { isEmptyDecimal, isScientificNumber, numberToString, trimNumber,
  validateNumber } from './decimal-format.engine';
import type { DecimalValue, MiniDecimal } from './mini-decimal.engine';

/** BigIntDecimal from mini-decimal 1.0.1, including original strings, scale, and rounding. */
export class BigIntDecimal implements MiniDecimal {
  origin = '';
  negative?: boolean;
  integer?: bigint;
  decimal?: bigint;
  decimalLen?: number;
  empty?: boolean;
  nan?: boolean;

  // Distinguishes empty and invalid values. Reads the integer and fractional parts after
  // normalizing the string.
  constructor(value: DecimalValue) {
    if (isEmptyDecimal(value)) {
      this.empty = true;
      return;
    }

    this.origin = String(value);
    if (value === '-' || Number.isNaN(value)) {
      this.nan = true;
      return;
    }

    let number = value!;
    if (isScientificNumber(number)) number = Number(number);

    const text = typeof number === 'string' ? number : numberToString(number);
    if (validateNumber(text)) {
      const trimmed = trimNumber(text);
      const parts = trimmed.trimStr.split('.');
      const decimal = parts[1] || '0';

      this.negative = trimmed.negative;
      this.integer = BigInt(parts[0]);
      this.decimal = BigInt(decimal);
      this.decimalLen = decimal.length;
    }
    else {
      this.nan = true;
    }
  }

  // Adds the sign only for a value represented as negative.
  private getMark() {
    return this.negative ? '-' : '';
  }

  // Serializes the instance's integer part after checking validity.
  private getIntegerStr() {
    return this.integer!.toString();
  }

  // Restores leading fractional zeros using the stored scale.
  private getDecimalStr() {
    return this.decimal!.toString().padStart(this.decimalLen!, '0');
  }

  // Converts the value to an integer at a common scale, padding the fraction on the right.
  private alignDecimal(length: number) {
    return BigInt(this.getMark() + this.getIntegerStr() + this.getDecimalStr().padEnd(length, '0'));
  }

  // Copies the normalized representation and reverses its sign without mutating the receiver.
  negate() {
    const clone = new BigIntDecimal(this.toString());
    clone.negative = !clone.negative;

    return clone;
  }

  // Adds integers at a common scale and restores the decimal point.
  add(value: DecimalValue): BigIntDecimal {
    if (this.isInvalidate()) {
      return new BigIntDecimal(value);
    }

    const offset = new BigIntDecimal(value);
    if (offset.isInvalidate()) {
      return this;
    }

    const length = Math.max(this.getDecimalStr().length, offset.getDecimalStr().length);
    const number = (this.alignDecimal(length) + offset.alignDecimal(length)).toString();
    const { negativeStr, trimStr } = trimNumber(number);
    const hydrated = negativeStr + trimStr.padStart(length + 1, '0');

    return new BigIntDecimal(`${hydrated.slice(0, -length)}.${hydrated.slice(-length)}`);
  }

  // Marks the absence of input independently of the parse result.
  isEmpty() {
    return this.empty;
  }

  // Marks a parse error in a separate flag.
  isNaN() {
    return this.nan;
  }

  // Checks states for which the number parts are absent.
  isInvalidate() {
    return this.isEmpty() || this.isNaN();
  }

  // Compares normalized decimal strings without losing precision through number conversion.
  equals(target: MiniDecimal | null | undefined) {
    return this.toString() === target?.toString();
  }

  // Compares the sign of the difference at a common scale.
  lessEquals(target: MiniDecimal) {
    return this.add(target.negate().toString()).toNumber() <= 0;
  }

  // Converts the normalized string to a number and preserves NaN for parse errors.
  toNumber() {
    return this.isNaN() ? NaN : Number(this.toString());
  }

  // Returns the former text in raw mode and removes insignificant zeros in safe mode.
  toString(safe = true) {
    if (!safe) {
      return this.origin;
    }
    if (this.isInvalidate()) {
      return '';
    }

    return trimNumber(`${this.getMark()}${this.getIntegerStr()}.${this.getDecimalStr()}`).fullStr;
  }
}
