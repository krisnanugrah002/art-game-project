# Product Requirements Document (PRD) v3
## Platform Edukasi Seni Rupa Interaktif

| | |
|---|---|
| **Versi** | 3.0 (perbaikan bug + strategi database lokal MySQL → produksi Supabase) |
| **Status** | Draft untuk implementasi |
| **Menggantikan** | PRD v2 dan Addendum v2.1 untuk bagian yang disebut di dokumen ini |
| **Tetap berlaku dari Addendum v2.1** | Bagian 5 (isi kurikulum 6 stage × 5 chapter beserta kuis & mini-game) dan Bagian 4 (pustaka tipe mini-game). Berikan **kedua file** ke AI coding agent. |

> **Catatan untuk AI coding agent (Antigravity):** dokumen ini berisi daftar bug yang **harus** diperbaiki, masing-masing dengan *Acceptance Criteria* yang bisa diuji. Jangan menandai selesai sebelum seluruh checklist pada Bagian 12 terpenuhi. Konten permainan harus **data-driven** dari `content/curriculum.json` (6 stage × 5 chapter).

---

## 1. Ringkasan Perubahan v3

| # | Bug / Permintaan | Ringkasan Solusi | Bagian |
|---|---|---|---|
| 1 | Nyawa habis tapi masih bisa lanjut soal | Server menolak aksi saat nyawa 0, sesi diakhiri, otomatis kembali ke Beranda | 6.1 |
| 2 | Garis peta muncul melewati section yang belum dikerjakan | Garis hanya digambar sampai chapter yang sudah selesai | 6.2 |
| 3 | Leaderboard harus pakai username register | Tampilkan `display_name` dari tabel `players` | 6.3 |
| 4 | Dilarang ada data dummy | Hapus semua seed/mock pemain; leaderboard hanya berisi pemain asli | 6.4 |
| 5 | Sinkronisasi username, XP, nyawa | Satu sumber kebenaran (database) + satu store client + versi data | 6.5 |
| 6 | Tombol belum berfungsi (ganti username, zona waktu, ekspor data, keluar) | Endpoint dan alur UI lengkap | 6.6 |
| 7 | Hapus tab Virtual Gallery | Hapus menu, rute, API, tabel | 6.7 |
| 8 | Tombol Guide di card stage | Halaman/modal materi yang diujikan | 6.8 |
| 9 | Tombol bawah hijau "Lanjut" saat berhasil | State machine bar jawaban | 6.9 |
| + | Database lokal MySQL, produksi Supabase, konfigurasi Supabase di folder tersendiri | Lapisan database portabel (Kysely) + folder `database/mysql/` dan `supabase/` | 3, 4, 11 |

### Yang Dihapus dari Scope
- Virtual Gallery dan seluruh penyimpanan gambar (Supabase Storage tidak dipakai).
- Login Google/GitHub dan Supabase Auth.
- Practice Mode (agar tidak ambigu dengan aturan nyawa habis).
- Liga mingguan (promosi/degradasi). Leaderboard sederhana tetap ada.
- Jalur 2 dan 3 (hanya jalur "Seni Rupa Dasar").

---

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 14+ (App Router) + TypeScript |
| UI | Tailwind CSS, Framer Motion |
| Canvas | React Konva (untuk mini-game kanvas dan Boss) |
| State client | Zustand + fetch ke API (lihat 6.5) |
| Akses database | **Kysely** (query builder portabel) |
| Database **lokal (laptop)** | **MySQL 8** (atau MariaDB 10.5+) lewat driver `mysql2` |
| Database **produksi** | **Supabase Postgres** lewat driver `pg` (connection pooler) |
| Sesi | JWT di cookie `httpOnly` (library `jose`) |
| AI | Google Gemini Vision (hanya Boss bertipe `canvas_ai`) |
| Hosting | Vercel |

**Mengapa Kysely:** satu kode bisnis yang sama berjalan di MySQL (lokal) dan Postgres (Supabase) hanya dengan mengganti variabel `DB_PROVIDER`. Tidak perlu menulis ulang saat pindah ke Supabase.

> **Penting:** MySQL di laptop **tidak bisa diakses dari Vercel**. MySQL hanya untuk pengembangan lokal. Setelah di-push ke GitHub dan di-deploy ke Vercel, aplikasi memakai Supabase (lihat Bagian 11).

---

## 3. Struktur Folder

