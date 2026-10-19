# Super OPR SK Sungai Tiram — Mario Edition PWA (PDF klik terus v4)

## Pembetulan utama

PDF kini dijana sebagai fail PDF sebenar di dalam aplikasi menggunakan jsPDF yang disertakan secara tempatan. Ia tidak memerlukan popup, penangkapan skrin, CDN atau dialog cetak pelayar. Font Fredoka dan lencana asal dibenamkan dalam fail PDF. Teks kekal boleh dipilih. Tiga gambar berada bersebelahan, tanpa dipotong. Setiap laporan menggunakan satu halaman A4; kandungan panjang diskalakan untuk muat.

Grafik header, lencana PWA, latar, carian guru, input objektif, Arkib OPR, simpanan data/gambar, admin, padam dan bunyi permainan dikekalkan.

## Muat naik ke GitHub

1. Ekstrak ZIP baharu.
2. Gantikan semua fail frontend: index.html, mario-edition.css, pwa.js, bulk-opr.js, game-audio.js, pdf-assets.js, pdf-export.js, sw.js, manifest.webmanifest, offline.html serta folder assets dan icons.
3. Pastikan folder baharu assets/vendor turut dimuat naik. Fail jspdf.umd.min.js diperlukan untuk PDF; jangan muat naik ZIP sahaja.
4. Buka laman GitHub Pages melalui HTTPS. Simpan kerja dan pilih Kemas kini apabila notis PWA muncul. Jika paparan masih lama, muat semula halaman dengan cache dikosongkan atau buka URL dalam tab baharu selepas deployment selesai.

Versi cache: mario-v4-click-count-sound. Jangan buang parameter ?v=4 pada pautan aset dalam HTML. Laluan aplikasi relatif untuk menyokong GitHub Pages di subfolder.

## PDF satu laporan

1. Jana Pra-tonton OPR atau buka satu laporan penuh daripada Arkib OPR.
2. Klik Muat turun PDF.
3. Jika pelayar tidak memuat turun secara automatik, klik pautan kuning Muat turun PDF di sini. Pada peranti yang membuka fail dalam pemapar PDF, gunakan menu simpan/kongsi pemapar tersebut.
4. Butang Cetak A4 kekal tersedia sebagai pilihan cetakan fizikal melalui pelayar.

## PDF pukal — hanya admin

1. Dalam Arkib OPR, log masuk sebagai admin menggunakan akaun sedia ada.
2. Gunakan tapisan guru, kelas, subjek atau carian tarikh/tajuk. Tandakan laporan pada kad atau klik Pilih semua dalam tapisan. Pilihan terdahulu kekal walaupun tapisan berubah; jumlah pilihan dipaparkan.
3. Klik Jana OPR Pukal / PDF. Tunggu status pengambilan rekod dan penjanaan selesai.
4. Fail PDF mengandungi semua laporan pilihan, satu OPR setiap halaman. Klik pautan Muat turun PDF pukal untuk menyimpan fail.

Pengesahan token admin dibuat oleh Apps Script semasa mengambil setiap kelompok dan sebelum mengeluarkan PDF siap. Log keluar, sesi tamat atau pembatalan memadamkan pautan muat turun pukal. Kegagalan gambar atau rekod menghentikan penjanaan tanpa menawarkan fail separa. Tiada salinan laporan ditulis ke Google Sheet semasa menjana PDF.

## Apps Script

Versi v4 memerlukan Code.gs baharu untuk menyimpan jumlah murid. Gantikan Code.gs dalam projek sedia ada, jalankan setup, kemudian Deploy > Manage deployments > Edit > New version > Deploy menggunakan URL Web App yang sama. Tidak perlu resetAdmin. appsscript.json tidak berubah. Migrasi menambah kolum M secara automatik tanpa mengalih gambar atau objektif sedia ada. Frontend menyemak capabilities sebelum menyimpan supaya jumlah murid tidak hilang jika deployment masih lama.

Code.gs dan salinan TXT backend disertakan untuk rujukan peribadi; hanya fail frontend perlu dimuat naik ke repositori laman awam.

## PWA, internet dan audio

Pemasangan PWA dan ikon piksel sekolah dikekalkan. Modul PDF, font serta lencana dicache secara tempatan selepas lawatan pertama. PDF laporan yang telah dibuka boleh dijana daripada data dalam memori. Mengambil senarai guru, rekod/gambar awan, simpanan, log masuk dan penjanaan pukal memerlukan internet. Service worker hanya mencache fail aplikasi, bukan API Google atau PDF/data peribadi.

Bunyi chiptune berbeza mengikut butang kekal berfungsi, bersama pilihan Bunyi: Aktif / Tutup. Tiada fail audio luar diperlukan.

## Semakan

Fail PDF sebenar diperiksa: satu halaman tunggal, tujuh halaman pukal, laporan berteks panjang serta turutan laporan. Paparan PDF dirender dan diperiksa. Ujian backend dan aliran aplikasi meliputi token wajib, sesi tamat/dibatalkan, pembatalan dan kegagalan rekod. Grafik serta templat pra-tonton asal dikekalkan. Sambungan langsung Google dan tingkah laku muat turun pada peranti sebenar belum diuji di sini.

## Edit dalam Gemini

Sertakan KOD_HTML_UNTUK_GEMINI.txt, KOD_CSS_UNTUK_GEMINI.txt serta fail JavaScript berkaitan. Rujuk PANDUAN_EDIT_GEMINI.txt.

## Pembetulan klik v4

Fail pdf-assets.js menyediakan font dan lencana sebelum butang ditekan. Butang Muat turun PDF menjana fail serta memanggil kaedah save secara segerak daripada klik asal, tanpa await, fetch atau timer dalam pengendali klik itu. Pautan muat turun sandaran kekal tersedia tanpa target popup. Muat naik pdf-assets.js bersama fail yang lain.

## Jumlah murid

Borang mempunyai medan wajib Jumlah Murid Menghantar Tugasan. Masukkan nombor bulat 0 hingga 10000; sifar ialah nilai sah. Jumlah ini disimpan di kolum M, diambil semula bersama arkib, dan muncul dalam pra-tonton, cetakan serta PDF tunggal/pukal. Rekod lama tanpa nilai dipaparkan sebagai Belum direkodkan. Teks jumlah diisi oleh guru, bukan dikira daripada sistem tugasan lain.

## Bunyi pilihan

Pilihan subjek, kelas dan tarikh kini memainkan kesan ketika pemilih dibuka dan selepas nilai dipilih. Penapis subjek dan kelas dalam arkib turut disokong. Bunyi hanya dimainkan apabila Bunyi: Aktif; pilihan Tutup tetap berfungsi.

## Pengesahan v4

Pengendali butang diuji dengan modul jsPDF sebenar: save dipanggil terus dalam panggilan klik, tanpa await, timer atau fetch. Ujian 0/28 murid, migrasi 11/12 kolum kepada 13, rekod lama, nombor tidak sah dan kawalan admin turut lulus. Fail PDF satu dan tujuh halaman diperiksa dengan jumlah murid. Penjanaan dan logik muat turun diuji dalam persekitaran JavaScript simulasi; tingkah laku simpan fail pada peranti cikgu masih bergantung pada pelayar.
