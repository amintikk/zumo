import { blobToArrayBuffer } from 'features/worker-utils';

export default async function decode(blob: Blob): Promise<ImageData> {
  const [{ default: UTIF }, buffer] = await Promise.all([
    import('utif2'),
    blobToArrayBuffer(blob),
  ]);

  const pages = UTIF.decode(buffer);
  if (!pages.length) throw new Error('Decoding error');

  // Some TIFFs start with a thumbnail, so use the largest page.
  // t256/t257 are the ImageWidth/ImageLength tags.
  const area = (page: typeof pages[number]) =>
    (page.t256 ? page.t256[0] : 0) * (page.t257 ? page.t257[0] : 0);
  const page = pages.reduce((best, current) =>
    area(current) > area(best) ? current : best,
  );
  UTIF.decodeImage(buffer, page);
  if (!page.width || !page.height) throw new Error('Decoding error');

  const rgba: Uint8Array = UTIF.toRGBA8(page);
  return new ImageData(
    new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.byteLength),
    page.width,
    page.height,
  );
}
