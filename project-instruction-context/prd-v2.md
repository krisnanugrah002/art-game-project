# PRD Addendum v2.1
## Login Username-Only + Kurikulum 6 Stage (Kuis & Mini-Game)

> **Cara pakai dokumen ini:** dokumen ini **menggantikan** bagian Autentikasi (Supabase Auth/Social Login), Path Selection (3 jalur), dan struktur level di PRD v2. Bagian lain PRD v2 (nyawa, XP, streak, AI Critic, RLS, dsb.) tetap berlaku kecuali disebut di sini.
>
> **Catatan untuk AI coding agent (Antigravity):** konten permainan **harus data-driven**. Jangan hardcode satu stage. Aplikasi wajib membaca seluruh **6 stage × 5 chapter** dari seed data (bagian 6) dan menampilkan semuanya di peta (lihat Acceptance Criteria bagian 8).

---

## 1. Ringkasan Perubahan

| Topik | Sebelumnya | Sekarang |
|---|---|---|
| Login | Google/GitHub (Supabase Auth) | **Username saja, tanpa password** |
| Jalur belajar | 3 jalur (Lukis, DKV, Kriya) | **1 jalur "Seni Rupa Dasar"** dengan 6 Stage (jalur lain ditunda) |
| Struktur | Unit → Node | **Stage → Chapter** (4-5 chapter per stage, chapter terakhir = Boss) |
| Pembelajaran | Teori, kuis, kanvas | Setiap chapter punya **kuis + mini-game unik** |

---

## 2. Login Username-Only

### 2.1 Alur Layar Awal
Saat pertama kali membuka web, pengguna melihat layar sambutan:

```
🎨 Selamat datang di [Nama Platform]!

Masukkan username untuk mulai belajar.

[ ______________ ]   [Mulai / Lanjutkan]

ℹ️ Username kamu menyimpan semua progres: stage yang
sudah dibuka, XP, streak, dan nyawa. Kalau besok kamu
kembali (atau nyawa habis lalu kamu menutup browser),
cukup masukkan username yang sama untuk melanjutkan.
Tanpa password, jadi catat username kamu ya!
```

### 2.2 Aturan Username
- 3-16 karakter; huruf (a-z), angka, dan underscore.
- **Tidak peka huruf besar/kecil** (`Raka` = `raka`). Simpan versi huruf kecil sebagai kunci unik, dan simpan versi asli untuk tampilan.
- Tolak kata terlarang/tidak pantas.
- Pesan error jelas (mis. "Username minimal 3 karakter").

### 2.3 Logika Pencarian (Hindari Tertimpa Tidak Sengaja)
Setelah pengguna menekan tombol, server memeriksa username:

| Kondisi | Tampilan |
|---|---|
| **Username belum ada** | "Username `raka` belum dipakai. Buat akun baru dengan nama ini?" → tombol **Buat & Mulai** / **Ganti nama** |
| **Username sudah ada** | "Username `raka` sudah punya progres (Stage 2, 120 XP). Ini kamu? Lanjutkan?" → tombol **Ya, lanjutkan** / **Bukan aku, ganti nama** |

Ringkasan progres pada layar konfirmasi membantu pengguna memastikan itu memang akunnya. Jangan tampilkan data sensitif apa pun.

### 2.4 Sesi di Browser
- Setelah masuk, server membuat **token sesi bertanda tangan** (mis. JWT dengan `jose`) dan menyimpannya di **cookie `httpOnly`, `Secure`, `SameSite=Lax`**, masa berlaku panjang (mis. 1 tahun).
- Pengguna yang membuka web lagi di browser yang sama **langsung masuk tanpa mengetik username**.
- Di browser/perangkat lain: ketik username lagi.
- Menu profil punya tombol **"Ganti pengguna / Keluar"**.

### 2.5 Keamanan dan Batasan (Wajib Dipahami)
Tanpa password, **siapa pun yang mengetahui username seseorang dapat membuka progres orang itu**. Untuk tahap ini hal itu diterima, dengan mitigasi:

- Beri tahu pengguna: **jangan memakai nama asli lengkap atau data pribadi** sebagai username.
- **Tidak ada data sensitif** yang disimpan (tidak ada email, nomor telepon, dll.).
- Rate limit pembuatan akun dan percobaan masuk per IP (mis. Upstash Redis).
- Fitur publik (Gallery) **default privat**.
- Tidak ada pemulihan akun: jika username lupa, progres tidak bisa dipulihkan. Tampilkan pengingat "Catat username kamu".
- **Peningkatan di masa depan (opsional):** PIN 4 digit, atau tautkan Google login untuk yang ingin akun lebih aman.

### 2.6 Dampak Teknis ke Database dan RLS
Karena tidak memakai Supabase Auth, `auth.uid()` tidak tersedia:

