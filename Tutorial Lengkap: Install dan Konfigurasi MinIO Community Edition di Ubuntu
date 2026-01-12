### Tutorial Lengkap: Install dan Konfigurasi MinIO Community Edition di Ubuntu

MinIO adalah object storage server berbasis open-source yang sangat cocok digunakan sebagai penyimpanan kompatibel Amazon S3. Artikel ini akan membahas cara install dan konfigurasi **MinIO Community Edition** di Ubuntu secara lengkap, mulai dari setup awal hingga manajemen bucket.

------

### 🔐 Persyaratan

Sebelum memulai, pastikan sistem memenuhi syarat berikut:

- Ubuntu Server (20.04 / 22.04)
- Akses root atau sudo
- Port **9000** (Object API) dan **9001** (Console) terbuka di firewall

------

### 🔄 1. Update Sistem

```bash
sudo apt update && sudo apt upgrade -y
```

------

### 📦 2. Unduh dan Install MinIO

```bash
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/
```

------

### 📁 3. Buat Direktori untuk Data dan Konfigurasi

```bash
sudo mkdir -p /data/minio
sudo mkdir -p /etc/minio
sudo chown -R minio-user:minio-user /data/minio
```

------

### ⚙️ 4. Buat Service Systemd

Buat file service:

```ini
[Unit]
Description=MinIO
Documentation=https://min.io/docs/
After=network.target

[Service]
User=minio-user
Group=minio-user
ExecStart=/usr/local/bin/minio server /data/minio --console-address ":9001"
Restart=always
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

Reload dan jalankan service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable minio
sudo systemctl start minio
```

------

### 🔍 5. Cek Status dan Akses

```bash
sudo systemctl status minio
```

Akses Web UI MinIO melalui browser:

- 🌐 `http://IP-SERVER:9001`
- Object API: `http://IP-SERVER:9000`

------

### 🧰 6. Install dan Konfigurasi MinIO Client (mc)

#### 6.1 Unduh dan Install mc

```bash
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/
```

#### 6.2 Tambahkan Alias Server MinIO

```bash
mc alias set myminio http://localhost:9000 ACCESS_KEY SECRET_KEY
```

------

### 🪣 6.3 Cek Bucket yang Ada

```bash
mc ls myminio
```

------

### 🧑‍💻 7. Manajemen Bucket (via CLI)

#### ➕ Membuat Bucket

```bash
mc mb myminio/bucket-test
```

#### ❌ Menghapus Bucket (harus kosong)

```bash
mc rb myminio/bucket-test
```

#### 🗑️ Menghapus Objek

```bash
mc rm myminio/bucket-test/file.txt
```

------

### 📝 8. Catatan Web UI Terbaru MinIO

Web UI MinIO terbaru menyediakan fitur:

- Manajemen bucket dan objek
- Manajemen user dan policy
- Monitoring usage dan aktivitas
- Pengaturan access key langsung dari dashboard

------

### 🏁 Penutup

Dengan mengikuti tutorial ini, Anda dapat menginstall dan mengkonfigurasi **MinIO Community Edition** di Ubuntu dengan mudah. MinIO sangat cocok digunakan sebagai object storage untuk kebutuhan backup, aplikasi cloud-native, dan integrasi S3-compatible storage.

------

**Tags:**
`MinIO` · `Object Storage` · `Ubuntu` · `S3` · `Cloud`

------

