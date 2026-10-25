import { h, Component, Fragment } from 'preact';

import { linkRef } from 'shared/prerendered-app/util';
import logo from 'url:./imgs/zumo-icon.svg';
import editorShot from 'url:./imgs/editor.jpg';
import * as style from './style.css';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import 'shared/custom-els/snack-bar';
import { Icon, IconName } from 'shared/icons';
import { S } from 'shared/strings';
import { reopenConsent, loadAnalytics } from 'shared/analytics';
import PrivacyChoice from '../PrivacyChoice';

const supportsClipboardAPI =
  !__PRERENDER__ && navigator.clipboard && navigator.clipboard.read;

const acceptedFiles =
  'image/*,.zip,application/zip,application/x-zip-compressed,.heic,.heif,.tif,.tiff,.avif,.jxl,.qoi,.wp2,.svg';

/** Real results from a test batch (JPEG, quality 75, max 1200 px) */
const examples = [
  { name: 'IMG_0002.HEIC', before: '2,9 MB', after: '167 kB', saved: '94' },
  {
    name: 'vacaciones/playa.jpg',
    before: '2,8 MB',
    after: '118 kB',
    saved: '96',
  },
  {
    name: 'capturas/movil.png',
    before: '1,6 MB',
    after: '154 kB',
    saved: '90',
  },
];

const stepTiles: [IconName, string][] = [
  ['file-archive', 't-orange'],
  ['sliders', 't-indigo'],
  ['download', 't-green'],
];

const featureTiles: [IconName, string][] = [
  ['file-archive', 't-orange'],
  ['shield-check', 't-green'],
  ['chevrons-left-right', 't-indigo'],
  ['smartphone', 't-gray'],
  ['scaling', 't-teal'],
  ['wifi-off', 't-blue'],
];

const inputFormats = [
  'HEIC',
  'JPEG',
  'PNG',
  'WebP',
  'AVIF',
  'TIFF',
  'GIF',
  'BMP',
  'SVG',
  'JPEG XL',
];

const outputFormats: [string, string][] = [
  ['JPEG', 'mozJPEG'],
  ['WebP', 'webP'],
  ['AVIF', 'avif'],
  ['PNG', 'oxiPNG'],
  ['JPEG XL', 'jxl'],
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
  scrolled: boolean;
}

export default class Intro extends Component<Props, State> {
  state: State = { scrolled: false };
  private fileInput?: HTMLInputElement;
  private scroller?: HTMLElement;
  private observer?: IntersectionObserver;

  componentDidMount() {
    window.addEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPromptEvent,
    );
    window.addEventListener('appinstalled', this.onAppInstalled);
    loadAnalytics();

