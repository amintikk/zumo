import { h, FunctionalComponent } from 'preact';
import favicon from 'url:static-build/assets/favicon.png';
import touchIcon from 'url:static-build/assets/icon-large-maskable.png';
import ogImage from 'url:static-build/assets/og.png';
import interFont from 'url:static-build/assets/inter.woff2';
import { escapeStyleScriptContent, siteOrigin } from 'static-build/utils';
import { S, lang } from 'shared/strings';

interface Props {
  title: string;
  description: string;
  path: string;
  css: string[];
}

const fontFace = `@font-face{font-family:'Inter Variable';src:url(${interFont}) format('woff2');font-weight:100 900;font-display:swap}`;

/** Everything in <head> that every page shares. */
const Head: FunctionalComponent<Props> = ({
  title,
  description,
  path,
  css,
}) => {
  const url = `${siteOrigin}${path}`;
  return (
    <head>
      <meta charSet="utf-8" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, viewport-fit=cover"
      />
      <link rel="canonical" href={url} />
      <link rel="alternate" hrefLang={lang} href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />
      <meta
        name="theme-color"
        content="#f2f2f7"
        media="(prefers-color-scheme: light)"
      />
      <meta
        name="theme-color"
        content="#000000"
        media="(prefers-color-scheme: dark)"
      />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="zumo" />
      <meta property="og:locale" content="es_ES" />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={`${siteOrigin}${ogImage}`} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={S.meta.ogAlt} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <link rel="icon" type="image/png" href={favicon} />
      <link rel="apple-touch-icon" href={touchIcon} />
      <link rel="manifest" href="/manifest.json" />
      <link
        rel="preload"
        href={interFont}
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <style dangerouslySetInnerHTML={{ __html: fontFace }} />
      {css.map((sheet) => (
        <style
          dangerouslySetInnerHTML={{ __html: escapeStyleScriptContent(sheet) }}
        />
      ))}
    </head>
  );
};

export default Head;
