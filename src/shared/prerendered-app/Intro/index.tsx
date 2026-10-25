import { h, Component } from 'preact';

import { linkRef } from 'shared/prerendered-app/util';
import logo from 'url:./imgs/zumo-icon.svg';
import * as style from './style.css';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import 'shared/custom-els/snack-bar';
import { Icon, IconName } from 'shared/icons';
import { S, lang, setLang } from 'shared/strings';
import { currentTheme, setTheme, Theme } from 'shared/theme';
import { reopenConsent, loadAnalytics } from 'shared/analytics';
import PrivacyChoice from '../PrivacyChoice';

const supportsClipboardAPI =
  !__PRERENDER__ && navigator.clipboard && navigator.clipboard.read;

const acceptedFiles =
  'image/*,.zip,application/zip,application/x-zip-compressed,.heic,.heif,.tif,.tiff,.avif,.jxl,.qoi,.wp2,.svg';

const infoTiles: [IconName, string][] = [
  ['file-archive', 't-orange'],
  ['shield-check', 't-green'],
  ['smartphone', 't-gray'],
];

async function getImageClipboardItem(
  items: ClipboardItem[],
): Promise<undefined | Blob> {
  for (const item of items) {
    const type = item.types.find((type) => type.startsWith('image/'));
    if (type) return item.getType(type);
  }
}

/** HTML from the dictionary (only used for <br> in titles) */
const html = (text: string) => ({ __html: text });

interface Props {
  onFiles?: (files: File[]) => void;
  showSnack?: SnackBarElement['showSnackbar'];
}

interface State {
  beforeInstallEvent?: BeforeInstallPromptEvent;
  theme: Theme;
  installed: boolean;
  installHelp: boolean;
}

