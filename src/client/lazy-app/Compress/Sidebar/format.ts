import prettyBytes from '../Results/pretty-bytes';

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
