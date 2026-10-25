import { h, Component, Fragment } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import type { SideSettings } from '..';
import { encoderMap } from '../../feature-meta';
import prettyBytes from '../Results/pretty-bytes';
import type { BatchEntry } from '../../batch/expand';
import {
  processBatch,
  zipResults,
  outputPath,
  BatchResult,
  BatchSettings,
} from '../../batch/process';

interface Props {
  entries: BatchEntry[];
  name: string;
  previewIndex: number;
  onPreviewChange(index: number): void;
  settings: [SideSettings, SideSettings];
  mobileView: boolean;
  showSnack: SnackBarElement['showSnackbar'];
}

interface RunInputs {
  side: SideSettings;
  maxWidth: string;
  maxHeight: string;
  keepOriginal: boolean;
}

interface State {
  sideIndex: 0 | 1;
  maxWidth: string;
  maxHeight: string;
  keepOriginal: boolean;
  collapsed: boolean;
  showDetails: boolean;
  running: boolean;
  zipping: boolean;
  results: (BatchResult | undefined)[];
  zipUrl?: string;
  zipSize?: number;
  /** Inputs used for the last run, to tell if the results are stale */
  ranWith?: RunInputs;
}

const numberFormat = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 1,
});

export function formatBytes(bytes: number): string {
  const { value, unit } = prettyBytes(bytes);
  return `${numberFormat.format(Number(value))} ${unit}`;
}

function savings(before: number, after: number): string {
  if (!before) return '';
  const percent = Math.round((1 - after / before) * 100);
  return percent >= 0 ? `−${percent} %` : `+${-percent} %`;
}

function parseSize(value: string): number | undefined {
  const number = Math.round(Number(value));
  return number > 0 ? number : undefined;
}

export default class BatchBar extends Component<Props, State> {
  state: State = {
    sideIndex: 1,
    maxWidth: '',
    maxHeight: '',
    keepOriginal: true,
    collapsed: this.props.mobileView,
    showDetails: false,
    running: false,
    zipping: false,
    results: [],
  };

  private abortController?: AbortController;

  componentWillUnmount() {
    this.abortController?.abort();
    if (this.state.zipUrl) URL.revokeObjectURL(this.state.zipUrl);
  }

  private currentInputs(): RunInputs {
    const { sideIndex, maxWidth, maxHeight, keepOriginal } = this.state;
    return {
      side: this.props.settings[sideIndex],
      maxWidth,
      maxHeight,
      keepOriginal,
    };
  }

  private isStale(): boolean {
    const { ranWith } = this.state;
    if (!ranWith) return false;
    const now = this.currentInputs();
    return (
      ranWith.side.encoderState !== now.side.encoderState ||
      ranWith.side.processorState !== now.side.processorState ||
      ranWith.maxWidth !== now.maxWidth ||
      ranWith.maxHeight !== now.maxHeight ||
      ranWith.keepOriginal !== now.keepOriginal
    );
  }

