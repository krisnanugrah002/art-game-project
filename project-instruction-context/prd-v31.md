# PRD v3.1: Sistem Mini-Game Super Interaktif
## Platform Edukasi Seni Rupa Interaktif

| | |
|---|---|
| **Versi** | 3.1 |
| **Melengkapi** | PRD v3 (bug fix, database, login) dan Addendum v2.1 (kurikulum 6 stage × 5 chapter) |
| **Istilah** | "Section" di permintaan = **chapter**. Total **30 mini-game** (6 stage × 5 chapter), dua di antaranya Boss berbasis AI per stage. |
| **Tujuan dokumen** | Menjadi acuan membangun mini-game yang benar-benar seru dan interaktif di setiap chapter, lengkap dengan ide, mekanik, skor, dan spesifikasi teknis. |

> **Catatan untuk AI coding agent:** semua aturan PRD v3 tetap berlaku, terutama: (1) mini-game **tidak mengurangi nyawa**; (2) layar hasil memakai tombol hijau **"LANJUT"**; (3) **dilarang data dummy** (tidak ada lawan palsu, skor palsu, atau pemain bayangan); (4) data XP/nyawa/username hanya dari server. Bangun **satu engine bersama** (Bagian 4) lalu 30 game sebagai modul plug-in, jangan menulis 30 aplikasi terpisah.

---

## 1. Visi dan Tujuan

**Visi:** setiap chapter terasa seperti permainan kecil yang ingin diulang, bukan kuis tambahan. Pemain belajar konsep seni lewat *melakukan*, bukan sekadar membaca.

**Tujuan terukur**

| Tujuan | Target awal |
|---|---|
| Penyelesaian mini-game setelah kuis | ≥ 85% |
| Pemain yang mengulang mini-game demi bintang lebih tinggi | ≥ 25% |
| Durasi rata-rata per mini-game | 60-120 detik |
| Frame rate di HP menengah | ≥ 50 fps |
| Ukuran bundel per game (gzip) | ≤ 150 KB (di luar aset gambar) |
| Pemain yang memahami cara main tanpa membaca teks panjang | ≥ 90% (uji 5 orang) |

---

## 2. Prinsip Desain Game

1. **Belajar lewat aksi.** Konsep yang diajarkan chapter itu harus menjadi *mekanik inti* permainan (mis. perspektif = menggeser titik hilang), bukan sekadar tema visual.
2. **Satu mekanik, dimengerti dalam 5 detik.** Tutorial berupa demo "tangan hantu" (ghost hand), bukan paragraf teks.
3. **Singkat dan berlapis:** 3 ronde (mudah → sedang → sulit) dalam 60-120 detik.
4. **Umpan balik instan dan "juicy":** animasi, partikel, getar (haptic), suara; setiap aksi benar terasa memuaskan.
5. **Gagal dengan lembut:** salah tidak mengurangi nyawa. Konsekuensinya hanya skor/combo yang turun dan penjelasan singkat.
6. **Dapat diulang:** soal/posisi diacak dengan *seed* sehingga tiap main berbeda, tetapi adil.
7. **Mobile-first:** semua bisa dimainkan dengan satu jari, area sentuh ≥ 44 px.
8. **Inklusif:** tidak bergantung pada warna saja, ada alternatif non-drag, dan dukung *reduced motion*.
9. **Aset orisinal atau berlisensi terbuka.** Karya seni pada Stage 6 hanya yang domain publik.

---

## 3. Pustaka Komponen Dasar (Primitives)

Agar 30 game tidak dibuat dari nol, bangun komponen yang dipakai ulang:

| Primitive | Fungsi | Dipakai oleh |
|---|---|---|
| `GameShell` | Kerangka: intro, hitung mundur, pause, hasil | Semua game |
| `DragDropKit` | Drag & drop sentuh/mouse, snap, zona jatuh, mode ketuk-pilih | 1.2, 1.5, 3.1, 4.2, 5.1, 5.3, 6.1, 6.4 |
| `SwipeDeck` | Kartu geser kiri/kanan dengan fisika ringan | 2.3, 5.4, 6.3 |
| `TapField` | Area target ketuk dengan *hit-test* | 1.1, 1.3, 3.2, 4.3 |
| `CanvasStage` | Wrapper React Konva: gambar, tracing, koordinat, undo | 1.4, 3.4, 5.2, Boss |
| `ComboMeter` | Beruntun benar → pengali skor | Hampir semua |
| `FeedbackFX` | Partikel, goyang layar, flash, getar, suara | Semua game |
| `GhostHand` | Demo tutorial otomatis | Semua game |
| `ResultScreen` | Skor, bintang, tombol hijau "LANJUT" | Semua game |

---

## 4. Arsitektur Engine

