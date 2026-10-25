import { h } from 'preact';
import { iconData, IconName } from './data';

export type { IconName };

interface Props {
  name: IconName;
  size?: number;
  /** Stroke width: 2 by default, 1.8 for big glyphs, ~2.6 for small checks */
  weight?: number;
  class?: string;
}

/** Lucide icon, drawn with round caps and joins. Always decorative. */
export function Icon({ name, size = 18, weight = 2, class: className }: Props) {
  return (
    <svg
      class={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={weight}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {iconData[name].map(([tag, attrs]) => h(tag, attrs as any))}
    </svg>
  );
}