```
project-root/
├─ app/
│  ├─ page.tsx                       # layar username (login/daftar)
│  ├─ (game)/
│  │  ├─ home/page.tsx               # peta stage & chapter
│  │  ├─ stage/[stageId]/guide/page.tsx
│  │  ├─ chapter/[chapterId]/page.tsx
│  │  ├─ leaderboard/page.tsx
│  │  └─ profile/page.tsx
│  └─ api/
│     ├─ auth/{login,register,logout}/route.ts
│     ├─ me/route.ts                 # snapshot pemain
│     ├─ me/username/route.ts
│     ├─ me/timezone/route.ts
│     ├─ me/export/route.ts
│     ├─ chapters/[chapterId]/{start,answer,complete}/route.ts
│     ├─ leaderboard/route.ts
│     └─ evaluate/route.ts           # Gemini (Boss canvas_ai)
├─ lib/
│  ├─ db/
│  │  ├─ index.ts                    # pabrik koneksi (mysql | supabase)
│  │  ├─ types.ts                    # tipe tabel untuk Kysely
│  │  ├─ errors.ts                   # isDuplicateError() lintas driver
│  │  └─ repositories/               # players, stats, progress, xp, leaderboard
│  ├─ game/{lives.ts, xp.ts, streak.ts, unlock.ts, map-segments.ts}
│  └─ session.ts
├─ content/
│  └─ curriculum.json                # 6 stage × 5 chapter (+ guide)
├─ database/
│  └─ mysql/                         # KHUSUS LOKAL
│     ├─ schema.sql
│     └─ README.md
├─ supabase/                         # KHUSUS PRODUKSI (folder tersendiri)
│  ├─ migrations/0001_init.sql
│  ├─ .env.example
│  └─ README.md
├─ .env.example
└─ .env.local                        # JANGAN di-commit
```

Aturan:
- Hanya folder `lib/db/` yang boleh tahu perbedaan MySQL vs Postgres. Kode lain memanggil repository.
- `.env.local` masuk `.gitignore`. Yang di-commit hanya `.env.example`.

---

## 4. Strategi Database

### 4.1 Pemilihan Driver lewat Environment
```
DB_PROVIDER=mysql        # lokal (default)
DB_PROVIDER=supabase     # produksi
```

| Variabel | Dipakai saat | Contoh |
|---|---|---|
| `DB_PROVIDER` | selalu | `mysql` / `supabase` |
| `MYSQL_URL` | `mysql` | `mysql://seni_app:password@localhost:3306/seni_rupa` |
| `DATABASE_URL` | `supabase` | connection string **pooler** Supabase |
| `SESSION_SECRET` | selalu | string acak ≥ 32 karakter |
| `GEMINI_API_KEY` | Boss `canvas_ai` | dari Google AI Studio |

### 4.2 Pabrik Koneksi (`lib/db/index.ts`)
```ts
import { Kysely, MysqlDialect, PostgresDialect } from 'kysely';
import { createPool } from 'mysql2';
import { Pool } from 'pg';
import type { DB } from './types';

const globalForDb = globalThis as unknown as { db?: Kysely<DB> };

function createDb(): Kysely<DB> {
  if ((process.env.DB_PROVIDER ?? 'mysql') === 'mysql') {
    return new Kysely<DB>({
      dialect: new MysqlDialect({
        pool: createPool({ uri: process.env.MYSQL_URL!, timezone: 'Z', connectionLimit: 5 }),
      }),
    });
  }
  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL!,
        max: 1, // serverless: satu koneksi per instance
        ssl: { rejectUnauthorized: false },
      }),
    }),
  });
}

export const db = globalForDb.db ?? createDb();
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
```

### 4.3 Aturan Kode Portabel (Wajib)
1. **ID** dibuat di aplikasi (`crypto.randomUUID()`), disimpan `CHAR(36)` di MySQL dan `uuid` di Postgres.
2. **Waktu** selalu UTC. Server aplikasi memakai `new Date()` (jam server Vercel/Node), bukan jam browser. Pool MySQL memakai `timezone: 'Z'`.
3. **Dilarang** memakai fitur yang hanya ada di satu DB: `RETURNING`, `ON CONFLICT`, `ON DUPLICATE KEY`, tipe `ENUM`, fungsi `NOW()`/`UTC_TIMESTAMP()` di SQL. Gunakan parameter dari aplikasi.
4. **Duplikat unik** ditangani dengan `try/catch` + helper `isDuplicateError(e)` (kode `ER_DUP_ENTRY`/1062 di MySQL, `23505` di Postgres).
5. **Transaksi** memakai `db.transaction().execute(...)` dan `.forUpdate()` untuk mengunci baris `user_stats` (didukung kedua DB).
6. Nama tabel/kolom `snake_case`, huruf kecil.
7. Jangan memakai stored procedure/fungsi SQL; logika (nyawa, XP, unlock) ada di TypeScript dalam transaksi supaya identik di kedua DB.

### 4.4 Tabel

| Tabel | Fungsi |
|---|---|
| `players` | `id`, `username_key` (huruf kecil, unik), `display_name` (tampilan asli), `timezone`, `username_changed_at`, `created_at`, `last_seen_at` |
| `user_stats` | `player_id`, `lives_count`, `lives_anchor_at`, `total_xp`, `current_streak`, `longest_streak`, `last_played_date`, **`version`**, `updated_at` |
| `chapter_progress` | `player_id`, `chapter_id`, `stars`, `best_minigame_score`, `best_quiz_correct`, `completed_at` |
| `chapter_attempts` | `id`, `player_id`, `chapter_id`, `status` (`active/completed/failed`), `quiz_correct`, `quiz_wrong`, `started_at`, `finished_at` |
| `attempt_answers` | `attempt_id`, `question_id`, `is_correct`, `answered_at` (PK gabungan; mencegah soal yang sama mengurangi nyawa dua kali) |
| `xp_events` | `id`, `player_id`, `amount`, `source`, **`ref_key` (unik per pemain)**, `created_at` |
| `submissions` | `id`, `player_id`, `chapter_id`, `score`, `criteria_results`, `feedback`, `created_at` (tanpa menyimpan gambar) |
| `rate_limits` | `bucket`, `window_start`, `hits` (pembatas sederhana, portabel) |

