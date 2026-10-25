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
import { Icon } from 'shared/icons';
import { S } from 'shared/strings';
import { track } from 'shared/analytics';

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
        this.showSnack(S.snack.loadError);
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

    // iOS lets people pinch-zoom the whole UI, which gets in the way of
    // zooming the image. This prevents it.
    document.body.addEventListener('gesturestart', (event: any) => {
      event.preventDefault();
    });

    window.addEventListener('popstate', this.onPopState);
    // Every string comes from the dictionary: redraw everything
    window.addEventListener('zumo:lang', () => this.forceUpdate());
  }

  private onFileDrop = ({ files }: FileDropEvent) => {
    if (!files || files.length === 0) return;
    this.openFiles(files);
  };

  private openFiles = async (files: File[]) => {
    const { needsBatch, expandFiles } = await loadExpand();

    if (!needsBatch(files)) {
      track('open_images', { source: 'single', image_count: 1 });
      this.openEditor();
      this.setState({ file: files[0], batch: undefined });
      return;
    }

    this.setState({ expanding: true });
    try {
      const { entries, name, skipped } = await expandFiles(files);
      if (entries.length === 0) {
        this.showSnack(S.snack.noImages);
        return;
      }
      track('open_images', {
        source: files.some((file) => /\.zip$/i.test(file.name))
          ? 'zip'
          : 'files',
        image_count: entries.length,
      });
      this.openEditor();
      this.setState({
        file: entries[0].file,
        batch: entries.length > 1 ? { entries, name } : undefined,
      });
      if (skipped) {
        this.showSnack(S.snack.skipped(skipped), { timeout: 4000 });
      }
    } catch (err) {
      console.error(err);
      this.showSnack(S.snack.zipError);
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
    const editorReady = isEditorOpen && Compress && file;
    const busy =
      awaitingShareTarget || expanding || (isEditorOpen && !editorReady);

    return (
      <div class={style.app}>
        <file-drop multiple onfiledrop={this.onFileDrop} class={style.drop}>
          {editorReady && Compress ? (
            <Compress
              file={file!}
              batch={batch}
              showSnack={this.showSnack}
              onBack={back}
            />
          ) : (
            !isEditorOpen && (
              <Intro onFiles={this.openFiles} showSnack={this.showSnack} />
            )
          )}

          {busy && (
            <div class={style.busy} role="status">
              <div class={`${style.busyCard} glass`}>
                <span class="spinner" />
                {expanding ? S.app.opening : S.app.loading}
              </div>
            </div>
          )}

          <div class={style.dropHint} aria-hidden="true">
            <div class={`${style.dropHintCard} glass`}>
              <span class="tile t-orange">
                <Icon name="upload" size={24} />
              </span>
              {S.drop.dragging}
            </div>
          </div>

          <snack-bar
            ref={linkRef(this, 'snackbar')}
            data-placement={isEditorOpen ? 'top' : 'bottom'}
          />
        </file-drop>
      </div>
    );
  }
}
