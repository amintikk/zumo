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
import { h } from 'preact';

import { renderPage, writeFiles, siteOrigin } from './utils';
import IndexPage from './pages/index';
import PrivacyPage from './pages/privacy';
import { S } from 'shared/strings';
import * as iconLargeMaskable from 'img-url:static-build/assets/icon-large-maskable.png';
import * as iconLarge from 'img-url:static-build/assets/icon-large.png';
import dedent from 'dedent';
import { lookup as lookupMime } from 'mime-types';

interface Dimensions {
  width: number;
  height: number;
}

const manifestSize = ({ width, height }: Dimensions) => `${width}x${height}`;

interface Output {
  [outputPath: string]: string;
}

const buildDate = new Date().toISOString().slice(0, 10);

const toOutput: Output = {
  'index.html': renderPage(<IndexPage />),
  'privacidad/index.html': renderPage(<PrivacyPage />),
  'manifest.json': JSON.stringify({
    name: 'zumo · Optimizador de imágenes',
    short_name: 'zumo',
    start_url: '/?utm_medium=PWA&utm_source=launcher',
    display: 'standalone',
    orientation: 'any',
    background_color: '#f2f2f7',
    theme_color: '#f2f2f7',
    icons: [
      {
        src: iconLarge.default,
        type: lookupMime(iconLarge.default),
        sizes: manifestSize(iconLarge),
      },
      {
        src: iconLargeMaskable.default,
        type: lookupMime(iconLargeMaskable.default),
        sizes: manifestSize(iconLargeMaskable),
        purpose: 'maskable',
      },
    ],
    description:
      'Optimiza imágenes una a una o en lote desde un ZIP, directamente en tu navegador.',
    lang: 'es',
    categories: ['photo', 'productivity', 'utilities'],
    share_target: {
      action: '/?utm_medium=PWA&utm_source=share-target&share-target',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: {
        files: [
          {
            name: 'file',
            accept: ['image/*'],
          },
        ],
      },
    },
  }),
  // IndexNow ownership key (public by design)
  '50bf579a186c64027df6fe14832d5259.txt': '50bf579a186c64027df6fe14832d5259',
  'robots.txt': dedent`
    User-agent: *
    Allow: /

    Sitemap: ${siteOrigin}/sitemap.xml
  `,
  'sitemap.xml': dedent`
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${siteOrigin}/</loc>
        <lastmod>${buildDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>${siteOrigin}/privacidad/</loc>
        <lastmod>${buildDate}</lastmod>
        <changefreq>yearly</changefreq>
        <priority>0.3</priority>
      </url>
    </urlset>
  `,
  _headers: dedent`
    /*
      Cache-Control: no-cache

    # I don't think Rollup is cache-busting files correctly.
    #/c/*
    #  Cache-Control: max-age=31536000

    # COOP+COEP for WebAssembly threads.
    /*
      Cross-Origin-Embedder-Policy: require-corp
      Cross-Origin-Opener-Policy: same-origin
  `,
};

writeFiles(toOutput);