const isIOS =
  !__PRERENDER__ &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export default class Intro extends Component<Props, State> {
  state: State = {
    theme: __PRERENDER__ ? 'light' : currentTheme(),
    installed:
      !__PRERENDER__ &&
      (matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true),
    installHelp: false,
  };
  private fileInput?: HTMLInputElement;

  componentDidMount() {
    window.addEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPromptEvent,
    );
    window.addEventListener('appinstalled', this.onAppInstalled);
    window.addEventListener('zumo:theme', this.onThemeChange);
    matchMedia('(prefers-color-scheme: dark)').addListener(this.onThemeChange);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('pointerdown', this.onPointerDown, true);
    loadAnalytics();
  }

  componentWillUnmount() {
    window.removeEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPromptEvent,
    );
    window.removeEventListener('appinstalled', this.onAppInstalled);
    window.removeEventListener('zumo:theme', this.onThemeChange);
    matchMedia('(prefers-color-scheme: dark)').removeListener(
      this.onThemeChange,
    );
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('pointerdown', this.onPointerDown, true);
  }

  private onThemeChange = () => this.setState({ theme: currentTheme() });

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.state.installHelp) {
      this.setState({ installHelp: false });
    }
  };

  private onPointerDown = (event: Event) => {
    if (!this.state.installHelp) return;
    const wrap = (this.base as HTMLElement).querySelector(
      `.${style.installWrap}`,
    );
    if (wrap && !wrap.contains(event.target as Node)) {
      this.setState({ installHelp: false });
    }
  };

  private onThemeClick = (event: MouseEvent) => {
    const button = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setTheme(this.state.theme === 'dark' ? 'light' : 'dark', {
      x: button.left + button.width / 2,
      y: button.top + button.height / 2,
    });
  };

  private onLangClick = () => {
    setLang(lang === 'es' ? 'en' : 'es');
  };

  private onFileChange = (event: Event): void => {
    const fileInput = event.target as HTMLInputElement;
    const files = fileInput.files ? Array.from(fileInput.files) : [];
    if (files.length === 0) return;
    fileInput.value = '';
    this.props.onFiles!(files);
  };

  private onOpenClick = () => {
    this.fileInput!.click();
  };

  private onBeforeInstallPromptEvent = (event: BeforeInstallPromptEvent) => {
    event.preventDefault();
    this.setState({ beforeInstallEvent: event });
  };

  private onInstallClick = () => {
    const { beforeInstallEvent, installHelp } = this.state;
    if (beforeInstallEvent) {
      beforeInstallEvent.prompt();
      return;
    }
    // Safari and Firefox don't offer a prompt: explain how instead
    this.setState({ installHelp: !installHelp });
  };

  private onAppInstalled = () => {
    this.setState({
      beforeInstallEvent: undefined,
      installed: true,
      installHelp: false,
    });
  };

  private renderActions() {
    const { theme, installed, installHelp } = this.state;
    const themeLabel = theme === 'dark' ? S.header.toLight : S.header.toDark;
    return (
      <div class={style.actions}>
        <button
          class={`icon-btn has-tip ${style.action}`}
          onClick={this.onThemeClick}
          aria-label={themeLabel}
        >
          <span
            class={`${style.themeIcon} ${theme === 'dark' ? style.isDark : ''}`}
          >
            <Icon name="sun" size={18} class={style.sun} />
            <Icon name="moon" size={17} class={style.moon} />
          </span>
          <span class="tip" aria-hidden="true">
            {themeLabel}
          </span>
        </button>

        {!installed && (
          <div class={style.installWrap}>
            <button
              class={`icon-btn has-tip ${style.action}`}
              onClick={this.onInstallClick}
              aria-label={S.header.install}
              aria-expanded={installHelp}
              disabled={__PRERENDER__}
            >
              <Icon name="monitor-down" size={18} />
              <span class="tip" aria-hidden="true">
                {S.header.install}
              </span>
            </button>
            {installHelp && (
              <div class={style.installSheet} role="dialog">
                <span class="tile t-orange">
                  <Icon name="monitor-down" size={22} />
                </span>
                <h2 class={style.sheetTitle}>{S.install.title}</h2>
                <p>{S.install.text}</p>
                <p class={style.sheetStep}>
                  {isIOS && <Icon name="share" size={16} />}
                  {isIOS ? S.install.ios : S.install.other}
                </p>
                <button
                  class="btn btn-tinted btn-sm btn-block"
                  onClick={() => this.setState({ installHelp: false })}
                >
                  {S.install.ok}
                </button>
              </div>
            )}
          </div>
        )}

        <button
          class={`icon-btn has-tip ${style.action}`}
          onClick={this.onLangClick}
          aria-label={S.header.languageLabel}
          lang={lang === 'es' ? 'en' : 'es'}
        >
          <span key={lang} class={style.langCode}>
            {S.header.current}
          </span>
          <span class="tip" aria-hidden="true">
            {S.header.language}
          </span>
        </button>
      </div>
    );
  }

  private onPasteClick = async () => {
    let clipboardItems: ClipboardItem[];
    try {
      clipboardItems = await navigator.clipboard.read();
    } catch (err) {
      this.props.showSnack!(S.snack.clipboardDenied);
      return;
    }
    const blob = await getImageClipboardItem(clipboardItems);
    if (!blob) {
      this.props.showSnack!(S.snack.clipboardEmpty);
      return;
    }
    this.props.onFiles!([new File([blob], 'imagen.unknown')]);
  };

  render() {
    return (
      <div class={style.intro}>
        <div class="ambient" aria-hidden="true">
          <i class="b1" />
          <i class="b2" />
          <i class="b3" />
        </div>
        <input
          class={style.hide}
          ref={linkRef(this, 'fileInput')}
          type="file"
          multiple
          accept={acceptedFiles}
          onChange={this.onFileChange}
        />

        <div class={style.scroller}>
          <header class={`${style.wrap} ${style.nav}`}>
            <a class={style.logo} href="/">
              <img src={logo} width="28" height="28" alt="" />
              zumo
            </a>
            {this.renderActions()}
          </header>

          <main class={style.wrap}>
            <section class={style.hero}>
              <div class={style.heroCopy}>
                <h1
                  class={style.h1}
                  dangerouslySetInnerHTML={html(S.hero.title)}
                />
                <p class={style.lead}>{S.hero.lead}</p>
                <ul class={style.trust}>
                  {S.hero.trust.map((item) => (
                    <li>
                      <Icon name="check" size={15} weight={3} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div class={`${style.dropCard} glass`}>
                <img
                  class={style.dropLogo}
                  src={logo}
                  alt=""
                  width="112"
                  height="112"
                />
                <h2 class={style.dropTitle}>
                  <span class={style.pointerOnly}>{S.drop.title}</span>
                  <span class={style.touchOnly}>{S.drop.titleTouch}</span>
                </h2>
                <p class={style.dropSubtitle}>{S.drop.subtitle}</p>
                <button
                  class={`btn btn-primary ${style.dropButton}`}
                  onClick={this.onOpenClick}
                  disabled={__PRERENDER__}
                >
                  <Icon name="images" size={19} />
                  {S.drop.choose}
                </button>
                {supportsClipboardAPI && (
                  <button
                    class="btn btn-plain btn-sm"
                    onClick={this.onPasteClick}
                  >
                    <Icon name="clipboard-paste" size={16} />
                    {S.drop.paste}
                  </button>
                )}
              </div>
            </section>

            <ul class={style.info}>
              {S.info.items.map((item, i) => (
                <li class={`${style.infoItem} glass`}>
                  <span class={`tile ${infoTiles[i][1]}`}>
                    <Icon name={infoTiles[i][0]} size={22} />
                  </span>
                  <div>
                    <h3 class={style.h3}>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </main>

          <footer class={`${style.wrap} ${style.footer}`}>
            <span>{S.footer.legal}</span>
            <nav>
              <a href="/privacidad/">{S.nav.privacy}</a>
              <button class="unbutton" onClick={reopenConsent}>
                {S.footer.cookies}
              </button>
              <a href="https://github.com/amintikk/zumo">{S.footer.source}</a>
            </nav>
          </footer>
        </div>

        {!__PRERENDER__ && <PrivacyChoice />}
      </div>
    );
  }
}