- Buat tabel **`players`**: `id (uuid)`, `username_key (unique, lowercase)`, `display_name`, `timezone`, `created_at`, `last_seen_at`.
- Semua tabel progres (`user_stats`, `chapter_progress`, `submissions`, `xp_events`) memakai **`player_id`** sebagai kunci.
- **RLS diaktifkan dengan kebijakan menolak semua akses langsung dari client (deny-all untuk role `anon`).** Seluruh baca/tulis lewat **API Route Next.js** yang memvalidasi cookie sesi lalu memakai `SUPABASE_SERVICE_ROLE_KEY` di server. Service key tidak boleh ke browser.
- Pada setiap API, ambil `player_id` **dari token sesi**, bukan dari body request, agar pengguna tidak bisa memalsukan ID orang lain.
- Nyawa, XP, streak tetap dihitung **server-side dengan jam server** (lazy evaluation, lihat PRD v2 bagian 5).

### 2.7 Persistensi Nyawa
Skenario yang harus lolos uji:
1. Pengguna bermain sampai nyawa 0, menutup browser.
2. Esok hari membuka web: cookie masih ada → langsung masuk, **atau** mengetik username yang sama.
3. Nyawa sudah terisi sesuai waktu berlalu (1 nyawa/jam, maks 5), progres stage utuh, streak dievaluasi sesuai tanggal.

---

## 3. Struktur Permainan

### 3.1 Hierarki
```
Jalur: Seni Rupa Dasar
 └─ Stage 1..6
     └─ Chapter 1..5   (chapter 5 = BOSS)
         └─ Sesi: Teori (2 kartu) → Kuis (3 soal) → Mini-Game (1-2 menit) → Hasil
```

### 3.2 Aturan Sesi Chapter
1. **Micro-Theory:** 2 kartu, maks 2 kalimat per kartu, dengan ilustrasi.
2. **Kuis:** 3 soal pilihan ganda visual/teks. Salah = **-1 nyawa**.
3. **Mini-Game:** permainan unik tiap chapter. **Tidak mengurangi nyawa**; hasilnya berupa skor dan bintang (agar tetap menyenangkan dan tidak menekan).
4. **Hasil:** 1-3 bintang, XP, animasi.

### 3.3 Bintang dan XP

| Bintang | Syarat |
|---|---|
| ⭐ | Menyelesaikan chapter |
| ⭐⭐ | ≥ 2 soal kuis benar **dan** skor mini-game ≥ 70% |
| ⭐⭐⭐ | 3 soal benar **dan** skor mini-game ≥ 90% |

- Selesai chapter: **+10 XP**; 3 bintang: **+5 bonus XP**; Boss lulus: **+25 XP**.
- Chapter bisa diulang kapan saja (Practice Mode tanpa nyawa), XP hanya didapat saat peningkatan bintang.

### 3.4 Aturan Unlock
- Chapter berikutnya terbuka setelah chapter sebelumnya selesai (≥ 1 bintang).
- Stage berikutnya terbuka setelah **Boss** stage ini lulus.
- Boss lulus: kuis ≥ 2 benar **dan** tantangan boss mencapai passing score (lihat tiap boss).
- Boss tidak mengurangi nyawa dan bisa diulang.

### 3.5 Peta Pembelajaran
Peta menampilkan **6 stage**, masing-masing berisi **5 node chapter** (node terakhir berbentuk ikon boss/mahkota). Stage yang terkunci tampak redup dengan ikon gembok. Node menampilkan bintang yang sudah diraih.

---

## 4. Pustaka Tipe Mini-Game (untuk Implementasi)

Sebagian besar mini-game **dinilai secara deterministik di sisi server/klien tanpa AI** (hemat biaya, konsisten). Hanya Boss bertipe `canvas_ai` yang memakai Gemini.

| ID Tipe | Deskripsi | Penilaian |
|---|---|---|
| `tap_match` | Ketuk item yang sesuai perintah sebelum waktu habis | Jumlah benar / total |
| `drag_sort` | Seret kartu ke kategori atau urutan yang benar | Jumlah posisi benar |
| `hotspot_find` | Temukan objek tersembunyi dengan mengetuk gambar | Jumlah ditemukan / target |
| `trace_path` | Ikuti jalur dengan jari | Jarak rata-rata ke jalur (toleransi piksel) |
| `shape_builder` | Susun bentuk dasar menjadi objek | Kecocokan posisi/jenis bentuk dengan template |
| `color_mixer` | Campur warna dengan slider/tetes cat untuk mencapai target | Selisih warna (jarak RGB/HSL) |
| `memory_match` | Cocokkan kartu berpasangan | Jumlah langkah vs minimum |
| `swipe_cards` | Geser kartu kiri/kanan untuk kategori | Jumlah benar |
| `palette_pick` | Pilih palet yang sesuai untuk sebuah adegan | Benar/salah + waktu |
| `gradient_sort` | Urutkan petak dari gelap ke terang | Posisi benar |
| `shadow_tap` | Ketuk bayangan/area cahaya pada ilustrasi | Hotspot benar |
| `texture_match` | Cocokkan foto tekstur dengan nama | Jumlah pasangan benar |
| `shade_brush` | Arsir/gradasi dengan kuas pada bentuk | Pengecekan luminans bertahap (deterministik) |
| `thirds_placer` | Seret subjek ke titik rule of thirds | Jarak ke titik power |
| `balance_scale` | Seret objek ke timbangan hingga seimbang | Selisih bobot visual |
| `focal_tap` | Ketuk elemen yang paling menonjol / buat menonjol | Hotspot benar |
| `pattern_complete` | Lengkapi pola yang hilang | Benar/salah |
| `layer_stack` | Susun lapisan depan-tengah-belakang | Urutan benar |
| `vanishing_lines` | Seret titik hilang dan tarik garis ke horizon | Toleransi sudut garis |
| `city_builder` | Letakkan bangunan mengikuti garis perspektif | Kecocokan sudut |
| `depth_swipe` | Geser: objek "dekat" atau "jauh" | Jumlah benar |
| `timeline_sort` | Urutkan zaman/karya pada garis waktu | Posisi benar |
| `who_painted` | Cocokkan karya dengan senimannya | Jumlah benar |
| `map_drag` | Seret motif/karya ke peta asal | Jumlah benar |
| `marathon_quiz` | Kuis beruntun dengan 3 "kesempatan" | Jumlah benar / total |
| `canvas_ai` | Kanvas bebas dinilai AI dengan rubrik (khusus Boss) | Skor rubrik server-side |

