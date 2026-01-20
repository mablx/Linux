# Tutorial Lengkap: Setup MariaDB Galera Cluster + TLS (Ubuntu 24.04)

Dokumen ini membahas langkah demi langkah membangun **MariaDB Galera Cluster** yang aman menggunakan **TLS/SSL** pada sistem **Ubuntu 24.04**. Cocok untuk kebutuhan high availability dan replikasi database real-time.

------

## Gambaran Arsitektur Cluster

Contoh topologi yang digunakan:

| Node   | Hostname  | IP Address   |
| ------ | --------- | ------------ |
| Node 1 | Cluster-1 | 172.20.0.215 |
| Node 2 | Cluster-2 | 172.20.0.216 |
| Node 3 | Cluster-3 | 172.20.0.217 |

Semua node:

- Ubuntu Server 24.04
- MariaDB 10.11+
- Akses root / sudo
- Waktu sistem sinkron (chrony)

------

## Tahap 1: Instalasi MariaDB & Galera

Jalankan perintah berikut **di semua node**:

```bash
apt update
apt install mariadb-server mariadb-client galera-4 -y
```

Verifikasi:

```bash
mariadb --version
```

Pastikan service aktif:

```bash
systemctl status mariadb
```

------

## Tahap 2: Pembuatan Sertifikat TLS

TLS digunakan agar komunikasi antar node terenkripsi.

### 1️⃣ Buat direktori SSL

```bash
sudo mkdir -p /etc/ssl/mysql
cd /etc/ssl/mysql
```

### 2️⃣ Buat CA (Certificate Authority)

```bash
openssl genrsa 2048 > ca-key.pem
openssl req -new -x509 -nodes -days 3650 \
  -key ca-key.pem -out ca.pem \
  -subj "/CN=Galera-CA"
```

### 3️⃣ Generate server key & CSR

```bash
openssl req -newkey rsa:2048 -days 3650 -nodes \
  -keyout server-key.pem -out server-req.pem \
  -subj "/CN=$(hostname)"
```

### 4️⃣Sign cert

```bash
openssl x509 -req -in server-req.pem -days 3650 \
  -CA ca.pem -CAkey ca-key.pem -set_serial 01 \
  -out server-cert.pem
```

### 5️⃣Copy ke node lain (Contoh Node 2):

```bash
scp *.pem root@172.20.0.216:/etc/ssl/mysql
```

### 5️⃣Copy ke node lain (Contoh Node 3):

```bash
scp *.pem root@172.20.0.217:/etc/ssl/mysql
```

Salin file SSL ke semua node dengan path yang sama.

### 6️⃣Node Pertama (Node 1) Wajib Perbaiki Permission: 

biar tidak error/ada masalah **Galera tidak bisa membaca / memakai file SSL key**.

#### ✅ SOLUSI (PALING AMAN): Perbaiki Permission:

```bash
chown mysql:mysql /etc/ssl/mysql/*.pem
chmod 600 /etc/ssl/mysql/server-key.pem
chmod 644 /etc/ssl/mysql/server-cert.pem
chmod 644 /etc/ssl/mysql/ca.pem
```

Verifikasi:

```bash
sudo -u mysql cat /etc/ssl/mysql/server-key.pem >/dev/null && echo OK
```

Kalau `OK` → aman

#### ❌ Jika Key Terenkripsi (Sering Terjadi)

Cek:

```
openssl rsa -in /etc/ssl/mysql/server-key.pem -check
```

Kalau muncul:

```
Enter pass phrase for server-key.pem:
```

#### ➡️ **Galera TIDAK SUPPORT key ber-password**

Fix:

```
openssl rsa \
  -in /etc/ssl/mysql/server-key.pem \
  -out /etc/ssl/mysql/server-key-nopass.pem
```

Ganti config ke key baru:

```
wsrep_provider_options="socket.ssl_key=/etc/ssl/mysql/server-key-nopass.pem"
```

#### 🔁 Restart MariaDB

```
systemctl daemon-reload
systemctl start mariadb
```

Cek:

```
systemctl status mariadb
```

### 7️⃣Node Kedua dan Node Seterusnya Harus di Perbaiki biar  tidak error seperti Contoh di bawah:

```
Bad value '/etc/ssl/mysql/server-cert.pem'
Permission denied
```

Artinya:
 👉 **user `mysql` TIDAK PUNYA AKSES baca ke file SSL**

Walaupun filenya ada, **permission / ownership masih salah**.

------

#### 🔎 Kenapa ini bisa terjadi?

Galera dijalankan oleh:

```
User = mysql
```

Kalau file SSL:

```
root:root
chmod 600
```

##### ➡️ **mysql TIDAK bisa baca** → Galera gagal start

------

#### ✅ SOLUSI WAJIB (LAKUKAN DI SEMUA NODE)

##### 1️⃣ Set ownership & permission yang BENAR

Jalankan sebagai root:

