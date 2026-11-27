// Algorithm Project Nayuki from @rc-component/qrcode 2.0.0, MIT. See vendor/LICENSE.qrcodegen and
// vendor/LICENSE.rc-qrcode.

export class Ecc {
  public static readonly LOW = new Ecc(0, 1);
  public static readonly MEDIUM = new Ecc(1, 0);
  public static readonly QUARTILE = new Ecc(2, 3);
  public static readonly HIGH = new Ecc(3, 2);
  public ordinal: number;
  public formatBits: number;

  private constructor(ordinal: number, formatBits: number) {
    this.ordinal = ordinal;
    this.formatBits = formatBits;
  }
}
