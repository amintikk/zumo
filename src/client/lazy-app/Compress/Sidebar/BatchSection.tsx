import { h, Component, Fragment } from 'preact';
import * as style from './style.css';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import type { SideSettings, Batch } from '..';
import {
  processBatch,
  zipResults,
  outputPath,
  BatchResult,
} from '../../batch/process';
import { formatBytes, savings } from './format';

interface Props {
  batch: Batch;
  settings: SideSettings;
  previewIndex: number;
  onPreviewChange(index: number): void;
  showSnack: SnackBarElement['showSnackbar'];
}

interface RunInputs {
  settings: SideSettings;
  keepOriginal: boolean;
}

interface State {
  keepOriginal: boolean;
  showDetails: boolean;
  running: boolean;
  zipping: boolean;
  results: (BatchResult | undefined)[];
  zipUrl?: string;
  zipSize?: number;
  /** Inputs used for the last run, to tell if the results are stale */
  ranWith?: RunInputs;
}

export default class BatchSection extends Component<Props, State> {
  state: State = {
    keepOriginal: true,
    showDetails: false,
    running: false,
    zipping: false,
    results: [],
  };

  private abortController?: AbortController;

  componentWillReceiveProps(nextProps: Props) {
    // A new batch was opened: forget the previous run
    if (nextProps.batch !== this.props.batch) this.reset();
  }

  componentWillUnmount() {
    this.reset();
  }

  private reset() {
    this.abortController?.abort();
    if (this.state.zipUrl) URL.revokeObjectURL(this.state.zipUrl);
    this.setState({
      running: false,
      zipping: false,
      results: [],
      zipUrl: undefined,
      zipSize: undefined,
      ranWith: undefined,
    });
  }

  private isStale(): boolean {
    const { ranWith, keepOriginal } = this.state;
    if (!ranWith) return false;
    const { settings } = this.props;
    return (
      ranWith.settings.encoderState !== settings.encoderState ||
      ranWith.settings.processorState !== settings.processorState ||
      ranWith.keepOriginal !== keepOriginal
    );
  }

