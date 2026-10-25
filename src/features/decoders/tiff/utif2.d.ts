// Minimal types for utif2. Its own types pull in Node's globals (Buffer),
// which would leak into the browser code, so generic-tsconfig maps the
// module here instead.
interface IFD {
  width: number;
  height: number;
  [tag: string]: any;
}

declare const UTIF: {
  decode(buffer: ArrayBuffer): IFD[];
  decodeImage(buffer: ArrayBuffer, ifd: IFD): void;
  toRGBA8(ifd: IFD): Uint8Array;
};

export default UTIF;
