import { h, Component } from 'preact';

import * as style from './style.css';
import 'add-css:./style.css';
import { assertSignal } from '../util';
import {
  PreprocessorState,
  ProcessorState,
  EncoderState,
  encoderMap,
  defaultPreprocessorState,
  defaultProcessorState,
  EncoderType,
  EncoderOptions,
} from '../feature-meta';
import Output from './Output';
import ResultCache from './result-cache';
import { cleanMerge, cleanSet } from '../util/clean-modify';
import WorkerBridge from '../worker-bridge';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import { drawableToImageData } from '../util/canvas';
import {
  decodeImage,
  preprocessImage,
  processImage,
  compressImage,
  processSvg,
} from './pipeline';
import Sidebar from './Sidebar';
import { Icon } from 'shared/icons';
import { S, lang } from 'shared/strings';
import { formatBytes, formatNames, mainFormats } from './Sidebar/format';
import type { BatchEntry } from '../batch/expand';

export interface SourceImage {
  file: File;
  decoded: ImageData;
  preprocessed: ImageData;
  vectorImage?: HTMLImageElement;
}

export interface SideSettings {
  processorState: ProcessorState;
  encoderState?: EncoderState;
}

interface Side {
  processed?: ImageData;
  file?: File;
  downloadUrl?: string;
  data?: ImageData;
  latestSettings: SideSettings;
  encodedSettings?: SideSettings;
  loading: boolean;
}

export interface Batch {
  entries: BatchEntry[];
  name: string;
}

interface Props {
  file: File;
  /** Present when several images were opened at once (ZIP or multi-select) */
  batch?: Batch;
  showSnack: SnackBarElement['showSnackbar'];
  onBack: () => void;
}

interface State {
  source?: SourceImage;
  sides: [Side, Side];
  /** Source image load */
  loading: boolean;
  mobileView: boolean;
  preprocessorState: PreprocessorState;
  encodedPreprocessorState?: PreprocessorState;
  /** Which batch entry is shown in the editor */
  previewIndex: number;
}

interface MainJob {
  file: File;
  preprocessorState: PreprocessorState;
}

interface SideJob {
  processorState: ProcessorState;
  encoderState?: EncoderState;
}

interface LoadingFileInfo {
  loading: boolean;
  filename?: string;
}

function stateForNewSourceData(state: State): State {
  let newState = { ...state };

  for (const i of [0, 1]) {
    // Ditch previous encodings
    const downloadUrl = state.sides[i].downloadUrl;
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);

    newState = cleanMerge(state, `sides.${i}`, {
      preprocessed: undefined,
      file: undefined,
      downloadUrl: undefined,
      data: undefined,
      encodedSettings: undefined,
    });
  }

  return newState;
}

/**
 * If two processors are disabled, they're considered equivalent, otherwise
 * equivalence is based on ===
 */
function processorStateEquivalent(a: ProcessorState, b: ProcessorState) {
  // Quick exit
  if (a === b) return true;

  // All processors have the same keys
  for (const key of Object.keys(a) as Array<keyof ProcessorState>) {
    // If both processors are disabled, they're the same.
    if (!a[key].enabled && !b[key].enabled) continue;
    if (a !== b) return false;
  }

  return true;
}

const loadingIndicator = '⏳ ';

const originalDocumentTitle = document.title;

function updateDocumentTitle(loadingFileInfo: LoadingFileInfo): void {
  const { loading, filename } = loadingFileInfo;
  let title = '';
  if (loading) title += loadingIndicator;
  if (filename) title += filename + ' - ';
  title += originalDocumentTitle;
  document.title = title;
}

const settingsKey = 'zumo:settings';

const defaultSettings: SideSettings = {
  processorState: cleanMerge(defaultProcessorState, 'resize', {
    width: 0,
    height: 0,
  }),
  encoderState: {
    type: 'mozJPEG',
    options: encoderMap.mozJPEG.meta.defaultOptions,
  },
};

