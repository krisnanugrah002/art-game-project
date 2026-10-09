# Database MySQL (Khusus Lokal)

Folder ini hanya untuk pengembangan di laptop. Setelah di-push ke GitHub dan di-deploy ke Vercel,
aplikasi memakai Supabase (lihat folder `../../supabase/`).

## Prasyarat
- MySQL 8.0.16+ atau MariaDB 10.5+ (XAMPP/Laragon juga bisa).

## Langkah
1. Buat database dan tabel (semua tabel kosong, tanpa data dummy):
   ```bash
   mysql -u root -p < database/mysql/schema.sql
   ```
2. Buat user khusus aplikasi (jalankan di klien MySQL, ganti password):
   ```sql
   CREATE USER IF NOT EXISTS 'seni_app'@'localhost' IDENTIFIED BY 'ganti_password';
   GRANT SELECT, INSERT, UPDATE, DELETE ON seni_rupa.* TO 'seni_app'@'localhost';
   FLUSH PRIVILEGES;
   ```
3. Salin `.env.example` ke `.env.local`, lalu isi:
   ```
   DB_PROVIDER=mysql
   MYSQL_URL=mysql://seni_app:ganti_password@localhost:3306/seni_rupa
   SESSION_SECRET=string-acak-panjang-minimal-32-karakter
   ```
4. Jalankan aplikasi: `npm run dev`.

## Reset database lokal (mulai dari kosong)
```sql
DROP DATABASE seni_rupa;
```
Lalu jalankan ulang langkah 1-2.

## Catatan
- Semua waktu disimpan sebagai UTC; pool `mysql2` memakai `timezone: 'Z'`.
- Jika skema diubah, ubah juga `supabase/migrations/0001_init.sql` (atau tambahkan migrasi baru) agar tetap ekuivalen.
- Jangan commit `.env.local`.
