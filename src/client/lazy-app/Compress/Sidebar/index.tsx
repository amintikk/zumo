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
import Select from '../Options/Select';
import Toggle from '../Options/Toggle';
import Expander from '../Options/Expander';
import { Options as QuantOptionsComponent } from 'features/processors/quantize/client';
import BatchSection from './BatchSection';
import { formatBytes, savings } from './format';

type EncoderMap = typeof encoderMap;

const supportedEncoderMapP: Promise<Partial<EncoderMap>> = (async () => {
  const supported: Partial<EncoderMap> = { ...encoderMap };
  await Promise.all(
    Object.entries(encoderMap).map(async ([name, details]) => {
      if ('featureTest' in details && !(await details.featureTest())) {
        delete supported[name as EncoderType];
      }
    }),
  );
  return supported;
})();

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

interface State {
  supportedEncoderMap?: Partial<EncoderMap>;
}

function dimensions(data?: { width: number; height: number }): string {
  return data ? `${data.width} × ${data.height}` : '';
}

export default class Sidebar extends Component<Props, State> {
  state: State = {};

  constructor(props: Props) {
    super(props);
    supportedEncoderMapP.then((supportedEncoderMap) =>
      this.setState({ supportedEncoderMap }),
    );
  }

  private onEncoderTypeChange = (event: Event) => {
    const type = (event.currentTarget as HTMLSelectElement).value;
    this.props.onEncoderTypeChange(type as EncoderType);
  };

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

  private renderResult() {
    const { source, resultFile, resultData, loading, settings } = this.props;
    const encoderLabel = settings.encoderState
      ? encoderMap[settings.encoderState.type].meta.label
      : '';

    return (
      <section class={style.section}>
        <h2 class={style.sectionTitle}>
          Resultado
          {loading && <span class={style.spinner} aria-label="Procesando" />}
        </h2>
        <dl class={style.resultTable}>
          <dt>Original</dt>
          <dd>
            {source ? formatBytes(source.file.size) : '—'}
            <span class={style.muted}>{dimensions(source?.preprocessed)}</span>
          </dd>
          <dt>{encoderLabel}</dt>
          <dd>
            {resultFile && !loading ? (
              <Fragment>
                <strong>{formatBytes(resultFile.size)}</strong>
                <span class={style.muted}>{dimensions(resultData)}</span>
              </Fragment>
            ) : (
              <span class={style.muted}>calculando…</span>
            )}
          </dd>
        </dl>
        {source && resultFile && !loading && (
          <p
            class={resultFile.size <= source.file.size ? style.good : style.bad}
          >
            {savings(source.file.size, resultFile.size)}{' '}
            {resultFile.size <= source.file.size ? 'más ligera' : 'más pesada'}
          </p>
        )}
      </section>
    );
  }

  private renderDownload() {
    const { resultFile, downloadUrl, loading, batch } = this.props;
    const ready = resultFile && downloadUrl && !loading;
    return (
      <a
        class={batch ? style.linkButton : style.primaryButton}
        href={ready ? downloadUrl : undefined}
        download={ready ? resultFile!.name : undefined}
        aria-disabled={!ready}
      >
        {batch
          ? 'Descargar solo esta imagen'
          : ready
          ? `Descargar · ${formatBytes(resultFile!.size)}`
          : 'Procesando…'}
      </a>
    );
  }

  render(
    {
      settings,
      batch,
      previewIndex,
      onPreviewChange,
      showSnack,
      source,
    }: Props,
    { supportedEncoderMap }: State,
  ) {
    const { encoderState, processorState } = settings;
    const encoder = encoderState && encoderMap[encoderState.type];
    const EncoderOptionsComponent =
      encoder && 'Options' in encoder ? encoder.Options : undefined;
    const isVector = Boolean(source && source.vectorImage);

    return (
      <aside class={style.sidebar}>
        <div class={style.scroll}>
          <section class={style.section}>
            <h2 class={style.sectionTitle}>Formato</h2>
            <div class={style.padded}>
              <Select
                value={encoderState?.type}
                onChange={this.onEncoderTypeChange}
                large
              >
                {supportedEncoderMap ? (
                  Object.entries(supportedEncoderMap).map(([type, enc]) => (
                    <option value={type}>{enc!.meta.label}</option>
                  ))
                ) : (
                  <option>Cargando…</option>
                )}
              </Select>
            </div>
            <Expander>
              {EncoderOptionsComponent && (
                <EncoderOptionsComponent
                  options={encoderState!.options as any}
                  onChange={this.props.onEncoderOptionsChange}
                />
              )}
            </Expander>
          </section>

          <section class={style.section}>
            <label class={style.switchRow}>
              <span>
                <span class={style.switchTitle}>Tamaño máximo</span>
                <span class={style.switchHint}>
                  Reduce sin deformar; nunca amplía
                </span>
              </span>
              <Toggle
                name="resize"
                checked={processorState.resize.enabled}
                onChange={this.onToggle}
              />
            </label>
            <Expander>
              {processorState.resize.enabled && (
                <div class={style.sizeRow}>
                  <label class={style.sizeField}>
                    <span>Ancho</span>
                    <input
                      class={style.input}
                      type="number"
                      min="0"
                      inputMode="numeric"
                      name="width"
                      placeholder="libre"
                      value={processorState.resize.width || ''}
                      onInput={this.onSizeInput}
                    />
                  </label>
                  <span class={style.times}>×</span>
                  <label class={style.sizeField}>
                    <span>Alto</span>
                    <input
                      class={style.input}
                      type="number"
                      min="0"
                      inputMode="numeric"
                      name="height"
                      placeholder="libre"
                      value={processorState.resize.height || ''}
                      onInput={this.onSizeInput}
                    />
                  </label>
                  <span class={style.unit}>px</span>
                </div>
              )}
            </Expander>
          </section>

          {!isVector && (
            <section class={style.section}>
              <label class={style.switchRow}>
                <span>
                  <span class={style.switchTitle}>Reducir colores</span>
                  <span class={style.switchHint}>
                    Útil para PNG con pocos colores
                  </span>
                </span>
                <Toggle
                  name="quantize"
                  checked={processorState.quantize.enabled}
                  onChange={this.onToggle}
                />
              </label>
              <Expander>
                {processorState.quantize.enabled && (
                  <QuantOptionsComponent
                    options={processorState.quantize}
                    onChange={this.onQuantizeChange}
                  />
                )}
              </Expander>
            </section>
          )}

          {this.renderResult()}
          {batch && <div class={style.padded}>{this.renderDownload()}</div>}
        </div>

        {batch ? (
          <BatchSection
            batch={batch}
            settings={settings}
            previewIndex={previewIndex}
            onPreviewChange={onPreviewChange}
            showSnack={showSnack}
          />
        ) : (
          <div class={style.footer}>{this.renderDownload()}</div>
        )}
      </aside>
    );
  }
}