/** The settings used last time, if they still make sense. */
function loadSettings(): SideSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(settingsKey) || 'null');
    if (
      saved &&
      saved.encoderState &&
      mainFormats.includes(saved.encoderState.type) &&
      saved.processorState
    ) {
      return {
        encoderState: {
          type: saved.encoderState.type,
          options: {
            ...(encoderMap[saved.encoderState.type as EncoderType].meta
              .defaultOptions as any),
            ...saved.encoderState.options,
          },
        },
        processorState: {
          resize: {
            ...defaultSettings.processorState.resize,
            ...saved.processorState.resize,
          },
          quantize: {
            ...defaultSettings.processorState.quantize,
            ...saved.processorState.quantize,
          },
        },
      } as SideSettings;
    }
  } catch (err) {
    console.warn('Ignoring saved settings', err);
  }
  return defaultSettings;
}

export default class Compress extends Component<Props, State> {
  widthQuery = window.matchMedia('(max-width: 859px)');

  state: State = {
    source: undefined,
    loading: false,
    preprocessorState: defaultPreprocessorState,
    // The left side always shows the original; the right side is what the
    // user edits, and what batches use.
    sides: [
      {
        latestSettings: {
          processorState: defaultProcessorState,
          encoderState: undefined,
        },
        loading: false,
      },
      { latestSettings: loadSettings(), loading: false },
    ],
    mobileView: this.widthQuery.matches,
    previewIndex: 0,
  };

  private readonly encodeCache = new ResultCache();
  // One for each side
  private readonly workerBridges = [new WorkerBridge(), new WorkerBridge()];
  /** Abort controller for actions that impact both sites, like source image decoding and preprocessing */
  private mainAbortController = new AbortController();
  // And again one for each side
  private sideAbortControllers = [new AbortController(), new AbortController()];
  /** For debouncing calls to updateImage for each side. */
  private updateImageTimeout?: number;

  constructor(props: Props) {
    super(props);
    this.widthQuery.addListener(this.onMobileWidthChange);
    this.sourceFile = props.file;
    this.queueUpdateImage({ immediate: true });

    import('../sw-bridge').then(({ mainAppLoaded }) => mainAppLoaded());
  }

  private onMobileWidthChange = () => {
    this.setState({ mobileView: this.widthQuery.matches });
  };

  private onEncoderTypeChange = (type: EncoderType): void => {
    this.setState({
      sides: cleanSet(this.state.sides, '1.latestSettings.encoderState', {
        type,
        options: encoderMap[type].meta.defaultOptions,
      }),
    });
  };

  private onProcessorOptionsChange = (options: ProcessorState): void => {
    this.setState({
      sides: cleanSet(
        this.state.sides,
        '1.latestSettings.processorState',
        options,
      ),
    });
  };

  private onEncoderOptionsChange = (options: EncoderOptions): void => {
    this.setState({
      sides: cleanSet(
        this.state.sides,
        '1.latestSettings.encoderState.options',
        options,
      ),
    });
  };

  componentWillReceiveProps(nextProps: Props): void {
    if (nextProps.file !== this.props.file) {
      this.sourceFile = nextProps.file;
      this.setState({ previewIndex: 0 });
      this.queueUpdateImage({ immediate: true });
    }
  }

