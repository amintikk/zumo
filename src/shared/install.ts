/**
 * "Install app": keeps the browser's install prompt for the whole page
 * life, so it survives going to the editor and back. Chrome, Edge and
 * Android offer it; Safari and Firefox don't, so there's nothing to show.
 */
let deferred: BeforeInstallPromptEvent | undefined;

const changed = () => window.dispatchEvent(new Event('zumo:install'));

if (!__PRERENDER__) {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Our own button replaces the browser's mini-infobar
    event.preventDefault();
    deferred = event;
    changed();
  });
  window.addEventListener('appinstalled', () => {
    deferred = undefined;
    changed();
  });
}

export function canInstall(): boolean {
  return !!deferred;
}

/** Opens the browser's own install dialog. A prompt can only be used once. */
export async function promptInstall(): Promise<void> {
  const event = deferred;
  if (!event) return;
  deferred = undefined;
  changed();
  await event.prompt();
}