Skema SQL lengkap ada di `database/mysql/schema.sql` dan `supabase/migrations/0001_init.sql`. **Kedua file harus selalu ekuivalen**; setiap perubahan skema dilakukan di keduanya.

Di Supabase, **RLS diaktifkan tanpa policy** dan hak `anon`/`authenticated` dicabut, sehingga API REST publik Supabase tidak bisa membaca data. Aplikasi mengakses lewat koneksi Postgres dari server.

---

## 5. Login Username (Ringkasan Perubahan dari Addendum)

Alur layar username, aturan username (3-16 karakter, a-z 0-9 underscore, tidak peka huruf besar-kecil), konfirmasi buat/lanjutkan, dan cookie sesi **tetap sama** seperti Addendum v2.1 Bagian 2. Penegasan tambahan v3:

- Cookie sesi hanya berisi **`player_id`** (bukan nama/XP/nyawa). Nama, XP, dan nyawa selalu dibaca dari database.
- Semua endpoint mengambil `player_id` dari sesi, **tidak pernah dari body/query**.
- Database tidak boleh diakses langsung dari browser.
- `username_key` = `lowercase(username)`; `display_name` = ejaan asli yang diketik saat daftar. **Leaderboard, profil, dan header memakai `display_name`.**

---

## 6. Spesifikasi Perbaikan Bug

### 6.1 Nyawa Habis → Kembali ke Beranda

**Masalah:** nyawa sudah 0 tetapi pemain masih bisa lanjut ke soal berikutnya.

**Penyebab umum:** pengecekan nyawa hanya di UI/client dan tidak diverifikasi server; tombol "Lanjut" tidak mengecek nyawa terbaru.

**Persyaratan:**
1. `POST /api/chapters/[id]/start` ditolak dengan **HTTP 409 `NO_LIVES`** bila nyawa 0.
2. `POST /api/chapters/[id]/answer` memproses satu jawaban dalam satu transaksi:
   - Kunci baris `user_stats` (`forUpdate`), hitung nyawa terkini (lazy, 6.5), cek `attempt_answers` (soal sama tidak diproses dua kali).
   - Jika jawaban salah → nyawa -1. Jika nyawa menjadi 0 → `attempt.status = 'failed'`, respons berisi `sessionEnded: true`.
   - Jika nyawa sudah 0 sebelum request → 409 `NO_LIVES`.
3. Saat respons `sessionEnded: true` atau 409 `NO_LIVES`:
   - Tampilkan umpan balik jawaban (benar/salah) sebentar.
   - Tombol bawah berubah menjadi **"Kembali ke Beranda"** (tidak ada jalur ke soal berikutnya) dan otomatis menuju `/home` setelah 3 detik.
   - Di Beranda tampil banner "Nyawa habis" dengan hitung mundur nyawa berikutnya.
4. **Route guard:** halaman `/chapter/[id]` mengecek nyawa saat dibuka dan setiap kali tab kembali aktif; bila 0 → redirect ke `/home`. Tombol Back/refresh browser tidak boleh membuka kembali sesi yang sudah `failed`.
5. Di Beranda, saat nyawa 0 semua node chapter tampil nonaktif; mengetuk node menampilkan pesan "Nyawa habis, tunggu hingga terisi" (tidak membuka chapter).
6. Mini-game dan Boss tidak mengurangi nyawa (tetap seperti Addendum), tetapi **tidak bisa dimulai** saat nyawa 0 karena `start` ditolak.

**Acceptance Criteria:**
- [ ] Menjawab salah sampai nyawa 0 di tengah kuis langsung mengakhiri sesi dan kembali ke Beranda.
- [ ] Memanggil API `answer` secara manual saat nyawa 0 mengembalikan 409.
- [ ] Membuka URL `/chapter/...` langsung saat nyawa 0 mengalihkan ke Beranda.
- [ ] Menekan tombol Back setelah dialihkan tidak memunculkan soal.

### 6.2 Garis Peta Hanya Sampai Section yang Sudah Dikerjakan

**Masalah:** garis penghubung antar node sudah tergambar melewati node yang belum dikerjakan.

**Persyaratan:**
1. Setiap node memiliki status: `completed`, `current` (chapter terbuka berikutnya), `locked`.
2. Segmen garis antara node *i* dan *i+1* (berlaku juga antar stage) digambar **hanya jika node *i+1* berstatus `completed`**. Dengan kata lain, garis berakhir pada node `completed` terakhir.
3. Node `current` ditandai cincin berdenyut (tanpa garis tambahan); node `locked` tanpa garis masuk maupun keluar.
4. Fungsi murni `computeSegments(nodes): Segment[]` di `lib/game/map-segments.ts`, dipakai komponen peta, sehingga bisa diuji unit.
5. Untuk pemain baru (belum ada chapter selesai) **tidak ada garis sama sekali**.
6. Garis diperbarui seketika setelah chapter selesai (dari snapshot terbaru, 6.5), tanpa refresh.

