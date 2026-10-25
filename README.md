<img src="src/shared/prerendered-app/Intro/imgs/zumo-mark.svg" width="64" height="64" alt="">

# zumo

**Optimiza imágenes una a una o en lote desde un ZIP, sin salir del navegador.**

https://zumo.aminox.dev

Todo el trabajo (descomprimir el ZIP, decodificar, redimensionar, comprimir y crear el ZIP de
salida) ocurre en el navegador con WebAssembly y Web Workers. Ninguna imagen se sube a ningún
servidor: el servidor solo entrega archivos estáticos.

## Qué hace

- **Lotes:** suelta un `.zip` (o selecciona varias imágenes) y se abre el editor con una de
  ellas como muestra. Ajusta formato y calidad mirando el antes y el después, pasa de una
  imagen a otra con las flechas y pulsa **Optimizar**: se procesan todas con los mismos ajustes del panel y se descarga un
  ZIP con la misma estructura de carpetas.
  - _Tamaño máximo_ (ancho × alto): cada imagen se reduce proporcionalmente hasta caber; nunca
    se amplía. La vista previa usa exactamente lo mismo que el lote.
  - _Conservar el original si ya pesa menos_: si al recodificar en el mismo formato el archivo
    crece, se guarda el original.
  - Se ignoran los archivos que no son imágenes y la basura de los compresores
    (`__MACOSX/`, archivos ocultos, `Thumbs.db`).
  - Se procesan entre 1 y 4 imágenes a la vez, según los núcleos y la memoria del dispositivo.
- **Formatos de entrada:** JPG, PNG, WebP, AVIF, JPEG XL, GIF, BMP, SVG, QOI, WebP2 y además
  **HEIC/HEIF** (fotos del iPhone) y **TIFF**. Safari abre HEIC por sí mismo; en el resto de
  navegadores se usa libheif en WebAssembly, que solo se descarga (~2 MB) la primera vez que
  se abre un HEIC. TIFF usa UTIF (~100 KB), también bajo demanda.
- **Una imagen:** el editor de comparación de Squoosh, con MozJPEG, WebP, AVIF, JPEG XL,
  OxiPNG, QOI, WebP2, redimensionado y reducción de paleta.

## Desarrollo

```sh
npm ci --ignore-scripts
npm run dev      # http://localhost:5000
npm run build    # genera build/
```

Los códecs ya vienen compilados a WASM en `codecs/`; no hace falta Emscripten ni Rust salvo que
se quiera recompilarlos.

### Código propio

| Ruta                                       | Qué                                                                        |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| `src/client/lazy-app/batch/expand.ts`      | Lee ZIPs y archivos sueltos y devuelve la lista de imágenes                |
| `src/client/lazy-app/batch/process.ts`     | Procesa el lote en paralelo y crea el ZIP de salida                        |
| `src/client/lazy-app/Compress/Sidebar/`    | Panel único del editor (formato, tamaño, resultado y lote)                 |
| `src/client/lazy-app/Compress/pipeline.ts` | Decodificar / procesar / comprimir (extraído del editor para reutilizarlo) |
| `src/features/decoders/heic/`, `tiff/`     | Decodificadores de HEIC (libheif) y TIFF (UTIF), cargados bajo demanda     |
| `src/shared/prerendered-app/Intro/`        | Portada                                                                    |

## Despliegue

```sh
./deploy.sh
```

Compila y copia `build/` a `~/docker/zumo/data/html`, que sirve el contenedor `zumo` (nginx) a
través de Nginx Proxy Manager. El nginx envía `Cross-Origin-Opener-Policy` y
`Cross-Origin-Embedder-Policy`, necesarias para los códecs multihilo. Tras desplegar, conviene
purgar la caché de Cloudflare de `zumo.aminox.dev`.

## Licencia

Apache 2.0. zumo es un fork modificado de [Squoosh](https://github.com/GoogleChromeLabs/squoosh)
(© Google): se han añadido el procesado por lotes con ZIP, una portada y una identidad nuevas, la
interfaz en español y la analítica propia. Ver [LICENSE](LICENSE).

Incluye [libheif](https://github.com/strukturag/libheif) vía
[libheif-js](https://github.com/catdad-experiments/libheif-js) (LGPL-3.0), que se sirve como un
archivo aparte (`libheif-bundle-*.js`) y puede sustituirse por otra versión, y
[UTIF](https://github.com/photopea/UTIF.js) (MIT).