---

## 5. Kurikulum Lengkap

Format soal: `(A) (B) (C) → jawaban`. Soal dapat diacak urutan pilihannya. Penulis konten disarankan menambah gambar pada soal bertanda 🖼️.

---

### 🟦 STAGE 1: Dunia Garis & Bentuk
*Tema: dasar unsur seni rupa. Maskot: "Pensil si Garis".*

| Ch | Judul | Mini-Game | Tipe | Cara Main |
|---|---|---|---|---|
| 1 | Kenali Garis | **Garis Kilat** | `tap_match` | Garis muncul bergantian; ketuk yang sesuai perintah ("Cari garis zigzag!") dalam 30 detik. |
| 2 | Geometris vs Organik | **Sortir Kilat** | `drag_sort` | Benda jatuh dari atas; seret ke keranjang "Geometris" atau "Organik" sebelum menyentuh dasar. |
| 3 | Titik, Garis, Bidang | **Detektif Bentuk** | `hotspot_find` | Temukan 8 bentuk tersembunyi di lukisan kota dalam 60 detik. |
| 4 | Garis Kontur | **Ikuti Jalur** | `trace_path` | Telusuri tepi siluet binatang dengan jari, makin akurat makin tinggi skor. |
| 5 | 👑 **BOSS: Monster Bentuk** | **Rakit Monster** | `shape_builder` (+ opsi `canvas_ai`) | Susun lingkaran, segitiga, dan persegi menjadi monster sesuai "permintaan" (mis. kepala bulat, 2 tanduk segitiga, badan kotak). Lulus bila ≥ 80% bentuk sesuai. |

**Kuis**

**Ch1 Kenali Garis**
1. Garis yang naik-turun seperti ombak disebut? (A) Lurus (B) Bergelombang (C) Putus-putus → **B**
2. Garis horizontal umumnya memberi kesan? (A) Tenang dan stabil (B) Cepat dan marah (C) Tegang → **A**
3. Garis diagonal umumnya memberi kesan? (A) Diam (B) Gerak/dinamis (C) Sejuk → **B**

**Ch2 Geometris vs Organik**
1. Mana yang termasuk bentuk organik? (A) Daun (B) Kotak korek (C) Penggaris → **A**
2. Lingkaran, persegi, dan segitiga termasuk bentuk? (A) Organik (B) Geometris (C) Abstrak → **B**
3. Benda yang memiliki panjang, lebar, dan tinggi disebut bentuk? (A) Satu dimensi (B) Dua dimensi (C) Tiga dimensi → **C**

**Ch3 Titik, Garis, Bidang**
1. Unsur seni rupa yang paling kecil? (A) Titik (B) Bidang (C) Garis → **A**
2. Titik-titik yang disusun berurutan membentuk? (A) Warna (B) Garis (C) Tekstur → **B**
3. Garis yang tertutup membentuk? (A) Bidang (B) Titik (C) Cahaya → **A**

**Ch4 Garis Kontur**
1. Garis kontur menggambarkan? (A) Warna benda (B) Tepi/batas bentuk benda (C) Bayangan → **B**
2. Menggambar kontur sambil tidak melihat kertas disebut? (A) Blind contour (B) Cross-hatching (C) Perspektif → **A**
3. Agar kontur rapi, gerakkan tangan? (A) Cepat asal jadi (B) Pelan mengikuti tepi objek (C) Berhenti tiap detik → **B**

**Ch5 Boss**
1. Kepala monster yang bulat memakai bentuk dasar? (A) Lingkaran (B) Segitiga (C) Persegi panjang → **A**
2. Bentuk dasar yang memberi kesan runcing/tajam? (A) Lingkaran (B) Segitiga (C) Oval → **B**
3. Menyusun bentuk dasar menjadi sebuah objek disebut? (A) Konstruksi bentuk (B) Arsir (C) Gradasi → **A**