  private onStart = async () => {
    const inputs = this.currentInputs();
    const { encoderState, processorState } = inputs.side;
    if (!encoderState) return;

    this.abortController?.abort();
    const abortController = (this.abortController = new AbortController());
    if (this.state.zipUrl) URL.revokeObjectURL(this.state.zipUrl);

    this.setState({
      running: true,
      results: [],
      zipUrl: undefined,
      zipSize: undefined,
      ranWith: inputs,
    });

    const settings: BatchSettings = {
      encoderState,
      processorState,
      maxWidth: parseSize(inputs.maxWidth),
      maxHeight: parseSize(inputs.maxHeight),
      keepOriginalIfLarger: inputs.keepOriginal,
    };

    try {
      const results = await processBatch(
        abortController.signal,
        this.props.entries,
        settings,
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

  private onPrev = () => {
    const { previewIndex, entries } = this.props;
    this.props.onPreviewChange(
      (previewIndex - 1 + entries.length) % entries.length,
    );
  };

  private onNext = () => {
    const { previewIndex, entries } = this.props;
    this.props.onPreviewChange((previewIndex + 1) % entries.length);
  };

  private renderSummary(results: BatchResult[]) {
    const ok = results.filter((result) => result.output);
    const before = ok.reduce((sum, result) => sum + result.entry.file.size, 0);
    const after = ok.reduce((sum, result) => sum + result.output!.size, 0);
    if (!ok.length) return null;

    return (
      <span class={style.summary}>
        {formatBytes(before)} → <strong>{formatBytes(after)}</strong>{' '}
        <span class={after <= before ? style.good : style.bad}>
          {savings(before, after)}
        </span>
      </span>
    );
  }

  private renderDetails(results: (BatchResult | undefined)[]) {
    return (
      <ul class={style.details}>
        {this.props.entries.map((entry, i) => {
          const result = results[i];
          return (
            <li class={style.detailRow}>
              <button
                class={style.detailName}
                title={entry.path}
                onClick={() => this.props.onPreviewChange(i)}
              >
                {result ? outputPath(result) : entry.path}
              </button>
              <span class={style.detailValue}>
                {!result ? (
                  <span class={style.muted}>pendiente</span>
                ) : result.error ? (
                  <span class={style.bad}>error</span>
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
                        ? 'original'
                        : savings(entry.file.size, result.output!.size)}
                    </span>
                  </Fragment>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  render(
    { entries, name, previewIndex, settings }: Props,
    {
      sideIndex,
      maxWidth,
      maxHeight,
      keepOriginal,
      collapsed,
      showDetails,
      running,
      zipping,
      results,
      zipUrl,
      zipSize,
    }: State,
  ) {
    const total = entries.length;
    const done = results.filter(Boolean).length;
    const encoderState = settings[sideIndex].encoderState;
    const encoderLabel = encoderState
      ? encoderMap[encoderState.type].meta.label
      : undefined;
    const sideResize = settings[sideIndex].processorState.resize.enabled;
    const stale = this.isStale();
    const finished = !running && !zipping && done > 0;
    const busy = running || zipping;

    return (
      <div class={`${style.batchBar} ${collapsed ? style.collapsed : ''}`}>
        <div class={style.header}>
          <svg class={style.boxIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.5 7.3 12 2.5 3.5 7.3v9.4l8.5 4.8 8.5-4.8V7.3ZM12 4.8l5.9 3.3L12 11.4 6.1 8.1 12 4.8Zm-6.5 5 5.5 3.1v6.1l-5.5-3.1V9.8Zm7.5 9.2v-6.1l5.5-3.1v6.1L13 19Z" />
          </svg>
          <div class={style.title}>
            <strong>
              {total} {total === 1 ? 'imagen' : 'imágenes'}
            </strong>
            <span class={style.muted}> · {name}</span>
          </div>
          {busy && (
            <span class={style.headerProgress}>
              {zipping ? 'ZIP…' : `${done}/${total}`}
            </span>
          )}
          <button
            class={style.iconButton}
            onClick={() => this.setState({ collapsed: !collapsed })}
            title={collapsed ? 'Mostrar' : 'Ocultar'}
            aria-expanded={!collapsed}
          >
            <svg viewBox="0 0 24 24" class={style.chevron}>
              <path d="m7 10 5 5 5-5H7Z" />
            </svg>
          </button>
        </div>

        {!collapsed && (
          <div class={style.body}>
            <div class={style.previewNav}>
              <button
                class={style.iconButton}
                onClick={this.onPrev}
                title="Anterior"
                disabled={total < 2}
              >
                ‹
              </button>
              <span
                class={style.previewName}
                title={entries[previewIndex].path}
              >
                <span class={style.muted}>
                  {previewIndex + 1}/{total}
                </span>{' '}
                {entries[previewIndex].path}
              </span>
              <button
                class={style.iconButton}
                onClick={this.onNext}
                title="Siguiente"
                disabled={total < 2}
              >
                ›
              </button>
            </div>

            <div class={style.row}>
              <span class={style.label}>Ajustes</span>
              <div class={style.segmented} role="radiogroup">
                {(['Izquierda', 'Derecha'] as const).map((label, i) => (
                  <button
                    role="radio"
                    aria-checked={sideIndex === i}
                    class={`${style.segment} ${
                      i === 0 ? style.segmentLeft : style.segmentRight
                    } ${sideIndex === i ? style.segmentActive : ''}`}
                    onClick={() => this.setState({ sideIndex: i as 0 | 1 })}
                    disabled={busy}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span class={style.encoder}>
                {encoderLabel || (
                  <span class={style.bad}>elige un formato</span>
                )}
              </span>
            </div>

            <div class={style.row}>
              <span class={style.label}>Tamaño máx.</span>
              <input
                class={style.sizeInput}
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="ancho"
                value={maxWidth}
                disabled={busy}
                onInput={(event) =>
                  this.setState({
                    maxWidth: (event.target as HTMLInputElement).value,
                  })
                }
              />
              <span class={style.muted}>×</span>
              <input
                class={style.sizeInput}
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="alto"
                value={maxHeight}
                disabled={busy}
                onInput={(event) =>
                  this.setState({
                    maxHeight: (event.target as HTMLInputElement).value,
                  })
                }
              />
              <span class={style.muted}>px</span>
            </div>
            {sideResize && (
              <p class={style.hint}>
                El lote no usa el «Resize» del panel: cada imagen se reduce
                proporcionalmente hasta caber en el tamaño máximo.
              </p>
            )}

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
              Conservar el original si ya pesa menos
            </label>

            {(busy || finished) && (
              <div class={style.progress}>
                <div
                  class={style.progressBar}
                  style={{ width: `${(done / total) * 100}%` }}
                />
              </div>
            )}

            {(busy || finished) && (
              <div class={style.status}>
                <span>
                  {zipping
                    ? 'Creando ZIP…'
                    : running
                    ? `Optimizando ${done}/${total}…`
                    : `${done}/${total} listas`}
                </span>
                {this.renderSummary(results.filter(Boolean) as BatchResult[])}
              </div>
            )}

            <div class={style.actions}>
              {busy ? (
                <button class={style.secondaryButton} onClick={this.onCancel}>
                  Cancelar
                </button>
              ) : (
                <button
                  class={
                    zipUrl && !stale
                      ? style.secondaryButton
                      : style.primaryButton
                  }
                  onClick={this.onStart}
                  disabled={!encoderState}
                >
                  {finished
                    ? stale
                      ? 'Aplicar nuevos ajustes'
                      : 'Repetir'
                    : `Optimizar ${total === 1 ? 'la imagen' : `las ${total}`}`}
                </button>
              )}
              {zipUrl && !busy && (
                <a
                  class={style.primaryButton}
                  href={zipUrl}
                  download={`${name}-zumo.zip`}
                >
                  Descargar ZIP · {formatBytes(zipSize!)}
                </a>
              )}
            </div>
            {stale && zipUrl && !busy && (
              <p class={style.hint}>
                Has cambiado los ajustes: el ZIP es de la versión anterior.
              </p>
            )}

            {(busy || finished) && (
              <button
                class={style.linkButton}
                onClick={() => this.setState({ showDetails: !showDetails })}
              >
                {showDetails ? 'Ocultar detalle' : 'Ver detalle por imagen'}
              </button>
            )}
            {showDetails && this.renderDetails(results)}
          </div>
        )}
      </div>
    );
  }
}