### 4.1 Antarmuka Modul Game
```ts
// lib/games/types.ts
export interface GameProps<TConfig> {
  config: TConfig;            // dari curriculum.json
  seed: string;               // dari attempt id, untuk pengacakan yang dapat direproduksi
  difficulty: 1 | 2 | 3;      // dipakai ronde bertingkat
  reducedMotion: boolean;
  muted: boolean;
  onFinish: (result: GameResult) => void;
  onExit: () => void;
}

export interface GameResult {
  score: number;              // 0-100 (dinormalisasi)
  durationMs: number;
  stats: Record<string, number>;   // mis. { correct: 9, mistakes: 2, maxCombo: 6 }
}

export interface GameModule<TConfig = unknown> {
  type: string;               // mis. 'tap_match'
  Component: React.ComponentType<GameProps<TConfig>>;
  minDurationMs: number;      // batas wajar terendah untuk validasi server
}
```

### 4.2 Siklus Hidup
```
intro (judul + GhostHand) → countdown 3-2-1 → playing ⇄ paused → finished → result
```
- Tombol **Jeda** dan **Keluar** selalu ada. Keluar di tengah permainan tidak memberi hukuman; main ulang dari awal.
- Setelah `finished`, `ResultScreen` menampilkan skor, bintang, ringkasan "yang kamu pelajari", dan tombol hijau **LANJUT**.

### 4.3 Registri dan Pemuatan
- Registri `games/index.ts` memetakan `type` → modul. Setiap game dimuat dengan `next/dynamic` (code-splitting) agar halaman peta ringan.
- Jika `type` belum diimplementasikan: tampilkan kuis tambahan sebagai *fallback* (aplikasi tidak boleh crash).

### 4.4 Pengacakan Adil
- RNG berbasis seed (mis. `mulberry32(hash(attemptId))`). Seed disimpan pada `chapter_attempts` agar server dapat memeriksa hasil untuk game yang bisa dihitung ulang.

### 4.5 Skor dan Bintang
Skor akhir 0-100:
```
skor = 0.70 × akurasi + 0.20 × kecepatan + 0.10 × combo
```
- `akurasi` = proporsi aksi benar (atau ketepatan terukur untuk game kanvas).
- `kecepatan` = sisa waktu dinormalisasi (game tanpa waktu: bobot dialihkan ke akurasi).
- `combo` = combo maksimum / combo maksimum yang mungkin.
- Bintang mengikuti PRD v3: ⭐ selesai, ⭐⭐ skor ≥ 70 (dan kuis ≥ 2 benar), ⭐⭐⭐ skor ≥ 90 (dan kuis 3 benar). **Server** yang menghitung bintang.

### 4.6 Validasi Server (Anti-Curang Ringan)
Skor mini-game dikirim saat `POST /api/chapters/[id]/complete`:
```json
{ "attemptId": "...", "minigame": { "score": 87, "durationMs": 74000,
  "stats": { "correct": 9, "mistakes": 2, "maxCombo": 6 } } }
```
- Server membatasi `score` 0-100 dan menolak `durationMs` < `minDurationMs` game tersebut (skor dibatasi maks 50 dan ditandai).
- Game deterministik (mis. `color_mixer`, `thirds_placer`) menyertakan hasil akhir (warna/posisi akhir) agar server dapat menghitung ulang skor.
- Mini-game hanya memengaruhi **bintang**. XP dan nyawa tidak bergantung pada skor yang dilaporkan client.

### 4.7 Preferensi Pengguna
Disimpan lokal (boleh di `localStorage` karena bukan data progres): suara aktif/mati, getar, *reduced motion*, mode ramah buta warna.

### 4.8 Halaman Pengembangan (Dev Playground)
Rute `/dev/games/[type]` (hanya aktif saat `NODE_ENV !== 'production'`) untuk memainkan satu game dengan konfigurasi contoh, **tanpa menulis ke database**. Memudahkan pengujian tiap game secara terpisah.

---

## 5. Katalog Game per Chapter

Format tiap game: **Konsep** · **Mekanik** · **Skor** · **Efek seru** · **Catatan teknis**. Level kesulitan dan jumlah ronde adalah usulan awal.

---

### 🟦 STAGE 1: Dunia Garis & Bentuk

**1.1 Garis Kilat** · `tap_match` (varian *slice*)
- **Konsep:** mengenali jenis garis (lurus, zigzag, lengkung, bergelombang, putus-putus).
- **Mekanik:** berbagai garis meluncur dari bawah seperti permainan "iris buah". Perintah di atas layar: *"Iris semua garis zigzag!"* Pemain menggesek jari untuk mengiris garis yang benar; mengiris garis salah memutus combo.
- **Skor:** akurasi (benar diiris vs salah/terlewat), combo; 3 ronde, perintah berganti tiap ronde.
- **Efek:** garis terbelah dengan percikan tinta, suara "swish", layar bergetar halus saat combo ≥ 5.
- **Teknis:** `TapField` + deteksi persimpangan segmen gesekan dengan garis; Konva atau CSS transform.