---

### 🟥 STAGE 2: Pesta Warna
*Tema: teori warna. Maskot: "Tetes si Pigmen".*

| Ch | Judul | Mini-Game | Tipe | Cara Main |
|---|---|---|---|---|
| 1 | Primer, Sekunder, Tersier | **Racik Cat** | `color_mixer` | Pelanggan memesan warna (mis. "hijau daun"); campur tetes merah/kuning/biru hingga cocok. |
| 2 | Roda Warna & Komplementer | **Pasangan Lawan** | `memory_match` | Balik kartu untuk mencocokkan warna dengan pasangan komplementernya. |
| 3 | Hangat vs Dingin | **Termometer Warna** | `swipe_cards` | Geser kartu warna/gambar ke kanan (hangat) atau kiri (dingin) dengan cepat. |
| 4 | Harmoni Warna | **Stylist Palet** | `palette_pick` | Tiga adegan muncul; pilih palet yang paling harmonis (analogus/monokromatik/triadik). |
| 5 | 👑 **BOSS: Senja di Pantai** | **Lukis Matahari Terbenam** | `canvas_ai` | Lukis matahari terbenam memakai palet terbatas (5 warna). Passing score 75. |

**Rubrik Boss (untuk AI Critic)**
- c1 (30): Terdapat matahari/lingkaran terang yang jelas.
- c2 (40): Palet didominasi warna hangat yang harmonis (analogus).
- c3 (30): Ada kontras antara langit dan elemen lain (laut/siluet).

**Kuis**

**Ch1 Primer, Sekunder, Tersier**
1. Tiga warna primer (pigmen cat)? (A) Merah, kuning, biru (B) Hijau, ungu, oranye (C) Hitam, putih, abu → **A**
2. Biru + kuning = ? (A) Ungu (B) Hijau (C) Oranye → **B**
3. Merah + kuning = ? (A) Oranye (B) Cokelat (C) Merah muda → **A**

**Ch2 Roda Warna & Komplementer**
1. Warna yang berseberangan di roda warna disebut? (A) Analogus (B) Komplementer (C) Monokromatik → **B**
2. Komplementer biru? (A) Oranye (B) Hijau (C) Ungu → **A**
3. Komplementer kuning? (A) Oranye (B) Ungu (C) Hijau → **B**

**Ch3 Hangat vs Dingin**
1. Manakah warna dingin? (A) Merah (B) Biru (C) Kuning → **B**
2. Warna hangat cenderung memberi kesan? (A) Energik dan hangat (B) Sejuk (C) Sunyi → **A**
3. Pantai tenang di pagi hari cocok didominasi? (A) Merah-oranye menyala (B) Biru-hijau lembut (C) Hitam pekat → **B**

**Ch4 Harmoni Warna**
1. Warna yang bersebelahan di roda warna disebut harmoni? (A) Analogus (B) Komplementer (C) Triadik → **A**
2. Satu warna dengan variasi terang-gelap disebut? (A) Monokromatik (B) Triadik (C) Kontras → **A**
3. Tiga warna berjarak sama di roda warna disebut? (A) Analogus (B) Monokromatik (C) Triadik → **C**

**Ch5 Boss**
1. Palet matahari terbenam yang hangat? (A) Merah-oranye-kuning (B) Biru-ungu (C) Hitam-putih → **A**
2. Menambahkan putih pada warna menghasilkan? (A) Shade (B) Tint (C) Komplementer → **B**
3. Agar matahari menonjol di langit biru-ungu, gunakan? (A) Warna senada (B) Warna kontras hangat (C) Abu-abu → **B**

---

### 🟨 STAGE 3: Cahaya, Bayangan & Tekstur
*Tema: value dan volume. Maskot: "Lampu si Cahaya".*

| Ch | Judul | Mini-Game | Tipe | Cara Main |
|---|---|---|---|---|
| 1 | Value (Gelap-Terang) | **Tangga Gradasi** | `gradient_sort` | Urutkan petak abu-abu acak dari paling gelap ke paling terang secepatnya. |
| 2 | Cahaya & Bayangan | **Pemburu Bayangan** | `shadow_tap` | Ketuk semua *cast shadow* dan *highlight* pada ilustrasi ruangan; sumber cahaya bisa berpindah tiap ronde. |
| 3 | Tekstur | **Tebak Rasa Permukaan** | `texture_match` | Cocokkan foto close-up tekstur (kayu, kain goni, kaca, daun) dengan namanya. |
| 4 | Arsir & Gradasi | **Arsir Bola** | `shade_brush` | Arsir sebuah bola datar hingga tampak bervolume sesuai arah cahaya. |
| 5 | 👑 **BOSS: Trio Bervolume** | **Bola, Kubus, Silinder** | `canvas_ai` | Gambar satu bentuk 3D dengan arsiran dan bayangan. Passing score 70. |

**Rubrik Boss**
- c1 (30): Bentuk dasar terbaca jelas (bola/kubus/silinder).
- c2 (40): Ada gradasi gelap-terang konsisten dengan satu arah cahaya.
- c3 (30): Ada bayangan jatuh (cast shadow) di bawah/samping objek.