  componentWillUnmount(): void {
    updateDocumentTitle({ loading: false });
    this.widthQuery.removeListener(this.onMobileWidthChange);
    this.mainAbortController.abort();
    for (const controller of this.sideAbortControllers) {
      controller.abort();
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    const wasLoading =
      prevState.loading ||
      prevState.sides[0].loading ||
      prevState.sides[1].loading;
    const isLoading =
      this.state.loading ||
      this.state.sides[0].loading ||
      this.state.sides[1].loading;
    const sourceChanged = prevState.source !== this.state.source;
    if (wasLoading !== isLoading || sourceChanged) {
      updateDocumentTitle({
        loading: isLoading,
        filename: this.state.source?.file.name,
      });
    }
    const settings = this.state.sides[1].latestSettings;
    if (settings !== prevState.sides[1].latestSettings) {
      localStorage.setItem(settingsKey, JSON.stringify(settings));
    }

    this.queueUpdateImage();
  }

  private onPreviewChange = (previewIndex: number): void => {
    const batch = this.props.batch;
    if (!batch || previewIndex === this.state.previewIndex) return;
    this.setState({ previewIndex });
    this.sourceFile = batch.entries[previewIndex].file;
    this.queueUpdateImage({ immediate: true });
  };

  private onPreprocessorChange = async (
    preprocessorState: PreprocessorState,
  ): Promise<void> => {
    const source = this.state.source;
    if (!source) return;

    this.setState({ loading: true, preprocessorState });
  };

  /**
   * Debounce the heavy lifting of updateImage.
   * Otherwise, the thrashing causes jank, and sometimes crashes iOS Safari.
   */
  private queueUpdateImage({ immediate }: { immediate?: boolean } = {}): void {
    // Call updateImage after this delay, unless queueUpdateImage is called
    // again, in which case the timeout is reset.
    const delay = 100;

    clearTimeout(this.updateImageTimeout);
    if (immediate) {
      this.updateImage();
    } else {
      this.updateImageTimeout = setTimeout(() => this.updateImage(), delay);
    }
  }

  private sourceFile: File;
  /** The in-progress job for decoding and preprocessing */
  private activeMainJob?: MainJob;
  /** The in-progress job for each side (processing and encoding) */
  private activeSideJobs: [SideJob?, SideJob?] = [undefined, undefined];

  /**
   * Perform image processing.
   *
   * This function is a monster, but I didn't want to break it up, because it
   * never gets partially called. Instead, it looks at the current state, and
   * decides which steps can be skipped, and which can be cached.
   */
  private async updateImage() {
    const currentState = this.state;

    // State of the last completed job, or ongoing job
    const latestMainJobState: Partial<MainJob> = this.activeMainJob || {
      file: currentState.source && currentState.source.file,
      preprocessorState: currentState.encodedPreprocessorState,
    };
    const latestSideJobStates: Partial<SideJob>[] = currentState.sides.map(
      (side, i) =>
        this.activeSideJobs[i] || {
          processorState:
            side.encodedSettings && side.encodedSettings.processorState,
          encoderState:
            side.encodedSettings && side.encodedSettings.encoderState,
        },
    );

    // State for this job
    const mainJobState: MainJob = {
      file: this.sourceFile,
      preprocessorState: currentState.preprocessorState,
    };
    const sideJobStates: SideJob[] = currentState.sides.map((side) => ({
      // If there isn't an encoder selected, we don't process either
      processorState: side.latestSettings.encoderState
        ? side.latestSettings.processorState
        : defaultProcessorState,
      encoderState: side.latestSettings.encoderState,
    }));

    // Figure out what needs doing:
    const needsDecoding = latestMainJobState.file != mainJobState.file;
    const needsPreprocessing =
      needsDecoding ||
      latestMainJobState.preprocessorState !== mainJobState.preprocessorState;
    const sideWorksNeeded = latestSideJobStates.map((latestSideJob, i) => {
      const needsProcessing =
        needsPreprocessing ||
        !latestSideJob.processorState ||
        // If we're going to or from 'original image' we should reprocess
        !!latestSideJob.encoderState !== !!sideJobStates[i].encoderState ||
        !processorStateEquivalent(
          latestSideJob.processorState,
          sideJobStates[i].processorState,
        );

      return {
        processing: needsProcessing,
        encoding:
          needsProcessing ||
          latestSideJob.encoderState !== sideJobStates[i].encoderState,
      };
    });

    let jobNeeded = false;

    // Abort running tasks & cycle the controllers
    if (needsDecoding || needsPreprocessing) {
      this.mainAbortController.abort();
      this.mainAbortController = new AbortController();
      jobNeeded = true;
      this.activeMainJob = mainJobState;
    }
    for (const [i, sideWorkNeeded] of sideWorksNeeded.entries()) {
      if (sideWorkNeeded.processing || sideWorkNeeded.encoding) {
        this.sideAbortControllers[i].abort();
        this.sideAbortControllers[i] = new AbortController();
        jobNeeded = true;
        this.activeSideJobs[i] = sideJobStates[i];
      }
    }

    if (!jobNeeded) return;

    const mainSignal = this.mainAbortController.signal;
    const sideSignals = this.sideAbortControllers.map((ac) => ac.signal);

    let decoded: ImageData;
    let vectorImage: HTMLImageElement | undefined;

    // Handle decoding
    if (needsDecoding) {
      try {
        assertSignal(mainSignal);
        this.setState({
          source: undefined,
          loading: true,
        });

        // Special-case SVG. We need to avoid createImageBitmap because of
        // https://bugs.chromium.org/p/chromium/issues/detail?id=606319.
        // Also, we cache the HTMLImageElement so we can perform vector resizing later.
        if (mainJobState.file.type.startsWith('image/svg+xml')) {
          vectorImage = await processSvg(mainSignal, mainJobState.file);
          decoded = drawableToImageData(vectorImage);
        } else {
          decoded = await decodeImage(
            mainSignal,
            mainJobState.file,
            // Either worker is good enough here.
            this.workerBridges[0],
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        this.props.showSnack(S.snack.decodeError);
        throw err;
      }
    } else {
      ({ decoded, vectorImage } = currentState.source!);
    }

    let source: SourceImage;

    // Handle preprocessing
    if (needsPreprocessing) {
      try {
        assertSignal(mainSignal);
        this.setState({
          loading: true,
        });

        const preprocessed = await preprocessImage(
          mainSignal,
          decoded,
          mainJobState.preprocessorState,
          // Either worker is good enough here.
          this.workerBridges[0],
        );

        source = {
          decoded,
          vectorImage,
          preprocessed,
          file: mainJobState.file,
        };

        // Update state for process completion, including intermediate render
        this.setState((currentState) => {
          if (mainSignal.aborted) return {};
          let newState: State = {
            ...currentState,
            loading: false,
            source,
            encodedPreprocessorState: mainJobState.preprocessorState,
            sides: currentState.sides.map((side) => {
              if (side.downloadUrl) URL.revokeObjectURL(side.downloadUrl);

              const newSide: Side = {
                ...side,
                // Intermediate render
                data: preprocessed,
                processed: undefined,
                encodedSettings: undefined,
              };
              return newSide;
            }) as [Side, Side],
          };
          newState = stateForNewSourceData(newState);
          return newState;
        });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        this.setState({ loading: false });
        this.props.showSnack(S.snack.processError);
        throw err;
      }
    } else {
      source = currentState.source!;
    }

    // That's the main part of the job done.
    this.activeMainJob = undefined;

    // Allow side jobs to happen in parallel
    sideWorksNeeded.forEach(async (sideWorkNeeded, sideIndex) => {
      try {
        // If processing is true, encoding is always true.
        if (!sideWorkNeeded.encoding) return;

        const signal = sideSignals[sideIndex];
        const jobState = sideJobStates[sideIndex];
        const workerBridge = this.workerBridges[sideIndex];
        let file: File;
        let data: ImageData;
        let processed: ImageData | undefined = undefined;

        // If there's no encoder state, this is "original image", which also
        // doesn't allow processing.
        if (!jobState.encoderState) {
          file = source.file;
          data = source.preprocessed;
        } else {
          const cacheResult = this.encodeCache.match(
            source.preprocessed,
            jobState.processorState,
            jobState.encoderState,
          );

          if (cacheResult) {
            ({ file, processed, data } = cacheResult);
          } else {
            // Set loading state for this side
            this.setState((currentState) => {
              if (signal.aborted) return {};
              const sides = cleanMerge(currentState.sides, sideIndex, {
                loading: true,
              });
              return { sides };
            });

            if (sideWorkNeeded.processing) {
              processed = await processImage(
                signal,
                source,
                jobState.processorState,
                workerBridge,
              );

              // Update state for process completion, including intermediate render
              this.setState((currentState) => {
                if (signal.aborted) return {};
                const currentSide = currentState.sides[sideIndex];
                const side: Side = {
                  ...currentSide,
                  processed,
                  // Intermediate render
                  data: processed,
                  encodedSettings: {
                    ...currentSide.encodedSettings,
                    processorState: jobState.processorState,
                  },
                };
                const sides = cleanSet(currentState.sides, sideIndex, side);
                return { sides };
              });
            } else {
              processed = currentState.sides[sideIndex].processed!;
            }

            file = await compressImage(
              signal,
              processed,
              jobState.encoderState,
              source.file.name,
              workerBridge,
            );
            data = await decodeImage(signal, file, workerBridge);

            this.encodeCache.add({
              data,
              processed,
              file,
              preprocessed: source.preprocessed,
              encoderState: jobState.encoderState,
              processorState: jobState.processorState,
            });
          }
        }

        this.setState((currentState) => {
          if (signal.aborted) return {};
          const currentSide = currentState.sides[sideIndex];

          if (currentSide.downloadUrl) {
            URL.revokeObjectURL(currentSide.downloadUrl);
          }

          const side: Side = {
            ...currentSide,
            data,
            file,
            downloadUrl: URL.createObjectURL(file),
            loading: false,
            processed,
            encodedSettings: {
              processorState: jobState.processorState,
              encoderState: jobState.encoderState,
            },
          };
          const sides = cleanSet(currentState.sides, sideIndex, side);
          return { sides };
        });

        this.activeSideJobs[sideIndex] = undefined;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        this.setState((currentState) => {
          const sides = cleanMerge(currentState.sides, sideIndex, {
            loading: false,
          });
          return { sides };
        });
        this.props.showSnack(S.snack.processError);
        throw err;
      }
    });
  }

  render(
    { onBack, batch, showSnack }: Props,
    {
      loading,
      sides,
      source,
      mobileView,
      preprocessorState,
      previewIndex,
    }: State,
  ) {
    const [, side] = sides;
    const [leftImageData, rightImageData] = sides.map((i) => i.data);
    const settings = side.latestSettings;
    const total = batch ? batch.entries.length : 0;
    const busy = loading || side.loading;
    const encoderLabel = settings.encoderState
      ? formatNames[settings.encoderState.type]
      : '';

    return (
      <div class={style.compress}>
        <div class={`ambient ${style.ambient}`} aria-hidden="true">
          <i class="b1" />
          <i class="b2" />
        </div>

        <header class={style.topBar}>
          <button class={style.back} onClick={onBack}>
            <Icon name="chevron-left" size={22} weight={2.4} />
            {S.editor.back}
          </button>

          {batch ? (
            <nav class={style.previewNav} aria-label={S.batch.listTitle}>
              <button
                class="icon-btn"
                onClick={() =>
                  this.onPreviewChange((previewIndex - 1 + total) % total)
                }
                title={S.editor.prev}
                aria-label={S.editor.prev}
              >
                <Icon name="chevron-left" size={16} weight={2.4} />
              </button>
              <span
                class={style.previewName}
                title={batch.entries[previewIndex].path}
              >
                <span class={style.previewTitle}>
                  {batch.entries[previewIndex].path.split('/').pop()}
                </span>
                <span class={style.previewCount}>
                  {previewIndex + 1} {S.editor.of} {total}
                </span>
              </span>
              <button
                class="icon-btn"
                onClick={() => this.onPreviewChange((previewIndex + 1) % total)}
                title={S.editor.next}
                aria-label={S.editor.next}
              >
                <Icon name="chevron-right" size={16} weight={2.4} />
              </button>
            </nav>
          ) : (
            <span class={style.fileName}>{source?.file.name}</span>
          )}

          <span class={style.status} aria-live="polite">
            {busy && (
              <span class={style.statusBusy}>
                <span class="spinner small" />
                <span class={style.statusText}>{S.editor.working}</span>
              </span>
            )}
          </span>
        </header>

        <div class={style.stage}>
          <Output
            source={source}
            mobileView={mobileView}
            leftCompressed={leftImageData}
            rightCompressed={rightImageData}
            leftImgContain={false}
            rightImgContain={false}
            preprocessorState={preprocessorState}
            onPreprocessorChange={this.onPreprocessorChange}
            hideRotate={!!batch}
            lang={lang}
          />
          <span class={`${style.stageLabel} ${style.stageLabelStart} glass`}>
            {S.editor.original}
            {source && (
              <span class={style.stageSize}>
                {formatBytes(source.file.size)}
              </span>
            )}
          </span>
          <span class={`${style.stageLabel} ${style.stageLabelEnd} glass`}>
            {encoderLabel}
            {side.file && !busy && (
              <span class={style.stageSize}>{formatBytes(side.file.size)}</span>
            )}
          </span>
          {busy && <div class={style.stageLoading} />}
        </div>

        <Sidebar
          source={source}
          settings={settings}
          resultFile={side.file}
          resultData={side.data}
          downloadUrl={side.downloadUrl}
          loading={busy}
          batch={batch}
          previewIndex={previewIndex}
          onPreviewChange={this.onPreviewChange}
          onEncoderTypeChange={this.onEncoderTypeChange}
          onEncoderOptionsChange={this.onEncoderOptionsChange}
          onProcessorOptionsChange={this.onProcessorOptionsChange}
          showSnack={showSnack}
        />
      </div>
    );
  }
}
