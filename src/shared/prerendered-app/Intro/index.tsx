import { h, Component } from 'preact';

import { linkRef } from 'shared/prerendered-app/util';
import logo from 'url:./imgs/zumo-icon.svg';
import * as style from './style.css';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import 'shared/custom-els/snack-bar';
import { Icon, IconName } from 'shared/icons';
import { S, lang, setLang } from 'shared/strings';
import { currentTheme, setTheme, Theme } from 'shared/theme';
import { canInstall, promptInstall } from 'shared/install';
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
  theme: Theme;
  /** The browser offered to install the app */
  installable: boolean;
}

export default class Intro extends Component<Props, State> {
  state: State = {
    theme: __PRERENDER__ ? 'light' : currentTheme(),
    installable: !__PRERENDER__ && canInstall(),
  };
  private fileInput?: HTMLInputElement;

  componentDidMount() {
    window.addEventListener('zumo:install', this.onInstallChange);
    window.addEventListener('zumo:theme', this.onThemeChange);
    matchMedia('(prefers-color-scheme: dark)').addListener(this.onThemeChange);
    loadAnalytics();
  }

  componentWillUnmount() {
    window.removeEventListener('zumo:install', this.onInstallChange);
    window.removeEventListener('zumo:theme', this.onThemeChange);
    matchMedia('(prefers-color-scheme: dark)').removeListener(
      this.onThemeChange,
    );
  }

  private onThemeChange = () => this.setState({ theme: currentTheme() });

  private onInstallChange = () => this.setState({ installable: canInstall() });

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

  private onInstallClick = () => {
    promptInstall();
  };

  private renderActions() {
    const { theme, installable } = this.state;
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

        {installable && (
          <button
            class={`icon-btn has-tip ${style.action} ${style.installAction}`}
            onClick={this.onInstallClick}
            aria-label={S.header.install}
          >
            <Icon name="monitor-down" size={18} />
            <span class="tip" aria-hidden="true">
              {S.header.install}
            </span>
          </button>
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