**Kuis**

**Ch1 Value**
1. Value dalam seni rupa adalah? (A) Tingkat gelap-terang (B) Jenis garis (C) Nama warna → **A**
2. Warna + putih = ? (A) Tint (B) Shade (C) Hue → **A**
3. Warna + hitam = ? (A) Tint (B) Shade (C) Hue → **B**

**Ch2 Cahaya & Bayangan**
1. Bayangan yang jatuh di lantai/meja disebut? (A) Cast shadow (B) Form shadow (C) Highlight → **A**
2. Bagian paling terang pada benda yang memantulkan cahaya? (A) Highlight (B) Outline (C) Kontur → **A**
3. Jika cahaya datang dari kanan, bayangan jatuh ke? (A) Kanan (B) Kiri (C) Atas → **B**

**Ch3 Tekstur**
1. Tekstur yang bisa diraba langsung disebut? (A) Nyata (B) Semu (C) Hanya warna → **A**
2. Lukisan kulit kayu tampak kasar padahal kanvasnya halus; ini tekstur? (A) Nyata (B) Semu/visual (C) Tidak ada → **B**
3. Amplas memiliki tekstur? (A) Halus (B) Kasar (C) Licin → **B**

**Ch4 Arsir & Gradasi**
1. Arsir adalah? (A) Garis sejajar untuk membuat area gelap (B) Mencampur cat (C) Menghapus gambar → **A**
2. Arsir silang disebut? (A) Cross-hatching (B) Blind contour (C) Stippling → **A**
3. Agar area lebih gelap, garis arsir dibuat? (A) Lebih renggang (B) Lebih rapat/berlapis (C) Lebih putus → **B**

**Ch5 Boss**
1. Bola dengan cahaya dari kiri atas; bagian paling gelap berada di? (A) Kanan bawah (B) Kiri atas (C) Tengah atas → **A**
2. Agar bola tampak menapak di meja, tambahkan? (A) Cast shadow di bawah bola (B) Warna merah (C) Garis tebal → **A**
3. Gradasi halus dari terang ke gelap membuat bentuk tampak? (A) Pipih (B) Bervolume (3D) (C) Transparan → **B**

---

### 🟩 STAGE 4: Seni Menata (Komposisi)
*Tema: prinsip desain. Maskot: "Bingkai si Penata".*

| Ch | Judul | Mini-Game | Tipe | Cara Main |
|---|---|---|---|---|
| 1 | Rule of Thirds | **Fotografer Dadakan** | `thirds_placer` | Seret karakter/objek ke titik power pada grid 3×3 untuk "memotret" 5 adegan. |
| 2 | Keseimbangan | **Timbangan Seni** | `balance_scale` | Letakkan objek berbobot visual berbeda di kiri/kanan sampai timbangan seimbang. |
| 3 | Pusat Perhatian | **Mata Pertama** | `focal_tap` | Ketuk elemen yang pertama menarik mata; di ronde lanjut ubah kontras agar objek target menonjol. |
| 4 | Irama, Pola, Kesatuan | **Lengkapi Pola** | `pattern_complete` | Lengkapi pola motif (termasuk motif batik sederhana) dengan memilih potongan yang hilang. |
| 5 | 👑 **BOSS: Poster Mini** | **Desainer Poster** | `shape_builder` / drag & drop (+ opsi `canvas_ai`) | Susun judul, gambar utama, dan elemen pendukung pada poster; dinilai dari aturan komposisi (fokus di titik sepertiga, kontras teks, keseimbangan). Lulus ≥ 75%. |

**Kuis**

**Ch1 Rule of Thirds**
1. Rule of thirds membagi bidang menjadi? (A) 3×3 bagian (B) 2×2 bagian (C) 4×4 bagian → **A**
2. Berapa titik pertemuan garis pada grid tersebut? (A) 2 (B) 4 (C) 9 → **B**
3. Garis horizon sebaiknya diletakkan? (A) Tepat di tengah (B) Di garis sepertiga (C) Di pojok → **B**

**Ch2 Keseimbangan**
1. Keseimbangan yang sama persis di kiri dan kanan? (A) Simetris (B) Asimetris (C) Radial → **A**
2. Objek berbeda di kiri-kanan tetapi terasa seimbang? (A) Simetris (B) Asimetris (C) Radial → **B**
3. Keseimbangan yang memusat dari tengah seperti bunga atau roda? (A) Simetris (B) Asimetris (C) Radial → **C**

**Ch3 Pusat Perhatian**
1. Bagian yang pertama menarik mata disebut? (A) Focal point (B) Margin (C) Siluet → **A**
2. Cara mudah membuat objek menonjol? (A) Beri kontras warna/ukuran (B) Samakan semua elemen (C) Buat kecil dan pudar → **A**
3. Satu apel merah di antara apel hijau mencolok karena? (A) Kontras warna (B) Tekstur (C) Ritme → **A**

