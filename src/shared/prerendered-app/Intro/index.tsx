import { h, Component } from 'preact';

import { linkRef } from 'shared/prerendered-app/util';
import '../../custom-els/loading-spinner';
import logo from 'url:./imgs/zumo-mark.svg';
import * as style from './style.css';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import 'shared/custom-els/snack-bar';
import SlideOnScroll from './SlideOnScroll';

const supportsClipboardAPI =
  !__PRERENDER__ && navigator.clipboard && navigator.clipboard.read;

const acceptedFiles =
  'image/*,.zip,application/zip,application/x-zip-compressed,.heic,.heif,.tif,.tiff,.avif,.jxl,.qoi,.wp2,.svg';

async function getImageClipboardItem(
  items: ClipboardItem[],
): Promise<undefined | Blob> {
  for (const item of items) {
    const type = item.types.find((type) => type.startsWith('image/'));
    if (type) return item.getType(type);
  }
}

const features = [
  {
    title: 'Lotes en un ZIP',
    text: 'Sube un .zip con cientos de imágenes (con carpetas incluidas) y descárgalas todas optimizadas en otro .zip, con la misma estructura.',
    icon: 'M20.5 7.3 12 2.5 3.5 7.3v9.4l8.5 4.8 8.5-4.8V7.3ZM12 4.8l5.9 3.3L12 11.4 6.1 8.1 12 4.8Zm-6.5 5 5.5 3.1v6.1l-5.5-3.1V9.8Zm7.5 9.2v-6.1l5.5-3.1v6.1L13 19Z',
  },
  {
    title: 'Nada sale de tu equipo',
    text: 'Todo se procesa en tu navegador con WebAssembly. Tus fotos no se suben a ningún servidor; funciona incluso sin conexión.',
    icon: 'M12 1 3 5v6c0 5.6 3.8 10.7 9 12 5.2-1.3 9-6.4 9-12V5l-9-4Zm0 10.9h7c-.5 4.1-3.3 7.8-7 8.9V12H5V6.3l7-3.1v8.7Z',
  },
  {
    title: 'Formatos modernos',
    text: 'Abre fotos HEIC del iPhone, TIFF, PNG o JPG y conviértelas a AVIF, WebP, JPEG XL, MozJPEG u OxiPNG. Compara el antes y el después con zoom.',
    icon: 'M21 3H3a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h18a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 16h-9V5h9v14ZM5 15l2.5-3.2 1.8 2.2 2.5-3.2V17H5v-2Z',
  },
];

const steps = [
  {
    title: 'Suelta tu ZIP',
    text: 'O selecciona varias imágenes a la vez.',
  },
  {
    title: 'Ajusta con una muestra',
    text: 'Elige formato y calidad mirando una imagen; puedes ir pasando entre todas.',
  },
  {
    title: 'Descarga el lote',
    text: 'Pulsa «Optimizar» y llévate un ZIP con todo más ligero.',
  },
];

interface Props {
  onFiles?: (files: File[]) => void;
  showSnack?: SnackBarElement['showSnackbar'];
}
interface State {
  beforeInstallEvent?: BeforeInstallPromptEvent;
}

export default class Intro extends Component<Props, State> {
  state: State = {};
  private fileInput?: HTMLInputElement;

