// Числовой fallback MiniDecimal для runtime без BigInt. Сохраняет исходную строку и ограничивает
// результат безопасным диапазоном.
import { getNumberPrecision, isEmptyDecimal, numberToString } from './decimal-format.engine';
import type { DecimalValue, MiniDecimal } from './mini-decimal.engine';

/** Исходный fallback mini-decimal для runtime без BigInt. */
export class NumberDecimal implements MiniDecimal {
  origin = '';
  number?: number;
  empty?: boolean;

  // Различает пустой ввод и недопустимое число, сохраняя исходный текст непустого значения.
  constructor(value: DecimalValue) {
    if (isEmptyDecimal(value)) {
      this.empty = true;
      return;
    }

    this.origin = String(value);
    this.number = Number(value);
  }

  // Возвращает числовое значение с обратным знаком в новом экземпляре.
  negate() {
    return new NumberDecimal(-this.toNumber()!);
  }

  // Учитывает точность обоих слагаемых и пределы безопасных чисел. Невалидное слагаемое сохраняет
  // текущее значение.
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

  // Показывает отдельно состояние пустого ввода.
  isEmpty() {
    return this.empty;
  }

  // Распознаёт невалидное число, сохраняя отдельное состояние пустой строки.
  isNaN() {
    return Number.isNaN(this.number);
  }

  // Проверяет, допустимо ли использовать экземпляр в числовой операции.
  isInvalidate() {
    return this.isEmpty() || this.isNaN();
  }

  // Сравнивает числовые представления без приведения разных типов.
  equals(target: MiniDecimal | null | undefined) {
    return this.toNumber() === target?.toNumber();
  }

  // Сравнивает знак разности с тем же округлением, что и add.
  lessEquals(target: MiniDecimal) {
    return this.add(target.negate().toString()).toNumber()! <= 0;
  }

  // Возвращает сохранённое число или undefined для пустого ввода.
  toNumber() {
    return this.number;
  }

  // В raw-режиме сохраняет пользовательское представление, в safe-режиме нормализует число.
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
