/** Light/dark: follows the system until the person picks one. */
export type Theme = 'light' | 'dark';

const themeKey = 'zumo:theme';
const darkQuery = () => matchMedia('(prefers-color-scheme: dark)');
const backgrounds: { [theme in Theme]: string } = {
  light: '#f2f2f7',
  dark: '#000000',
};

export function currentTheme(): Theme {
  const forced = document.documentElement.dataset.theme;
  if (forced === 'light' || forced === 'dark') return forced;
  return darkQuery().matches ? 'dark' : 'light';
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  // The browser UI (address bar on mobile) follows the page
  Array.from(document.querySelectorAll('meta[name="theme-color"]')).forEach(
    (meta) => meta.setAttribute('content', backgrounds[theme]),
  );
  try {
    localStorage.setItem(themeKey, theme);
  } catch {}
  window.dispatchEvent(new Event('zumo:theme'));
}

/**
 * Switch theme. With View Transitions, the new theme grows as a circle from
 * `origin` (the button); otherwise it changes at once.
 */
export function setTheme(theme: Theme, origin?: { x: number; y: number }) {
  const doc = document as any;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!doc.startViewTransition || reduced || !origin) {
    apply(theme);
    return;
  }

  const { x, y } = origin;
  const radius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y),
  );
  const transition = doc.startViewTransition(() => apply(theme));
  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${radius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 560,
        easing: 'cubic-bezier(.32, .72, 0, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    );
  });
}

/** Inline in <head> so the stored theme and language apply before paint. */
export const earlyPreferencesScript =
  "try{var d=document.documentElement,t=localStorage.getItem('zumo:theme');" +
  "if(t==='light'||t==='dark'){d.dataset.theme=t;" +
  "document.querySelectorAll('meta[name=\"theme-color\"]').forEach(function(m){m.content=t==='dark'?'#000000':'#f2f2f7'})}" +
  "var l=localStorage.getItem('zumo:lang');" +
  "d.lang=l==='es'||l==='en'?l:/^es\\b/i.test(navigator.language)?'es':'en'}catch(e){}";