**Ch4 Irama, Pola, Kesatuan**
1. Pengulangan elemen secara teratur menciptakan? (A) Irama/ritme (B) Kontras (C) Fokus → **A**
2. Motif batik yang berulang adalah contoh? (A) Pola (B) Perspektif (C) Siluet → **A**
3. Kesatuan (unity) berarti? (A) Semua unsur terasa selaras (B) Semua unsur berbeda total (C) Hanya satu objek → **A**

**Ch5 Boss**
1. Elemen terpenting pada poster sebaiknya diletakkan di? (A) Titik sepertiga/pusat perhatian (B) Pojok tersembunyi (C) Pinggir bawah → **A**
2. Teks judul poster harus? (A) Kontras dengan latar agar terbaca (B) Sewarna latar (C) Sangat kecil → **A**
3. Terlalu banyak elemen dengan gaya berbeda dapat merusak? (A) Kesatuan (B) Perspektif (C) Tekstur → **A**

---

### 🟪 STAGE 5: Menembus Ruang (Perspektif)
*Tema: kedalaman. Maskot: "Si Garis Horizon".*

| Ch | Judul | Mini-Game | Tipe | Cara Main |
|---|---|---|---|---|
| 1 | Depan, Tengah, Belakang | **Susun Panggung** | `layer_stack` | Seret pohon, rumah, gunung ke lapisan foreground, middle ground, background agar pemandangan terlihat dalam. |
| 2 | Perspektif 1 Titik Hilang | **Jalan Tak Berujung** | `vanishing_lines` | Seret titik hilang di horizon lalu tarik garis tepi jalan ke arahnya; garis tepat memunculkan jalan 3D. |
| 3 | Perspektif 2 Titik Hilang | **Bangun Kota** | `city_builder` | Letakkan gedung dengan mengikuti garis bantu dua titik hilang; gedung tepat "mengunci" ke kota. |
| 4 | Dekat atau Jauh? | **Radar Kedalaman** | `depth_swipe` | Geser kartu objek (ukuran, detail, kejelasan warna) ke "dekat" atau "jauh". |
| 5 | 👑 **BOSS: Jalan ke Cakrawala** | **Lukis Jalan Raya** | `canvas_ai` | Gambar jalan lurus dengan tiang listrik dan gunung di kejauhan. Passing score 70. |

**Rubrik Boss**
- c1 (40): Garis tepi jalan bertemu di satu titik pada horizon.
- c2 (30): Tiang/objek mengecil dan merapat ke kejauhan.
- c3 (30): Gunung/objek jauh tampak lebih pucat atau kurang detail.

**Kuis**

**Ch1 Depan, Tengah, Belakang**
1. Bagian paling dekat dengan penonton disebut? (A) Foreground (B) Background (C) Horizon → **A**
2. Objek yang menutupi objek lain terkesan? (A) Lebih dekat (B) Lebih jauh (C) Sama jauh → **A**
3. Tiga lapisan ruang: depan, tengah, dan? (A) Latar belakang (B) Kontur (C) Highlight → **A**

**Ch2 Perspektif 1 Titik Hilang**
1. Titik tempat garis sejajar tampak bertemu disebut? (A) Titik hilang (B) Titik fokus (C) Titik balik → **A**
2. Titik hilang berada pada? (A) Garis horizon (B) Dasar kertas (C) Sudut bawah → **A**
3. Rel kereta api yang menyempit ke kejauhan adalah contoh perspektif? (A) 1 titik hilang (B) 2 titik hilang (C) 3 titik hilang → **A**

**Ch3 Perspektif 2 Titik Hilang**
1. Kubus yang dilihat dari sudutnya memakai? (A) 1 titik hilang (B) 2 titik hilang (C) Tanpa titik → **B**
2. Pada perspektif 2 titik, garis vertikal bangunan tetap? (A) Tegak lurus (B) Miring ke titik hilang (C) Melengkung → **A**
3. Dua titik hilang berada di? (A) Garis horizon kiri dan kanan (B) Dasar kertas (C) Tengah lukisan → **A**

**Ch4 Dekat atau Jauh?**
1. Objek yang jauh tampak? (A) Lebih kecil (B) Lebih besar (C) Sama → **A**
2. Pada perspektif atmosfer, gunung jauh tampak? (A) Lebih pucat/kebiruan dan kabur (B) Lebih tajam dan gelap (C) Lebih merah → **A**
3. Detail paling jelas terlihat pada objek? (A) Dekat (B) Jauh (C) Sama jelas → **A**

**Ch5 Boss**
1. Pada jalan lurus ke cakrawala, garis tepi jalan bertemu di? (A) Titik hilang di horizon (B) Langit paling atas (C) Dasar kertas → **A**
2. Tiang listrik makin jauh tampak makin? (A) Kecil dan rapat (B) Besar (C) Sama → **A**
3. Agar pegunungan tampak jauh, warnanya dibuat? (A) Pucat kebiruan (B) Merah pekat (C) Hitam → **A**

---

