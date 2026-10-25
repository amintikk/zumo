import { zip, Zippable } from 'fflate';
import WorkerBridge from '../worker-bridge';
import { sniffMimeType } from '../util';
import { drawableToImageData } from '../util/canvas';
import type { EncoderState, ProcessorState } from '../feature-meta';
import type { SourceImage } from '../Compress';
import {
  decodeImage,
  processImage,
  compressImage,
  processSvg,
  resizeTarget,
} from '../Compress/pipeline';
import type { BatchEntry } from './expand';

export interface BatchSettings {
  processorState: ProcessorState;
  encoderState: EncoderState;
  /** Keep the original file if re-encoding in the same format makes it bigger */
  keepOriginalIfLarger: boolean;
}

export interface BatchResult {
  entry: BatchEntry;
  output?: File;
  keptOriginal?: boolean;
  error?: string;
}

/**
 * How many images to process at once. Each lane has its own worker, and
 * holds a couple of full-size bitmaps in memory, so stay conservative.
 */
function laneCount(total: number): number {
  const cores = navigator.hardwareConcurrency || 2;
  const memory: number = (navigator as any).deviceMemory || 8;
  const max = memory <= 4 ? 2 : 4;
  return Math.max(1, Math.min(max, Math.floor(cores / 2), total));
}

async function processEntry(
  signal: AbortSignal,
  entry: BatchEntry,
  settings: BatchSettings,
  workerBridge: WorkerBridge,
): Promise<Pick<BatchResult, 'output' | 'keptOriginal'>> {
  const { file } = entry;
  let decoded: ImageData;
  let vectorImage: HTMLImageElement | undefined;

  if (file.type.startsWith('image/svg+xml')) {
    vectorImage = await processSvg(signal, file);
    decoded = drawableToImageData(vectorImage);
  } else {
    decoded = await decodeImage(signal, file, workerBridge);
  }

  const source: SourceImage = {
    file,
    decoded,
    preprocessed: decoded,
    vectorImage,
  };
  const { processorState } = settings;
  const processed = await processImage(
    signal,
    source,
    processorState,
    workerBridge,
  );
  const output = await compressImage(
    signal,
    processed,
    settings.encoderState,
    file.name,
    workerBridge,
  );

  if (
    settings.keepOriginalIfLarger &&
    !resizeTarget(decoded.width, decoded.height, processorState.resize) &&
    output.size >= file.size &&
    (await sniffMimeType(file)) === output.type
  ) {
    return { output: file, keptOriginal: true };
  }

  return { output, keptOriginal: false };
}

/**
 * Process every entry with the same settings. Results are reported as they
 * complete, and also returned in the original order.
 */
export async function processBatch(
  signal: AbortSignal,
  entries: BatchEntry[],
  settings: BatchSettings,
  onResult: (index: number, result: BatchResult) => void,
): Promise<BatchResult[]> {
  const results: BatchResult[] = new Array(entries.length);
  let next = 0;

  const lane = async () => {
    const workerBridge = new WorkerBridge();
    while (next < entries.length) {
      if (signal.aborted) return;
      const index = next++;
      const entry = entries[index];
      let result: BatchResult;

      try {
        result = {
          entry,
          ...(await processEntry(signal, entry, settings, workerBridge)),
        };
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error(entry.path, err);
        result = {
          entry,
          error: err instanceof Error ? err.message : String(err),
        };
      }

      results[index] = result;
      onResult(index, result);
    }
  };

  await Promise.all(
    Array.from({ length: laneCount(entries.length) }, () => lane()),
  );

  if (signal.aborted) throw new DOMException('AbortError', 'AbortError');
  return results;
}

/** Output path for a result: same folder, new extension, no clashes. */
function uniquePath(path: string, used: Set<string>): string {
  let candidate = path;
  for (let i = 1; used.has(candidate.toLowerCase()); i++) {
    candidate = path.replace(/(\.[^./]*)?$/, `-${i}$1`);
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

export function outputPath(result: BatchResult): string {
  const { entry, output } = result;
  if (!output || result.keptOriginal) return entry.path;
  const ext = /\.[^./]*$/.exec(output.name)?.[0] || '';
  return entry.path.replace(/(\.[^./]*)?$/, ext);
}

/** Bundle all successful outputs into a single ZIP, keeping folders. */
export async function zipResults(results: BatchResult[]): Promise<Blob> {
  const files: Zippable = {};
  const used = new Set<string>();

  for (const result of results) {
    if (!result.output) continue;
    const path = uniquePath(outputPath(result), used);
    const data = new Uint8Array(await result.output.arrayBuffer());
    // Images are already compressed, so just store them.
    files[path] = [data, { level: 0 }];
  }

  const data = await new Promise<Uint8Array>((resolve, reject) => {
    zip(files, { level: 0 }, (err, data) =>
      err ? reject(err) : resolve(data),
    );
  });

  return new Blob([data], { type: 'application/zip' });
}
