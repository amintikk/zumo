import { h, Component, Fragment } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import 'add-css:../Options/style.css';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import type { SourceImage, SideSettings, Batch } from '..';
import {
  EncoderOptions,
  EncoderType,
  ProcessorState,
  ProcessorOptions,
  encoderMap,
} from '../../feature-meta';
import { cleanMerge, cleanSet } from '../../util/clean-modify';
import Checkbox from '../Options/Checkbox';
import Expander from '../Options/Expander';
import { Options as QuantOptionsComponent } from 'features/processors/quantize/client';
import {
  processBatch,
  zipResults,
  outputPath,
  BatchResult,
} from '../../batch/process';
import { Icon } from 'shared/icons';
import { S } from 'shared/strings';
import { track } from 'shared/analytics';
import { formatBytes, formatNames, savings, mainFormats } from './format';

/** Formats whose feature test passes in this browser */
const supportedFormatsP: Promise<EncoderType[]> = Promise.all(
  mainFormats.map(async (type) => {
    const encoder = encoderMap[type] as any;
    return !encoder.featureTest || (await encoder.featureTest())
      ? type
      : undefined;
  }),
).then((types) => types.filter(Boolean) as EncoderType[]);

type Screen = 'settings' | 'images';

interface Props {
  source?: SourceImage;
  settings: SideSettings;
  resultFile?: File;
  resultData?: ImageData;
  downloadUrl?: string;
  loading: boolean;
  batch?: Batch;
  previewIndex: number;
  onPreviewChange(index: number): void;
  onEncoderTypeChange(type: EncoderType): void;
  onEncoderOptionsChange(options: EncoderOptions): void;
  onProcessorOptionsChange(state: ProcessorState): void;
  showSnack: SnackBarElement['showSnackbar'];
}

interface RunInputs {
  settings: SideSettings;
  keepOriginal: boolean;
}

interface State {
  formats: EncoderType[];
  screen: Screen;
  motion: 'push' | 'pop' | 'none';
  scrolled: boolean;
  // Batch run
  keepOriginal: boolean;
  running: boolean;
  zipping: boolean;
  results: (BatchResult | undefined)[];
  zipUrl?: string;
  zipSize?: number;
  ranWith?: RunInputs;
}

function dimensions(data?: { width: number; height: number }): string {
  return data ? `${data.width} × ${data.height}` : '';
}

/** Percentage saved as a number (negative if it grew) */
function savedPercent(before: number, after: number): number {
  return before ? Math.round((1 - after / before) * 100) : 0;
}

export default class Sidebar extends Component<Props, State> {
  state: State = {
    formats: mainFormats,
    screen: 'settings',
    motion: 'none',
    scrolled: false,
    keepOriginal: true,
    running: false,
    zipping: false,
    results: [],
  };

  private abortController?: AbortController;

  constructor(props: Props) {
    super(props);
    supportedFormatsP.then((formats) => this.setState({ formats }));
  }

  componentWillReceiveProps(next: Props) {
    if (next.batch !== this.props.batch) {
      this.resetBatch();
      this.setState({ screen: 'settings', motion: 'none' });
    }
  }

  componentWillUnmount() {
    this.resetBatch();
  }

  private formatName(): string {
    return formatNames[this.props.settings.encoderState?.type || ''] || '';
  }

  // ---- Settings -----------------------------------------------------------

  private onFormatClick(type: EncoderType) {
    const current = this.props.settings.encoderState?.type;
    if (type !== current) this.props.onEncoderTypeChange(type);
  }

  private onToggle = (event: Event) => {
    const el = event.currentTarget as HTMLInputElement;
    const processor = el.name as keyof ProcessorState;
    let state = cleanSet(
      this.props.settings.processorState,
      `${processor}.enabled`,
      el.checked,
    );
    // Give "max size" a sensible starting point
    const { resize } = state;
    if (
      processor === 'resize' &&
      el.checked &&
      !resize.width &&
      !resize.height
    ) {
      state = cleanMerge(state, 'resize', { width: 1920, height: 0 });
    }
    this.props.onProcessorOptionsChange(state);
  };

  private onSizeInput = (event: Event) => {
    const el = event.currentTarget as HTMLInputElement;
    const value = Math.max(0, Math.round(Number(el.value) || 0));
    this.props.onProcessorOptionsChange(
      cleanMerge(this.props.settings.processorState, 'resize', {
        [el.name]: value,
      }),
    );
  };

  private onQuantizeChange = (options: ProcessorOptions['quantize']) => {
    this.props.onProcessorOptionsChange(
      cleanMerge(this.props.settings.processorState, 'quantize', options),
    );
  };

