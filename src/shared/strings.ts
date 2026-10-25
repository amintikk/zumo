/**
 * Every user-facing string, one dictionary per language (same keys).
 * Only Spanish is shipped for now; add another language by copying `es`.
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
    how: 'Cómo funciona',
    features: 'Funciones',
    formats: 'Formatos',
    privacy: 'Privacidad',
    open: 'Abrir imágenes',
  },

  hero: {
    title: 'Tus fotos, mucho<br>más ligeras.',
    lead: 'Suelta un ZIP o un montón de imágenes. Elige la calidad viendo el antes y el después, y descárgalas todas de una vez.',
    cta: 'Elegir imágenes',
    secondary: 'Cómo funciona',
    trust: ['Nada se sube', 'Gratis, sin cuenta', 'Fotos del iPhone incluidas'],
  },

  drop: {
    title: 'Suelta aquí tus fotos',
    titleTouch: 'Elige tus fotos',
    subtitle: 'O un .zip, con carpetas y todo.',
    choose: 'Elegir archivos',
    paste: 'Pegar del portapapeles',
    example: 'Resultados reales · JPEG, calidad 75, máximo 1200 px',
    dragging: 'Suelta para abrir',
  },

  how: {
    kicker: 'Cómo funciona',
    title: 'Tres pasos. Nada que instalar.',
    steps: [
      {
        title: 'Suelta tus fotos',
        text: 'Un ZIP, una carpeta comprimida o varias imágenes a la vez.',
      },
      {
        title: 'Ajusta mirando',
        text: 'Mueve la calidad y compara con zoom. Pasa de una foto a otra con las flechas.',
      },
      {
        title: 'Descarga el lote',
        text: 'Un toque y te llevas un ZIP con todo, en las mismas carpetas.',
      },
    ],
  },

  features: {
    kicker: 'Funciones',
    title: 'Hecho para muchas fotos a la vez.',
    shotAlt:
      'El editor de zumo en el móvil con una foto del iPhone: arriba el original, abajo el resultado en JPEG y los ajustes debajo.',
    items: [
      {
        title: 'Lotes en un ZIP',
        text: 'Cientos de fotos de una vez. El ZIP de salida mantiene tus carpetas.',
      },
      {
        title: 'Nada sale de tu equipo',
        text: 'Todo se procesa en tu navegador. No subimos ni una sola imagen.',
      },
      {
        title: 'Antes y después',
        text: 'Compara con zoom y elige la calidad mirando, no a ciegas.',
      },
      {
        title: 'Fotos del iPhone',
        text: 'Abre HEIC y TIFF y pásalos a JPEG, WebP o AVIF.',
      },
      {
        title: 'Tamaño máximo',
        text: 'Limita a 1920 px o a lo que quieras, sin deformar nada.',
      },
      {
        title: 'También sin conexión',
        text: 'Instálala como app y úsala aunque no tengas internet.',
      },
    ],
  },

  formats: {
    kicker: 'Formatos',
    title: 'Entra lo que tengas.<br>Sale lo que necesites.',
    inTitle: 'Abre',
    inText: 'Lo que salga de tu móvil, tu cámara o tu escáner.',
    outTitle: 'Guarda en',
    outText: 'Elige según dónde vayan a acabar las fotos.',
  },

  final: {
    title: '¿Listo? Suelta tus fotos.',
    text: 'Sin registro y sin esperas. Funciona en el móvil y en el ordenador.',
  },

  footer: {
    source: 'Código fuente',
    cookies: 'Cookies',
    legal:
      'zumo es un proyecto basado en Squoosh, de Google Chrome Labs (licencia Apache 2.0).',
  },

  consent: {
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
        text: 'Si la aceptas, usamos Google Analytics para contar visitas de forma agregada: páginas vistas, país y tipo de dispositivo. No enviamos nombres de archivo, tamaños ni nada de tus fotos. Si la rechazas, no se carga.',
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

const dictionaries: { [lang: string]: Strings } = { es };

export const lang = 'es';
export const S: Strings = dictionaries[lang];