**Acceptance Criteria:**
- [ ] Pemain baru: tidak ada garis di peta.
- [ ] Selesai chapter 1: garis dari node 1 ke node 2 **tidak** muncul sampai chapter 2 selesai (garis ke node `current` tidak digambar).
- [ ] Tidak ada garis yang menyentuh node `locked` pada kondisi apa pun.
- [ ] Unit test `computeSegments` untuk kasus: 0, 1, 3 chapter selesai, dan perbatasan antar stage.

### 6.3 Leaderboard Memakai Username Register
- Kolom nama menampilkan `players.display_name` hasil join, **bukan** nilai dari localStorage/state lokal atau nama default.
- Jika username diganti (6.6), leaderboard langsung menampilkan nama baru.
- Baris milik pemain saat ini diberi penanda "Kamu".

### 6.4 Larangan Data Dummy
1. **Dilarang** menaruh pemain, XP, atau peringkat palsu dalam bentuk apa pun: seed SQL, array mock, library `faker`, atau fallback "contoh". Berlaku juga untuk teks "lorem ipsum".
2. Setelah migrasi awal, tabel `players`, `user_stats`, `xp_events`, `chapter_progress`, `submissions` **harus kosong**.
3. Leaderboard hanya menampilkan pemain asli (XP > 0). Jika kosong: *empty state* "Belum ada peringkat. Selesaikan chapter untuk masuk papan peringkat!".
4. Data statis yang sah hanya konten kurikulum (`content/curriculum.json`).
5. Cek otomatis: `grep -rniE "dummy|mock|faker|lorem|sample_user" app lib database supabase` tidak boleh menghasilkan temuan yang berhubungan dengan data pengguna.

**Leaderboard:**
- Tab/filter: **Minggu ini** (`SUM(xp_events.amount)` sejak Senin 00:00 WIB) dan **Sepanjang waktu** (`user_stats.total_xp`, nilai yang sama dengan Profil).
- Menampilkan 50 teratas ditambah baris peringkat pemain saat ini bila di luar 50.
- Urutan imbang: XP terbanyak, lalu `created_at` pemain tertua.

**Acceptance Criteria:**
- [ ] Database kosong → Leaderboard tampil *empty state*.
- [ ] Mendaftar satu akun dan menyelesaikan chapter → hanya satu baris dengan username pemain tersebut.
- [ ] Pencarian dummy (grep di atas) bersih.

### 6.5 Sinkronisasi Data (Username, XP, Nyawa)

**Masalah:** profil menampilkan nama yang salah, total XP berbeda antar tab, validasi nyawa lemah.

**Prinsip:** database adalah **satu-satunya sumber kebenaran**. Browser hanya cache tampilan.

1. **Snapshot tunggal** `GET /api/me` mengembalikan:
   ```json
   {
     "player": { "id": "...", "displayName": "Raka", "timezone": "Asia/Jakarta" },
     "stats": { "lives": 3, "maxLives": 5, "nextLifeAt": "2026-10-09T10:00:00Z",
                "totalXp": 120, "streak": 4, "version": 37 },
     "progress": [ { "chapterId": "s1-c1", "stars": 3 } ],
     "serverTime": "2026-10-09T09:12:00Z"
   }
   ```
2. **Satu store client** (`useMe()` berbasis Zustand/SWR). Header, Beranda, Profil, dan Leaderboard **semuanya membaca dari store ini**; tidak ada komponen yang menyimpan salinan XP/nyawa/nama sendiri.
3. **Setiap endpoint yang mengubah data** (`answer`, `complete`, `username`, `timezone`) mengembalikan snapshot terbaru, dan client langsung memperbarui store.
4. **Versi data:** `user_stats.version` naik 1 pada setiap perubahan. Client menolak snapshot dengan `version` lebih kecil dari yang sudah dimiliki (mencegah respons usang menimpa data baru).
5. **Sinkron antar tab:** gunakan `BroadcastChannel('app-sync')` untuk memberi tahu tab lain agar *refetch* `/api/me`. Tambah refetch saat jendela kembali fokus (`visibilitychange`).
6. **Dilarang** menyimpan XP/nyawa/nama di `localStorage`/`sessionStorage` sebagai data utama.
7. **XP konsisten:** penambahan `xp_events` dan `user_stats.total_xp` dilakukan **dalam satu transaksi**. `xp_events` memiliki `ref_key` unik per pemain (mis. `chapter:s1-c1:stars:3`) sehingga klik ganda/retry tidak menggandakan XP. Profil dan Leaderboard "Sepanjang waktu" sama-sama membaca `user_stats.total_xp`.
8. **Nyawa (lazy, jam server):**
   ```ts
   // lib/game/lives.ts
   export const MAX_LIVES = 5;
   export const REGEN_MS = 60 * 60 * 1000;

   export function computeLives(count: number, anchor: Date, now: Date) {
     if (count >= MAX_LIVES) return { lives: MAX_LIVES, anchor: now };
     const regen = Math.floor((now.getTime() - anchor.getTime()) / REGEN_MS);
     const lives = Math.min(MAX_LIVES, count + Math.max(regen, 0));
     const newAnchor = lives >= MAX_LIVES
       ? now
       : new Date(anchor.getTime() + Math.max(regen, 0) * REGEN_MS);
     return { lives, anchor: newAnchor };
   }
   ```
   - `nextLifeAt = anchor + 1 jam` bila nyawa < 5.
   - Hasil dibatasi 0..5 (juga ada CHECK di database).
   - Hitung mundur di UI memakai selisih `serverTime` dengan jam browser; saat mencapai 0, client **refetch `/api/me`** (tidak menambah nyawa secara lokal).
