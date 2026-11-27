// Encodes input as QR bit segments. The mode determines the data format and count width for the
// symbol version. Uses Project Nayuki's algorithm from @rc-component/qrcode 2.0.0, MIT. See
// vendor/LICENSE.qrcodegen and vendor/LICENSE.rc-qrcode.
import { Mode } from './qrcode-mode.engine';
import { appendBits } from './qrcode-bits.engine';

export class QrSegment {

  // Writes each input item as one byte of the BYTE segment.
  public static makeBytes(data: Readonly<number[]>): QrSegment {
    const bb: number[] = [];
    for (const b of data) {
      appendBits(b, 8, bb);
    }
    return new QrSegment(Mode.BYTE, data.length, bb);
  }

  // Encodes groups up to three digits with a width corresponding to the number of digits.
  public static makeNumeric(digits: string): QrSegment {
    if (!QrSegment.isNumeric(digits)) {
      throw new RangeError('String contains non-numeric characters');
    }
    const bb: number[] = [];
    for (let i = 0; i < digits.length;) {
      const n: number = Math.min(digits.length - i, 3);
      appendBits(parseInt(digits.substring(i, i + n), 10), n * 3 + 1, bb);
      i += n;
    }
    return new QrSegment(Mode.NUMERIC, digits.length, bb);
  }

  // Encodes a pair of symbols from the alphabet QR and completes a single tail.
  public static makeAlphanumeric(text: string): QrSegment {
    if (!QrSegment.isAlphanumeric(text)) {
      throw new RangeError('String contains unencodable characters in alphanumeric mode');
    }
    const bb: number[] = [];
    let i: number;
    for (i = 0; i + 2 <= text.length; i += 2) {
      let temp: number = QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)) * 45;
      temp += QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i + 1));
      appendBits(temp, 11, bb);
    }
    if (i < text.length) {
      appendBits(QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)), 6, bb);
    }
    return new QrSegment(Mode.ALPHANUMERIC, text.length, bb);
  }

  // Select the mode for the whole line. An empty line does not add segments.
  public static makeSegments(text: string): QrSegment[] {
    if (text == '') {
      return [];
    }
    else if (QrSegment.isNumeric(text)) {
      return [QrSegment.makeNumeric(text)];
    }
    else if (QrSegment.isAlphanumeric(text)) {
      return [QrSegment.makeAlphanumeric(text)];
    }
    else {
      return [QrSegment.makeBytes(QrSegment.toUtf8ByteArray(text))];
    }
  }

  // Writes the ECI identifier at the width required by its range.
  public static makeEci(assignVal: number): QrSegment {
    const bb: number[] = [];
    if (assignVal < 0) {
      throw new RangeError('ECI assignment value out of range');
    }
    else if (assignVal < 1 << 7) {
      appendBits(assignVal, 8, bb);
    }
    else if (assignVal < 1 << 14) {
      appendBits(0b10, 2, bb);
      appendBits(assignVal, 14, bb);
    }
    else if (assignVal < 1000000) {
      appendBits(0b110, 3, bb);
      appendBits(assignVal, 21, bb);
    }
    else {
      throw new RangeError('ECI assignment value out of range');
    }
    return new QrSegment(Mode.ECI, 0, bb);
  }

  // Verifies the permissibility of the digital mode for the whole string.
  public static isNumeric(text: string): boolean {
    return QrSegment.NUMERIC_REGEX.test(text);
  }

  // Verifies the line according to the alphabet mode ALPHANUMERIC.
  public static isAlphanumeric(text: string): boolean {
    return QrSegment.ALPHANUMERIC_REGEX.test(text);
  }
  public mode: Mode;
  public numChars: number;
  private bitData: number[];

  // Saves the counter and bit data with a separate copy.
  public constructor(mode: Mode, numChars: number, bitData: number[]) {
    this.mode = mode;
    this.numChars = numChars;
    this.bitData = bitData;
    if (numChars < 0) {
      throw new RangeError('Invalid argument');
    }
    this.bitData = bitData.slice();
  }

  // Returns a copy of the bits so that the causing code does not change the segment.
  public getData(): number[] {
    return this.bitData.slice();
  }

  // Considers the titles and data for the version. Returns Infinity when the meter is overflowed.
  public static getTotalBits(segs: Readonly<QrSegment[]>, version: number): number {
    let result: number = 0;
    for (const seg of segs) {
      const ccbits: number = seg.mode.numCharCountBits(version);
      if (seg.numChars >= 1 << ccbits) {
        return Infinity;
      }
      result += 4 + ccbits + seg.bitData.length;
    }
    return result;
  }
  // Encodes a string in UTF-8 for mode BYTE.
  private static toUtf8ByteArray(input: string): number[] {
    const str = encodeURI(input);
    const result: number[] = [];
    for (let i = 0; i < str.length; i++) {
      if (str.charAt(i) != '%') {
        result.push(str.charCodeAt(i));
      }
      else {
        result.push(parseInt(str.substring(i + 1, i + 3), 16));
        i += 2;
      }
    }
    return result;
  }
  private static readonly NUMERIC_REGEX: RegExp = /^[0-9]*$/;
  private static readonly ALPHANUMERIC_REGEX: RegExp = /^[A-Z0-9 $%*+./:-]*$/;
  private static readonly ALPHANUMERIC_CHARSET: string = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
}