```
chown mysql:mysql /etc/ssl/mysql/*.pem
chmod 600 /etc/ssl/mysql/server-key.pem
chmod 644 /etc/ssl/mysql/server-cert.pem
chmod 644 /etc/ssl/mysql/ca.pem
```

------

##### 2️⃣ Verifikasi mysql bisa baca

```
sudo -u mysql cat /etc/ssl/mysql/server-cert.pem >/dev/null && echo OK
sudo -u mysql cat /etc/ssl/mysql/server-key.pem  >/dev/null && echo OK
sudo -u mysql cat /etc/ssl/mysql/ca.pem          >/dev/null && echo OK
```

##### ⚠️ **HARUS keluar `OK` semua**

Kalau salah satu gagal → MariaDB **PASTI gagal start**

------

#### 🔐 CEK KEY TIDAK BOLEH PAKAI PASSWORD

Galera **TIDAK support private key ber-password**

Cek:

```
openssl rsa -in /etc/ssl/mysql/server-key.pem -check
```

Kalau muncul:

```
Enter pass phrase:
```

##### Fix:

```
openssl rsa \
 -in /etc/ssl/mysql/server-key.pem \
 -out /etc/ssl/mysql/server-key-nopass.pem
```

Update config:

```
wsrep_provider_options="gcache.size=128M;socket.ssl_key=/etc/ssl/mysql/server-key-nopass.pem;socket.ssl_cert=/etc/ssl/mysql/server-cert.pem;socket.ssl_ca=/etc/ssl/mysql/ca.pem"
```

#### 🔁 Restart MariaDB

```
systemctl daemon-reload
systemctl start mariadb
```

Cek:

```
systemctl status mariadb
```

------

## Tahap 3: Konfigurasi Galera Cluster

Edit konfigurasi MariaDB:

```bash
sudo nano /etc/mysql/mariadb.conf.d/60-galera.cnf
```

Contoh konfigurasi:

```bash
[galera]
wsrep_on=ON
wsrep_provider=/usr/lib/galera/libgalera_smm.so
wsrep_cluster_name="ClusterDB"
wsrep_cluster_address="gcomm://172.20.0.215,172.20.0.216,172.20.0.217"

wsrep_node_name="Cluster-1"
wsrep_node_address="172.20.0.215"

wsrep_sst_method=rsync
binlog_format=row
default_storage_engine=InnoDB
innodb_autoinc_lock_mode=2

# TLS
wsrep_provider_options="socket.ssl_key=/etc/mysql/ssl/server.key;socket.ssl_cert=/etc/mysql/ssl/server.pem;socket.ssl_ca=/etc/mysql/ssl/ca.pem"
```

Sesuaikan **node name** dan **IP** di setiap server.

------

## Tahap 4: Bootstrap Node Pertama

Di **node pertama saja**:

```bash
systemctl stop mariadb
rm -f /var/lib/mysql/grastate.dat
/usr/bin/galera_new_cluster
```

Cek status cluster:

```sql
mysql -u root -p -e "SHOW STATUS LIKE 'wsrep_cluster_size';"
```

```bash
+--------------------+-------+
| Variable_name      | Value |
+--------------------+-------+
| wsrep_cluster_size |   1   |
+--------------------+-------+
```

------

## Tahap 5: Join Node Kedua & Ketiga

Di node lain:

```bash
systemctl stop mariadb
rm -f /var/lib/mysql/grastate.dat
systemctl start mariadb
```

Pastikan node berhasil join:

```sql
mysql -u root -p -e "SHOW STATUS LIKE 'wsrep_cluster_size';"
```

Status harus **Synced**.

Status Node 2:
```bash
+--------------------+-------+
| Variable_name      | Value |
+--------------------+-------+
| wsrep_cluster_size |   2   |
+--------------------+-------+
```
Status Node 3:
```bash
+--------------------+-------+
| Variable_name      | Value |
+--------------------+-------+
| wsrep_cluster_size |   3   |
+--------------------+-------+
```

------

## Tahap 6: Verifikasi Replikasi

Tes sederhana:

```sql
CREATE DATABASE test_galera;
```

Pastikan database tersebut muncul di node lain.

------

## Troubleshooting Umum

### 🔴 Service MariaDB gagal start

- Periksa log:

```bash
journalctl -xeu mariadb
```

### 🔴 Node tidak bisa join cluster

- Pastikan port berikut terbuka:
  - 3306
  - 4444
  - 4567
  - 4568

### 🔴 TLS error

- Pastikan permission file SSL:

```bash
chown mysql:mysql /etc/mysql/ssl/*
chmod 600 /etc/mysql/ssl/*.key
```

------

## Keuntungan Menggunakan TLS di Galera

✅ Data antar node terenkripsi
✅ Aman di jaringan publik
✅ Standar produksi & compliance
✅ Mencegah sniffing dan MITM

------

## Kesimpulan

Dengan konfigurasi ini:

- Galera Cluster berjalan **high availability**
- Replikasi data **real-time**
- Komunikasi antar node **terenkripsi TLS**
- Cocok untuk environment **production**

------