    // Scroll reveal. Content is visible without JS (see .no-js).
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = (this.base as HTMLElement).querySelectorAll('.reveal');
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('in'));
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('in');
          this.observer!.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    items.forEach((el) => this.observer!.observe(el));
  }

  componentWillUnmount() {
    window.removeEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPromptEvent,
    );
    window.removeEventListener('appinstalled', this.onAppInstalled);
    this.observer?.disconnect();
  }

  private onScroll = () => {
    const scrolled = this.scroller!.scrollTop > 8;
    if (scrolled !== this.state.scrolled) this.setState({ scrolled });
  };

  private scrollTo = (event: Event) => {
    const link = event.currentTarget as HTMLAnchorElement;
    const target = (this.base as HTMLElement).querySelector(link.hash);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
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
    this.state.beforeInstallEvent?.prompt();
  };

  private onAppInstalled = () => {
    this.setState({ beforeInstallEvent: undefined });
  };

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

  private renderLogo() {
    return (
      <a class={style.logo} href="/">
        <img src={logo} width="28" height="28" alt="" />
        zumo
      </a>
    );
  }

  private renderDropCard() {
    return (
      <div class={`${style.dropCard} glass`}>
        <div class={style.dropZone}>
          <span class={`tile t-orange ${style.dropTile}`}>
            <Icon name="upload" size={26} />
          </span>
          <h2 class={style.dropTitle}>
            <span class={style.pointerOnly}>{S.drop.title}</span>
            <span class={style.touchOnly}>{S.drop.titleTouch}</span>
          </h2>
          <p class={style.dropSubtitle}>{S.drop.subtitle}</p>
          <div class={style.dropActions}>
            <button
              class="btn btn-tinted btn-sm"
              onClick={this.onOpenClick}
              disabled={__PRERENDER__}
            >
              {S.drop.choose}
            </button>
            {supportsClipboardAPI && (
              <button class="btn btn-plain btn-sm" onClick={this.onPasteClick}>
                <Icon name="clipboard-paste" size={16} />
                {S.drop.paste}
              </button>
            )}
          </div>
        </div>

        <div class={style.examples}>
          <ul class="list">
            {examples.map((example) => (
              <li class="row with-icon">
                <span class="row-icon t-gray">
                  <Icon name="image" size={16} />
                </span>
                <span class={`grow ${style.exampleName}`}>
                  {example.name}
                  <span class={style.exampleSizes}>
                    {example.before} → {example.after}
                  </span>
                </span>
                <span class="pill good">
                  <Icon name="arrow-down" size={11} weight={2.8} />
                  {example.saved} %
                </span>
              </li>
            ))}
          </ul>
          <p class={style.examplesCaption}>{S.drop.example}</p>
        </div>
      </div>
    );
  }

  render({}: Props, { beforeInstallEvent, scrolled }: State) {
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

        <div
          class={style.scroller}
          ref={linkRef(this, 'scroller')}
          onScroll={this.onScroll}
        >
          <header class={`${style.nav} ${scrolled ? style.scrolled : ''}`}>
            <div class={`${style.wrap} ${style.navIn}`}>
              {this.renderLogo()}
              <nav class={style.links}>
                <a href="#como-funciona" onClick={this.scrollTo}>
                  {S.nav.how}
                </a>
                <a href="#funciones" onClick={this.scrollTo}>
                  {S.nav.features}
                </a>
                <a href="#formatos" onClick={this.scrollTo}>
                  {S.nav.formats}
                </a>
                <a href="/privacidad/">{S.nav.privacy}</a>
              </nav>
              <div class={style.navEnd}>
                {beforeInstallEvent && (
                  <button
                    class="btn btn-glass btn-sm"
                    onClick={this.onInstallClick}
                  >
                    Instalar
                  </button>
                )}
                <button
                  class="btn btn-primary btn-sm"
                  onClick={this.onOpenClick}
                  disabled={__PRERENDER__}
                >
                  {S.nav.open}
                </button>
              </div>
            </div>
          </header>

          <main>
            <section class={`${style.wrap} ${style.hero}`}>
              <div class={style.heroCopy}>
                <h1
                  class={style.h1}
                  dangerouslySetInnerHTML={html(S.hero.title)}
                />
                <p class={style.lead}>{S.hero.lead}</p>
                <div class={style.ctas}>
                  <button
                    class="btn btn-primary"
                    onClick={this.onOpenClick}
                    disabled={__PRERENDER__}
                  >
                    <Icon name="images" size={19} />
                    {S.hero.cta}
                  </button>
                  <a
                    class="btn btn-glass"
                    href="#como-funciona"
                    onClick={this.scrollTo}
                  >
                    {S.hero.secondary}
                  </a>
                </div>
                <ul class={style.trust}>
                  {S.hero.trust.map((item) => (
                    <li>
                      <Icon name="check" size={15} weight={3} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              {this.renderDropCard()}
            </section>

            <section
              id="como-funciona"
              class={`${style.wrap} ${style.section}`}
            >
              <div class={style.head}>
                <p class={style.kicker}>{S.how.kicker}</p>
                <h2 class={style.h2}>{S.how.title}</h2>
              </div>
              <ol class={style.steps}>
                {S.how.steps.map((step, i) => (
                  <li
                    class={`${style.card} glass reveal`}
                    style={{ '--d': `${i * 90}ms` }}
                  >
                    <span class={style.stepN}>{i + 1}</span>
                    <span class={`tile ${stepTiles[i][1]}`}>
                      <Icon name={stepTiles[i][0]} size={22} />
                    </span>
                    <h3 class={style.h3}>{step.title}</h3>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section id="funciones" class={`${style.wrap} ${style.section}`}>
              <div class={style.featGrid}>
                <div class={`${style.frame} reveal`}>
                  <img
                    src={editorShot}
                    alt={S.features.shotAlt}
                    width="1080"
                    height="1350"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div>
                  <p class={style.kicker}>{S.features.kicker}</p>
                  <h2 class={style.h2}>{S.features.title}</h2>
                  <ul class={style.features}>
                    {S.features.items.map((item, i) => (
                      <li class="reveal" style={{ '--d': `${(i % 2) * 90}ms` }}>
                        <span class={`tile ${featureTiles[i][1]}`}>
                          <Icon name={featureTiles[i][0]} size={22} />
                        </span>
                        <h3 class={style.h3}>{item.title}</h3>
                        <p>{item.text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section id="formatos" class={`${style.wrap} ${style.section}`}>
              <div class={style.head}>
                <p class={style.kicker}>{S.formats.kicker}</p>
                <h2
                  class={style.h2}
                  dangerouslySetInnerHTML={html(S.formats.title)}
                />
              </div>
              <div class={style.formatGrid}>
                <div class={`${style.card} glass reveal`}>
                  <span class="tile t-gray">
                    <Icon name="file-image" size={22} />
                  </span>
                  <h3 class={style.h3}>{S.formats.inTitle}</h3>
                  <p>{S.formats.inText}</p>
                  <ul class={style.formatPills}>
                    {inputFormats.map((format) => (
                      <li class="pill flat">{format}</li>
                    ))}
                  </ul>
                </div>
                <div
                  class={`${style.card} glass reveal`}
                  style={{ '--d': '90ms' }}
                >
                  <span class="tile t-orange">
                    <Icon name="sparkles" size={22} />
                  </span>
                  <h3 class={style.h3}>{S.formats.outTitle}</h3>
                  <p>{S.formats.outText}</p>
                  <ul class={`list ${style.outList}`}>
                    {outputFormats.map(([label, type]) => (
                      <li class="row">
                        <span class={style.outName}>{label}</span>
                        <span class={style.outHint}>
                          {S.editor.formatHints[type]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section class={`${style.wrap} ${style.section}`}>
              <div class={`${style.final} glass reveal`}>
                <h2 class={style.h2}>{S.final.title}</h2>
                <p class={style.lead}>{S.final.text}</p>
                <button
                  class="btn btn-primary"
                  onClick={this.onOpenClick}
                  disabled={__PRERENDER__}
                >
                  <Icon name="images" size={19} />
                  {S.hero.cta}
                </button>
              </div>
            </section>
          </main>

          <footer class={`${style.wrap} ${style.footer}`}>
            {this.renderLogo()}
            <nav>
              <a href="#como-funciona" onClick={this.scrollTo}>
                {S.nav.how}
              </a>
              <a href="#formatos" onClick={this.scrollTo}>
                {S.nav.formats}
              </a>
              <a href="/privacidad/">{S.nav.privacy}</a>
              <button class="unbutton" onClick={reopenConsent}>
                {S.footer.cookies}
              </button>
            </nav>
            <p>
              {S.footer.legal}{' '}
              <a href="https://github.com/GoogleChromeLabs/squoosh">
                {S.footer.source}
              </a>
            </p>
          </footer>
        </div>

        {!__PRERENDER__ && <PrivacyChoice />}
      </div>
    );
  }
}
