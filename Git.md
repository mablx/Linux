# > Command Git

## **Cek Origin**
```bash
git remote -v 
```

## **Set Origin**
```bash
git remote set-url origin https://github.com/<user>/<repo>
```

## **Push Ke Repo**
```bash
git push origin <repo>
```

---

---

# > cara edit commit git per file

## Metode 1: Menggunakan `git reset` dan `git add --patch`

### 1. Kembalikan (unstage) perubahan dari commit terakhir (jika sudah di-commit):

```bash
git reset HEAD~1
```

> Perintah ini akan memindahkan commit terakhir kembali ke status "staged/unstaged" (area persiapan/belum dipersiapkan), menjaga perubahan file Anda tetap ada, tetapi belum di-commit.

### 2. Tambahkan perubahan secara interaktif (per file):

```bash
git add --patch
# atau
git add -p
```

Perintah ini memulai sesi interaktif yang menampilkan "chunks" (bagian-bagian) perubahan dalam file Anda. Git akan menanyakan apakah Anda ingin menambahkan setiap chunk ke area staging.

1. Ketik `y` (ya) untuk menambahkan chunk.
2. Ketik `n` (tidak) untuk melewatkan chunk tersebut.
3. Ketik `s` untuk membagi chunk menjadi bagian yang lebih kecil (jika perubahan dalam satu file besar).
4. Ketik `d` untuk keluar atau melihat opsi lain.

### 3. Buat commit pertama:

Setelah Anda menambahkan perubahan untuk file/bagian file pertama ke area staging, buat commit:

```bash
git commit -m "Pesan commit untuk file pertama"
```

### 4. Ulangi proses untuk file/perubahan berikutnya:

Gunakan lagi `git add -p` untuk men-stage perubahan yang tersisa, lalu buat commit baru:

``` bash
git commit -m "Pesan commit untuk file kedua"
```

## Metode 2: Menggunakan `git commit --amend

Metode ini digunakan jika Anda hanya ingin *mengubah* commit terakhir dengan menambahkan atau menghapus file tertentu dari commit tersebut.

1. **Pastikan perubahan yang diinginkan ada di area kerja Anda.**

2. **Tambahkan file yang ingin Anda masukkan ke dalam commit:**x

   Gunakan `git add` untuk file spesifik yang ingin Anda tambahkan ke commit terakhir:

   ```
   git add nama_file_yang_ingin_diedit.txt
   ```

3. **Ubah commit terakhir:**

   ```
   git commit --amend --no-edit
   ```

   1. `--amend` akan menambahkan perubahan yang distage ke commit terakhir, menggantikan commit asli.
   2. `--no-edit` akan menggunakan kembali pesan commit yang sama tanpa membuka editor teks. Jika Anda ingin mengubah pesannya, hilangkan `--no-edit`.

## Metode 3: Menggunakan `git rebase -i` (Lanjutan)

Metode ini sangat kuat jika Anda perlu mengedit commit yang bukan commit terakhir (misalnya, commit ketiga dari belakang).

1. **Mulai rebase interaktif:**

   ```
   git rebase -i HEAD~3
   # Mengedit 3 commit terakhir
   ```

2. **Tandai commit yang ingin Anda edit dengan `edit` (atau `e`):**

   Editor teks akan terbuka. Ganti `pick` dengan `edit` di sebelah commit yang relevan, simpan, dan tutup editor.

3. **Edit file yang diinginkan:**
   Setelah rebase berhenti pada commit yang ditandai, gunakan perintah git normal (seperti `git reset HEAD^`, `git add -p`, `git commit --amend`) untuk mengubah isi commit tersebut.

4. **Lanjutkan rebase:**
   Setelah selesai, jalankan:

   ```
   git rebase --continue
   ```

   



















------

# > Cara Mengubah Commit/Kepemilikan

## ✅ KASUS 1 — Commit BELUM di-push ke GitHub

Paling aman & simpel.

Ubah author commit terakhir

```bash
git commit --amend --author="Muhammad Abdullah <email@anda.com>"
```

Lalu simpan (jika editor terbuka).

Cek:

```bash
git log -1
```

------

## ✅ KASUS 2 - Commit SUDAH di-push, tapi hanya 1 commit terakhir

Perlu **force push** ⚠️

```bash
git commit --amend --author="Muhammad Abdullah <email@anda.com>"
git push --force
```

> ⚠️ Jangan lakukan ini jika repo dipakai banyak orang tanpa koordinasi.

------

# > Cara Mengubah Intial commnit 

![001](G:\Markdown\Git\Images\001.png)

➡️ **BISA**, tapi harus **rewrite history (ubah riwayat Git)**

Karena itu **commit lama**, bukan commit terakhir.

Cara PALING BENAR (git rebase)

Misal commit itu ada di awal.

```bash
git log --oneline --reverse
```

Cari hash commit:

```text
xxxxxxx Initial commit AndikaBot WhatsApp Bot
```

Lalu rebase interaktif dari sebelum commit itu:

```bash
git rebase -i --root
```

Nanti editor terbuka, contoh:

```text
pick xxxxxxx Initial commit AndikaBot WhatsApp Bot
pick yyyyyyy commit lainnya
```

Ubah baris commit itu jadi:

```text
reword xxxxxxx Initial commit AndikaBot WhatsApp Bot
```

Atau kalau mau **hapus total**:

```text
drop xxxxxxx Initial commit AndikaBot WhatsApp Bot
```

Simpan → keluar editor
Lalu **force push**:

```bash
git push --force origin main
```

⚠️ **WAJIB `--force` karena history berubah**

------

# > Tag Github

### ✅JIKA YANG BERUBAH HANYA JUDUL RELEASE (PALING MUDAH)

**Ini tidak mengubah tag atau commit sama sekali**

1. Buka **repository GitHub**

2. Klik **Releases**

3. Pilih **v3.0.1**

4. Klik ikon ✏️ **Edit**

5. Ubah:

   ```
   AndikaBot v3.0.1 - Stable Release
   ```

   menjadi:

   ```
   WhatsAppBot v3.0.1 - Stable Release
   ```

6. Klik **Update release**

✔️ **Selesai – ini cara paling aman & direkomendasikan**

------

### ✅ JIKA NAMA ITU ADA DI PESAN TAG (ANNOTATED TAG)

Cek dulu:

```bash
git show v3.0.1
```

Jika masih tertulis **AndikaBot**, lakukan ini:

#### 1️⃣ Hapus tag lama (local & remote)

```bash
git tag -d v3.0.1
git push origin :refs/tags/v3.0.1
```

#### 2️⃣ Buat ulang tag dengan nama baru

```bash
git tag -a v3.0.1 -m "WhatsAppBot v3.0.1 - Stable Release"
git push origin v3.0.1
```

------

## ⚠️ PENTING (WAJIB BACA)

- ❌ **Jangan hapus tag** jika repo sudah dipakai banyak orang (breaking change)
- ✔️ Untuk kasus **judul saja**, **EDIT RELEASE di GitHub UI adalah solusi terbaik
