import { blobToArrayBuffer } from 'features/worker-utils';

interface HeifImage {
  get_width(): number;
  get_height(): number;
  display(
    target: { data: Uint8ClampedArray; width: number; height: number },
    callback: (result: unknown) => void,
  ): void;
  free?(): void;
}

interface LibHeif {
  HeifDecoder: new () => { decode(data: Uint8Array): HeifImage[] };
}

let libheif: Promise<LibHeif> | undefined;

/**
 * libheif (LGPL) with its wasm inlined. It's ~2 MB, so it's only loaded the
 * first time someone opens a HEIC/HEIF file.
 */
function loadLibheif(): Promise<LibHeif> {
  if (!libheif) {
    libheif = import(
      // @ts-ignore - no types for the ESM bundle
      'libheif-js/libheif-wasm/libheif-bundle.mjs'
    ).then(async ({ default: factory }) => {
      const module = factory();
      return typeof module.then === 'function' ? await module : module;
    });
  }
  return libheif;
}

export default async function decode(blob: Blob): Promise<ImageData> {
  const [lib, buffer] = await Promise.all([
    loadLibheif(),
    blobToArrayBuffer(blob),
  ]);

  const images = new lib.HeifDecoder().decode(new Uint8Array(buffer));
  // The first image is the primary one (others are thumbnails, depth maps…)
  const image = images[0];
  if (!image) throw new Error('Decoding error');

  try {
    const width = image.get_width();
    const height = image.get_height();
    const target = {
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
    };
    await new Promise<void>((resolve, reject) =>
      image.display(target, (result) =>
        result ? resolve() : reject(new Error('Decoding error')),
      ),
    );
    return new ImageData(target.data, width, height);
  } finally {
    for (const img of images) img.free?.();
  }
}
