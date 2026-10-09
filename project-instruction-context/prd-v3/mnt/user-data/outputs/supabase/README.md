# Konfigurasi Supabase (Produksi)

Folder ini berisi semua yang dibutuhkan untuk memakai Supabase Postgres sebagai database produksi.
Untuk pengembangan lokal di laptop gunakan MySQL (lihat `../database/mysql/`).

Aplikasi memakai Postgres Supabase **hanya dari server** (lewat `pg` + Kysely). Supabase Auth,
Storage, dan API REST publik tidak dipakai.

## Langkah Setup

1. **Buat project** di supabase.com (region Southeast Asia / Singapore), atau lewat
   Vercel -> project -> Storage -> Create Database -> Supabase. Simpan database password.
2. **Jalankan migrasi**: buka Dashboard -> SQL Editor, tempel isi `migrations/0001_init.sql`, jalankan.
   Hasil: 8 tabel kosong + RLS aktif tanpa policy (data tidak bisa diakses lewat API publik).
   Alternatif dengan Supabase CLI:
   ```bash
   supabase login
   supabase link --project-ref <ref-project>
   supabase db push
   ```
3. **Ambil connection string pooler**: Project Settings -> Database -> Connection string ->
   pilih **Transaction pooler** (port 6543). Ganti `[YOUR-PASSWORD]` dengan password database.
4. **Isi environment variable di Vercel** (lihat `.env.example` di folder ini):
   `DB_PROVIDER=supabase`, `DATABASE_URL`, `SESSION_SECRET`, `GEMINI_API_KEY`.
   Nama tampilan dashboard dapat berubah; yang penting adalah connection string pooler.
5. **Deploy**: `git push` ke GitHub, Vercel otomatis build dan deploy.
6. **Verifikasi**: daftar akun baru di situs produksi, lalu cek tabel `players` di
   Dashboard -> Table Editor (harus ada 1 baris milik akun tadi, bukan data lain).

## Catatan
- Gunakan **pooler** (bukan koneksi direct) agar koneksi tidak habis di lingkungan serverless.
- Tidak ada migrasi data dari lokal: data lokal hanya data uji. Produksi dimulai kosong.
- Jika skema berubah, buat migrasi baru (`0002_xxx.sql`) dan ubah juga `database/mysql/schema.sql`.
- Paket gratis Supabase dapat menjeda project yang lama tidak aktif; cek kebijakan terbaru
  sebelum rilis publik.
- Jangan pernah commit connection string atau password; hanya `.env.example` yang boleh di repositori.
