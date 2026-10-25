/**
 * Every user-facing string, one dictionary per language (same keys).
 * `S` always points at the current language; see setLang().
 */
const es = {
  meta: {
    title: 'zumo · Optimiza tus fotos en lote, sin subirlas',
    description:
      'Comprime y convierte fotos HEIC, JPG, PNG, WebP, AVIF y TIFF en tu navegador. Suelta un ZIP con cientos de imágenes y descárgalas todas más ligeras, sin subirlas a ningún servidor.',
    ogAlt: 'Icono de zumo junto al texto: tus fotos, mucho más ligeras.',
    noJs: 'zumo necesita JavaScript para trabajar con tus imágenes.',
    reload: 'Recargar',
  },

  nav: {
    privacy: 'Privacidad',
    open: 'Abrir imágenes',
  },

  header: {
    toDark: 'Modo oscuro',
    toLight: 'Modo claro',
    install: 'Instalar la app',
    language: 'English',
    languageLabel: 'Cambiar a inglés',
    current: 'ES',
  },

  install: {
    title: 'Instala zumo',
    text: 'Tendrás zumo como una app más y funcionará sin conexión.',
    ios: 'En Safari, pulsa Compartir y luego «Añadir a pantalla de inicio».',
    other:
      'Abre el menú del navegador y elige «Instalar zumo» o «Añadir a pantalla de inicio».',
    ok: 'Entendido',
  },

  hero: {
    title: 'Tus fotos, mucho<br>más ligeras.',
    lead: 'Suelta un ZIP o un montón de imágenes. Elige la calidad viendo el antes y el después, y descárgalas todas de una vez.',
    trust: ['Nada se sube', 'Gratis, sin cuenta', 'Fotos del iPhone incluidas'],
  },

  drop: {
    title: 'Suelta aquí tus fotos',
    titleTouch: 'Elige tus fotos',
    subtitle: 'O un .zip, con carpetas y todo.',
    choose: 'Elegir archivos',
    paste: 'Pegar del portapapeles',
    dragging: 'Suelta para abrir',
  },

  info: {
    items: [
      {
        title: 'Lotes en un ZIP',
        text: 'Cientos de fotos de una vez. El ZIP que descargas mantiene tus carpetas.',
      },
      {
        title: 'Nada sale de tu equipo',
        text: 'Todo se procesa en tu navegador. No subimos ni una sola imagen.',
      },
      {
        title: 'Fotos del iPhone',
        text: 'Abre HEIC, TIFF, PNG o JPG y guárdalos en JPEG, WebP o AVIF.',
      },
    ],
  },

  footer: {
    source: 'Código fuente',
    cookies: 'Cookies',
    legal:
      'zumo es un proyecto basado en Squoosh, de Google Chrome Labs (licencia Apache 2.0).',
  },

  consent: {
    label: 'Privacidad y analítica',
    text: 'Usamos analítica anónima para saber cuánta gente usa zumo. Tus imágenes nunca salen de tu equipo.',
    reject: 'Rechazar',
    accept: 'Aceptar',
  },

  privacy: {
    title: 'Privacidad',
    updated: 'Actualizado el 25 de octubre de 2026',
    sections: [
      {
        title: 'Tus imágenes',
        text: 'zumo procesa todas las imágenes en tu navegador. No se suben a ningún servidor, no las vemos y no las guardamos. Al cerrar la pestaña, desaparecen.',
      },
      {
        title: 'Analítica',
        text: 'Si la aceptas, usamos Google Analytics para contar visitas de forma agregada (páginas vistas, país y tipo de dispositivo) y cómo se usa zumo: cuántas imágenes abres, qué formato eliges y si descargas el resultado. Nunca enviamos nombres de archivo, tamaños ni el contenido de tus fotos. Si la rechazas, no se carga.',
      },
      {
        title: 'Lo que se guarda en tu navegador',
        text: 'Guardamos tus últimos ajustes (formato, calidad y tamaño) y tu elección sobre la analítica, para no preguntarte cada vez. También guardamos la app para que funcione sin conexión. Puedes borrarlo desde los ajustes de tu navegador.',
      },
      {
        title: 'Cambiar de opinión',
        text: 'Pulsa «Cookies» al pie de la página para volver a elegir.',
      },
    ],
    back: 'Volver a zumo',
  },

  editor: {
    back: 'Inicio',
    prev: 'Imagen anterior',
    next: 'Imagen siguiente',
    of: 'de',
    original: 'Original',
    working: 'Procesando…',
    format: 'Formato',
    formatHints: {
      mozJPEG: 'Se abre en cualquier sitio. La opción segura.',
      webP: 'Más ligero que JPEG y compatible con todos los navegadores.',
      avif: 'El más ligero. Tarda un poco más en comprimir.',
      oxiPNG: 'Sin pérdida. Para capturas, logos y transparencias.',
      jxl: 'Muy eficiente, pero pocos programas lo abren todavía.',
    } as { [type: string]: string },
    quality: 'Calidad',
    formatSettings: (format: string) => `Ajustes de ${format}`,
    advanced: 'Ajustes avanzados',
    size: 'Tamaño',
    maxSize: 'Tamaño máximo',
    width: 'Ancho',
    height: 'Alto',
    any: 'libre',
    sizeHint: 'Se reduce sin deformar. Nunca se amplía.',
    colors: 'Colores',
    reduceColors: 'Reducir colores',
    colorsHint: 'Útil para capturas y gráficos con pocos colores.',
    result: 'Resultado',
    lighter: 'más ligera',
    heavier: 'más pesada',
    from: 'de',
    download: 'Descargar',
    downloadThis: 'Descargar solo esta',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    rotate: 'Girar',
    background: 'Cambiar fondo',
    smoothing: 'Ver píxeles',
    dropHere: 'Suelta para abrir',
  },

  codec: {
    interlace: 'Entrelazado',
    effort: 'Esfuerzo',
    type: 'Tipo',
    standard: 'Estándar',
    colors: 'Colores',
    dithering: 'Tramado',
    lossless: 'Sin pérdida',
    slightLoss: 'Pérdida mínima',
    altLossy: 'Modo con pérdida alternativo',
    autoEdge: 'Filtro de bordes automático',
    edgeFilter: 'Filtro que conserva bordes',
    decodeSpeed: 'Priorizar velocidad al abrir',
    noiseIso: 'Grano equivalente a ISO',
    progressive: 'Carga progresiva',
    channels: 'Canales',
    grayscale: 'Escala de grises',
    autoSubsample: 'Submuestreo de color automático',
    subsampleBy: 'Submuestrear color',
    separateChroma: 'Calidad del color aparte',
    chromaQuality: 'Calidad del color',
    baseline: 'JPEG básico (máxima compatibilidad)',
    huffman: 'Optimizar tabla de Huffman',
    smoothing: 'Suavizado',
    quantization: 'Cuantización',
    flat: 'Plana',
    trellisMultipass: 'Trellis en varias pasadas',
    zeroBlocks: 'Optimizar bloques vacíos',
    trellisTable: 'Optimizar tras el trellis',
    trellisPasses: 'Pasadas de trellis',
    subsample: 'Submuestreo de color',
    sharpYuv: 'Reducción de color nítida',
    separateAlpha: 'Calidad de la transparencia aparte',
    alphaQuality: 'Calidad de la transparencia',
    chromaDeltaQ: 'Comprimir más el color',
    sharpness: 'Nitidez',
    noise: 'Síntesis de grano',
    tuning: 'Optimizar para',
    auto: 'Automático',
    tileRows: 'Filas de mosaico (log2)',
    tileCols: 'Columnas de mosaico (log2)',
    discreteTone: 'Imagen de tonos planos',
    compressAlpha: 'Comprimir la transparencia',
    alphaFilter: 'Calidad del filtro de transparencia',
    autoFilter: 'Ajustar el filtro solo',
    filterStrength: 'Intensidad del filtro',
    strongFilter: 'Filtro fuerte',
    filterSharpness: 'Nitidez del filtro',
    passes: 'Pasadas',
    sns: 'Modelado espacial del ruido',
    preprocess: 'Preprocesado',
    none: 'Ninguno',
    segmentSmooth: 'Suavizado por segmentos',
    randomDither: 'Tramado pseudoaleatorio',
    segments: 'Segmentos',
    partitions: 'Particiones',
    exact: 'Conservar datos transparentes',
    errorDiffusion: 'Difusión de error',
    vary: 'Variable',
    half: 'Mitad',
    off: 'Desactivado',
    colorSpace: 'Espacio de color',
    randomMatrix: 'Matriz aleatoria',
  },

  batch: {
    title: 'Lote',
    images: (n: number) => (n === 1 ? '1 imagen' : `${n} imágenes`),
    list: 'Ver todas',
    listTitle: 'Imágenes',
    backToSettings: 'Ajustes',
    keepOriginal: 'Dejar la original si no mejora',
    optimize: (n: number) => (n === 1 ? 'Optimizar' : `Optimizar las ${n}`),
    again: 'Volver a optimizar',
    cancel: 'Cancelar',
    downloadZip: 'Descargar ZIP',
    zipping: 'Creando el ZIP…',
    working: (done: number, total: number) =>
      `Optimizando ${done} de ${total}…`,
    done: (done: number, total: number) => `${done} de ${total} listas`,
    stale: 'Has cambiado los ajustes. Vuelve a optimizar para aplicarlos.',
    pending: 'En cola',
    error: 'Error',
    same: 'Original',
    failed: (n: number) =>
      n === 1
        ? '1 imagen no se pudo procesar.'
        : `${n} imágenes no se pudieron procesar.`,
    batchError: 'Algo salió mal con el lote. Prueba otra vez.',
  },

  app: {
    opening: 'Abriendo tus fotos…',
    loading: 'Cargando…',
  },

  snack: {
    close: 'cerrar',
    undo: 'deshacer',
    reload: 'recargar',
    noImages: 'No hay imágenes en lo que has abierto.',
    skipped: (n: number) =>
      n === 1
        ? 'Se ha ignorado 1 archivo que no es una imagen.'
        : `Se han ignorado ${n} archivos que no son imágenes.`,
    zipError: 'No se pudo abrir el ZIP. Comprueba que no esté dañado.',
    loadError: 'No se pudo cargar la app. Recarga la página.',
    decodeError:
      'No se pudo abrir esta imagen. Formato no compatible o archivo dañado.',
    processError: 'No se pudo procesar la imagen. Prueba con otro formato.',
    clipboardDenied: 'Sin permiso para leer el portapapeles.',
    clipboardEmpty: 'No hay ninguna imagen en el portapapeles.',
    offline: 'Lista para usar sin conexión.',
    update: 'Hay una versión nueva.',
  },
};