**1.2 Sortir Kilat** · `drag_sort` (varian *ban berjalan*)
- **Konsep:** bentuk geometris vs organik.
- **Mekanik:** benda (daun, awan, kotak, penggaris, koin…) bergerak di ban berjalan; seret ke keranjang **Geometris** atau **Organik** sebelum jatuh. Kecepatan naik tiap ronde; di ronde 3 muncul benda "jebakan" (batu = organik).
- **Skor:** benar/total, combo.
- **Efek:** keranjang "menelan" benda dengan animasi, angka +10 melayang.
- **Teknis:** `DragDropKit` + mode ketuk (ketuk benda, ketuk keranjang).

**1.3 Detektif Bentuk** · `hotspot_find` (varian *kaca pembesar*)
- **Konsep:** titik, garis, bidang pada gambar nyata.
- **Mekanik:** lukisan kota penuh bentuk; pemain menggeser **kaca pembesar** untuk menemukan 8 bentuk tersembunyi dan mengetuknya. Daftar target ("2 bidang, 3 garis, 3 titik") ada di panel. Tombol *petunjuk* menyorot area (menambah penalti kecil).
- **Skor:** ditemukan/target, waktu, jumlah petunjuk.
- **Efek:** objek yang ditemukan "menyala" dengan garis tepi bercahaya.
- **Teknis:** hit-test koordinat pada ilustrasi SVG, area target didefinisikan di data.

**1.4 Ikuti Jalur** · `trace_path` (varian *terowongan cat*)
- **Konsep:** garis kontur.
- **Mekanik:** siluet hewan muncul sebagai jalur tipis; pemain menelusuri dengan jari, meninggalkan jejak cat. Jejak yang menyimpang dari "terowongan" memudar. Ronde berikutnya jalur makin rumit, ronde akhir *blind contour* (jalur disembunyikan setelah 3 detik).
- **Skor:** rata-rata jarak jejak ke jalur (px, dinormalisasi) × persentase jalur tercakup.
- **Efek:** jejak berwarna gradasi; siluet "terisi warna" saat selesai.
- **Teknis:** `CanvasStage`; hitung jarak titik ke polyline; toleransi sesuai ukuran layar.

**1.5 👑 Boss: Rakit Monster** · `shape_builder` (+ opsi `canvas_ai`)
- **Konsep:** konstruksi bentuk dasar.
- **Mekanik:** kartu pesanan: *"Monster berkepala bulat, 2 tanduk segitiga, badan kotak, 3 mata"*. Pemain menyeret, memutar, dan mengubah ukuran bentuk dasar di kanvas dengan *snap* ke bagian tubuh. Saat selesai, monster **hidup**: berkedip dan melambai.
- **Skor:** kecocokan jenis dan jumlah bentuk dengan pesanan (deterministik); lulus ≥ 80%.
- **Efek:** animasi hidup monster, konfeti; monster bisa disimpan sebagai gambar profil? (tidak di scope; hanya tampilan hasil).
- **Teknis:** `CanvasStage` + `DragDropKit`; bentuk sebagai komponen Konva dengan handle ubah ukuran.

---

### 🟥 STAGE 2: Pesta Warna

**2.1 Racik Cat** · `color_mixer`
- **Konsep:** warna primer, sekunder, tersier.
- **Mekanik:** pemain sebagai penjual cat. Pelanggan memesan warna (*"hijau daun"*, *"oranye matahari"*). Pemain meneteskan cat merah/kuning/biru/putih/hitam ke palet dan mengaduk (gesek jari) sampai cocok dengan swatch target. Tiap pelanggan punya batas waktu.
- **Skor:** kedekatan warna (jarak warna di ruang CIELAB, ΔE) → akurasi; bonus kecepatan.
- **Efek:** tetesan cat dengan animasi cair, pengadukan berputar, pelanggan tersenyum/cemberut.
- **Teknis:** gunakan model campuran **RYB** (bukan RGB cahaya) agar biru+kuning=hijau sesuai materi; pastikan fungsi pencampur diuji unit. Tampilkan nama warna sebagai teks (ramah buta warna).

**2.2 Pasangan Lawan** · `memory_match` (varian *roda warna*)
- **Konsep:** warna komplementer.
- **Mekanik:** kartu-kartu tertutup; balik dua kartu, cocok jika keduanya **komplementer** (bukan sama). Roda warna di tepi layar berputar dan menyorot posisi pasangan setelah pasangan ditemukan, memperlihatkan konsep "berseberangan".
- **Skor:** langkah terhadap minimum, waktu.
- **Efek:** pasangan yang cocok "menyatu" dengan kilatan; roda warna terisi bertahap.
- **Teknis:** DOM + Framer Motion (flip 3D); label teks warna pada kartu.

