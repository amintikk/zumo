import { h, FunctionalComponent } from 'preact';

import baseCss from 'css:./base.css';
import initialCss from 'initial-css:';
import { allSrc } from 'client-bundle:client/initial-app';
import { escapeStyleScriptContent } from 'static-build/utils';
import Intro from 'shared/prerendered-app/Intro';
import snackbarCss from 'css:../../../shared/custom-els/snack-bar/styles.css';
import * as snackbarStyle from '../../../shared/custom-els/snack-bar/styles.css';
import Head from '../head';
import { S, lang } from 'shared/strings';
import { siteOrigin } from 'static-build/utils';

/** Structured data so search engines know this is a free web app */
const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'zumo',
  url: `${siteOrigin}/`,
  description: S.meta.description,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any',
  browserRequirements: 'Requires JavaScript and WebAssembly',
  inLanguage: lang,
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  featureList: S.features.items.map((item) => item.title),
});

const Index: FunctionalComponent = () => (
  <html lang={lang} class="no-js">
    <Head
      title={S.meta.title}
      description={S.meta.description}
      path="/"
      css={[baseCss, initialCss]}
    />
    <body>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: escapeStyleScriptContent(jsonLd),
        }}
      />
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
              <div class={snackbarStyle.text}>{S.meta.noJs}</div>
              <a class={snackbarStyle.button} href="/">
                {S.meta.reload}
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
