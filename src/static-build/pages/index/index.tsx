/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { h, FunctionalComponent } from 'preact';

import baseCss from 'css:./base.css';
import initialCss from 'initial-css:';
import { allSrc } from 'client-bundle:client/initial-app';
import favicon from 'url:static-build/assets/favicon.png';
import touchIcon from 'url:static-build/assets/icon-large-maskable.png';
import ogImage from 'url:static-build/assets/og.png';
import { escapeStyleScriptContent, siteOrigin } from 'static-build/utils';
import Intro from 'shared/prerendered-app/Intro';
import snackbarCss from 'css:../../../shared/custom-els/snack-bar/styles.css';
import * as snackbarStyle from '../../../shared/custom-els/snack-bar/styles.css';

interface Props {}

const gaMeasurementId = 'G-X02W5L49KB';
const gaSnippet = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaMeasurementId}');`;

const title = 'zumo · Optimiza imágenes en lote desde un ZIP';
const description =
  'Comprime y convierte HEIC, JPG, PNG, WebP, AVIF, TIFF y JPEG XL en tu navegador. Sube un ZIP con cientos de imágenes y descárgalas todas optimizadas, sin subirlas a ningún servidor.';

const Index: FunctionalComponent<Props> = () => (
  <html lang="es">
    <head>
      <meta charSet="utf-8" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="og:title" content={title} />
      <meta property="og:site_name" content="zumo" />
      <meta property="og:locale" content="es_ES" />
      <meta property="og:url" content={siteOrigin + '/'} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={`${siteOrigin}${ogImage}`} />
      <meta
        property="og:image:secure_url"
        content={`${siteOrigin}${ogImage}`}
      />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta
        property="og:image:alt"
        content="Rodaja de naranja junto al texto: zumo, exprime tus imágenes."
      />
      <meta property="og:description" content={description} />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
      />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <link rel="icon" type="image/png" href={favicon} />
      <link rel="apple-touch-icon" href={touchIcon} />
      <meta name="theme-color" content="#ff7a1a" />
      <link rel="manifest" href="/manifest.json" />
      <script
        async
        crossOrigin="anonymous"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: escapeStyleScriptContent(gaSnippet),
        }}
      />
      <link rel="canonical" href={siteOrigin + '/'} />
      <style
        dangerouslySetInnerHTML={{ __html: escapeStyleScriptContent(baseCss) }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: escapeStyleScriptContent(initialCss),
        }}
      />
    </head>
    <body>
      <div id="app">
        <Intro />
        <noscript>
          <style
            dangerouslySetInnerHTML={{
              __html: escapeStyleScriptContent(snackbarCss),
            }}
          />
          <snack-bar>
            <div
              class={snackbarStyle.snackbar}
              aria-live="assertive"
              aria-atomic="true"
              aria-hidden="false"
            >
              <div class={snackbarStyle.text}>
                Esta web necesita JavaScript, y está desactivado en tu
                navegador.
              </div>
              <a class={snackbarStyle.button} href="/">
                recargar
              </a>
            </div>
          </snack-bar>
        </noscript>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: escapeStyleScriptContent(allSrc),
        }}
      />
    </body>
  </html>
);

export default Index;