**2.3 Termometer Warna** · `swipe_cards`
- **Konsep:** warna hangat vs dingin.
- **Mekanik:** kartu gambar/warna digeser kanan (hangat) atau kiri (dingin). **Termometer** di samping naik/turun mengikuti jawaban; menjaga termometer pada zona "pas" lewat 20 kartu = bonus. Ronde sulit: warna netral/ambigu (hijau kekuningan) disertai penjelasan.
- **Skor:** benar/total, combo.
- **Efek:** api kecil saat combo, es saat dingin; kartu terbang dengan fisika.
- **Teknis:** `SwipeDeck`; tombol alternatif kiri/kanan.

**2.4 Stylist Palet** · `palette_pick`
- **Konsep:** harmoni warna (analogus, monokromatik, triadik).
- **Mekanik:** sebuah adegan hitam-putih (rumah, taman, kapal). Pemain memilih satu dari beberapa palet dan adegan **langsung berubah warna**. Tujuan: palet sesuai perintah ("suasana tenang", "harmoni analogus"). **Meter harmoni** naik/turun secara langsung.
- **Skor:** kesesuaian palet dengan tujuan, jumlah percobaan.
- **Efek:** transisi warna mengalir seperti cat tumpah.
- **Teknis:** ilustrasi SVG dengan variabel CSS warna; palet didefinisikan di data.

**2.5 👑 Boss: Senja di Pantai** · `canvas_ai`
- **Konsep:** palet analogus hangat, kontras objek.
- **Mekanik:** kanvas dengan 5 warna terbatas; pemain melukis langit, matahari, dan laut. Ada **slider posisi matahari** sebagai alat bantu opsional.
- **Skor:** rubrik Gemini (PRD v2 bagian 6) dihitung server; lulus ≥ 75.
- **Efek:** setelah dinilai, lukisan "dianimasikan" (matahari turun perlahan).
- **Teknis:** `CanvasStage`, `POST /api/evaluate`, fallback error tanpa mengurangi nyawa.

---

### 🟨 STAGE 3: Cahaya, Bayangan & Tekstur

**3.1 Tangga Gradasi** · `gradient_sort`
- **Konsep:** value (gelap-terang).
- **Mekanik:** petak-petak abu-abu acak; seret ke tangga sesuai urutan dari paling gelap ke terang. Setiap anak tangga yang benar membuat **karakter naik** satu langkah; salah membuat karakter turun. Ronde sulit: perbedaan value sangat tipis, dan warna berwarna (bukan hanya abu).
- **Skor:** posisi benar, waktu.
- **Efek:** karakter memanjat dengan animasi, ucapan semangat.
- **Teknis:** `DragDropKit`; kalkulasi luminans untuk urutan benar.

**3.2 Pemburu Bayangan** · `shadow_tap` (varian *senter*)
- **Konsep:** cast shadow, form shadow, highlight, arah cahaya.
- **Mekanik:** ruangan gelap dengan benda-benda. Pemain **menggeser senter** (sumber cahaya) dan bayangan bergerak real-time. Tugas per ronde: *"Ketuk semua cast shadow"*, *"Letakkan senter agar bayangan jatuh ke kanan"*, *"Temukan highlight"*.
- **Skor:** target benar, waktu.
- **Efek:** bayangan memanjang dan memendek mengikuti senter; cahaya hangat berpendar.
- **Teknis:** `CanvasStage`; proyeksi bayangan 2D sederhana dari posisi cahaya (tanpa 3D penuh).

**3.3 Tebak Rasa Permukaan** · `texture_match` (varian *gosok kartu*)
- **Konsep:** tekstur nyata dan semu.
- **Mekanik:** foto close-up tertutup lapisan abu-abu; pemain **menggosok** untuk membukanya, lalu mencocokkan dengan nama (kayu, kain goni, kaca, daun). Ronde lanjut: "Nyata atau semu?" untuk gambar tekstur.
- **Skor:** benar, jumlah gosokan minimum (bonus menebak lebih awal).
- **Efek:** getar khas (pola getaran kasar vs halus) di perangkat yang mendukung.
- **Teknis:** Canvas `destination-out` untuk efek gosok; `navigator.vibrate` jika tersedia.

**3.4 Arsir Bola** · `shade_brush`
- **Konsep:** arsir dan gradasi.
- **Mekanik:** bola datar dengan **panah arah cahaya**. Pemain mengarsir dengan kuas; **meter gradasi** menunjukkan seberapa halus bagian gelap ke terang sesuai arah cahaya. Ronde 2: arah cahaya berubah.
- **Skor:** pemeriksaan luminans bertahap sepanjang sumbu cahaya (monoton menurun) + kehalusan; deterministik tanpa AI.
- **Efek:** bola tampak "membulat" seiring arsiran.
- **Teknis:** `CanvasStage`; ambil piksel dari kanvas untuk menghitung luminans per pita.