9. **Nama pengguna:** selalu `player.displayName` dari `/api/me`. Cookie sesi tidak menyimpan nama sehingga tidak ada nama basi.

**Acceptance Criteria:**
- [ ] Daftar dengan username "Raka_Art": Header, Profil, dan Leaderboard menampilkan "Raka_Art" persis.
- [ ] Buka dua tab, selesaikan chapter di tab A → tab B menampilkan XP dan bintang yang sama dalam ≤ 2 detik atau saat fokus.
- [ ] Total XP di Profil = total XP di Leaderboard "Sepanjang waktu" = `SUM(xp_events.amount)` pemain tersebut (uji otomatis).
- [ ] Klik ganda tombol selesai tidak menggandakan XP.
- [ ] Mengubah jam perangkat tidak memengaruhi nyawa.
- [ ] Nyawa tidak pernah < 0 atau > 5.

### 6.6 Tombol di Pengaturan/Profil Harus Berfungsi

| Tombol | Endpoint | Perilaku |
|---|---|---|
| **Ganti username** | `PATCH /api/me/username` | Validasi aturan username dan keunikan `username_key` (409 jika dipakai). Konfirmasi dialog "Username akan berubah di seluruh aplikasi". Batas: maksimal 1 kali per 24 jam (`username_changed_at`). Sukses → snapshot baru, semua tampilan ikut berubah. |
| **Zona waktu** | `PATCH /api/me/timezone` | Dropdown nilai IANA yang valid (default `Asia/Jakarta`; sediakan `Asia/Makassar` dan `Asia/Jayapura` di bagian atas). Validasi di server. Dipakai untuk perhitungan streak. |
| **Ekspor data** | `GET /api/me/export` | Mengunduh file `data-{username}.json` berisi profil, statistik, progres chapter, dan riwayat `xp_events`/`submissions` milik pemain sendiri. Header `Content-Disposition: attachment`. |
| **Keluar** | `POST /api/auth/logout` | Menghapus cookie sesi, mengosongkan store client, memberi sinyal `BroadcastChannel` agar tab lain ikut keluar, lalu menuju `/`. **Data tidak dihapus**; masuk lagi dengan username yang sama memulihkan progres. |

Setiap tombol menampilkan *loading state* dan pesan sukses/gagal yang jelas.

**Acceptance Criteria:**
- [ ] Ganti username ke yang sudah dipakai → pesan error, data tidak berubah.
- [ ] Setelah ganti username, Leaderboard dan Profil memakai nama baru tanpa refresh manual.
- [ ] Ganti zona waktu tersimpan setelah refresh.
- [ ] File ekspor terunduh dan hanya berisi data pemain itu.
- [ ] Setelah Keluar, membuka `/home` mengalihkan ke `/`; masuk lagi dengan username yang sama memulihkan XP dan nyawa.

### 6.7 Hapus Virtual Gallery
- Hapus item navigasi, rute `/gallery`, komponen, API, dan tabel terkait.
- Jangan membuat bucket Storage. Gambar kanvas Boss hanya dikirim untuk evaluasi dan **tidak disimpan**; yang disimpan adalah skor dan hasil kriteria.
- Navigasi akhir: **Beranda, Leaderboard, Profil**.

**Acceptance Criteria:** [ ] Tidak ada kata "Gallery"/"Galeri" pada UI, rute, atau skema. [ ] URL `/gallery` mengembalikan 404.

### 6.8 Tombol Guide pada Card Stage
- Setiap card stage di Beranda punya tombol **Guide** yang membuka `/stage/[stageId]/guide` (atau modal layar penuh di ponsel).
- Isi Guide berasal dari field `guide` pada `curriculum.json` per chapter: **ringkasan materi**, **istilah kunci** (definisi singkat), dan **contoh**.
- Guide dapat dibuka tanpa memakai nyawa dan tanpa harus membuka stage (boleh dibaca walau stage terkunci, supaya pemain bisa belajar dulu).
- **Syarat kualitas:** setiap konsep yang menjadi jawaban kuis atau materi mini-game harus muncul di Guide stage tersebut (diuji otomatis, lihat Bagian 12).

Struktur data:
```json
"guide": {
  "summary": "Ringkasan 2-3 kalimat.",
  "key_points": ["Poin 1", "Poin 2"],
  "terms": [{ "term": "Garis kontur", "definition": "Garis tepi atau batas sebuah bentuk." }]
}
```

