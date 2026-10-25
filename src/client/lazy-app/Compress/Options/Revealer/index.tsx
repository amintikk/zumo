import { h } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import { Icon } from 'shared/icons';

interface Props extends preact.JSX.HTMLAttributes {}

/** Disclosure chevron for "advanced settings" rows. */
export default function Revealer(props: Props) {
  return (
    <span class={style.revealer}>
      {/* @ts-ignore - TS bug https://github.com/microsoft/TypeScript/issues/16019 */}
      <input class={style.input} type="checkbox" {...props} />
      <span class={style.chevron}>
        <Icon name="chevron-right" size={16} weight={2.4} />
      </span>
    </span>
  );
}