**3.5 👑 Boss: Trio Bervolume** · `canvas_ai`
- **Konsep:** gradasi, volume, cast shadow.
- **Mekanik:** pilih satu bentuk (bola/kubus/silinder), lalu gambar dengan arsiran dan bayangan. Garis bantu arah cahaya dapat diseret (opsional).
- **Skor:** rubrik AI; lulus ≥ 70.

---

### 🟩 STAGE 4: Seni Menata

**4.1 Fotografer Dadakan** · `thirds_placer`
- **Konsep:** rule of thirds.
- **Mekanik:** pemain memegang **bingkai kamera** dengan grid 3×3. Geser dan zoom bingkai agar subjek berada di titik power. Tekan **jepret** (efek flash) dan dapat "rating foto". 5 adegan dengan kesulitan naik (subjek bergerak pelan di ronde akhir).
- **Skor:** jarak subjek ke titik power terdekat (dinormalisasi); bonus horizon di garis sepertiga.
- **Efek:** suara rana, flash putih, foto muncul ke "album".
- **Teknis:** `CanvasStage`/DOM; skor deterministik dapat dihitung ulang server dari koordinat akhir.

**4.2 Timbangan Seni** · `balance_scale`
- **Konsep:** keseimbangan simetris, asimetris, radial.
- **Mekanik:** papan jungkat-jungkit; seret objek dengan bobot visual berbeda (besar-gelap berat, kecil-terang ringan) ke kiri/kanan hingga seimbang. Ronde 1 simetris, ronde 2 asimetris (objek berbeda tapi seimbang), ronde 3 radial (susun mengelilingi pusat).
- **Skor:** selisih torsi (`Σ bobot × jarak`) mendekati nol; jumlah gerakan.
- **Efek:** papan miring real-time, objek "bergoyang"; bintang muncul saat seimbang.
- **Teknis:** hitung torsi sederhana; animasi rotasi dengan pegas.

**4.3 Mata Pertama** · `focal_tap`
- **Konsep:** focal point dan kontras.
- **Mekanik:** Fase A: gambar muncul 2 detik, pemain mengetuk "apa yang pertama kamu lihat", lalu muncul **heatmap** berdasarkan area fokus rancangan. Fase B: pemain mengatur slider kontras/ukuran/warna sebuah objek agar menjadi pusat perhatian.
- **Skor:** kecocokan fokus dengan target desain + ketepatan penyesuaian.
- **Efek:** heatmap hangat-dingin, sorotan cahaya menuju objek.
- **Teknis:** target fokus didefinisikan pada data; skor Fase B dihitung dari selisih kontras relatif.

**4.4 Lengkapi Pola** · `pattern_complete` (varian *tenun batik*)
- **Konsep:** irama, pola, kesatuan.
- **Mekanik:** kain batik dengan beberapa petak hilang; pilih/seret motif yang melengkapi pola. Ronde 2: pola bergeser dua motif bergantian; ronde 3: temukan **elemen pengganggu** yang merusak kesatuan.
- **Skor:** benar/total, waktu.
- **Efek:** kain "ditenun" dengan animasi benang saat pola lengkap.
- **Teknis:** DOM grid; motif SVG orisinal bergaya batik sederhana (tanpa menjiplak motif berhak cipta).

**4.5 👑 Boss: Desainer Poster** · `shape_builder` (+ opsi `canvas_ai`)
- **Konsep:** komposisi lengkap.
- **Mekanik:** editor poster: seret judul, gambar utama, dan elemen pendukung. **Meter komposisi** real-time menunjukkan skor berdasarkan aturan: fokus di titik sepertiga, kontras teks, keseimbangan, kesatuan warna. Pemain memperbaiki hingga hijau.
- **Skor:** gabungan aturan komposisi (deterministik); lulus ≥ 75%.
- **Efek:** poster "dicetak" dan jatuh ke tumpukan.
- **Teknis:** `DragDropKit` + fungsi evaluasi aturan; tiap aturan terpisah dan dapat diuji unit.

---

### 🟪 STAGE 5: Menembus Ruang

**5.1 Susun Panggung** · `layer_stack` (varian *parallax*)
- **Konsep:** foreground, middle ground, background.
- **Mekanik:** pemandangan kosong dengan tiga lapisan; seret pohon, rumah, gunung ke lapisan yang benar. Setelah selesai, kemiringan ponsel atau geseran jari memicu **efek parallax** sehingga kedalaman terlihat nyata.
- **Skor:** penempatan benar, urutan overlap.
- **Efek:** parallax halus, burung terbang di lapisan depan.
- **Teknis:** DOM berlapis + transform; sensor gerak opsional (izin), fallback geseran jari.

