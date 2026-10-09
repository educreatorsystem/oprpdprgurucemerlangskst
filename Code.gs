/** OPR SK Sungai Tiram — pasang dalam Google Apps Script. */
const CONFIG = Object.freeze({
  sheetId: '1-dzawk8p3kWGp4BTMaChL9p_G-4zMxGE_V3kuyDJM7A',
  folderId: '15LwCH3QNNoSDBr7Q8nTNKllErGflVmh3',
  sheetName: 'DATA_OPR',
  timezone: 'Asia/Kuala_Lumpur'
});
const HEADERS = ['ID', 'TIMESTAMP', 'NAMA GURU', 'SUBJEK', 'KELAS', 'TARIKH', 'TAJUK', 'GAMBAR 1 ID', 'GAMBAR 2 ID', 'GAMBAR 3 ID', 'FOLDER URL'];
function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function sheet_() {
  const book = SpreadsheetApp.openById(CONFIG.sheetId);
  const sheet = book.getSheetByName(CONFIG.sheetName) || book.insertSheet(CONFIG.sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
  const actual = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0];
  if (actual.join('|') !== HEADERS.join('|')) throw new Error('Header DATA_OPR tidak sepadan. Namakan semula tab lama sebelum menjalankan setup.');
  return sheet;
}
function setup() {
  setupAdmin();
  const sheet = sheet_();
  const folder = DriveApp.getFolderById(CONFIG.folderId);
  console.log('Sedia: ' + sheet.getName() + ' / ' + folder.getName());
}
function record_(row) {
  return {id: row[0], timestamp: row[1], namaGuru: row[2], subjek: row[3], kelas: row[4], tarikh: row[5], tajuk: row[6], imageIds: row.slice(7, 10), folderUrl: row[10], cloudSaved: true};
}
function records_() {
  const sheet = sheet_();
  return sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getDisplayValues().map(record_).reverse();
}
function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    if (params.action === 'getRecords') return json_(records_());
    if (params.action === 'getThumbnail') {
      const record = records_().find(r => r.id === params.id);
      if (!record || !record.imageIds[0]) throw new Error('Gambar previu tidak ditemukan.');
      const file = DriveApp.getFileById(record.imageIds[0]);
      const blob = file.getThumbnail() || file.getBlob();
      return json_({status:'success',thumbnail:'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes())});
    }
    if (params.action === 'getRecord') {
      const record = records_().find(r => r.id === params.id);
      if (!record) throw new Error('Rekod tidak ditemukan.');
      record.images = record.imageIds.map(id => {
        const blob = DriveApp.getFileById(id).getBlob();
        return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
      });
      return json_({status: 'success', record: record});
    }
    return json_({status: 'success', message: 'API OPR SK Sungai Tiram sedia.', actions: ['saveOPR (POST)', 'getRecords', 'getRecord']});
  } catch (error) { console.error(error); return json_({status: 'error', message: String(error.message || error)}); }
}
function text_(value, label, limit) {
  const text = String(value == null ? '' : value).trim();
  if (!text || text.length > limit) throw new Error(label + ' wajib diisi dan maksimum ' + limit + ' aksara.');
  return text;
}
// Elakkan teks guru/tajuk menjadi formula dalam Google Sheet.
function safeCell_(text) { return /^[=+@-]/.test(text) ? "'" + text : text; }
function validateImages_(images) {
  if (!Array.isArray(images) || images.length !== 3) throw new Error('Tepat 3 gambar diperlukan.');
  return images.map((image, index) => {
    const data = typeof image === 'string' ? image : image && image.data;
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(data || '');
    if (!match) throw new Error('Format gambar ' + (index + 1) + ' tidak sah.');
    if (match[2].length > 7 * 1024 * 1024) throw new Error('Gambar terlalu besar.');
    const bytes = Utilities.base64Decode(match[2]);
    if (!bytes.length || bytes.length > 5 * 1024 * 1024) throw new Error('Had setiap gambar ialah 5 MB.');
    return {bytes: bytes, mime: match[1], ext: match[1].split('/')[1] === 'jpeg' ? 'jpg' : match[1].split('/')[1]};
  });
}
function doPost(e) {
  const lock = LockService.getScriptLock();
  let acquired = false, folder = null, committed = false;
  try {
    const payload = JSON.parse(e && e.postData ? e.postData.contents : '{}');
    if (payload.action === 'adminLogin') return json_(adminLogin_(payload));
    if (payload.action === 'adminLogout') { adminLogout_(payload.token); return json_({status:'success'}); }
    if (payload.action === 'deleteOPR') return json_(deleteOPR_(payload));
    if (payload.action !== 'saveOPR') throw new Error('Action tidak sah.');
    const id = payload.id ? text_(payload.id, 'ID', 100) : 'OPR-' + Utilities.getUuid();
    if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error('ID tidak sah.');
    const guru = text_(payload.namaGuru, 'Nama guru', 200);
    const subjek = text_(payload.subjek, 'Subjek', 200);
    const kelas = text_(payload.kelas, 'Kelas', 100);
    const tarikh = text_(payload.tarikh, 'Tarikh', 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tarikh) || isNaN(Date.parse(tarikh)) || new Date(tarikh).toISOString().slice(0,10) !== tarikh) throw new Error('Tarikh tidak sah.');
    const tajuk = text_(payload.tajuk, 'Tajuk', 5000);
    const images = validateImages_(payload.images);
    lock.waitLock(30000); acquired = true;
    const sheet = sheet_();
    const existing = records_().find(r => r.id === id);
    if (existing) return json_({status: 'success', id: id, duplicate: true, record: existing});
    folder = DriveApp.getFolderById(CONFIG.folderId).createFolder(id + '_' + tarikh);
    const imageIds = images.map((image, i) => folder.createFile(Utilities.newBlob(image.bytes, image.mime, 'Gambar_' + (i + 1) + '.' + image.ext)).getId());
    const timestamp = Utilities.formatDate(new Date(), CONFIG.timezone, 'yyyy-MM-dd HH:mm:ss');
    const row = [id, timestamp, safeCell_(guru), safeCell_(subjek), safeCell_(kelas), tarikh, safeCell_(tajuk)].concat(imageIds, [folder.getUrl()]);
    const next = sheet.getLastRow() + 1;
    sheet.getRange(next, 1, 1, HEADERS.length).setNumberFormat('@').setValues([row]);
    committed = true;
    SpreadsheetApp.flush();
    return json_({status: 'success', id: id, message: 'Data dan 3 gambar berjaya disimpan.', record: record_(sheet.getRange(next, 1, 1, HEADERS.length).getDisplayValues()[0])});
  } catch (error) {
    if (folder && !committed) {
      try { const files = folder.getFiles(); while (files.hasNext()) files.next().setTrashed(true); folder.setTrashed(true); } catch (cleanupError) { console.error(cleanupError); }
    }
    console.error(error);
    return json_({status: 'error', message: String(error.message || error)});
  } finally { if (acquired) lock.releaseLock(); }
}