  // ---- Navigation ---------------------------------------------------------

  private push(screen: Screen) {
    this.setState({ screen, motion: 'push', scrolled: false });
  }

  private pop() {
    this.setState({ screen: 'settings', motion: 'pop', scrolled: false });
  }

  private onScroll = (event: Event) => {
    const scrolled = (event.currentTarget as HTMLElement).scrollTop > 2;
    if (scrolled !== this.state.scrolled) this.setState({ scrolled });
  };

  // ---- Batch --------------------------------------------------------------

  private resetBatch() {
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
    if (!encoderState || !batch) return;

    this.abortController?.abort();
    const abortController = (this.abortController = new AbortController());
    if (this.state.zipUrl) URL.revokeObjectURL(this.state.zipUrl);

    const keepOriginal = this.state.keepOriginal;
    track('optimize_batch', {
      format: formatNames[encoderState.type],
      image_count: batch.entries.length,
    });
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
      if (failed) this.props.showSnack(S.batch.failed(failed));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error(err);
      this.setState({ running: false, zipping: false });
      this.props.showSnack(S.batch.batchError);
    }
  };

  private onCancel = () => {
    this.abortController?.abort();
    this.setState({ running: false, zipping: false, ranWith: undefined });
  };

  // ---- Rendering ----------------------------------------------------------

  private renderFormat() {
    const { settings } = this.props;
    const current = settings.encoderState?.type;
    const { formats } = this.state;
    const index = Math.max(0, formats.indexOf(current as EncoderType));

    return (
      <section class={style.group}>
        <div class="group-header">{S.editor.format}</div>
        <div
          class={style.seg}
          role="radiogroup"
          aria-label={S.editor.format}
          style={{ '--n': formats.length, '--i': index }}
        >
          <span class={style.segKnob} aria-hidden="true" />
          {formats.map((type) => (
            <button
              type="button"
              role="radio"
              aria-checked={type === current}
              class={style.segButton}
              onClick={() => this.onFormatClick(type)}
            >
              {formatNames[type]}
            </button>
          ))}
        </div>
        <div class="group-footer">
          {current ? S.editor.formatHints[current] : ''}
        </div>
      </section>
    );
  }

  private renderEncoderOptions() {
    const { encoderState } = this.props.settings;
    const encoder = encoderState && encoderMap[encoderState.type];
    const EncoderOptions =
      encoder && 'Options' in encoder ? encoder.Options : undefined;
    if (!EncoderOptions) return null;

    return (
      <section class={style.group}>
        <div class="group-header">
          {S.editor.formatSettings(formatNames[encoderState!.type])}
        </div>
        <div class="list glass">
          <EncoderOptions
            key={encoderState!.type}
            options={encoderState!.options as any}
            onChange={this.props.onEncoderOptionsChange}
          />
        </div>
      </section>
    );
  }

  private renderSize() {
    const { resize } = this.props.settings.processorState;
    return (
      <section class={style.group}>
        <div class="group-header">{S.editor.size}</div>
        <div class="list glass">
          <label class="row">
            <span class="grow">{S.editor.maxSize}</span>
            <Checkbox
              name="resize"
              checked={resize.enabled}
              onChange={this.onToggle}
            />
          </label>
          <Expander>
            {resize.enabled && (
              <div class={`row ${style.sizeRow}`}>
                <label class={style.sizeField}>
                  <span>{S.editor.width}</span>
                  <input
                    class="field"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    name="width"
                    placeholder={S.editor.any}
                    value={resize.width || ''}
                    onInput={this.onSizeInput}
                  />
                </label>
                <span class={style.times}>×</span>
                <label class={style.sizeField}>
                  <span>{S.editor.height}</span>
                  <input
                    class="field"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    name="height"
                    placeholder={S.editor.any}
                    value={resize.height || ''}
                    onInput={this.onSizeInput}
                  />
                </label>
                <span class={style.unit}>px</span>
              </div>
            )}
          </Expander>
        </div>
        <div class="group-footer">{S.editor.sizeHint}</div>
      </section>
    );
  }

  private renderColors() {
    const { source, settings } = this.props;
    if (source && source.vectorImage) return null;
    const { quantize } = settings.processorState;
    return (
      <section class={style.group}>
        <div class="group-header">{S.editor.colors}</div>
        <div class="list glass">
          <label class="row">
            <span class="grow">{S.editor.reduceColors}</span>
            <Checkbox
              name="quantize"
              checked={quantize.enabled}
              onChange={this.onToggle}
            />
          </label>
          <Expander>
            {quantize.enabled && (
              <div class={style.nested}>
                <QuantOptionsComponent
                  options={quantize}
                  onChange={this.onQuantizeChange}
                />
              </div>
            )}
          </Expander>
        </div>
        <div class="group-footer">{S.editor.colorsHint}</div>
      </section>
    );
  }

  private renderResult() {
    const { source, resultFile, resultData, loading, batch, downloadUrl } =
      this.props;
    const ready = !!(source && resultFile && !loading);
    const percent = ready
      ? savedPercent(source!.file.size, resultFile!.size)
      : 0;

    return (
      <section class={style.group}>
        <div class="group-header">{S.editor.result}</div>
        <div class={`${style.result} glass`}>
          <div class={style.figureRow}>
            {ready ? (
              <span
                class={`${style.figure} ${
                  percent >= 0 ? style.good : style.bad
                }`}
              >
                <Icon
                  name={percent >= 0 ? 'arrow-down' : 'arrow-up'}
                  size={22}
                  weight={2.8}
                />
                {Math.abs(percent)}
                <span class={style.unit}>%</span>
              </span>
            ) : (
              <span class={`skeleton ${style.figureSkeleton}`} />
            )}
            <span class={style.figureCaption}>
              {ready
                ? percent >= 0
                  ? S.editor.lighter
                  : S.editor.heavier
                : S.editor.working}
            </span>
          </div>
          <dl class={style.sizes}>
            <dt>{S.editor.original}</dt>
            <dd>
              <span class="num">
                {source ? formatBytes(source.file.size) : '—'}
              </span>
              <span class={style.dim}>{dimensions(source?.preprocessed)}</span>
            </dd>
            <dt>
              {formatNames[this.props.settings.encoderState?.type || ''] || ''}
            </dt>
            <dd>
              <strong class="num">
                {ready ? formatBytes(resultFile!.size) : '—'}
              </strong>
              <span class={style.dim}>
                {ready ? dimensions(resultData) : ''}
              </span>
            </dd>
          </dl>
          {batch && (
            <a
              class={`btn btn-plain btn-sm ${style.downloadThis}`}
              href={ready ? downloadUrl : undefined}
              download={ready ? resultFile!.name : undefined}
              aria-disabled={!ready}
              onClick={() =>
                ready && track('download_image', { format: this.formatName() })
              }
            >
              <Icon name="download" size={15} />
              {S.editor.downloadThis}
            </a>
          )}
        </div>
      </section>
    );
  }

  private renderBatchGroup() {
    const { batch } = this.props;
    if (!batch) return null;
    const { keepOriginal, running, zipping } = this.state;
    return (
      <section class={style.group}>
        <div class="group-header">{S.batch.title}</div>
        <div class="list glass">
          <button class="row with-icon" onClick={() => this.push('images')}>
            <span class="row-icon t-orange">
              <Icon name="images" size={16} />
            </span>
            <span class="grow">{S.batch.images(batch.entries.length)}</span>
            <span class="value">{S.batch.list}</span>
            <Icon name="chevron-right" size={14} weight={2.4} class="chev" />
          </button>
          <label class="row with-icon">
            <span class="row-icon t-green">
              <Icon name="shield-check" size={16} />
            </span>
            <span class="grow">{S.batch.keepOriginal}</span>
            <Checkbox
              checked={keepOriginal}
              disabled={running || zipping}
              onChange={(event: Event) =>
                this.setState({
                  keepOriginal: (event.currentTarget as HTMLInputElement)
                    .checked,
                })
              }
            />
          </label>
        </div>
      </section>
    );
  }

  private renderSettingsScreen() {
    return (
      <Fragment>
        {this.renderFormat()}
        {this.renderEncoderOptions()}
        {this.renderSize()}
        {this.renderColors()}
        {this.renderResult()}
        {this.renderBatchGroup()}
      </Fragment>
    );
  }

  private renderImagesScreen() {
    const { batch, previewIndex, onPreviewChange } = this.props;
    const { results } = this.state;
    if (!batch) return null;

    return (
      <section class={style.group}>
        <ul class={`list glass ${style.imageList}`}>
          {batch.entries.map((entry, i) => {
            const result = results[i];
            const percent =
              result && result.output
                ? savedPercent(entry.file.size, result.output.size)
                : 0;
            return (
              <li>
                <button
                  class={`row with-icon ${
                    i === previewIndex ? style.currentRow : ''
                  }`}
                  onClick={() => onPreviewChange(i)}
                  aria-current={i === previewIndex}
                >
                  <span class="row-icon t-gray">
                    <Icon name="image" size={15} />
                  </span>
                  <span class={`grow ${style.imageName}`}>
                    <span class={style.imageTitle}>
                      {result ? outputPath(result) : entry.path}
                    </span>
                    <span class={style.imageSizes}>
                      {formatBytes(entry.file.size)}
                      {result && result.output && !result.keptOriginal
                        ? ` → ${formatBytes(result.output.size)}`
                        : ''}
                    </span>
                  </span>
                  {!result ? (
                    this.state.running ? (
                      <span class="pill flat">{S.batch.pending}</span>
                    ) : null
                  ) : result.error ? (
                    <span class="pill bad" title={result.error}>
                      {S.batch.error}
                    </span>
                  ) : result.keptOriginal ? (
                    <span class="pill flat">{S.batch.same}</span>
                  ) : (
                    <span class={`pill ${percent >= 0 ? 'good' : 'bad'}`}>
                      <Icon
                        name={percent >= 0 ? 'arrow-down' : 'arrow-up'}
                        size={11}
                        weight={2.8}
                      />
                      {Math.abs(percent)} %
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  private renderFooter() {
    const { batch, resultFile, downloadUrl, loading } = this.props;

    if (!batch) {
      const ready = !!(resultFile && downloadUrl && !loading);
      return (
        <div class={style.footer}>
          <a
            class="btn btn-primary btn-block"
            href={ready ? downloadUrl : undefined}
            download={ready ? resultFile!.name : undefined}
            aria-disabled={!ready}
            onClick={() =>
              ready && track('download_image', { format: this.formatName() })
            }
          >
            <Icon name="download" size={18} />
            {ready
              ? `${S.editor.download} · ${formatBytes(resultFile!.size)}`
              : S.editor.working}
          </a>
        </div>
      );
    }

    const { running, zipping, results, zipUrl, zipSize } = this.state;
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
        {hasRun && (
          <div class={style.progress}>
            <div class={style.progressHead}>
              <span>
                {zipping
                  ? S.batch.zipping
                  : running
                  ? S.batch.working(done, total)
                  : S.batch.done(done, total)}
              </span>
              {ok.length > 0 && (
                <span class="num">
                  {formatBytes(before)} → <strong>{formatBytes(after)}</strong>
                </span>
              )}
            </div>
            <div class="meter-track">
              <div style={{ width: `${(done / total) * 100}%` }} />
            </div>
          </div>
        )}

        {stale && zipUrl && !busy && (
          <p class={style.notice}>{S.batch.stale}</p>
        )}

        {busy ? (
          <button class="btn btn-glass btn-block" onClick={this.onCancel}>
            {S.batch.cancel}
          </button>
        ) : zipUrl && !stale ? (
          <a
            class="btn btn-primary btn-block"
            href={zipUrl}
            download={`${batch.name}-zumo.zip`}
            onClick={() =>
              track('download_zip', {
                format: this.formatName(),
                image_count: total,
              })
            }
          >
            <Icon name="download" size={18} />
            {S.batch.downloadZip} · {formatBytes(zipSize!)}
            {ok.length > 0 && (
              <span class={style.btnBadge}>{savings(before, after)}</span>
            )}
          </a>
        ) : (
          <button
            class="btn btn-primary btn-block"
            onClick={this.onStart}
            disabled={!this.props.settings.encoderState}
          >
            <Icon name="zap" size={18} />
            {zipUrl ? S.batch.again : S.batch.optimize(total)}
          </button>
        )}
      </div>
    );
  }

  render(_: Props, { screen, motion, scrolled }: State) {
    const onImages = screen === 'images';
    return (
      <aside class={`${style.sidebar} glass`}>
        {onImages && (
          <header class={`${style.bar} ${scrolled ? style.barScrolled : ''}`}>
            <button class={style.backBtn} onClick={() => this.pop()}>
              <Icon name="chevron-left" size={20} weight={2.4} />
              {S.batch.backToSettings}
            </button>
            <span class={style.barTitle}>{S.batch.listTitle}</span>
            <span />
          </header>
        )}
        <div class={style.stack}>
          <div
            key={screen}
            class={`${style.screen} ${
              motion === 'push'
                ? style.enterPush
                : motion === 'pop'
                ? style.enterPop
                : ''
            }`}
            onScroll={this.onScroll}
          >
            {onImages ? this.renderImagesScreen() : this.renderSettingsScreen()}
          </div>
        </div>
        {this.renderFooter()}
      </aside>
    );
  }
}