**5.2 Jalan Tak Berujung** · `vanishing_lines`
- **Konsep:** perspektif 1 titik hilang.
- **Mekanik:** seret **titik hilang** di horizon dan tarik tepi jalan menuju titik tersebut. Jika garis tepat, **mobil** melaju sepanjang jalan dengan perspektif yang benar; jika salah, mobil melenceng. Ronde sulit: jalan membelok dan ada rel kereta.
- **Skor:** error sudut garis terhadap titik hilang; deterministik.
- **Efek:** mobil mengecil menuju cakrawala, matahari terbit.
- **Teknis:** `CanvasStage`; sudut garis dihitung terhadap titik hilang acuan.

**5.3 Bangun Kota** · `city_builder`
- **Konsep:** perspektif 2 titik hilang.
- **Mekanik:** dua titik hilang di horizon dengan garis bantu; seret bangunan agar sisi-sisinya sejajar garis bantu (snap ketika cukup tepat). Gedung yang tepat **menyala** dan kota hidup (lampu, kendaraan kecil).
- **Skor:** jumlah gedung terkunci, kecocokan sudut.
- **Efek:** kota menyala dari siang ke malam saat semua selesai.
- **Teknis:** `CanvasStage` + `DragDropKit`; sudut sisi gedung dihitung dari titik hilang.

**5.4 Radar Kedalaman** · `depth_swipe`
- **Konsep:** skala, perspektif atmosfer, detail.
- **Mekanik:** objek muncul di pemandangan berkabut; geser ke **Dekat** atau **Jauh** berdasarkan ukuran, kejelasan warna, dan detail. Slider kabut mengubah tingkat kepucatan untuk memperlihatkan perspektif atmosfer.
- **Skor:** benar/total, combo.
- **Efek:** objek terjauh memudar ke kabut biru.
- **Teknis:** `SwipeDeck`.

**5.5 👑 Boss: Jalan ke Cakrawala** · `canvas_ai`
- **Konsep:** gabungan perspektif.
- **Mekanik:** melukis jalan lurus, tiang listrik, dan gunung. **Tombol "Garis Bantu"** (menampilkan horizon dan titik hilang) dapat dinyalakan, dengan batas penggunaan (menurunkan bonus, bukan syarat lulus).
- **Skor:** rubrik AI; lulus ≥ 70.

---

### 🟫 STAGE 6: Jelajah Waktu

**6.1 Mesin Waktu** · `timeline_sort`
- **Konsep:** urutan zaman seni.
- **Mekanik:** pemain menyeret kartu karya/periode ke garis waktu; setiap penempatan benar membuat **mesin waktu melompat** ke zaman itu dengan latar yang berubah (gua, kapel Renaisans, taman Impresionis).
- **Skor:** posisi benar, waktu.
- **Efek:** transisi latar bergaya "warp".
- **Teknis:** `DragDropKit`; latar ilustrasi orisinal.

**6.2 Siapa Pelukisnya?** · `who_painted` (varian *detektif galeri*)
- **Konsep:** karya klasik dan senimannya.
- **Mekanik:** karya tampil dalam bentuk **zoom sangat dekat**; pemain boleh membuka petunjuk bertahap (zoom keluar, tahun, negara) dengan penalti poin, lalu memilih seniman. Hanya karya **domain publik**.
- **Skor:** benar, poin makin tinggi jika memakai sedikit petunjuk.
- **Efek:** bingkai emas membuka, "stempel" benar.
- **Teknis:** gambar dari Wikimedia Commons berlisensi terbuka/domain publik; simpan atribusi di data.

**6.3 Tebak Gaya** · `swipe_cards` / `tap_match` (varian *zoom keluar*)
- **Konsep:** impresionisme, kubisme, ekspresionisme, dsb.
- **Mekanik:** lukisan muncul sangat berpiksel/zoom dan **perlahan zoom keluar**. Makin cepat pemain menebak gaya, makin banyak poin. 10 putaran.
- **Skor:** benar × faktor kecepatan.
- **Efek:** "pecah" dari piksel menjadi gambar jelas.
- **Teknis:** animasi `scale` + `filter`; domain publik saja.

**6.4 Peta Nusantara** · `map_drag`
- **Konsep:** seni rupa Indonesia.
- **Mekanik:** peta pulau-pulau; seret kartu motif/seni ke daerah asal atau seniman yang tepat (mis. wayang → Jawa, ukiran → daerah terkait). Setelah benar, kartu menampilkan fakta singkat.
- **Skor:** benar/total.
- **Efek:** pulau "menyala" dan lencana budaya muncul.
- **Teknis:** SVG peta sederhana orisinal; data pasangan harus diverifikasi akurasinya oleh penulis konten.

