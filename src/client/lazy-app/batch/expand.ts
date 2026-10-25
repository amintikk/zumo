import { unzip, unzipSync, Unzipped, UnzipFileFilter } from 'fflate';

export interface BatchEntry {
  file: File;
  /** Path inside the batch (keeps the ZIP's folder structure) */
  path: string;
}

export interface ExpandedBatch {
  entries: BatchEntry[];
  /** Base name for the output ZIP, without extension */
  name: string;
  /** Files that were ignored because they aren't images */
  skipped: number;
}

const imageTypes: { [ext: string]: string } = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jfif: 'image/jpeg',
  pjpeg: 'image/jpeg',
  png: 'image/png',
  apng: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
  jxl: 'image/jxl',
  qoi: 'image/qoi',
  wp2: 'image/webp2',
  heic: 'image/heic',
  heif: 'image/heif',
  tif: 'image/tiff',
  tiff: 'image/tiff',
};

function extension(path: string): string {
  const match = /\.([^./]+)$/.exec(path);
  return match ? match[1].toLowerCase() : '';
}

function basename(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}

/** Junk added by macOS/Windows archivers, hidden files and folders */
function isJunk(path: string): boolean {
  return (
    path.endsWith('/') ||
    path.startsWith('__MACOSX/') ||
    path.split('/').some((part) => part.startsWith('.')) ||
    basename(path).toLowerCase() === 'thumbs.db'
  );
}

function isImagePath(path: string): boolean {
  return !isJunk(path) && extension(path) in imageTypes;
}

export function isZip(file: File): boolean {
  return (
    extension(file.name) === 'zip' ||
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed'
  );
}

/** True if these files should open the batch editor instead of a single image */
export function needsBatch(files: File[]): boolean {
  return files.length > 1 || (files.length === 1 && isZip(files[0]));
}

function unzipAsync(
  data: Uint8Array,
  filter: UnzipFileFilter,
): Promise<Unzipped> {
  return new Promise((resolve) => {
    unzip(data, { filter }, (err, result) => {
      // fflate decompresses large entries in workers. If that fails for any
      // reason, fall back to doing it on the main thread.
      resolve(err ? unzipSync(data, { filter }) : result);
    });
  });
}

/** Turn ZIPs and loose files into a flat, sorted list of images. */
export async function expandFiles(files: File[]): Promise<ExpandedBatch> {
  const entries: BatchEntry[] = [];
  let skipped = 0;
  const zips = files.filter(isZip);

  for (const file of files) {
    if (isZip(file)) {
      // Prefix with the ZIP name when there's more than one, to avoid clashes
      const prefix =
        zips.length > 1 ? file.name.replace(/\.zip$/i, '') + '/' : '';
      const data = new Uint8Array(await file.arrayBuffer());
      const unzipped = await unzipAsync(data, (info) => {
        if (info.name.endsWith('/')) return false;
        const keep = isImagePath(info.name);
        if (!keep && !isJunk(info.name)) skipped++;
        return keep;
      });

      for (const [path, bytes] of Object.entries(unzipped)) {
        entries.push({
          path: prefix + path,
          file: new File([bytes], basename(path), {
            type: imageTypes[extension(path)],
          }),
        });
      }
      continue;
    }

    if (
      !file.type.startsWith('image/') &&
      !(extension(file.name) in imageTypes)
    ) {
      skipped++;
      continue;
    }

    const path = (file as any).webkitRelativePath || file.name;
    // Some OSes leave the type empty for less common formats
    const typed =
      file.type || !imageTypes[extension(path)]
        ? file
        : new File([file], file.name, { type: imageTypes[extension(path)] });
    entries.push({ path, file: typed });
  }

  entries.sort((a, b) =>
    a.path.localeCompare(b.path, undefined, {
      numeric: true,
      sensitivity: 'base',
    }),
  );

  const name =
    files.length === 1 ? files[0].name.replace(/\.[^.]*$/, '') : 'imagenes';

  return { entries, name, skipped };
}