### 🟫 STAGE 6: Jelajah Waktu (Sejarah & Gaya Seni)
*Tema: sejarah seni dunia dan Nusantara. Maskot: "Kurator si Burung Hantu".*

| Ch | Judul | Mini-Game | Tipe | Cara Main |
|---|---|---|---|---|
| 1 | Seni Prasejarah | **Mesin Waktu** | `timeline_sort` | Seret periode/karya ke garis waktu dari zaman prasejarah sampai modern. |
| 2 | Renaisans | **Siapa Pelukisnya?** | `who_painted` | Cocokkan karya klasik domain publik dengan senimannya. |
| 3 | Impresionisme & Modern | **Tebak Gaya** | `swipe_cards` / `tap_match` | Lihat potongan lukisan; tebak gayanya (impresionisme, kubisme, ekspresionisme) sebelum waktu habis. |
| 4 | Seni Rupa Indonesia | **Peta Nusantara** | `map_drag` | Seret motif, wayang, dan karya ke daerah asal atau seniman yang tepat di peta. |
| 5 | 👑 **BOSS: Kurator Muda** | **Ujian Akhir Maraton** | `marathon_quiz` | 10 soal acak dari seluruh Stage 1-6 dengan 3 kesempatan. Lulus bila ≥ 7 benar. |

> **Catatan lisensi:** gunakan hanya karya **domain publik** (seniman yang wafat lebih dari 70 tahun lalu) atau gambar lisensi terbuka. Untuk seniman modern, gunakan deskripsi teks, bukan reproduksi gambar.

**Kuis**

**Ch1 Seni Prasejarah**
1. Lukisan cap tangan dan hewan di gua Leang-Leang berada di pulau? (A) Sulawesi (B) Jawa (C) Bali → **A**
2. Subjek utama lukisan gua prasejarah? (A) Hewan buruan dan cap tangan (B) Gedung bertingkat (C) Potret raja → **A**
3. Urutan zaman yang benar? (A) Prasejarah → Renaisans → Impresionisme (B) Impresionisme → Prasejarah → Renaisans (C) Renaisans → Prasejarah → Impresionisme → **A**

**Ch2 Renaisans**
1. Pelukis *Mona Lisa*? (A) Michelangelo (B) Leonardo da Vinci (C) Van Gogh → **B**
2. Langit-langit Kapel Sistina dilukis oleh? (A) Michelangelo (B) Monet (C) Picasso → **A**
3. Kata "Renaisans" berarti? (A) Kelahiran kembali (B) Cahaya (C) Warna → **A**

**Ch3 Impresionisme & Modern**
1. *The Starry Night* dilukis oleh? (A) Monet (B) Van Gogh (C) Da Vinci → **B**
2. Ciri impresionisme? (A) Sapuan kuas cepat yang menangkap kesan cahaya (B) Bentuk patah-patah geometris (C) Gambar sangat detail seperti foto → **A**
3. Kubisme dipelopori oleh? (A) Picasso dan Braque (B) Monet dan Renoir (C) Da Vinci dan Raphael → **A**

**Ch4 Seni Rupa Indonesia**
1. Raden Saleh terkenal dengan lukisan? (A) Penangkapan Pangeran Diponegoro (B) Mona Lisa (C) The Starry Night → **A**
2. Affandi dikenal dengan gaya? (A) Ekspresif, cat sering langsung dari tube/jari (B) Realisme sangat halus (C) Kubisme geometris → **A**
3. Batik ditetapkan UNESCO sebagai Warisan Budaya Takbenda pada tahun? (A) 2009 (B) 1999 (C) 2019 → **A**

**Ch5 Boss (Ujian Akhir)**
Ambil 10 soal acak dari bank soal seluruh stage. Contoh:
1. Komplementer merah? (A) Hijau (B) Biru (C) Kuning → **A**
2. Titik hilang berada pada? (A) Garis horizon (B) Dasar kertas (C) Tepi kanan → **A**
3. Rule of thirds membagi bidang menjadi? (A) 3×3 (B) 2×2 (C) 5×5 → **A**

---

## 6. Format Data (Seed) untuk Implementasi

Konten disimpan sebagai data (file JSON di repo untuk MVP, lalu dipindah ke tabel Supabase bila perlu). **Seluruh 6 stage × 5 chapter dimuat dari data ini.**

```json
{
  "path": { "id": "seni-rupa-dasar", "title": "Seni Rupa Dasar" },
  "stages": [
    {
      "id": "stage-1",
      "order": 1,
      "title": "Dunia Garis & Bentuk",
      "mascot": "pensil",
      "chapters": [
        {
          "id": "s1-c1",
          "order": 1,
          "title": "Kenali Garis",
          "is_boss": false,
          "theory": [
            { "text": "Garis adalah titik yang bergerak.", "image": "/img/s1c1-1.svg" },
            { "text": "Garis horizontal terasa tenang, diagonal terasa bergerak.", "image": "/img/s1c1-2.svg" }
          ],
          "quiz": [
            {
              "id": "s1c1-q1",
              "question": "Garis yang naik-turun seperti ombak disebut?",
              "options": ["Lurus", "Bergelombang", "Putus-putus"],
              "answer_index": 1,
              "explanation": "Garis bergelombang naik-turun secara berirama."
            }
          ],
          "minigame": {
            "type": "tap_match",
            "title": "Garis Kilat",
            "config": { "duration_seconds": 30, "targets": ["zigzag", "lengkung", "lurus", "putus-putus"] }
          }
        }
      ]
    }
  ]
}
```

