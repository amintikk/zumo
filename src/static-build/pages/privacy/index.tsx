import { h, FunctionalComponent } from 'preact';
import docCss from 'css:./doc.css';
import * as style from './doc.css';
import initialCss from 'initial-css:';
import logo from 'url:shared/prerendered-app/Intro/imgs/zumo-icon.svg';
import Head from '../head';
import { S, lang } from 'shared/strings';

const Privacy: FunctionalComponent = () => (
  <html lang={lang}>
    <Head
      title={`${S.privacy.title} · zumo`}
      description={S.privacy.sections[0].text}
      path="/privacidad/"
      css={[initialCss, docCss]}
    />
    <body class={style.body}>
      <div class={style.ambient} aria-hidden="true">
        <i class="b1" />
        <i class="b2" />
      </div>
      <header class={style.wrap}>
        <a class={style.logo} href="/">
          <img src={logo} width="28" height="28" alt="" />
          zumo
        </a>
      </header>
      <main class={`${style.wrap} ${style.doc}`}>
        <h1 class={style.h1}>{S.privacy.title}</h1>
        <p class={style.updated}>{S.privacy.updated}</p>
        {S.privacy.sections.map((section) => (
          <section class={style.section}>
            <h2 class={style.h2}>{section.title}</h2>
            <p>{section.text}</p>
          </section>
        ))}
        <a class={`btn btn-tinted ${style.back}`} href="/">
          {S.privacy.back}
        </a>
      </main>
    </body>
  </html>
);

export default Privacy;