**6.5 👑 Boss: Ujian Akhir (Kurator Muda)** · `marathon_quiz`
- **Konsep:** gabungan seluruh stage.
- **Mekanik:** 10 soal acak dari seluruh bank soal Stage 1-6 dengan 3 kesempatan dalam game dan **lifeline** (50:50, petunjuk, lewati satu soal) yang terbatas. Hanya satu aksi yang boleh dipakai per soal.
- **Skor:** benar/total; lulus ≥ 7 benar.
- **Efek:** panggung "pameran seni" yang makin ramai tiap jawaban benar.
- **Teknis:** soal dari bank konten; jawaban benar diverifikasi di server (seperti kuis chapter).
- **Catatan:** "kesempatan" dalam game ini **bukan** nyawa pemain (jangan memakai ikon tetesan pigmen).

---

## 6. Ide Game Tambahan (Rekomendasi Pengembangan Lanjutan)

Ide di luar 30 game utama untuk meningkatkan keterikatan. **Tidak boleh memakai lawan atau data palsu.**

| Ide | Deskripsi | Prioritas |
|---|---|---|
| **Tantangan Harian** | 1 mini-game kilat per hari dengan seed yang sama untuk semua pemain; skor masuk leaderboard harian dari pemain asli | Tinggi |
| **Warna Hari Ini** | Tebak/racik satu warna per hari (ala kuis harian) | Sedang |
| **Mode Cepat (Speed Run)** | Ulang game yang sudah dikuasai dengan waktu lebih ketat untuk bonus bintang emas | Sedang |
| **Koleksi Stiker Seniman** | Hadiah stiker tiap bintang 3 (kosmetik, tanpa efek ke nyawa/XP) | Sedang |
| **Boss Rush** | Setelah selesai satu stage, ulangi 5 game stage itu berurutan dengan skor gabungan | Rendah |
| **Duel Asinkron** | Tantang pemain asli lain dengan seed sama, bandingkan skor (butuh sistem teman) | Rendah |

---

## 7. Rekomendasi Game Paling Seru (Prioritas Implementasi)

**Lima game "wow factor" yang disarankan dikerjakan lebih dulu karena paling menonjolkan konsep:**

1. **Garis Kilat (1.1):** mengiris garis ala *Fruit Ninja*; sederhana, adiktif, mudah dibangun.
2. **Racik Cat (2.1):** meracik warna dengan tetesan cat; sangat visual dan edukatif.
3. **Pemburu Bayangan (3.2):** menggeser senter dan bayangan bergerak real-time.
4. **Jalan Tak Berujung (5.2):** mobil melaju bila perspektif benar; umpan balik langsung.
5. **Tebak Gaya (6.3):** lukisan zoom keluar dengan kecepatan sebagai poin.

**Urutan pembangunan**

| Fase | Isi | Alasan |
|---|---|---|
| **A: Fondasi** | `GameShell`, `FeedbackFX`, `ResultScreen`, `GhostHand`, `ComboMeter`, dev playground | Dipakai semua game |
| **B: Game berbasis DOM (mudah)** | 1.2, 2.2, 2.3, 2.4, 3.1, 4.4, 5.1, 5.4, 6.1, 6.3, 6.4 | Memakai `DragDropKit`/`SwipeDeck` |
| **C: Game kanvas** | 1.1, 1.3, 1.4, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.2, 5.3 | Butuh `CanvasStage` dan geometri |
| **D: Racik & editor** | 2.1, 1.5, 4.5 | Logika lebih kompleks (campur warna, editor) |
| **E: Boss AI** | 2.5, 3.5, 5.5 + `marathon_quiz` 6.5 | Bergantung `/api/evaluate` dan bank soal |

Chapter yang game-nya belum jadi memakai **fallback** (kuis tambahan) sehingga seluruh 30 chapter tetap bisa dimainkan sejak awal.

---

## 8. Konfigurasi Data (Contoh)

Setiap chapter menyimpan mini-game di `content/curriculum.json`:

```json
"minigame": {
  "type": "color_mixer",
  "title": "Racik Cat",
  "intro": "Campur cat sampai warnanya sama dengan pesanan!",
  "rounds": 3,
  "config": {
    "palette": ["merah", "kuning", "biru", "putih", "hitam"],
    "orders": [
      { "name": "Hijau daun", "target": "#4CAF50", "timeLimitSec": 40 },
      { "name": "Oranye matahari", "target": "#FF8C1A", "timeLimitSec": 35 }
    ],
    "colorModel": "RYB",
    "passDeltaE": 12
  }
}
```
```json
"minigame": {
  "type": "vanishing_lines",
  "title": "Jalan Tak Berujung",
  "rounds": 3,
  "config": {
    "horizonY": 0.45,
    "vanishingPoint": { "x": 0.5, "y": 0.45 },
    "toleranceDeg": 4,
    "extras": ["rel_kereta"]
  }
}
```
Warna dan koordinat di atas adalah **konfigurasi konten**, bukan data pengguna.