// Run setupAdmin memasang akaun admin yang telah ditetapkan. Untuk menukar kata laluan, tetapkan ADMIN_PASSWORD dalam Script Properties dan Run setupAdmin sekali lagi.
// Kata laluan tidak disimpan dalam fail GitHub atau HTML.
function hash_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8)
    .map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
}
function setupAdmin() {
  const props = PropertiesService.getScriptProperties();
  const password = props.getProperty('ADMIN_PASSWORD');
  if (password) {
    const salt = Utilities.getUuid();
    props.setProperty('ADMIN_PASSWORD_SALT', salt);
    props.setProperty('ADMIN_PASSWORD_HASH', hash_(salt + ':' + password));
    props.deleteProperty('ADMIN_PASSWORD');
    props.setProperty('ADMIN_SESSION_VERSION', Utilities.getUuid());
  }
  if (!props.getProperty('ADMIN_USERNAME')) props.setProperty('ADMIN_USERNAME','gurucemerlang');
  if (!props.getProperty('ADMIN_PASSWORD_HASH')) {
    props.setProperty('ADMIN_PASSWORD_SALT', 'e4d028e7d32da3c8db0821ef7aa49c67a7c7197882bd952f');
    props.setProperty('ADMIN_PASSWORD_HASH', '2ff99802f27866b0fb5f6417ece51c6a043192e4d4e245b4b5c4f7435c3e30a8');
    props.setProperty('ADMIN_SESSION_VERSION', Utilities.getUuid());
  }
}
function adminLogin_(payload) {
  const props = PropertiesService.getScriptProperties();
  const username = String(payload.username || '').trim();
  const password = String(payload.password || '');
  if (username.length > 200 || password.length > 200) throw new Error('Maklumat log masuk tidak sah.');
  if (!props.getProperty('ADMIN_PASSWORD_HASH') || !props.getProperty('ADMIN_PASSWORD_SALT')) resetAdmin();
  const expected = props.getProperty('ADMIN_PASSWORD_HASH');
  const salt = props.getProperty('ADMIN_PASSWORD_SALT');
  if (!expected || !salt) throw new Error('Admin belum dikonfigurasi. Jalankan setupAdmin.');
  if (username !== props.getProperty('ADMIN_USERNAME') || hash_(salt + ':' + password) !== expected) throw new Error('Nama pengguna atau kata laluan salah.');
  const token = Utilities.getUuid() + Utilities.getUuid();
  const expiresAt = Date.now() + 60 * 60 * 1000;
  CacheService.getScriptCache().put('admin:' + hash_(token), JSON.stringify({expiresAt:expiresAt,version:props.getProperty('ADMIN_SESSION_VERSION')}),3600);
  return {status:'success',token:token,expiresAt:expiresAt,username:username};
}
function requireAdmin_(token) {
  if (typeof token !== 'string' || token.length > 200 || !token) throw new Error('ADMIN_REQUIRED: Sila log masuk admin.');
  const cached = CacheService.getScriptCache().get('admin:' + hash_(token));
  if (!cached) throw new Error('ADMIN_REQUIRED: Sesi admin telah tamat. Log masuk semula.');
  const session = JSON.parse(cached);
  if (session.expiresAt <= Date.now() || session.version !== PropertiesService.getScriptProperties().getProperty('ADMIN_SESSION_VERSION')) throw new Error('ADMIN_REQUIRED: Sesi admin telah tamat.');
}
function adminLogout_(token) {
  if (typeof token === 'string' && token.length <= 200) CacheService.getScriptCache().remove('admin:' + hash_(token));
}
function deleteOPR_(payload) {
  requireAdmin_(payload.token);
  const id = text_(payload.id,'ID',100);
  const lock = LockService.getScriptLock();
  const changedFiles = []; let acquired = false, committed = false;
  try {
    lock.waitLock(30000); acquired = true;
    requireAdmin_(payload.token);
    const sheet = sheet_();
    const rows = sheet.getLastRow() < 2 ? [] : sheet.getRange(2,1,sheet.getLastRow()-1,HEADERS.length).getDisplayValues();
    const index = rows.findIndex(row=>row[0]===id);
    if (index < 0) return {status:'success',id:id,alreadyDeleted:true};
    const record = record_(rows[index]);
    // Hanya ID gambar yang memang tersimpan dalam baris laporan ini boleh dipadam.
    record.imageIds.filter(Boolean).forEach(fileId => {
      const file = DriveApp.getFileById(fileId);
      if (!file.isTrashed()) { file.setTrashed(true); changedFiles.push(file); }
    });
    sheet.deleteRow(index+2); committed = true;
    SpreadsheetApp.flush();
    return {status:'success',id:id,message:'Laporan OPR dipadam. Gambar dipindahkan ke Tong Sampah Drive.'};
  } catch(error) {
    if (!committed) changedFiles.forEach(file=>{try {file.setTrashed(false);} catch(restoreError){console.error(restoreError);}});
    throw error;
  } finally { if(acquired) lock.releaseLock(); }
}

/** Run resetAdmin sekali untuk membetulkan akaun kepada gurucemerlang / kata laluan asal yang diminta. */
function resetAdmin() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('ADMIN_USERNAME','gurucemerlang');
  props.setProperty('ADMIN_PASSWORD_SALT','e4d028e7d32da3c8db0821ef7aa49c67a7c7197882bd952f');
  props.setProperty('ADMIN_PASSWORD_HASH','2ff99802f27866b0fb5f6417ece51c6a043192e4d4e245b4b5c4f7435c3e30a8');
  props.setProperty('ADMIN_SESSION_VERSION',Utilities.getUuid());
  props.deleteProperty('ADMIN_PASSWORD');
  console.log('Akaun admin ditetapkan semula. Deploy New version selepas menyimpan kod.');
}