Isi Guide minimal per stage (agen memperluasnya menjadi kalimat ramah anak/pelajar):

**Stage 1: Dunia Garis & Bentuk**
| Chapter | Materi yang diujikan |
|---|---|
| 1 Kenali Garis | Jenis garis: lurus, lengkung, zigzag, bergelombang, putus-putus; horizontal = tenang/stabil; vertikal = kokoh; diagonal = gerak/dinamis |
| 2 Geometris vs Organik | Geometris (lingkaran, persegi, segitiga) beraturan; organik (daun, awan) tidak beraturan; bidang 2D vs bentuk 3D (panjang, lebar, tinggi) |
| 3 Titik, Garis, Bidang | Titik = unsur terkecil; titik berurutan membentuk garis; garis tertutup membentuk bidang |
| 4 Garis Kontur | Kontur = garis tepi/batas benda; *blind contour* = menggambar kontur tanpa melihat kertas; gerak tangan pelan mengikuti tepi |
| 5 Boss | Konstruksi bentuk: lingkaran → bulat, segitiga → runcing/tajam, persegi → kokoh |

**Stage 2: Pesta Warna**
| Chapter | Materi yang diujikan |
|---|---|
| 1 Primer, Sekunder, Tersier | Primer: merah, kuning, biru; sekunder: oranye (merah+kuning), hijau (biru+kuning), ungu (merah+biru); tersier = primer + sekunder yang bersebelahan |
| 2 Roda Warna & Komplementer | Komplementer = berseberangan di roda warna: merah-hijau, biru-oranye, kuning-ungu |
| 3 Hangat vs Dingin | Hangat: merah, oranye, kuning (energik); dingin: biru, hijau, ungu (tenang) |
| 4 Harmoni Warna | Analogus (bersebelahan), monokromatik (satu warna, variasi terang-gelap), triadik (tiga warna berjarak sama) |
| 5 Boss | Palet senja hangat (analogus); tint = warna + putih; shade = warna + hitam; kontras hangat membuat objek menonjol |

**Stage 3: Cahaya, Bayangan & Tekstur**
| Chapter | Materi yang diujikan |
|---|---|
| 1 Value | Value = tingkat gelap-terang; tint (+putih), shade (+hitam) |
| 2 Cahaya & Bayangan | Cast shadow (bayangan jatuh), form shadow, highlight; bayangan jatuh berlawanan arah sumber cahaya |
| 3 Tekstur | Tekstur nyata (bisa diraba) vs semu/visual (hanya terlihat); kasar, halus, licin |
| 4 Arsir & Gradasi | Arsir = garis sejajar; cross-hatching = arsir silang; makin rapat/berlapis makin gelap |
| 5 Boss | Gradasi menciptakan volume; bagian tergelap di sisi berlawanan cahaya; cast shadow membuat benda menapak |

**Stage 4: Seni Menata**
| Chapter | Materi yang diujikan |
|---|---|
| 1 Rule of Thirds | Bidang dibagi 3×3; ada 4 titik pertemuan; horizon di garis sepertiga |
| 2 Keseimbangan | Simetris, asimetris, radial |
| 3 Pusat Perhatian | Focal point = bagian pertama menarik mata; dibuat dengan kontras warna/ukuran |
| 4 Irama, Pola, Kesatuan | Irama = pengulangan teratur; pola (mis. batik); kesatuan = unsur terasa selaras |
| 5 Boss | Elemen terpenting di titik sepertiga; teks kontras dengan latar; gaya elemen konsisten |

**Stage 5: Menembus Ruang**
| Chapter | Materi yang diujikan |
|---|---|
| 1 Depan, Tengah, Belakang | Foreground, middle ground, background; objek yang menutupi terkesan lebih dekat |
| 2 Perspektif 1 Titik Hilang | Titik hilang berada di garis horizon; contoh jalan lurus dan rel kereta |
| 3 Perspektif 2 Titik Hilang | Kubus/gedung dilihat dari sudutnya; garis vertikal tetap tegak; dua titik di kiri-kanan horizon |
| 4 Dekat atau Jauh? | Objek jauh lebih kecil; perspektif atmosfer: lebih pucat/kebiruan dan kabur; detail jelas di dekat |
| 5 Boss | Gabungan: garis tepi jalan bertemu di titik hilang, objek makin kecil dan rapat, gunung jauh pucat |

**Stage 6: Jelajah Waktu**
| Chapter | Materi yang diujikan |
|---|---|
| 1 Seni Prasejarah | Lukisan gua Leang-Leang (Sulawesi Selatan): cap tangan dan hewan buruan; urutan zaman prasejarah → Renaisans → Impresionisme |
| 2 Renaisans | "Kelahiran kembali"; Leonardo da Vinci (*Mona Lisa*); Michelangelo (langit-langit Kapel Sistina) |
| 3 Impresionisme & Modern | Impresionisme: sapuan cepat menangkap cahaya (Monet); Van Gogh (*The Starry Night*); Kubisme: Picasso dan Braque |
| 4 Seni Rupa Indonesia | Raden Saleh (*Penangkapan Pangeran Diponegoro*); Affandi (ekspresif, cat langsung dari tube/jari); Batik diakui UNESCO 2009 |
| 5 Boss | Ringkasan seluruh stage 1-6 |

