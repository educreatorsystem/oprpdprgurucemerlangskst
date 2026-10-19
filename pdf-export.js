/* Direct, vector PDF export. No popup, screenshot, CDN or browser print dialog. */
(function (root) {
  'use strict';
  const downloads = new Map();
  const imageCaches = new WeakMap();
  let assetPromise = null;
  const BLUE = [0,31,84], RED = [217,4,41], INK = [30,41,59], GREY = [100,116,139];
  function base64(bytes) {
    let text = '';
    for (let offset = 0; offset < bytes.length; offset += 16384) text += String.fromCharCode(...bytes.subarray(offset,offset+16384));
    return root.btoa(text);
  }
  async function loadAssets() {
    if (root.OPR_PDF_ASSETS) return root.OPR_PDF_ASSETS;
    if (!assetPromise) assetPromise = (async () => {
      const files = ['./assets/font-0.ttf','./assets/font-2.ttf','./assets/lencana-sekolah.png'];
      const results = await Promise.all(files.map(async file => {
        const response = await fetch(file);
        if (!response.ok) throw new Error('Fail PDF tidak dapat dimuatkan: ' + file + '. Muat naik semua fail dalam ZIP dan kemas kini PWA.');
        return base64(new Uint8Array(await response.arrayBuffer()));
      }));
      return {regular:results[0],bold:results[1],logo:'data:image/png;base64,'+results[2]};
    })().catch(error => { assetPromise = null; throw error; });
    return assetPromise;
  }
  function createDocument(PDF, assets) {
    if (typeof PDF !== 'function') throw new Error('Modul PDF belum dimuatkan. Kemas kini aplikasi atau muat semula halaman.');
    const pdf = new PDF({orientation:'portrait',unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});
    pdf.addFileToVFS('OPR-Regular.ttf',assets.regular); pdf.addFont('OPR-Regular.ttf','OPR','normal');
    pdf.addFileToVFS('OPR-Bold.ttf',assets.bold); pdf.addFont('OPR-Bold.ttf','OPR','bold');
    pdf.setFont('OPR','normal');
    pdf.setProperties({title:'Laporan OPR SK Sungai Tiram',subject:'Rekod pelaksanaan PdPR / PdPC',creator:'Super OPR SKST'});
    return pdf;
  }
  const text = value => String(value == null || value === '' ? '-' : value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');
  function lines(pdf, value, width, size, bold = false) {
    pdf.setFont('OPR',bold?'bold':'normal'); pdf.setFontSize(size);
    return pdf.splitTextToSize(text(value),width);
  }
  function imageData(pdf, data, label) {
    if (!data) return null;
    let cache = imageCaches.get(pdf);
    if (!cache) { cache = new Map(); imageCaches.set(pdf,cache); }
    if (cache.has(data)) return cache.get(data);
    if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(data)) throw new Error(label + ': format gambar tidak sah.');
    try {
      const info = pdf.getImageProperties(data);
      if (!(info.width > 0 && info.height > 0)) throw new Error('Saiz gambar tidak sah.');
      const result = {data,width:info.width,height:info.height,format:info.fileType};
      cache.set(data,result);
      return result;
    } catch(error) { throw new Error(label + ' tidak dapat dibaca. Sila semak gambar laporan ini.'); }
  }
  function planPage(pdf, record) {
    const date = new Date(record.tarikh);
    const dateText = record.tarikh && !isNaN(date) ? date.toLocaleDateString('ms-MY',{day:'2-digit',month:'long',year:'numeric'}) : record.tarikh;
    const fields = [
      ['NAMA GURU:',record.namaGuru,4,54],['SUBJEK:',record.subjek,92,54],
      ['KELAS:',record.kelas,4,54],['TARIKH:',dateText,92,54]
    ].map(([label,value,x,width]) => ({label,x,lines:lines(pdf,value,width,9,true)}));
    const row1 = Math.max(8,Math.max(fields[0].lines.length,fields[1].lines.length)*4+3);
    const row2 = Math.max(8,Math.max(fields[2].lines.length,fields[3].lines.length)*4+3);
    const title = lines(pdf,record.tajuk,141,9,true);
    const objective = lines(pdf,record.objektif,172,9);
    const metaY = 45, metaH = 18+row1+row2+Math.max(6,title.length*4);
    const objectiveY = metaY+metaH+4, objectiveH = 12+objective.length*4;
    const photoY = objectiveY+objectiveH+12;
    const height = Math.max(265,photoY+65+17);
    return {fields,row1,row2,title,objective,metaY,metaH,objectiveY,objectiveH,photoY,height,scale:Math.min(1,277/height)};
  }
  function addRecord(pdf, record, assets, index) {
    const photos = [0,1,2].map(i => imageData(pdf,record.images?.[i],'Gambar '+(i+1)+' — '+text(record.namaGuru)));
    const logo = imageData(pdf,assets.logo,'Lencana sekolah');
    const plan = planPage(pdf,record), s = plan.scale;
    if (index > 0) pdf.addPage('a4','portrait');
    const left = (210-180*s)/2, top = 10;
    const x = value => left+value*s, y = value => top+value*s;
    const shape = (bx,by,w,h,fill,border=null,radius=0) => {
      if (fill) pdf.setFillColor(...fill);
      if (border) { pdf.setDrawColor(...border); pdf.setLineWidth(.25*s); }
      const style = fill ? border?'FD':'F' : 'S';
      if (radius) pdf.roundedRect(x(bx),y(by),w*s,h*s,radius*s,radius*s,style);
      else pdf.rect(x(bx),y(by),w*s,h*s,style);
    };
    const write = (value,bx,by,size=9,bold=false,color=INK,align='left') => {
      pdf.setFont('OPR',bold?'bold':'normal'); pdf.setFontSize(size*s); pdf.setTextColor(...color);
      pdf.text(value,x(bx),y(by),{baseline:'top',align,lineHeightFactor:1.26});
    };
    const fitImage = (image,bx,by,w,h,alias) => {
      if (!image) return;
      const ratio = Math.min(w/image.width,h/image.height);
      const iw = image.width*ratio, ih = image.height*ratio;
      pdf.addImage(image.data,image.format,x(bx+(w-iw)/2),y(by+(h-ih)/2),iw*s,ih*s,alias,'FAST');
    };
    shape(0,0,180,2,BLUE); shape(0,2,180,1,RED);
    fitImage(logo,0,8,26,26,'school-logo');
    write('LAPORAN BERGAMBAR AKTIVITI (OPR)',99,7.5,9,true,RED,'center');
    write(['SEKOLAH KEBANGSAAN','SUNGAI TIRAM'],99,13.5,15,true,BLUE,'center');
    write("81800 ULU TIRAM, JOHOR DARUL TA'ZIM",99,29,8,false,GREY,'center');
    write('REKOD PELAKSANAAN PENGAJARAN & PEMBELAJARAN (PdPR / PdPC)',99,34,6.7,false,GREY,'center');
    shape(0,40,180,.5,BLUE);
    shape(0,plan.metaY,180,plan.metaH,[248,250,252],[203,213,225],2);
    plan.fields.forEach((field,i) => {
      const fy = plan.metaY+4+(i>1?plan.row1:0);
      write(field.label,field.x,fy,8,true,BLUE);
      write(field.lines,field.x+30,fy,9,true);
    });
    const titleY = plan.metaY+4+plan.row1+plan.row2;
    write('TAJUK / AKTIVITI:',4,titleY,8,true,BLUE); write(plan.title,35,titleY,9,true);
    const countY = titleY+Math.max(6,plan.title.length*4)+3;
    const count = record.jumlahMuridHantar === '' || record.jumlahMuridHantar == null ? 'Belum direkodkan' : String(record.jumlahMuridHantar)+' orang';
    write('JUMLAH MURID MENGHANTAR TUGASAN:',4,countY,8,true,BLUE);
    write(count,82,countY,9,true);
    shape(0,plan.objectiveY,180,plan.objectiveH,[248,250,252],[203,213,225],2);
    write('OBJEKTIF PEMBELAJARAN:',4,plan.objectiveY+4,8.5,true,BLUE);
    write(plan.objective,4,plan.objectiveY+10,9);
    write('RAKAMAN GAMBAR AKTIVITI / TUGASAN MURID',0,plan.photoY-7,8.5,true,BLUE);
    photos.forEach((photo,i) => {
      const px = i*61;
      shape(px,plan.photoY,58,65,[248,250,252],[203,213,225],2);
      if (photo) fitImage(photo,px+1,plan.photoY+1,56,63,'report-'+index+'-photo-'+i);
      else write('Tiada Gambar '+(i+1),px+29,plan.photoY+29,8,false,GREY,'center');
      shape(px+40,plan.photoY+59,16,4.5,BLUE,null,1);
      write('Foto '+(i+1),px+48,plan.photoY+59.7,7,false,[255,255,255],'center');
    });
    shape(0,plan.height-10,180,.2,[226,232,240]);
    write('Jana Automatik Melalui Sistem OPR SKST',180,plan.height-8,7,false,GREY,'right');
    write('Tarikh Cetakan: '+text(record.timestamp || new Date().toLocaleString('ms-MY')),180,plan.height-4,7,false,GREY,'right');
    return {scale:s,height:plan.height};
  }
  function clearDownload(id) {
    const url = downloads.get(id); if (url) { URL.revokeObjectURL(url); downloads.delete(id); }
    const link = root.document?.getElementById(id);
    if (link) { link.hidden = true; link.removeAttribute('href'); }
  }
  function showDownload(pdf, id, filename, autoDownload = true) {
    const blob = pdf.output('blob');
    if (!blob || blob.size < 100) throw new Error('Fail PDF kosong. Sila cuba semula.');
    clearDownload(id);
    const url = URL.createObjectURL(blob), link = root.document.getElementById(id);
    downloads.set(id,url); link.href = url; link.download = filename; link.hidden = false;
    link.removeAttribute('target');
    if (autoDownload) link.click();
    return blob;
  }
  const yieldUI = () => new Promise(resolve => setTimeout(resolve,0));
  async function newBrowserDocument() {
    const assets = await loadAssets();
    return {pdf:createDocument(root.jspdf?.jsPDF,assets),assets};
  }
  let singleBusy = false;
  function downloadSingle() {
    if (singleBusy) return;
    if (typeof currentPreviewRecord === 'undefined' || !currentPreviewRecord) { alert('Jana pra-tonton atau buka satu laporan daripada Arkib OPR dahulu.'); return; }
    const original = currentPreviewRecord;
    const record = {...original,images:[...(original.images || [])]};
    const button = root.document.getElementById('single-pdf-button'), status = root.document.getElementById('single-pdf-status');
    singleBusy = true; button.disabled = true; status.textContent = 'Sedang menjana fail PDF...'; clearDownload('single-pdf-download');
    try {
      const assets = root.OPR_PDF_ASSETS;
      if (!assets) throw new Error('Fail pdf-assets.js belum dimuatkan. Muat naik semua fail dalam ZIP dan kemas kini PWA.');
      const pdf = createDocument(root.jspdf?.jsPDF,assets);
      addRecord(pdf,record,assets,0);
      const safe = text(record.namaGuru).replace(/[^\p{L}\p{N}_-]+/gu,'_').slice(0,60);
      const filename = 'OPR_'+safe+'_'+String(record.tarikh || 'laporan')+'.pdf';
      showDownload(pdf,'single-pdf-download',filename,false);
      // Save in this click's synchronous call stack; do not await fonts, fetch or timers.
      try { pdf.save(filename); } catch(error) { root.document.getElementById('single-pdf-download').click(); }
      status.textContent = 'PDF satu halaman telah dijana. Klik pautan Muat turun PDF jika pelayar belum menyimpannya.';
    } catch(error) { status.textContent = 'PDF belum dijana: '+error.message; alert(status.textContent); }
    finally { singleBusy = false; button.disabled = false; }
  }
  const api = {loadAssets,createDocument,planPage,addRecord,newBrowserDocument,showDownload,clearDownload,yieldUI,downloadSingle};
  root.OPRPDF = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window === 'object' ? window : globalThis);
