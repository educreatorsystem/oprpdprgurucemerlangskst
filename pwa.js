/* Install and update the app without interrupting an unfinished report. */
let installPrompt = null;
let waitingWorker = null;
const installButton = document.getElementById('installAppButton');
const offlineNotice = document.getElementById('offlineNotice');
function showConnectionStatus() { offlineNotice.hidden = navigator.onLine; }
window.addEventListener('online', showConnectionStatus);
window.addEventListener('offline', showConnectionStatus);
showConnectionStatus();
function refreshInstallButton() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  installButton.hidden = standalone;
}
refreshInstallButton();
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); installPrompt = event; refreshInstallButton();
});
window.addEventListener('appinstalled', () => { installPrompt = null; installButton.hidden = true; });
async function installOPRApp() {
  if (!installPrompt) { document.getElementById('install-help').showModal(); return; }
  const prompt = installPrompt; installPrompt = null;
  await prompt.prompt(); await prompt.userChoice;
}
function showUpdate(worker) {
  waitingWorker = worker; document.getElementById('updateNotice').hidden = false;
}
let reloadForUpdate = false;
document.getElementById('updateAppButton').addEventListener('click', () => {
  if (!waitingWorker) return;
  if (!confirm('Pastikan OPR telah disimpan. Kemas kini akan memuat semula halaman. Teruskan?')) return;
  reloadForUpdate = true; waitingWorker.postMessage({type: 'SKIP_WAITING'});
});
if ('serviceWorker' in navigator && ['https:', 'http:'].includes(location.protocol)) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', {scope: './', updateViaCache: 'none'});
      if (registration.waiting) showUpdate(registration.waiting);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate(worker);
        });
      });
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloadForUpdate) location.reload();
      });
    } catch (error) { console.warn('PWA belum tersedia:', error); }
  });
}
