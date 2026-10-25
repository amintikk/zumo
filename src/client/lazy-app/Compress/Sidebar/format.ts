import prettyBytes from '../Results/pretty-bytes';
import type { EncoderType } from '../../feature-meta';
import { lang } from 'shared/strings';

/** Formats offered in the editor. The rest of Squoosh's codecs stay hidden. */
export const mainFormats: EncoderType[] = [
  'mozJPEG',
  'webP',
  'avif',
  'oxiPNG',
  'jxl',
];

const locales = { es: 'es-ES', en: 'en-GB' };

/** Numbers in the current language: "56,8 kB" / "56.8 kB" */
export function formatBytes(bytes: number): string {
  const { value, unit } = prettyBytes(bytes);
  const number = new Intl.NumberFormat(locales[lang], {
    maximumFractionDigits: 1,
  }).format(Number(value));
  return `${number} ${unit}`;
}

/** "85 %" in Spanish, "85%" in English */
export function percent(value: number): string {
  return lang === 'es' ? `${value} %` : `${value}%`;
}

/** "−85 %" / "+12 %" */
export function savings(before: number, after: number): string {
  if (!before) return '';
  const saved = Math.round((1 - after / before) * 100);
  return saved >= 0 ? `−${percent(saved)}` : `+${percent(-saved)}`;
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
