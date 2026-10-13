# Super OPR SK Sungai Tiram — Mario Edition PWA

Tema mengikuti laman PdPR Cikgu Heryani: langit biru, header dunia permainan, toolbar navy, butang merah/kuning/hijau, font Press Start 2P dan Fredoka, kad berbingkai serta bayang timbul. Header telefon dipaparkan penuh; navigasi tiga tab kekal dalam header utama.

## Muat naik ke GitHub Pages

1. Ekstrak ZIP.
2. Muat naik `index.html`, `mario-edition.css`, `pwa.js`, `sw.js`, `offline.html`, `manifest.webmanifest` serta folder `assets` dan `icons` ke folder laman yang sama. Jangan muat naik ZIP sahaja.
3. Pastikan GitHub Pages aktif dan buka URL HTTPS laman tersebut.
4. Muat semula laman, kemudian pilih **PASANG APP** apabila pilihan pemasangan tersedia. Pada iPhone/iPad gunakan Safari > Kongsi > Tambah ke Skrin Utama.

Laluan manifest, start_url dan scope adalah relatif supaya serasi dengan repositori GitHub Pages di subfolder.

## Ikon sekolah piksel

`assets/lencana-pixel.png` ialah versi seni piksel lencana SK Sungai Tiram. Ikon 192px/512px dan ikon Apple 180px menggunakan imej itu. Ikon maskable mempunyai ruang selamat untuk potongan bulat. Header menggunakan versi piksel; cetakan laporan menggunakan lencana asal.

## PWA dan internet

Font, ikon, gaya dan header disertakan secara tempatan. Selepas lawatan pertama berjaya dan service worker dipasang, rangka aplikasi boleh dibuka luar talian. Senarai guru/subjek/kelas, simpanan laporan, gambar awan, log masuk admin dan pemadaman memerlukan internet. PWA tidak menyimpan permintaan API Google dalam cache service worker. Kaedah simpanan sedia ada dan pengesahan admin dikekalkan.

Versi baharu akan menawarkan butang kemas kini. Simpan laporan sebelum memilihnya kerana halaman akan dimuat semula. Untuk perubahan masa depan, naikkan nombor versi cache dalam `sw.js`.

## Apps Script

`Code.gs` dan `appsscript.json` ialah kod backend sedia ada, tanpa perubahan bagi kemas kini tema/PWA ini. Tidak perlu menggantikan Apps Script jika versi semasa sudah berfungsi. Kod backend ini disertakan untuk rujukan peribadi; jangan muat naik Code.gs atau salinan TXT backend ke repositori awam.

## Edit dalam Gemini

Lihat PANDUAN_EDIT_GEMINI.txt. Untuk paparan, beri fail KOD_HTML_UNTUK_GEMINI.txt dan KOD_CSS_UNTUK_GEMINI.txt bersama arahan. Salinan TXT disertakan untuk memudahkan perkongsian kod, bukan sebagai fail penerbitan.

## Pengesahan

Kod JavaScript, fail manifest, dimensi ikon, pautan aset tempatan dan peraturan cache service worker telah diperiksa. Ujian pemasangan PWA pada peranti sebenar dan sambungan Google perlu dibuat selepas muat naik; versi ini tidak diterbitkan secara automatik.
