import type { FileDropEvent } from 'file-drop-element';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import type { SnackOptions } from 'shared/custom-els/snack-bar';

import { h, Component } from 'preact';

import { linkRef } from 'shared/prerendered-app/util';
import * as style from './style.css';
import 'add-css:./style.css';
import 'file-drop-element';
import 'shared/custom-els/snack-bar';
import Intro from 'shared/prerendered-app/Intro';
import 'shared/custom-els/loading-spinner';

const ROUTE_EDITOR = '/editor';

const compressPromise = import('client/lazy-app/Compress');
const swBridgePromise = import('client/lazy-app/sw-bridge');
const loadExpand = () => import('client/lazy-app/batch/expand');

function back() {
  window.history.back();
}

interface Props {}

interface State {
  awaitingShareTarget: boolean;
  file?: File;
  batch?: import('client/lazy-app/Compress').Batch;
  /** Unpacking a ZIP or reading several files */
  expanding: boolean;
  isEditorOpen: Boolean;
  Compress?: typeof import('client/lazy-app/Compress').default;
}

export default class App extends Component<Props, State> {
  state: State = {
    awaitingShareTarget: new URL(location.href).searchParams.has(
      'share-target',
    ),
    isEditorOpen: false,
    expanding: false,
    file: undefined,
    Compress: undefined,
  };

  snackbar?: SnackBarElement;

  constructor() {
    super();

    compressPromise
      .then((module) => {
        this.setState({ Compress: module.default });
      })
      .catch(() => {
        this.showSnack('No se pudo cargar la app');
      });

    swBridgePromise.then(async ({ offliner, getSharedImage }) => {
      offliner(this.showSnack);
      if (!this.state.awaitingShareTarget) return;
      const file = await getSharedImage();
      // Remove the ?share-target from the URL
      history.replaceState('', '', '/');
      this.openEditor();
      this.setState({ file, batch: undefined, awaitingShareTarget: false });
    });

    // Since iOS 10, Apple tries to prevent disabling pinch-zoom. This is great in theory, but
    // really breaks things here, as you can easily end up zooming the UI when you mean to
    // zoom the image. Once you've done this, it's really difficult to undo. Anyway, this seems to
    // prevent it.
    document.body.addEventListener('gesturestart', (event: any) => {
      event.preventDefault();
    });

    window.addEventListener('popstate', this.onPopState);
  }

  private onFileDrop = ({ files }: FileDropEvent) => {
    if (!files || files.length === 0) return;
    this.openFiles(files);
  };

  private openFiles = async (files: File[]) => {
    const { needsBatch, expandFiles } = await loadExpand();

    if (!needsBatch(files)) {
      this.openEditor();
      this.setState({ file: files[0], batch: undefined });
      return;
    }

    this.setState({ expanding: true });
    try {
      const { entries, name, skipped } = await expandFiles(files);
      if (entries.length === 0) {
        this.showSnack('No se encontraron imágenes');
        return;
      }
      this.openEditor();
      this.setState({
        file: entries[0].file,
        batch: entries.length > 1 ? { entries, name } : undefined,
      });
      if (skipped) {
        this.showSnack(
          `Se ${
            skipped === 1
              ? 'ha ignorado 1 archivo'
              : `han ignorado ${skipped} archivos`
          } que no ${skipped === 1 ? 'es imagen' : 'son imágenes'}`,
          { timeout: 4000, actions: ['cerrar'] },
        );
      }
    } catch (err) {
      console.error(err);
      this.showSnack('No se pudo abrir el ZIP');
    } finally {
      this.setState({ expanding: false });
    }
  };

  private showSnack = (
    message: string,
    options: SnackOptions = {},
  ): Promise<string> => {
    if (!this.snackbar) throw Error('Snackbar missing');
    return this.snackbar.showSnackbar(message, options);
  };

  private onPopState = () => {
    this.setState({ isEditorOpen: location.pathname === ROUTE_EDITOR });
  };

  private openEditor = () => {
    if (this.state.isEditorOpen) return;
    // Change path, but preserve query string.
    const editorURL = new URL(location.href);
    editorURL.pathname = ROUTE_EDITOR;
    history.pushState(null, '', editorURL.href);
    this.setState({ isEditorOpen: true });
  };

  render(
    {}: Props,
    {
      file,
      batch,
      expanding,
      isEditorOpen,
      Compress,
      awaitingShareTarget,
    }: State,
  ) {
    const showSpinner =
      awaitingShareTarget || expanding || (isEditorOpen && !Compress);

    return (
      <div class={style.app}>
        <file-drop multiple onfiledrop={this.onFileDrop} class={style.drop}>
          {showSpinner ? (
            <loading-spinner class={style.appLoader} />
          ) : isEditorOpen ? (
            Compress && (
              <Compress
                file={file!}
                batch={batch}
                showSnack={this.showSnack}
                onBack={back}
              />
            )
          ) : (
            <Intro onFiles={this.openFiles} showSnack={this.showSnack} />
          )}
          <snack-bar ref={linkRef(this, 'snackbar')} />
        </file-drop>
      </div>
    );
  }
}
