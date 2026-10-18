# Super OPR SK Sungai Tiram — Mario Edition PWA

Tema mengikuti laman PdPR Cikgu Heryani: langit biru, header dunia permainan, toolbar navy, butang merah/kuning/hijau, font Press Start 2P dan Fredoka, kad berbingkai serta bayang timbul. Header telefon dipaparkan penuh; navigasi tiga tab kekal dalam header utama.

## Muat naik ke GitHub Pages

1. Ekstrak ZIP.
2. Muat naik `index.html`, `mario-edition.css`, `pwa.js`, `bulk-opr.js`, `game-audio.js`, `sw.js`, `offline.html`, `manifest.webmanifest` serta folder `assets` dan `icons` ke folder laman yang sama. Jangan muat naik ZIP sahaja.
3. Pastikan GitHub Pages aktif dan buka URL HTTPS laman tersebut.
4. Muat semula laman, kemudian pilih **PASANG APP** apabila pilihan pemasangan tersedia. Pada iPhone/iPad gunakan Safari > Kongsi > Tambah ke Skrin Utama.

Laluan manifest, start_url dan scope adalah relatif supaya serasi dengan repositori GitHub Pages di subfolder.

## Ikon sekolah piksel

`assets/lencana-pixel.png` ialah versi seni piksel lencana SK Sungai Tiram. Ikon 192px/512px dan ikon Apple 180px menggunakan imej itu. Ikon maskable mempunyai ruang selamat untuk potongan bulat. Header menggunakan versi piksel; cetakan laporan menggunakan lencana asal.

## PWA dan internet

Font, ikon, gaya dan header disertakan secara tempatan. Selepas lawatan pertama berjaya dan service worker dipasang, rangka aplikasi boleh dibuka luar talian. Senarai guru/subjek/kelas, simpanan laporan, gambar awan, log masuk admin dan pemadaman memerlukan internet. PWA tidak menyimpan permintaan API Google dalam cache service worker. Kaedah simpanan sedia ada dikekalkan. Pengesahan admin ditambah pada laluan baharu getBulkRecords dan verifyAdmin.

Versi baharu akan menawarkan butang kemas kini. Simpan laporan sebelum memilihnya kerana halaman akan dimuat semula. Untuk perubahan masa depan, naikkan nombor versi cache dalam `sw.js`.

## Apps Script

**Untuk versi pukal ini, gantikan Code.gs dalam projek Apps Script sedia ada.** Simpan kod, kemudian Deploy > Manage deployments > Edit > pilih New version > Deploy. Kekalkan URL Web App yang sama, Execute as: Me dan akses Anyone seperti pemasangan sedia ada. Tidak perlu menjalankan resetAdmin; akaun dan sesi admin sedia ada dikekalkan. appsscript.json tidak berubah. Pengesahan sesi admin dilakukan oleh backend bagi setiap permintaan pukal dan sebelum cetakan. Kod backend ini disertakan untuk rujukan peribadi; jangan muat naik Code.gs atau salinan TXT backend ke repositori awam.

## Edit dalam Gemini

Lihat PANDUAN_EDIT_GEMINI.txt. Untuk paparan, beri fail KOD_HTML_UNTUK_GEMINI.txt dan KOD_CSS_UNTUK_GEMINI.txt bersama arahan. Salinan TXT disertakan untuk memudahkan perkongsian kod, bukan sebagai fail penerbitan.

## Pengesahan

Kod JavaScript, fail manifest, dimensi ikon, pautan aset tempatan dan peraturan cache service worker telah diperiksa. Ujian pemasangan PWA pada peranti sebenar dan sambungan Google perlu dibuat selepas muat naik; versi ini tidak diterbitkan secara automatik.

## Jana OPR Pukal — khusus admin

1. Buka Arkib OPR dan Log Masuk Admin menggunakan akaun sedia ada.
2. Tapis nama guru, subjek, kelas atau tarikh/tajuk seperti biasa.
3. Tandakan kotak Pilih untuk OPR pukal pada kad, atau pilih Pilih semua dalam tapisan. Pilihan terdahulu kekal walaupun tapisan berubah; jumlah pilihan dipaparkan. Kosongkan pilihan untuk memulakan semula.
4. Tekan Jana OPR Pukal / PDF. Benarkan popup bagi laman ini.
5. Tunggu semua laporan dan gambar siap dalam tetingkap baharu. Klik Cetak / Simpan PDF, kemudian pilih Save as PDF dalam dialog cetak. Tetapkan kertas A4, skala 100%, margin tiada dan matikan header/footer pelayar jika ditawarkan. Satu OPR menggunakan satu halaman; laporan panjang diskalakan.

Rekod diambil tiga laporan pada satu masa; jumlah pilihan tidak dihadkan kepada tiga. Borang asal tidak diubah dan tiada salinan rekod ditulis ke Google Sheet. Tiada PDF separa disediakan apabila rekod/gambar gagal dimuatkan. Pilihan Batal penjanaan menghentikan operasi. Log keluar atau sesi tamat akan menutup previu pukal. Data pukal menggunakan POST dan tidak dicache oleh service worker.

## Bunyi butang

Setiap butang menggunakan kesan chiptune setempat mengikut tindakan: syiling, lompat, blok, paip, power-up, bintang, akses admin, reset dan padam. Tekanan berulang turut mempunyai variasi pic kecil. Pilih Mula dengan bunyi atau aktifkan Bunyi: Aktif untuk mendengar. Pilihan Bunyi: Tutup kekal berfungsi. Bunyi dijana melalui Web Audio; tiada fail audio luar atau rakaman rasmi permainan diperlukan.

## Kemas kini PWA

Muat naik semua fail frontend dalam pakej dan gunakan versi cache mario-v2-bulk-audio dalam sw.js. Selepas laman baharu diterbitkan, simpan kerja dan tekan Kemas kini apabila notis muncul. Grafik, lencana, header serta fungsi laporan tunggal dikekalkan.

## Pengesahan versi pukal

Ujian simulasi meliputi akaun admin sedia ada, token tidak sah, sesi tamat/dibatalkan, pilihan merentas tapisan, tujuh laporan melalui tiga permintaan, pembatalan, gambar/rekod gagal dan ketiadaan cetakan separa. Grafik asal serta templat laporan tunggal dibandingkan dengan pakej sebelum kemas kini dan sepadan. Pengesahan kod, fail cache dan keluarga bunyi turut lulus. Cetakan fizikal/PDF serta sambungan Google sebenar perlu diuji selepas deployment; ujian di sini menggunakan simulasi backend dan aliran aplikasi.
