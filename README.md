# Sistem OPR PdPR / PdPC — SK Sungai Tiram

## Kemaskini paparan
- Lencana utama menggunakan https://iili.io/nGTnxcu.png daripada pautan cikgu; salinan PNG dalam assets sebagai sandaran.
- Rekod dipaparkan sebagai kad. Klik kad untuk membuka laporan penuh bersama gambar.
- Tiga gambar bersebelahan, tanpa ruang tandatangan.
- Font Manrope dan Outfit, animasi hover serta sokongan pilihan reduced motion.
- Untuk kemaskini daripada versi sebelumnya, gantikan index.html dan assets/lencana-sekolah.png di GitHub. Apps Script tidak berubah. Refresh halaman selepas GitHub Pages selesai deploy.

## Kandungan
- `index.html`: sistem untuk GitHub Pages.
- `assets/lencana-sekolah.png`: lencana asal sekolah.
- `Code.gs`: kod backend Google Apps Script.
- `appsscript.json`: manifest Apps Script.

## 1. Pasang Apps Script
1. Buka Google Sheet `1-dzawk8p3kWGp4BTMaChL9p_G-4zMxGE_V3kuyDJM7A` menggunakan akaun yang mempunyai akses edit ke Sheet dan folder Drive `15LwCH3QNNoSDBr7Q8nTNKllErGflVmh3`.
2. Pilih **Extensions → Apps Script**. Gantikan kod dalam `Code.gs` dengan fail yang dibekalkan. Jika ada fungsi `doGet` / `doPost` lama dalam fail lain, buang atau gabungkan supaya tiada fungsi bertindih.
3. Dalam **Project Settings**, tandakan **Show appsscript.json manifest file in editor**, kemudian salin manifest yang dibekalkan.
4. Pilih fungsi `setup` dan klik **Run**. Benarkan akses Google Sheet dan Drive. Fungsi ini mencipta tab `DATA_OPR` jika belum wujud. Tab lain tidak diubah. Jika header tab DATA_OPR lama berbeza, namakan semula tab lama supaya data asal dikekalkan, kemudian jalankan setup semula.
5. Pilih **Deploy → Manage deployments**. Edit deployment Web App yang mempunyai URL sedia ada, pilih **New version**, tetapkan **Execute as: Me** dan **Who has access: Anyone**, kemudian **Deploy**. Jika belum ada deployment, pilih **Deploy → New deployment → Web app** dengan tetapan sama.
6. URL `/exec` sedia ada telah dimasukkan dalam index.html:
   `https://script.google.com/macros/s/AKfycby192vPA6OrmGJgN1OR78LbPyCOosV65NaLSfLWBaMpB0pSSPPSFyMxeLBUN1NDc6n5/exec`
   Jika membuat deployment baharu dengan URL berbeza, gantikan nilai `APPS_SCRIPT_URL` dalam index.html.
7. Buka URL `/exec`. Respons sepatutnya `status: success`. Buka `/exec?action=getRecords` untuk semak senarai; `[]` bermaksud belum ada rekod.

## 2. Publish GitHub Pages
1. Ekstrak ZIP ini dahulu. Muat naik **isi folder**, bukan ZIP, ke repository GitHub.
2. Pastikan `index.html` berada di root repository dan `assets/lencana-sekolah.png` kekal dalam folder `assets`.
3. Fail `Code.gs` dan `appsscript.json` dipasang dalam Apps Script; GitHub Pages tidak menjalankannya. Boleh simpan dalam repository sebagai rujukan.
4. Pergi ke **Settings → Pages → Build and deployment → Deploy from a branch**. Pilih branch `main` dan folder `/ (root)`, kemudian **Save**.
5. Buka URL GitHub Pages yang diberikan selepas deployment selesai.

## 3. Ujian selepas deployment
1. Semak dropdown guru, subjek dan kelas daripada tiga CSV yang ditetapkan.
2. Isi borang, pilih tepat 3 gambar dan klik **Simpan & Jana OPR**.
3. Pastikan mesej berjaya muncul, satu baris masuk ke `DATA_OPR`, dan satu subfolder OPR dengan 3 gambar muncul dalam folder Drive.
4. Muat semula halaman. Pergi ke **Rekod Disimpan**, klik **Papar / Cetak**, dan pastikan ketiga-tiga gambar dipaparkan semula.
5. Cuba dari peranti lain untuk memastikan rekod datang daripada Sheet, bukan cache peranti.

## Cara penyimpanan
- Kolum DATA_OPR: ID, TIMESTAMP, NAMA GURU, SUBJEK, KELAS, TARIKH, TAJUK, GAMBAR 1 ID, GAMBAR 2 ID, GAMBAR 3 ID, FOLDER URL.
- `saveOPR` (POST JSON melalui Content-Type text/plain): menyimpan data dan 3 gambar JPEG/PNG/WebP, maksimum 5 MB setiap gambar.
- `getRecords` (GET): senarai metadata tanpa memuatkan semua gambar.
- `getRecord&id=...` (GET): satu rekod lengkap bersama gambar base64 dari Drive.
- ID yang sama tidak mencipta rekod berganda. Jika simpanan gagal sebelum baris ditulis, gambar yang baru dicipta dibersihkan.
- Sistem tidak menukar tetapan perkongsian gambar Drive. Gambar dibaca oleh Apps Script menggunakan akaun pemilik deployment.
- Tetapan Web App **Anyone** membolehkan sesiapa yang mengetahui URL API menyimpan dan membaca rekod termasuk gambar melalui API. Versi ini tiada kawalan log masuk; gunakan hanya bagi rekod yang sesuai untuk akses tersebut.

## Jika gagal
- **Authorization / permission**: jalankan setup menggunakan akaun pemilik deployment dan pastikan akaun itu boleh edit Sheet serta folder Drive.
- **Gagal fetch / respons bukan JSON**: semak URL `/exec`, akses Anyone, dan pastikan deployment menggunakan versi kod terkini. Jangan gunakan URL `/dev`.
- **Header tidak sepadan**: namakan semula tab DATA_OPR lama. Kod tidak menimpa data lama.
- **Gambar lama tidak muncul**: semak fail gambar masih wujud dan ID gambar dalam Sheet tidak diubah.
- **Sekolah menghalang akses Anyone**: pentadbir Google Workspace perlu membenarkan deployment tersebut; hosting GitHub sahaja tidak menyelesaikan sekatan ini.

Kod telah diuji menggunakan mock Google Sheet/Drive. Simpanan sebenar perlu diuji selepas kod dipasang dan deployment dikemas kini dalam akaun cikgu.