### 6.9 Bar Jawaban: Tombol Hijau "Lanjut"
State machine bar di bagian bawah layar kuis:

| State | Tampilan bar | Tombol |
|---|---|---|
| `idle` (belum memilih) | netral | **PERIKSA** abu-abu, nonaktif |
| `selected` | netral | **PERIKSA** aktif (warna utama) |
| `checking` | netral | *loading*, tidak bisa diklik ganda |
| `correct` | latar hijau muda, ikon ✔ "Benar!" | **LANJUT** berwarna **hijau** |
| `wrong` | latar merah muda, ikon ✖ + jawaban benar + penjelasan | **LANJUT** (merah/netral gelap) |
| `wrong` dan nyawa jadi 0 | sama seperti `wrong` | **KEMBALI KE BERANDA** (lihat 6.1) |

- Layar hasil mini-game/chapter yang berhasil juga memakai tombol hijau berlabel **"LANJUT"**.
- Jangan hanya mengandalkan warna: selalu sertakan ikon dan teks (ramah buta warna).
- Tombol terkunci selama request berlangsung (`checking`) untuk mencegah klik ganda.

**Acceptance Criteria:**
- [ ] Jawaban benar → bar hijau, tombol hijau bertuliskan "LANJUT".
- [ ] Jawaban salah → penjelasan tampil, tombol tidak hijau.
- [ ] Sebelum memilih jawaban, tombol nonaktif.
- [ ] Mini-game berhasil → tombol hijau "LANJUT" pada layar hasil.

---

## 7. Kontrak API (Ringkas)

| Method & Path | Fungsi | Catatan |
|---|---|---|
| `POST /api/auth/register` | Buat pemain baru | Rate limit per IP; cek `username_key` unik |
| `POST /api/auth/login` | Lanjutkan dengan username | 404 jika tidak ada; set cookie sesi |
| `POST /api/auth/logout` | Keluar | Hapus cookie |
| `GET /api/me` | Snapshot pemain | Sumber data semua halaman |
| `PATCH /api/me/username` | Ganti username | 6.6 |
| `PATCH /api/me/timezone` | Ganti zona waktu | 6.6 |
| `GET /api/me/export` | Unduh data | 6.6 |
| `GET /api/chapters/[id]` | Materi + soal | **Tanpa** `answer_index` |
| `POST /api/chapters/[id]/start` | Mulai attempt | 409 bila nyawa 0 atau chapter terkunci |
| `POST /api/chapters/[id]/answer` | Kirim satu jawaban | Server menentukan benar/salah dan mengurangi nyawa |
| `POST /api/chapters/[id]/complete` | Selesaikan chapter | Hitung bintang/XP dari data attempt di server |
| `GET /api/leaderboard?range=week\|all` | Peringkat | Nama = `display_name` |
| `POST /api/evaluate` | Penilaian Boss `canvas_ai` | Rate limit; skor dihitung server dari kriteria |

Format error seragam: `{ "error": { "code": "NO_LIVES", "message": "..." } }`.

Aturan keamanan: semua endpoint (selain register/login) memverifikasi cookie sesi; jawaban benar kuis hanya ada di server; skor mini-game dari client divalidasi batas wajarnya (0-100) dan **tidak** menentukan nyawa/XP kuis.

---

## 8. Aturan Gamifikasi (Ringkas)

| Aspek | Aturan |
|---|---|
| Nyawa | Maks 5; regenerasi 1/jam (lazy); kuis salah -1; error sistem tidak mengurangi; 0 = tidak bisa memulai/melanjutkan chapter |
| XP | Selesai chapter pertama kali +10; 3 bintang +5 (sekali, saat pertama mencapai 3 bintang); Boss lulus +25; semua lewat `xp_events` dengan `ref_key` unik |
| Bintang | 1/2/3 sesuai Addendum 3.3; hanya naik, tidak turun |
| Streak | Hari kalender di zona waktu pemain; bertambah saat menyelesaikan ≥ 1 chapter hari itu; reset jika terlewat 1 hari penuh |
| Unlock | Chapter berurutan; stage berikutnya terbuka setelah Boss lulus |
| Mengulang chapter | Boleh, tetap memakai aturan nyawa; XP hanya jika bintang meningkat |

---

## 9. Kurikulum

Isi kurikulum (6 stage × 5 chapter, soal, jawaban, mini-game, rubrik Boss) **tetap sesuai Addendum v2.1 Bagian 5 dan 6**, ditambah field `guide` (6.8). Simpan di `content/curriculum.json`:
- `answer_index` hanya dibaca di server; endpoint publik tidak boleh mengirimnya.
- Aplikasi harus menampilkan **semua 6 stage dan 5 chapter per stage** pada peta.

---

## 10. Non-Functional

