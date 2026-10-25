import { h, Component } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';

interface Props extends preact.JSX.HTMLAttributes {
  /** Decimals shown in the value field */
  labelPrecision?: string;
}

interface State {
  editing?: string;
}

function decimals(step: unknown): number {
  const part = String(step ?? '').split('.')[1];
  return part ? part.length : 0;
}

/**
 * Slider row: label and an editable value on top, an iOS-style slider below.
 * The <input type=range> keeps the `name`, so forms can read it as before.
 */
export default class Range extends Component<Props, State> {
  state: State = {};
  private rangeEl?: HTMLInputElement;

  private format(value: number): string {
    const precision =
      Number(this.props.labelPrecision) || decimals(this.props.step);
    return precision ? value.toFixed(precision) : String(Math.round(value));
  }

  private commitText = (event: Event) => {
    const text = (event.currentTarget as HTMLInputElement).value.trim();
    this.setState({ editing: text });
    if (!text || isNaN(Number(text))) return;
    const range = this.rangeEl!;
    range.value = text;
    range.dispatchEvent(new Event('input', { bubbles: true }));
  };

  render(props: Props, { editing }: State) {
    const {
      children,
      labelPrecision,
      class: _,
      ref: __,
      ...rangeProps
    } = props as any;
    const min = Number(props.min ?? 0);
    const max = Number(props.max ?? 100);
    const value = Number(props.value ?? min);
    const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
    const label =
      typeof children === 'string' ? children.replace(/:\s*$/, '') : children;

    return (
      <div class={style.range}>
        <div class={style.head}>
          <span class={style.label}>{label}</span>
          <input
            class={style.value}
            type="text"
            inputMode="decimal"
            aria-label={typeof label === 'string' ? label : undefined}
            value={editing ?? this.format(value)}
            onInput={this.commitText}
            onBlur={() => this.setState({ editing: undefined })}
            onKeyDown={(event) => {
              if (event.key === 'Enter')
                (event.currentTarget as HTMLInputElement).blur();
            }}
            disabled={props.disabled}
          />
        </div>
        {/* @ts-ignore - TS bug https://github.com/microsoft/TypeScript/issues/16019 */}
        <input
          ref={(el: HTMLInputElement | null) => {
            this.rangeEl = el || undefined;
          }}
          class={style.slider}
          type="range"
          style={{ '--p': `${percent}%` }}
          {...rangeProps}
        />
      </div>
    );
  }
}