export type Strings = typeof es;

const en: Strings = {
  meta: {
    title: 'zumo · Shrink your photos in bulk, without uploading them',
    description:
      'Compress and convert HEIC, JPG, PNG, WebP, AVIF and TIFF photos in your browser. Drop a ZIP with hundreds of images and download them all lighter, without uploading them anywhere.',
    ogAlt: 'The zumo icon next to the text: your photos, much lighter.',
    noJs: 'zumo needs JavaScript to work with your images.',
    reload: 'Reload',
  },

  nav: {
    privacy: 'Privacy',
    open: 'Open images',
  },

  header: {
    toDark: 'Dark mode',
    toLight: 'Light mode',
    install: 'Install the app',
    language: 'Español',
    languageLabel: 'Switch to Spanish',
    current: 'EN',
  },

  install: {
    title: 'Install zumo',
    text: 'It works like any other app, even offline.',
    ios: 'In Safari, tap Share and then “Add to Home Screen”.',
    other:
      'Open your browser menu and choose “Install zumo” or “Add to Home Screen”.',
    ok: 'Got it',
  },

  hero: {
    title: 'Your photos,<br>much lighter.',
    lead: 'Drop a ZIP or a pile of images. Pick the quality while comparing before and after, then download them all at once.',
    trust: ['Nothing is uploaded', 'Free, no account', 'iPhone photos too'],
  },

  drop: {
    title: 'Drop your photos here',
    titleTouch: 'Choose your photos',
    subtitle: 'Or a .zip, folders and all.',
    choose: 'Choose files',
    paste: 'Paste from clipboard',
    dragging: 'Drop to open',
  },

  info: {
    items: [
      {
        title: 'Batches in a ZIP',
        text: 'Hundreds of photos at once. The ZIP you download keeps your folders.',
      },
      {
        title: 'Nothing leaves your device',
        text: 'Everything runs in your browser. We never upload a single image.',
      },
      {
        title: 'iPhone photos',
        text: 'Open HEIC, TIFF, PNG or JPG and save them as JPEG, WebP or AVIF.',
      },
    ],
  },

  footer: {
    source: 'Source code',
    cookies: 'Cookies',
    legal:
      'zumo is based on Squoosh, by Google Chrome Labs (Apache 2.0 license).',
  },

  consent: {
    label: 'Privacy and analytics',
    text: 'We use anonymous analytics to know how many people use zumo. Your images never leave your device.',
    reject: 'Decline',
    accept: 'Accept',
  },

  privacy: {
    title: 'Privacy',
    updated: 'Updated on 25 October 2026',
    sections: [
      {
        title: 'Your images',
        text: 'zumo processes every image in your browser. They are never uploaded to a server, we never see them and we never store them. When you close the tab, they are gone.',
      },
      {
        title: 'Analytics',
        text: 'If you accept it, we use Google Analytics to count visits in aggregate (page views, country and device type) and how zumo is used: how many images you open, which format you pick and whether you download the result. We never send file names, sizes or the content of your photos. If you decline, it is not loaded.',
      },
      {
        title: 'What your browser keeps',
        text: 'We keep your last settings (format, quality and size), your language and theme, and your analytics choice, so we don’t ask every time. We also keep the app so it works offline. You can clear it from your browser settings.',
      },
      {
        title: 'Changing your mind',
        text: 'Tap “Cookies” at the bottom of the page to choose again.',
      },
    ],
    back: 'Back to zumo',
  },

  editor: {
    back: 'Home',
    prev: 'Previous image',
    next: 'Next image',
    of: 'of',
    original: 'Original',
    working: 'Processing…',
    format: 'Format',
    formatHints: {
      mozJPEG: 'Opens anywhere. The safe choice.',
      webP: 'Lighter than JPEG and supported by every browser.',
      avif: 'The lightest. Takes a little longer to compress.',
      oxiPNG: 'Lossless. For screenshots, logos and transparency.',
      jxl: 'Very efficient, but few apps open it yet.',
    } as { [type: string]: string },
    quality: 'Quality',
    formatSettings: (format: string) => `${format} settings`,
    advanced: 'Advanced settings',
    size: 'Size',
    maxSize: 'Maximum size',
    width: 'Width',
    height: 'Height',
    any: 'any',
    sizeHint: 'Shrinks without distorting. Never enlarges.',
    colors: 'Colors',
    reduceColors: 'Reduce colors',
    colorsHint: 'Useful for screenshots and graphics with few colors.',
    result: 'Result',
    lighter: 'lighter',
    heavier: 'heavier',
    from: 'of',
    download: 'Download',
    downloadThis: 'Download just this one',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    rotate: 'Rotate',
    background: 'Change background',
    smoothing: 'Show pixels',
    dropHere: 'Drop to open',
  },

  codec: {
    interlace: 'Interlaced',
    effort: 'Effort',
    type: 'Type',
    standard: 'Standard',
    colors: 'Colors',
    dithering: 'Dithering',
    lossless: 'Lossless',
    slightLoss: 'Slight loss',
    altLossy: 'Alternative lossy mode',
    autoEdge: 'Automatic edge filter',
    edgeFilter: 'Edge-preserving filter',
    decodeSpeed: 'Prioritise opening speed',
    noiseIso: 'Grain equivalent to ISO',
    progressive: 'Progressive loading',
    channels: 'Channels',
    grayscale: 'Grayscale',
    autoSubsample: 'Automatic chroma subsampling',
    subsampleBy: 'Subsample chroma',
    separateChroma: 'Separate chroma quality',
    chromaQuality: 'Chroma quality',
    baseline: 'Baseline JPEG (maximum compatibility)',
    huffman: 'Optimize Huffman table',
    smoothing: 'Smoothing',
    quantization: 'Quantization',
    flat: 'Flat',
    trellisMultipass: 'Trellis multipass',
    zeroBlocks: 'Optimize zero blocks',
    trellisTable: 'Optimize after trellis',
    trellisPasses: 'Trellis passes',
    subsample: 'Chroma subsampling',
    sharpYuv: 'Sharp chroma downsampling',
    separateAlpha: 'Separate transparency quality',
    alphaQuality: 'Transparency quality',
    chromaDeltaQ: 'Compress color more',
    sharpness: 'Sharpness',
    noise: 'Grain synthesis',
    tuning: 'Tune for',
    auto: 'Automatic',
    tileRows: 'Tile rows (log2)',
    tileCols: 'Tile columns (log2)',
    discreteTone: 'Flat-tone image',
    compressAlpha: 'Compress transparency',
    alphaFilter: 'Transparency filter quality',
    autoFilter: 'Adjust the filter automatically',
    filterStrength: 'Filter strength',
    strongFilter: 'Strong filter',
    filterSharpness: 'Filter sharpness',
    passes: 'Passes',
    sns: 'Spatial noise shaping',
    preprocess: 'Preprocessing',
    none: 'None',
    segmentSmooth: 'Segment smoothing',
    randomDither: 'Pseudo-random dithering',
    segments: 'Segments',
    partitions: 'Partitions',
    exact: 'Keep transparent data',
    errorDiffusion: 'Error diffusion',
    vary: 'Variable',
    half: 'Half',
    off: 'Off',
    colorSpace: 'Color space',
    randomMatrix: 'Random matrix',
  },

  batch: {
    title: 'Batch',
    images: (n: number) => (n === 1 ? '1 image' : `${n} images`),
    list: 'See all',
    listTitle: 'Images',
    backToSettings: 'Settings',
    keepOriginal: 'Keep the original if it doesn’t improve',
    optimize: (n: number) => (n === 1 ? 'Optimize' : `Optimize all ${n}`),
    again: 'Optimize again',
    cancel: 'Cancel',
    downloadZip: 'Download ZIP',
    zipping: 'Creating the ZIP…',
    working: (done: number, total: number) => `Optimizing ${done} of ${total}…`,
    done: (done: number, total: number) => `${done} of ${total} done`,
    stale: 'You changed the settings. Optimize again to apply them.',
    pending: 'Queued',
    error: 'Error',
    same: 'Original',
    failed: (n: number) =>
      n === 1
        ? '1 image couldn’t be processed.'
        : `${n} images couldn’t be processed.`,
    batchError: 'Something went wrong with the batch. Please try again.',
  },

  app: {
    opening: 'Opening your photos…',
    loading: 'Loading…',
  },

  snack: {
    close: 'close',
    undo: 'undo',
    reload: 'reload',
    noImages: 'There are no images in what you opened.',
    skipped: (n: number) =>
      n === 1
        ? '1 file that isn’t an image was skipped.'
        : `${n} files that aren’t images were skipped.`,
    zipError: 'The ZIP couldn’t be opened. Check that it isn’t damaged.',
    loadError: 'The app couldn’t load. Please reload the page.',
    decodeError:
      'This image couldn’t be opened. Unsupported format or damaged file.',
    processError: 'The image couldn’t be processed. Try another format.',
    clipboardDenied: 'No permission to read the clipboard.',
    clipboardEmpty: 'There’s no image in the clipboard.',
    offline: 'Ready to work offline.',
    update: 'A new version is available.',
  },
};

export type Lang = 'es' | 'en';

export const dictionaries: { [lang in Lang]: Strings } = { es, en };
const langKey = 'zumo:lang';

function initialLang(): Lang {
  // The prerendered HTML is Spanish
  if (__PRERENDER__) return 'es';
  try {
    const stored = localStorage.getItem(langKey);
    if (stored === 'es' || stored === 'en') return stored;
  } catch {}
  return /^es\b/i.test(navigator.language) ? 'es' : 'en';
}

/** Live bindings: importers always see the current language. */
export let lang: Lang = initialLang();
export let S: Strings = dictionaries[lang];

export function setLang(next: Lang): void {
  if (next === lang) return;
  lang = next;
  S = dictionaries[next];
  try {
    localStorage.setItem(langKey, next);
  } catch {}
  document.documentElement.lang = next;
  if (location.pathname === '/' || location.pathname === '/editor') {
    document.title = S.meta.title;
  }
  window.dispatchEvent(new Event('zumo:lang'));
}