  private onStart = async () => {
    const { settings, batch } = this.props;
    const { encoderState, processorState } = settings;
    if (!encoderState) return;

    this.abortController?.abort();
    const abortController = (this.abortController = new AbortController());
    if (this.state.zipUrl) URL.revokeObjectURL(this.state.zipUrl);

    const keepOriginal = this.state.keepOriginal;
    this.setState({
      running: true,
      results: [],
      zipUrl: undefined,
      zipSize: undefined,
      ranWith: { settings, keepOriginal },
    });

    try {
      const results = await processBatch(
        abortController.signal,
        batch.entries,
        { encoderState, processorState, keepOriginalIfLarger: keepOriginal },
        (index, result) => {
          this.setState((state) => {
            const results = state.results.slice();
            results[index] = result;
            return { results };
          });
        },
      );

      this.setState({ running: false, zipping: true });
      const zip = await zipResults(results);
      if (abortController.signal.aborted) return;
      this.setState({
        zipping: false,
        zipUrl: URL.createObjectURL(zip),
        zipSize: zip.size,
      });

      const failed = results.filter((result) => result.error).length;
      if (failed) {
        this.setState({ showDetails: true });
        this.props.showSnack(
          `${failed} ${
            failed === 1 ? 'imagen no se pudo' : 'imágenes no se pudieron'
          } procesar`,
          { timeout: 6000, actions: ['cerrar'] },
        );
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error(err);
      this.setState({ running: false, zipping: false });
      this.props.showSnack(`Error en el lote: ${err}`);
    }
  };

  private onCancel = () => {
    this.abortController?.abort();
    this.setState({ running: false, zipping: false, ranWith: undefined });
  };

  private renderDetails(results: (BatchResult | undefined)[]) {
    const { batch, previewIndex, onPreviewChange } = this.props;
    return (
      <ul class={style.details}>
        {batch.entries.map((entry, i) => {
          const result = results[i];
          return (
            <li>
              <button
                class={`${style.detailRow} ${
                  i === previewIndex ? style.detailActive : ''
                }`}
                title={entry.path}
                onClick={() => onPreviewChange(i)}
              >
                <span class={style.detailName}>
                  {result ? outputPath(result) : entry.path}
                </span>
                <span class={style.detailValue}>
                  {!result ? (
                    <span class={style.muted}>
                      {formatBytes(entry.file.size)}
                    </span>
                  ) : result.error ? (
                    <span class={style.bad} title={result.error}>
                      error
                    </span>
                  ) : (
                    <Fragment>
                      {formatBytes(result.output!.size)}{' '}
                      <span
                        class={
                          result.output!.size <= entry.file.size
                            ? style.good
                            : style.bad
                        }
                      >
                        {result.keptOriginal
                          ? '='
                          : savings(entry.file.size, result.output!.size)}
                      </span>
                    </Fragment>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  render(
    { batch, settings }: Props,
    {
      keepOriginal,
      showDetails,
      running,
      zipping,
      results,
      zipUrl,
      zipSize,
    }: State,
  ) {
    const total = batch.entries.length;
    const finished = results.filter(Boolean) as BatchResult[];
    const done = finished.length;
    const ok = finished.filter((result) => result.output);
    const before = ok.reduce((sum, r) => sum + r.entry.file.size, 0);
    const after = ok.reduce((sum, r) => sum + r.output!.size, 0);
    const busy = running || zipping;
    const stale = this.isStale();
    const hasRun = busy || done > 0;

    return (
      <div class={style.footer}>
        <div class={style.batchHead}>
          <span class={style.sectionTitle}>Lote · {total} imágenes</span>
          <button
            class={style.textButton}
            onClick={() => this.setState({ showDetails: !showDetails })}
          >
            {showDetails ? 'Ocultar lista' : 'Ver lista'}
          </button>
        </div>

        {showDetails && this.renderDetails(results)}

        <label class={style.checkRow}>
          <input
            type="checkbox"
            checked={keepOriginal}
            disabled={busy}
            onChange={(event) =>
              this.setState({
                keepOriginal: (event.target as HTMLInputElement).checked,
              })
            }
          />
          Si una imagen no mejora, dejar la original
        </label>

        {hasRun && (
          <Fragment>
            <div class={style.progress}>
              <div
                class={style.progressBar}
                style={{ width: `${(done / total) * 100}%` }}
              />
            </div>
            <div class={style.status}>
              <span>
                {zipping
                  ? 'Creando ZIP…'
                  : running
                  ? `Optimizando ${done} de ${total}…`
                  : `${done} de ${total} listas`}
              </span>
              {ok.length > 0 && (
                <span>
                  {formatBytes(before)} → <strong>{formatBytes(after)}</strong>{' '}
                  <span class={after <= before ? style.good : style.bad}>
                    {savings(before, after)}
                  </span>
                </span>
              )}
            </div>
          </Fragment>
        )}

        {stale && zipUrl && !busy && (
          <p class={style.notice}>
            Has cambiado los ajustes. El ZIP es de la versión anterior.
          </p>
        )}

        <div class={style.actions}>
          {busy ? (
            <button class={style.secondaryButton} onClick={this.onCancel}>
              Cancelar
            </button>
          ) : zipUrl && !stale ? (
            <Fragment>
              <a
                class={style.primaryButton}
                href={zipUrl}
                download={`${batch.name}-zumo.zip`}
              >
                Descargar ZIP · {formatBytes(zipSize!)}
              </a>
            </Fragment>
          ) : (
            <button
              class={style.primaryButton}
              onClick={this.onStart}
              disabled={!settings.encoderState}
            >
              {zipUrl ? 'Volver a optimizar' : `Optimizar las ${total}`}
            </button>
          )}
        </div>
      </div>
    );
  }
}
