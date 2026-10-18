/* Admin-only batch printing. Reuse the existing report without changing its layout. */
const selectedBulkIds = new Set();
let bulkJob = null;
let bulkPreviewWindow = null;

function bulkAdminActive() {
  return !!adminSession && adminSession.expiresAt > Date.now();
}
function updateBulkUI() {
  const active = bulkAdminActive();
  const panel = document.getElementById('bulk-panel');
  panel.hidden = !active;
  const existing = new Set(savedRecordsList.map(record => record.id));
  for (const id of selectedBulkIds) if (!existing.has(id)) selectedBulkIds.delete(id);
  document.getElementById('bulk-count').textContent = selectedBulkIds.size + ' laporan dipilih • ' + filteredRecordsList.length + ' dalam tapisan';
  document.getElementById('bulk-generate').disabled = !active || !selectedBulkIds.size || !!bulkJob;
  document.getElementById('bulk-select').disabled = !!bulkJob || !filteredRecordsList.length;
  document.getElementById('bulk-clear').disabled = !!bulkJob || !selectedBulkIds.size;
  document.getElementById('bulk-cancel').hidden = !bulkJob;
  document.querySelectorAll('.bulk-checkbox').forEach(input => {
    input.checked = selectedBulkIds.has(input.value);
    input.disabled = !!bulkJob;
  });
}
function selectFilteredBulk() {
  if (!bulkAdminActive() || bulkJob) return;
  filteredRecordsList.forEach(record => selectedBulkIds.add(record.id));
  updateBulkUI();
}
function clearBulkSelection() {
  if (bulkJob) return;
  selectedBulkIds.clear(); updateBulkUI();
}
function appendBulkChoice(card, record) {
  if (!bulkAdminActive()) return;
  const label = document.createElement('label');
  label.className = 'bulk-choice';
  const input = document.createElement('input');
  input.type = 'checkbox'; input.className = 'bulk-checkbox'; input.value = record.id;
  input.checked = selectedBulkIds.has(record.id); input.disabled = !!bulkJob;
  input.addEventListener('change', () => {
    if (!bulkAdminActive() || bulkJob) { input.checked = selectedBulkIds.has(record.id); return; }
    if (input.checked) selectedBulkIds.add(record.id); else selectedBulkIds.delete(record.id);
    if (typeof playGameEffect === 'function') playGameEffect(input.checked ? 'coin' : 'pipe');
    updateBulkUI();
  });
  const text = document.createElement('span'); text.textContent = 'Pilih untuk OPR pukal';
  label.append(input, text); card.prepend(label);
}
function cancelBulkOPR(message = 'Penjanaan pukal dibatalkan.') {
  const job = bulkJob;
  if (job) { job.cancelled = true; job.controller.abort(); }
  if (bulkPreviewWindow && !bulkPreviewWindow.closed) bulkPreviewWindow.close();
  bulkPreviewWindow = null;
  document.getElementById('bulk-progress').textContent = message;
}
function resetBulkAdmin() {
  cancelBulkOPR(''); selectedBulkIds.clear();
}
function assertBulkSession(job) {
  if (job.cancelled || job.controller.signal.aborted) throw new Error('BULK_CANCELLED');
  if (!bulkAdminActive() || adminSession.token !== job.token) throw new Error('ADMIN_REQUIRED: Sila log masuk admin semula.');
  if (!job.popup || job.popup.closed) throw new Error('BULK_CANCELLED');
}
async function bulkApi(payload, job) {
  assertBulkSession(job);
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'},
    body: JSON.stringify({...payload, token: job.token}), redirect: 'follow', signal: job.controller.signal
  });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const result = await response.json();
  assertBulkSession(job);
  if (result.status !== 'success') throw new Error(result.message === 'Action tidak sah.'
    ? 'Gantikan Code.gs dengan versi pukal dan deploy New version terlebih dahulu.'
    : result.message || 'Rekod pukal tidak dapat diambil.');
  return result;
}
function fillBulkReport(record) {
  const clone = document.getElementById('opr-template').cloneNode(true);
  const fill = (id, value) => { clone.querySelector('#' + id).textContent = value || '-'; };
  fill('opr-out-guru', record.namaGuru); fill('opr-out-subjek', record.subjek);
  fill('opr-out-kelas', record.kelas); fill('opr-out-tajuk', record.tajuk);
  fill('opr-out-objektif', record.objektif);
  clone.querySelector('#opr-out-tajuk').style.whiteSpace = 'pre-wrap';
  const date = new Date(record.tarikh);
  fill('opr-out-tarikh', record.tarikh && !isNaN(date) ? date.toLocaleDateString('ms-MY', {day:'2-digit',month:'long',year:'numeric'}) : record.tarikh);
  fill('opr-out-timestamp', 'Tarikh Cetakan: ' + (record.timestamp || new Date().toLocaleString('ms-MY')));
  const photos = clone.querySelector('#opr-out-images'); photos.replaceChildren();
  for (let index = 0; index < 3; index++) {
    const box = document.createElement('div'); box.className = 'opr-photo';
    const data = record.images?.[index];
    if (data) {
      if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(data)) throw new Error('Format gambar OPR tidak sah.');
      const image = document.createElement('img'); image.src = data; image.alt = 'Gambar aktiviti ' + (index + 1);
      const caption = document.createElement('span'); caption.className = 'photo-caption'; caption.textContent = 'Foto ' + (index + 1);
      box.append(image, caption);
    } else { box.textContent = 'Tiada Gambar ' + (index + 1); }
    photos.appendChild(box);
  }
  clone.removeAttribute('id'); clone.classList.add('bulk-report'); clone.style.cssText = '';
  clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
  clone.querySelectorAll('*').forEach(element => {
    for (const attribute of [...element.attributes]) if (/^on/i.test(attribute.name)) element.removeAttribute(attribute.name);
  });
  return clone;
}
function setupBulkWindow(popup) {
  const styles = [...document.querySelectorAll('style')].map(style => style.textContent).join('\n');
  const base = escapeHTML(document.baseURI);
  popup.document.open();
  popup.document.write(`<!doctype html><html lang="ms"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${base}"><title>OPR Pukal — SK Sungai Tiram</title><link rel="stylesheet" href="./assets/fonts.css"><link rel="stylesheet" href="./assets/fontawesome.css"><style>${styles}</style><style>
  html,body{margin:0!important;padding:0!important;width:auto!important;height:auto!important;overflow:visible!important;background:#e2e8f0!important;font-family:Fredoka,sans-serif}
  .bulk-toolbar{position:sticky;top:0;z-index:5;padding:14px;background:#103e83;color:white;display:flex;align-items:center;gap:12px;flex-wrap:wrap;font:14px Fredoka,sans-serif}
  .bulk-toolbar button{padding:10px 16px;border:2px solid #172b53;border-radius:10px;background:#fcd116;color:#172b53;font:700 14px Fredoka,sans-serif;cursor:pointer}.bulk-toolbar button:disabled{opacity:.5;cursor:wait}
  .bulk-page{position:relative;box-sizing:border-box;width:210mm;height:297mm;margin:16px auto;background:white;overflow:hidden;break-inside:avoid;page-break-inside:avoid;}
  .bulk-report{position:absolute!important;top:10mm!important;left:15mm!important;width:180mm!important;min-height:0!important;height:auto!important;max-height:none!important;margin:0!important;padding:0!important;box-shadow:none!important;border:0!important;transform-origin:top left!important;transform:scale(var(--bulk-scale,1))!important;}
  .bulk-report .opr-photo{height:65mm!important}.bulk-report .opr-photo-row{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important}
  .bulk-report,.bulk-report *{overflow-wrap:anywhere}.bulk-report .whitespace-pre-wrap{white-space:pre-wrap}.bulk-page h1,.bulk-page h2,.bulk-page h3{font-family:Fredoka,sans-serif!important}
  @media print{@page{size:A4 portrait;margin:0}.bulk-toolbar{display:none!important}html,body{background:white!important}.bulk-page{margin:0!important;break-after:page;page-break-after:always}.bulk-page:last-child{break-after:auto;page-break-after:auto}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><div class="bulk-toolbar"><strong id="bulk-window-status">Sedang menyediakan laporan...</strong><button type="button" id="bulk-window-print" disabled>Cetak / Simpan PDF</button><button type="button" id="bulk-window-close">Tutup</button></div><div id="bulk-pages"></div></body></html>`);
  popup.document.close();
  popup.document.getElementById('bulk-window-close').addEventListener('click', () => {
    if (typeof playGameEffect === 'function') playGameEffect('pipe');
    if (bulkJob?.popup === popup) cancelBulkOPR(); else popup.close();
  });
}
async function prepareBulkPages(job) {
  const doc = job.popup.document;
  if (doc.fonts) await doc.fonts.ready;
  await Promise.all([...doc.querySelectorAll('img')].map(image => image.decode()));
  assertBulkSession(job);
  const availableHeight = (277 * 96 / 25.4) - 4;
  doc.querySelectorAll('.bulk-report').forEach(report => {
    report.style.setProperty('--bulk-scale', '1');
    const scale = Math.min(1, availableHeight / Math.max(report.scrollHeight, report.getBoundingClientRect().height, 1));
    report.style.setProperty('--bulk-scale', String(scale));
  });
}
async function generateBulkOPR() {
  if (!bulkAdminActive()) { clearAdmin(); alert('Sila log masuk admin untuk menjana OPR pukal.'); return; }
  if (bulkJob || !selectedBulkIds.size) return;
  if (!navigator.onLine) { alert('Sambungkan internet untuk menjana OPR pukal.'); return; }
  const ids = savedRecordsList.filter(record => selectedBulkIds.has(record.id)).map(record => record.id);
  if (!ids.length) return;
  const popup = window.open('', '_blank');
  if (!popup) { alert('Benarkan popup bagi laman ini untuk menjana OPR pukal.'); return; }
  if (bulkPreviewWindow && !bulkPreviewWindow.closed) bulkPreviewWindow.close();
  bulkPreviewWindow = popup;
  const job = {token:adminSession.token, popup, cancelled:false, controller:new AbortController()};
  bulkJob = job; updateBulkUI();
  const progress = document.getElementById('bulk-progress');
  try {
    setupBulkWindow(popup);
    for (let offset = 0; offset < ids.length; offset += 3) {
      assertBulkSession(job);
      progress.textContent = 'Mengambil laporan ' + (offset + 1) + '–' + Math.min(offset + 3, ids.length) + ' daripada ' + ids.length + '...';
      popup.document.getElementById('bulk-window-status').textContent = progress.textContent;
      const wanted = ids.slice(offset, offset + 3);
      const result = await bulkApi({action:'getBulkRecords', ids:wanted}, job);
      if (!Array.isArray(result.records) || result.records.length !== wanted.length || result.records.some((record,index) => record.id !== wanted[index])) throw new Error('Senarai laporan pukal tidak lengkap. Tiada PDF dijana.');
      for (const record of result.records) {
        const page = popup.document.createElement('section'); page.className = 'bulk-page';
        page.appendChild(popup.document.importNode(fillBulkReport(record), true));
        popup.document.getElementById('bulk-pages').appendChild(page);
      }
    }
    await prepareBulkPages(job);
    await bulkApi({action:'verifyAdmin'}, job);
    assertBulkSession(job);
    const ready = ids.length + ' OPR sedia • satu laporan setiap halaman A4.';
    progress.textContent = ready;
    popup.document.getElementById('bulk-window-status').textContent = ready + ' Pilih Save as PDF dalam dialog cetak.';
    popup.document.title = 'OPR Pukal SKST — ' + ids.length + ' laporan';
    const printButton = popup.document.getElementById('bulk-window-print');
    printButton.disabled = false;
    printButton.addEventListener('click', async () => {
      if (typeof playGameEffect === 'function') playGameEffect('powerup');
      printButton.disabled = true;
      try {
        await bulkApi({action:'verifyAdmin'}, job);
        await prepareBulkPages(job); assertBulkSession(job);
        popup.focus(); popup.print();
      } catch (error) {
        if (error.message.includes('ADMIN_REQUIRED')) clearAdmin();
        else { if (!popup.closed) popup.close(); alert('Cetakan pukal dibatalkan: ' + error.message); }
      } finally { if (!popup.closed) printButton.disabled = false; }
    });
    popup.focus();
    // The explicit button keeps printing reliable after asynchronous image loading.
    if (typeof playGameEffect === 'function') playGameEffect('complete');
  } catch (error) {
    if (!popup.closed) popup.close();
    if (error.message.includes('ADMIN_REQUIRED')) { clearAdmin(); document.getElementById('records-status').textContent = 'Sesi admin tamat. Log masuk semula untuk menjana OPR pukal.'; alert('Sesi admin tamat. Log masuk semula untuk menjana OPR pukal.'); }
    else if (error.name === 'AbortError' || error.message === 'BULK_CANCELLED') progress.textContent = 'Penjanaan pukal dibatalkan. Tiada laporan separa dicetak.';
    else { progress.textContent = 'OPR pukal belum dijana: ' + error.message; alert(progress.textContent); }
  } finally { if (bulkJob === job) bulkJob = null; updateBulkUI(); }
}
window.addEventListener('beforeunload', () => { if (bulkPreviewWindow && !bulkPreviewWindow.closed) bulkPreviewWindow.close(); });
