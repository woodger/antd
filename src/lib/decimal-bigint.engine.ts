// Хранит знак, целую и дробную части MiniDecimal раздельно. Общий scale используется только для
// выполнения арифметики.
import { isEmptyDecimal, isScientificNumber, numberToString, trimNumber,
  validateNumber } from './decimal-format.engine';
import type { DecimalValue, MiniDecimal } from './mini-decimal.engine';

/** BigIntDecimal mini-decimal 1.0.1: исходные строки, scale и округления. */
export class BigIntDecimal implements MiniDecimal {
  origin = '';
  negative?: boolean;
  integer?: bigint;
  decimal?: bigint;
  decimalLen?: number;
  empty?: boolean;
  nan?: boolean;

  // Отделяет пустое значение от невалидного. Целая и дробная части читаются после нормализации
  // строки.
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

  // Добавляет знак только для отрицательно представленного значения.
  private getMark() {
    return this.negative ? '-' : '';
  }

  // Сериализует целую часть экземпляра после проверки его валидности.
  private getIntegerStr() {
    return this.integer!.toString();
  }

  // Восстанавливает ведущие нули дробной части по сохранённому scale.
  private getDecimalStr() {
    return this.decimal!.toString().padStart(this.decimalLen!, '0');
  }

  // Переводит значение в целое число с общим scale, дополняя дробь справа.
  private alignDecimal(length: number) {
    return BigInt(this.getMark() + this.getIntegerStr() + this.getDecimalStr().padEnd(length, '0'));
  }

  // Копирует нормализованную запись и инвертирует знак, не изменяя получателя.
  negate() {
    const clone = new BigIntDecimal(this.toString());
    clone.negative = !clone.negative;

    return clone;
  }

  // Складывает целые с общим scale и восстанавливает положение дробной точки.
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

  // Обозначает отсутствие введённого значения независимо от результата parse.
  isEmpty() {
    return this.empty;
  }

  // Обозначает ошибку разбора в отдельном флаге.
  isNaN() {
    return this.nan;
  }

  // Проверяет состояния, для которых части числа не были созданы.
  isInvalidate() {
    return this.isEmpty() || this.isNaN();
  }

  // Сравнивает нормализованные десятичные строки без потери точности через number.
  equals(target: MiniDecimal | null | undefined) {
    return this.toString() === target?.toString();
  }

  // Сравнивает знак разности, вычисленной с общим scale.
  lessEquals(target: MiniDecimal) {
    return this.add(target.negate().toString()).toNumber() <= 0;
  }

  // Преобразует нормализованную строку в число и сохраняет NaN для ошибки разбора.
  toNumber() {
    return this.isNaN() ? NaN : Number(this.toString());
  }

  // Возвращает исходный текст в raw-режиме и убирает незначащие нули в safe-режиме.
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
