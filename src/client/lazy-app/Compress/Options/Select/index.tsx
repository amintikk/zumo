import { h, Component, toChildArray, VNode } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import { Icon } from 'shared/icons';

interface Props extends preact.JSX.HTMLAttributes {
  large?: boolean;
}

interface State {
  open: boolean;
  active: number;
}

interface Choice {
  value: string;
  label: string;
}

function choicesFrom(children: preact.ComponentChildren): Choice[] {
  return toChildArray(children)
    .filter((child): child is VNode<any> => typeof child === 'object')
    .map((child) => ({
      value: String(child.props.value),
      label: toChildArray(child.props.children).join(''),
    }));
}

let menuId = 0;

/**
 * Pop-up menu. A hidden <select> keeps the `name` and fires the usual
 * `change` event, so forms that read it don't need to know.
 */
export default class Select extends Component<Props, State> {
  state: State = { open: false, active: 0 };
  private id = `select-menu-${++menuId}`;
  private selectEl?: HTMLSelectElement;
  private buttonEl?: HTMLButtonElement;

  componentWillUnmount() {
    document.removeEventListener('pointerdown', this.onOutside, true);
  }

  private choices(): Choice[] {
    return choicesFrom(this.props.children);
  }

  private open = () => {
    const choices = this.choices();
    const current = choices.findIndex(
      (choice) => choice.value === String(this.props.value),
    );
    this.setState({ open: true, active: Math.max(0, current) });
    document.addEventListener('pointerdown', this.onOutside, true);
  };

  private close = (focusButton = true) => {
    this.setState({ open: false });
    document.removeEventListener('pointerdown', this.onOutside, true);
    if (focusButton) this.buttonEl?.focus();
  };

  private onOutside = (event: Event) => {
    if (!this.base!.contains(event.target as Node)) this.close(false);
  };

  private choose(value: string) {
    const select = this.selectEl!;
    if (select.value !== value) {
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    this.close();
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const choices = this.choices();
    const { open, active } = this.state;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        this.open();
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      this.setState({
        active: (active + step + choices.length) % choices.length,
      });
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (choices[active]) this.choose(choices[active].value);
    } else if (event.key === 'Tab') {
      this.close(false);
    }
  };

  render(props: Props, { open, active }: State) {
    const { large, children, class: _, ref: __, ...selectProps } = props as any;
    const choices = choicesFrom(children);
    const current = choices.find(
      (choice) => choice.value === String(props.value),
    );

    return (
      <div class={`${style.select} ${large ? style.large : ''}`}>
        {/* @ts-ignore - TS bug https://github.com/microsoft/TypeScript/issues/16019 */}
        <select
          ref={(el: HTMLSelectElement | null) => {
            this.selectEl = el || undefined;
          }}
          class={style.native}
          tabIndex={-1}
          aria-hidden="true"
          {...selectProps}
        >
          {children}
        </select>
        <button
          ref={(el: HTMLButtonElement | null) => {
            this.buttonEl = el || undefined;
          }}
          type="button"
          class={style.button}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={this.id}
          disabled={props.disabled}
          onClick={() => (open ? this.close() : this.open())}
          onKeyDown={this.onKeyDown}
        >
          <span class={style.current}>{current ? current.label : ''}</span>
          <Icon name="chevrons-up-down" size={14} weight={2.2} />
        </button>
        {open && (
          <ul
            id={this.id}
            class={style.menu}
            role="listbox"
            aria-activedescendant={`${this.id}-${active}`}
          >
            {choices.map((choice, i) => (
              <li
                id={`${this.id}-${i}`}
                role="option"
                aria-selected={choice.value === String(props.value)}
                class={`${style.option} ${i === active ? style.active : ''}`}
                onPointerEnter={() => this.setState({ active: i })}
                onClick={() => this.choose(choice.value)}
              >
                <span class={style.check}>
                  {choice.value === String(props.value) && (
                    <Icon name="check" size={15} weight={2.6} />
                  )}
                </span>
                {choice.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
}