Chapter boss bertipe `canvas_ai` menambahkan:
```json
"minigame": {
  "type": "canvas_ai",
  "title": "Lukis Matahari Terbenam",
  "config": {
    "passing_score": 75,
    "criteria": [
      { "id": "c1", "text": "Ada matahari/lingkaran terang yang jelas", "weight": 30 },
      { "id": "c2", "text": "Palet didominasi warna hangat yang harmonis", "weight": 40 },
      { "id": "c3", "text": "Ada kontras antara langit dan elemen lain", "weight": 30 }
    ]
  }
}
```

### Tabel Database Tambahan/Perubahan
| Tabel | Kolom Utama |
|---|---|
| `players` | `id`, `username_key (unique)`, `display_name`, `timezone`, `created_at`, `last_seen_at` |
| `chapter_progress` | `player_id`, `chapter_id`, `stars (0-3)`, `best_minigame_score`, `quiz_correct`, `completed_at` |
| `stage_progress` | `player_id`, `stage_id`, `unlocked_at`, `boss_passed_at` |
| `user_stats` | `player_id`, `lives_count`, `lives_anchor_at`, `total_xp`, `current_streak`, `last_played_date` |
| `submissions` | `id`, `player_id`, `chapter_id`, `image_path`, `score`, `criteria_results`, `created_at` |

---

## 7. Alur Pengguna Ringkas

1. Buka web → layar username (cookie ada? langsung ke peta).
2. Konfirmasi buat/lanjutkan akun.
3. Peta menampilkan 6 stage; Stage 1 terbuka, sisanya terkunci.
4. Pilih chapter → teori → kuis → mini-game → hasil (bintang + XP).
5. Selesaikan 4 chapter → buka Boss → lulus → Stage berikutnya terbuka.
6. Nyawa habis → tampil hitung mundur; **Practice Mode** tetap bisa dimainkan.
7. Kembali besok → masuk otomatis atau lewat username; nyawa terisi sesuai waktu berlalu.

---

## 8. Acceptance Criteria (Checklist untuk Agent)

**Login**
- [ ] Layar awal menampilkan input username dan teks penjelasan penyimpanan progres.
- [ ] Username unik tanpa peka huruf besar/kecil; validasi 3-16 karakter.
- [ ] Username baru → konfirmasi buat akun; username lama → konfirmasi lanjutkan dengan ringkasan progres.
- [ ] Cookie `httpOnly` menyimpan sesi; buka ulang browser langsung masuk; ada tombol Keluar/Ganti pengguna.
- [ ] `player_id` selalu diambil dari sesi server, tidak dari body request.
- [ ] Tidak ada akses langsung database dari client; service key hanya di server.

**Konten**
- [ ] Peta menampilkan **6 stage**, tiap stage **5 chapter** (chapter ke-5 bertanda Boss).
- [ ] Seluruh konten dimuat dari seed data, bukan hardcode per stage.
- [ ] Setiap chapter menjalankan urutan teori → 3 kuis → mini-game → hasil.
- [ ] Semua tipe mini-game pada bagian 4 yang dipakai kurikulum telah diimplementasikan (boleh bertahap, tetapi chapter tanpa implementasi tidak boleh membuat aplikasi crash; tampilkan fallback kuis tambahan).
- [ ] Unlock: chapter berurutan; stage berikutnya terbuka setelah Boss lulus.

**Gamifikasi**
- [ ] Nyawa 5 maks, regenerasi 1/jam (lazy, jam server), bertahan setelah browser ditutup.
- [ ] Kuis salah -1 nyawa; mini-game dan Boss tidak mengurangi nyawa; error sistem tidak mengurangi nyawa.
- [ ] Bintang dan XP sesuai bagian 3.3; streak per hari kalender sesuai zona waktu.
- [ ] Practice Mode tersedia saat nyawa habis.

**Mobile**
- [ ] Semua mini-game dapat dimainkan dengan sentuhan (Pointer Events), tanpa scroll yang mengganggu saat menggambar/menyeret.

---

## 9. Catatan Prioritas Implementasi
Jika waktu terbatas, kerjakan berurutan: **(1)** login username + sesi, **(2)** peta 6 stage dari seed data, **(3)** alur teori-kuis-hasil untuk semua chapter, **(4)** mini-game sederhana (`tap_match`, `drag_sort`, `swipe_cards`, `memory_match`), **(5)** mini-game kanvas (`trace_path`, `shade_brush`, `thirds_placer`), **(6)** Boss `canvas_ai`. Dengan urutan ini, seluruh stage sudah bisa dimainkan lebih dulu dengan kuis, lalu mini-game dilengkapi bertahap.