  componentDidMount() {
    // Listen for beforeinstallprompt events, indicating the app is installable.
    window.addEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPromptEvent,
    );
    window.addEventListener('appinstalled', this.onAppInstalled);
  }

  componentWillUnmount() {
    window.removeEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPromptEvent,
    );
    window.removeEventListener('appinstalled', this.onAppInstalled);
  }

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
    // Don't show the mini-infobar on mobile
    event.preventDefault();
    this.setState({ beforeInstallEvent: event });
  };

  private onInstallClick = async () => {
    const beforeInstallEvent = this.state.beforeInstallEvent;
    if (!beforeInstallEvent) return;
    beforeInstallEvent.prompt();
  };

  private onAppInstalled = () => {
    this.setState({ beforeInstallEvent: undefined });
  };

  private onPasteClick = async () => {
    let clipboardItems: ClipboardItem[];

    try {
      clipboardItems = await navigator.clipboard.read();
    } catch (err) {
      this.props.showSnack!('Sin permiso para leer el portapapeles');
      return;
    }

    const blob = await getImageClipboardItem(clipboardItems);

    if (!blob) {
      this.props.showSnack!('No hay ninguna imagen en el portapapeles');
      return;
    }

    this.props.onFiles!([new File([blob], 'imagen.unknown')]);
  };

  render({}: Props, { beforeInstallEvent }: State) {
    return (
      <div class={style.intro}>
        <input
          class={style.hide}
          ref={linkRef(this, 'fileInput')}
          type="file"
          multiple
          accept={acceptedFiles}
          onChange={this.onFileChange}
        />

        <header class={style.topBar}>
          <a class={style.brand} href="/">
            <img src={logo} alt="" width="34" height="34" />
            <span>zumo</span>
          </a>
          {beforeInstallEvent && (
            <button class={style.installBtn} onClick={this.onInstallClick}>
              Instalar app
            </button>
          )}
        </header>

        <main class={style.hero}>
          <div class={style.heroText}>
            <h1 class={style.heroTitle}>
              Exprime tus <span class={style.highlight}>imágenes</span>.
            </h1>
            <p class={style.heroLead}>
              Optimiza fotos una a una o <strong>a cientos con un ZIP</strong>.
              Más ligeras, misma pinta, y sin subirlas a ningún sitio.
            </p>
            <ul class={style.badges}>
              <li>HEIC · JPG · PNG · WebP · AVIF · TIFF</li>
              <li>100 % en tu navegador</li>
              <li>Gratis</li>
            </ul>
          </div>

          <div class={style.dropCard}>
            <img
              class={style.dropLogo}
              src={logo}
              alt=""
              width="96"
              height="96"
            />
            <p class={style.dropTitle}>
              <span class={style.dropText}>
                Arrastra aquí tus imágenes o un{' '}
              </span>
              <span class={style.tapText}>Elige imágenes o un </span>
              <code>.zip</code>
            </p>
            <button
              class={style.primaryBtn}
              onClick={this.onOpenClick}
              disabled={__PRERENDER__}
            >
              Elegir archivos
            </button>
            {supportsClipboardAPI && (
              <button class={style.pasteBtn} onClick={this.onPasteClick}>
                o pegar del portapapeles
              </button>
            )}
            <p class={style.dropNote}>
              Puedes seleccionar varias imágenes a la vez.
            </p>
          </div>
        </main>

        <section class={style.section}>
          <ul class={style.features}>
            {features.map((feature) => (
              <li>
                <SlideOnScroll>
                  <div class={style.feature}>
                    <svg viewBox="0 0 24 24" class={style.featureIcon}>
                      <path d={feature.icon} />
                    </svg>
                    <h2 class={style.featureTitle}>{feature.title}</h2>
                    <p class={style.featureText}>{feature.text}</p>
                  </div>
                </SlideOnScroll>
              </li>
            ))}
          </ul>
        </section>

        <section class={style.section}>
          <h2 class={style.sectionTitle}>Cómo funciona</h2>
          <ol class={style.steps}>
            {steps.map((step, i) => (
              <li class={style.step}>
                <span class={style.stepNumber}>{i + 1}</span>
                <div>
                  <h3 class={style.stepTitle}>{step.title}</h3>
                  <p class={style.stepText}>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <footer class={style.footer}>
          <span>
            <strong>zumo</strong> · Basado en{' '}
            <a href="https://github.com/GoogleChromeLabs/squoosh">Squoosh</a>{' '}
            (Apache 2.0)
          </span>
          <span>
            Tus imágenes nunca salen de tu dispositivo. Solo medimos visitas de
            forma anónima.
          </span>
        </footer>
      </div>
    );
  }
}