---

## 9. Persyaratan Non-Fungsional

| Aspek | Persyaratan |
|---|---|
| **Performa** | ≥ 50 fps di HP kelas menengah; hindari *re-render* React pada loop game (gunakan `requestAnimationFrame` dan ref); aset gambar SVG/WebP teroptimasi |
| **Ukuran** | Bundel tiap game ≤ 150 KB gzip, dimuat saat dibutuhkan |
| **Input** | Pointer Events; `touch-action: none` pada area game; area sentuh ≥ 44 px; cegah gulir halaman saat menyeret |
| **Aksesibilitas** | Semua game drag punya mode **ketuk-pilih** sebagai alternatif; mode ramah buta warna (label teks/pola pada game warna); dukung *reduced motion* (kurangi partikel/goyang); kontras memadai; teks instruksi selalu tampil |
| **Audio dan getar** | Dapat dimatikan; getar hanya jika perangkat mendukung |
| **Offline/jaringan buruk** | Game berjalan di client tanpa jaringan; hanya `complete` dan `evaluate` yang butuh koneksi. Jika gagal kirim, tampilkan "Coba kirim lagi" tanpa kehilangan skor |
| **Keamanan** | Skor divalidasi server (Bagian 4.6); kunci jawaban kuis tidak dikirim ke client; tidak ada rahasia di bundel |
| **Privasi** | Telemetri hanya agregat anonim (skor, durasi, jumlah salah per game); tidak ada gambar kanvas yang disimpan |
| **Lisensi aset** | Ilustrasi orisinal/berlisensi terbuka; karya seni Stage 6 hanya domain publik, atribusi di data |

---

## 10. Metrik dan Telemetri (Agregat)

Per game dicatat: jumlah dimainkan, skor rata-rata, durasi rata-rata, persentase selesai, persentase ulang. Dipakai untuk menyeimbangkan kesulitan:
- Skor rata-rata < 50 → game terlalu sulit, turunkan kesulitan ronde 2-3.
- Skor rata-rata > 90 → terlalu mudah, tambahkan jebakan/waktu lebih ketat.
- Persentase selesai < 70 → tutorial atau mekanik kurang jelas.

---

## 11. Definition of Done dan Pengujian

**Per game**
- [ ] Mekanik inti mengajarkan konsep chapter (bukan sekadar tema visual).
- [ ] Ada tutorial `GhostHand` dan hitung mundur sebelum mulai.
- [ ] 3 ronde dengan kesulitan naik; hasil acak berbasis seed.
- [ ] Umpan balik benar/salah instan (visual + suara/getar yang bisa dimatikan).
- [ ] Mode alternatif non-drag atau non-warna tersedia.
- [ ] Skor 0-100 dinormalisasi; unit test fungsi skor (kasus: sempurna, kosong, setengah benar).
- [ ] Dapat dimainkan di layar 360 px dengan satu jari.
- [ ] Tidak mengurangi nyawa; keluar di tengah game tidak menghukum.
- [ ] Layar hasil memiliki tombol hijau **LANJUT**.
- [ ] Berjalan tanpa error di `/dev/games/[type]`.

**Sistem**
- [ ] Seluruh 30 chapter memuat game atau fallback tanpa crash.
- [ ] Server menolak/membatasi skor dengan durasi tidak wajar.
- [ ] Tidak ada data dummy (lawan palsu, leaderboard palsu) pada game apa pun.
- [ ] Bundel game dimuat dinamis; halaman peta tidak memuat kode game.
- [ ] Uji coba pengguna: 5 orang memahami cara main tanpa bantuan teks panjang.

---

## 12. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| 30 game terlalu banyak untuk dikerjakan sekaligus | Komponen dasar bersama, fase A-E, fallback kuis |
| Game kanvas lag di HP murah | Loop `requestAnimationFrame`, kurangi partikel, uji di perangkat low-end |
| Skor client dapat dimanipulasi | Mini-game hanya memengaruhi bintang; validasi durasi; game deterministik dihitung ulang server |
| Perbedaan fisika sentuh antar browser | `touch-action: none`, Pointer Events, uji di Android Chrome dan iOS Safari |
| Konten sejarah/budaya tidak akurat | Penulis konten memverifikasi data Stage 6, simpan sumber |
| Aset berhak cipta | Hanya aset orisinal/domain publik; catat atribusi |
| Pencampuran warna tidak sesuai teori | Gunakan model RYB, uji unit kombinasi dasar (biru+kuning=hijau, dst.) |
