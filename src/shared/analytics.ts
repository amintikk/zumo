/** Google Analytics, only loaded after the person accepts it. */
const measurementId = 'G-X02W5L49KB';
const consentKey = 'zumo:consent';

export type Consent = 'granted' | 'denied';

export function getConsent(): Consent | undefined {
  try {
    const value = localStorage.getItem(consentKey);
    return value === 'granted' || value === 'denied' ? value : undefined;
  } catch {
    return undefined;
  }
}

let loaded = false;

export function loadAnalytics(): void {
  if (loaded || getConsent() !== 'granted') return;
  loaded = true;
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () {
    w.dataLayer.push(arguments);
  };
  w.gtag('js', new Date());
  w.gtag('config', measurementId);

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

export function setConsent(consent: Consent): void {
  try {
    localStorage.setItem(consentKey, consent);
  } catch {}
  if (consent === 'granted') loadAnalytics();
  // Withdrawing consent takes full effect on the next visit
  window.dispatchEvent(new Event('zumo:consent'));
}

/** Ask to show the choice again (footer "Cookies" button) */
export function reopenConsent(): void {
  window.dispatchEvent(new Event('zumo:consent-open'));
}
