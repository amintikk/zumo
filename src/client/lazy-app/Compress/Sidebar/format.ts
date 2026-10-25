import prettyBytes from '../Results/pretty-bytes';
import type { EncoderType } from '../../feature-meta';

/** Formats offered in the editor. The rest of Squoosh's codecs stay hidden. */
export const mainFormats: EncoderType[] = [
  'mozJPEG',
  'webP',
  'avif',
  'oxiPNG',
  'jxl',
];

const numberFormat = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 1,
});

export function formatBytes(bytes: number): string {
  const { value, unit } = prettyBytes(bytes);
  return `${numberFormat.format(Number(value))} ${unit}`;
}

/** "−85 %" / "+12 %" */
export function savings(before: number, after: number): string {
  if (!before) return '';
  const percent = Math.round((1 - after / before) * 100);
  return percent >= 0 ? `−${percent} %` : `+${-percent} %`;
}

/** What people call each output format (not the encoder's name) */
export const formatNames: { [type: string]: string } = {
  mozJPEG: 'JPEG',
  webP: 'WebP',
  avif: 'AVIF',
  oxiPNG: 'PNG',
  jxl: 'JPEG XL',
  browserJPEG: 'JPEG',
  browserPNG: 'PNG',
  browserGIF: 'GIF',
  qoi: 'QOI',
  wp2: 'WebP 2',
};