- **Keamanan:** rahasia hanya di environment; `.env.local` tidak di-commit; header keamanan dasar; validasi input (Zod).
- **Performa:** target respons API biasa < 300 ms; evaluasi Gemini P95 < 12 detik.
- **Mobile-first:** Pointer Events untuk mini-game; bar jawaban menempel di bawah layar (aman terhadap *safe area*).
- **Aksesibilitas:** tidak mengandalkan warna saja; kontras memadai; label ARIA pada tombol.
- **Observability:** log error server; log setiap evaluasi AI (latensi, status).
- **Privasi:** tidak ada data pribadi selain username; fitur ekspor data tersedia (6.6). Beri peringatan agar tidak memakai nama asli lengkap sebagai username.

---

## 11. Setup Lokal (MySQL) dan Migrasi ke Supabase

### 11.1 Tahap A: Pengembangan di Laptop (MySQL)
1. Pasang MySQL 8 (atau MariaDB 10.5+, termasuk dari XAMPP).
2. Jalankan `database/mysql/schema.sql` (lihat `database/mysql/README.md`).
3. Salin `.env.example` menjadi `.env.local`, isi:
   ```
   DB_PROVIDER=mysql
   MYSQL_URL=mysql://seni_app:PASSWORD@localhost:3306/seni_rupa
   SESSION_SECRET=ganti-dengan-string-acak-panjang
   ```
4. `npm install` lalu `npm run dev`.
5. Uji seluruh checklist Bagian 12 di lokal.

### 11.2 Tahap B: Push ke GitHub
- Pastikan `.env.local` ada di `.gitignore`.
- Yang ikut ter-commit: kode, `content/`, `database/mysql/`, `supabase/`, `.env.example`.

### 11.3 Tahap C: Produksi dengan Supabase
1. Buat project Supabase (region Singapore) atau lewat Vercel → Storage → Supabase.
2. Jalankan `supabase/migrations/0001_init.sql` di **SQL Editor** Supabase (atau dengan Supabase CLI).
3. Ambil connection string **pooler (transaction mode)** dari dashboard Supabase.
4. Di Vercel (Settings → Environment Variables) isi:
   ```
   DB_PROVIDER=supabase
   DATABASE_URL=<connection string pooler>
   SESSION_SECRET=<string acak>
   GEMINI_API_KEY=<kunci Gemini>
   ```
5. Deploy. **Tidak ada migrasi data**: data lokal hanyalah data uji, produksi dimulai dari database kosong (sesuai larangan data dummy).

Detail langkah ada di `supabase/README.md`.

---

## 12. Checklist Pengujian (Definition of Done)

**Database & Konfigurasi**
- [ ] Aplikasi berjalan penuh dengan `DB_PROVIDER=mysql` di laptop.
- [ ] Mengganti ke `DB_PROVIDER=supabase` (dengan `DATABASE_URL`) menjalankan kode yang sama tanpa perubahan.
- [ ] Folder `supabase/` berisi migrasi, README, dan `.env.example`; folder `database/mysql/` berisi skema lokal.
- [ ] Tidak ada kunci/rahasia pada repositori.

**Bug 1-9** (centang sesuai Acceptance Criteria di Bagian 6)
- [ ] 6.1 Nyawa habis kembali ke Beranda (UI dan server).
- [ ] 6.2 Garis peta hanya sampai chapter selesai (+ unit test `computeSegments`).
- [ ] 6.3 Leaderboard memakai `display_name`.
- [ ] 6.4 Tidak ada data dummy; *empty state* leaderboard.
- [ ] 6.5 Sinkron: nama, XP, nyawa konsisten antar halaman dan tab.
- [ ] 6.6 Ganti username, zona waktu, ekspor data, keluar berfungsi.
- [ ] 6.7 Virtual Gallery terhapus.
- [ ] 6.8 Guide tiap stage berisi materi yang diujikan.
- [ ] 6.9 Tombol hijau "LANJUT" saat berhasil.

**Uji otomatis yang disarankan**
- [ ] Setiap soal kuis: konsep jawabannya tercantum pada `key_points`/`terms` Guide stage-nya.
- [ ] Setelah N chapter selesai: `user_stats.total_xp == SUM(xp_events.amount)`.
- [ ] `computeLives` untuk kasus: penuh, 0 nyawa + 1 jam, 0 nyawa + 1 jam 40 menit (anchor bergeser 1 jam), > 5 jam.
- [ ] Dua request `answer` bersamaan untuk soal yang sama hanya mengurangi 1 nyawa.

**Skenario manual end-to-end**
1. Buka web → daftar dengan username baru → Beranda tanpa garis, Leaderboard kosong.
2. Selesaikan chapter 1 → bar hijau "LANJUT", XP naik, garis belum muncul ke chapter 2 (aktif), bintang tampil.
3. Selesaikan chapter 2 → garis dari chapter 1 ke chapter 2 muncul.
4. Sengaja menjawab salah sampai nyawa 0 → kembali ke Beranda, banner nyawa habis.
5. Tutup browser, buka lagi (atau masukkan username) → progres utuh, nyawa sesuai waktu berlalu.
6. Ganti username → Header, Profil, Leaderboard berubah.
7. Ekspor data → file JSON terunduh.
8. Keluar → kembali ke `/`; masuk lagi → data pulih.
