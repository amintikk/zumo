import { h } from 'preact';

interface Props extends preact.JSX.HTMLAttributes {}

/** Boolean option, shown as an iOS switch (see .switch in ui.css). */
export default function Checkbox(props: Props) {
  return (
    <span class="switch">
      {/* @ts-ignore - TS bug https://github.com/microsoft/TypeScript/issues/16019 */}
      <input type="checkbox" role="switch" {...props} />
      <span class="track">
        <span class="knob" />
      </span>
    </span>
  );
}
