/* Admin-only batch printing. Reuse the existing report without changing its layout. */
const selectedBulkIds = new Set();
let bulkJob = null;


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
  if (window.OPRPDF) OPRPDF.clearDownload('bulk-download');
  document.getElementById('bulk-progress').textContent = message;
}
function resetBulkAdmin() {
  cancelBulkOPR(''); selectedBulkIds.clear();
}
function assertBulkSession(job) {
  if (job.cancelled || job.controller.signal.aborted) throw new Error('BULK_CANCELLED');
  if (!bulkAdminActive() || adminSession.token !== job.token) throw new Error('ADMIN_REQUIRED: Sila log masuk admin semula.');

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
async function generateBulkOPR() {
  if (!bulkAdminActive()) { clearAdmin(); alert('Sila log masuk admin untuk menjana OPR pukal.'); return; }
  if (bulkJob || !selectedBulkIds.size) return;
  if (!navigator.onLine) { alert('Sambungkan internet untuk menjana OPR pukal.'); return; }
  const ids = savedRecordsList.filter(record => selectedBulkIds.has(record.id)).map(record => record.id);
  if (!ids.length) return;
  const job = {token:adminSession.token, cancelled:false, controller:new AbortController()};
  bulkJob = job; updateBulkUI();
  const progress = document.getElementById('bulk-progress');
  try {
    OPRPDF.clearDownload('bulk-download');
    progress.textContent = 'Menyediakan penjana PDF...';
    const {pdf,assets} = await OPRPDF.newBrowserDocument();
    assertBulkSession(job);
    let generated = 0;
    for (let offset = 0; offset < ids.length; offset += 3) {
      assertBulkSession(job);
      progress.textContent = 'Mengambil laporan ' + (offset + 1) + '–' + Math.min(offset + 3, ids.length) + ' daripada ' + ids.length + '...';
      const wanted = ids.slice(offset, offset + 3);
      const result = await bulkApi({action:'getBulkRecords', ids:wanted}, job);
      if (!Array.isArray(result.records) || result.records.length !== wanted.length || result.records.some((record,index) => record.id !== wanted[index])) throw new Error('Senarai laporan pukal tidak lengkap. Tiada PDF dijana.');
      for (const record of result.records) {
        assertBulkSession(job);
        progress.textContent = 'Menjana PDF ' + (generated + 1) + ' daripada ' + ids.length + '...';
        await OPRPDF.yieldUI(); assertBulkSession(job);
        OPRPDF.addRecord(pdf,record,assets,generated++);
      }
    }
    await bulkApi({action:'verifyAdmin'}, job);
    assertBulkSession(job);
    OPRPDF.showDownload(pdf,'bulk-download','OPR_Pukal_SKST_'+ids.length+'_laporan.pdf',false);
    progress.textContent = ids.length + ' OPR siap dalam satu PDF (' + ids.length + ' halaman). Klik Muat turun PDF pukal untuk menyimpan fail.';
    if (typeof playGameEffect === 'function') playGameEffect('complete');
  } catch (error) {
    if (window.OPRPDF) OPRPDF.clearDownload('bulk-download');
    if (error.message.includes('ADMIN_REQUIRED')) {
      clearAdmin(); document.getElementById('records-status').textContent = 'Sesi admin tamat. Log masuk semula untuk menjana OPR pukal.';
      alert('Sesi admin tamat. Log masuk semula untuk menjana OPR pukal.');
    } else if (error.name === 'AbortError' || error.message === 'BULK_CANCELLED') progress.textContent = 'Penjanaan pukal dibatalkan. Tiada PDF separa dijana.';
    else { progress.textContent = 'OPR pukal belum dijana: ' + error.message; alert(progress.textContent); }
  } finally { if (bulkJob === job) bulkJob = null; updateBulkUI(); }
}
