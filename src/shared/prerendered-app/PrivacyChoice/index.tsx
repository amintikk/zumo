import { h, Component } from 'preact';
import * as style from './style.css';
import { S } from 'shared/strings';
import { getConsent, setConsent } from 'shared/analytics';

interface State {
  open: boolean;
}

/**
 * Floating analytics choice. Deliberately not called "cookie-banner":
 * ad blockers hide anything with that name.
 */
export default class PrivacyChoice extends Component<{}, State> {
  state: State = { open: !__PRERENDER__ && !getConsent() };

  componentDidMount() {
    window.addEventListener('zumo:consent-open', this.onOpen);
    this.reserveSpace();
  }

  componentDidUpdate() {
    this.reserveSpace();
  }

  componentWillUnmount() {
    window.removeEventListener('zumo:consent-open', this.onOpen);
    document.documentElement.style.removeProperty('--privacy-h');
  }

  /** Lets the page and notices make room for the pill while it's open */
  private reserveSpace() {
    const root = document.documentElement.style;
    const el = this.base as HTMLElement | null;
    if (this.state.open && el && el.getBoundingClientRect) {
      root.setProperty(
        '--privacy-h',
        `${el.getBoundingClientRect().height + 18}px`,
      );
    } else {
      root.removeProperty('--privacy-h');
    }
  }

  private onOpen = () => this.setState({ open: true });

  private choose(consent: 'granted' | 'denied') {
    setConsent(consent);
    this.setState({ open: false });
  }

  render(_: {}, { open }: State) {
    if (!open) return null;
    return (
      <div
        class={style.privacyChoice}
        role="dialog"
        aria-label={S.consent.label}
        aria-live="polite"
      >
        <p class={style.text}>{S.consent.text}</p>
        <div class={style.buttons}>
          <button
            class="btn btn-glass btn-sm"
            onClick={() => this.choose('denied')}
          >
            {S.consent.reject}
          </button>
          <button
            class="btn btn-primary btn-sm"
            onClick={() => this.choose('granted')}
          >
            {S.consent.accept}
          </button>
        </div>
      </div>
    );
  }
}
