# Disaster Recovery Cluster (DRC) WordPress dengan MariaDB Galera dan Load Balancer Caddy

---

## 🖥️ Spesifikasi Server  

| Server                | IP           | Hostname           | Peran                                                  |
| --------------------- | ------------ | ------------------ | ------------------------------------------------------ |
| **DRC-1** (Primary)   | 172.20.0.201 | drc1.syslab.my.id  | Node Galera utama + container WordPress                |
| **DRC-2** (Secondary) | 172.20.0.202 | drc2.syslab.my.id  | Node Galera replikasi + container WordPress            |
| **CADDY-WEB-SERVER**  | 172.20.0.203 | caddy.syslab.my.id | Load balancer Caddy (HTTP/HTTPS) + HAProxy (port 3306) |

🌐 **Domain:** `www.syslab.my.id` dan `syslab.my.id`

## 📁 Struktur Direktori

Contoh di setiap server `~/wordpress-drc/`:

```bash
wordpress-drc/
├── db
├── data
├── docker-compose.yml
└── wordpress
```

## 🚀 Langkah-langkah Lengkap Deployment

### 1. Siapkan Docker & Folder di Setiap Server

```bash
sudo apt update && sudo apt install docker.io docker-compose -y
mkdir -p ~/wordpress-drc/{db,data,wordpress}
cd ~/wordpress-drc
```

### 2. Konfigurasi DRC-1 (172.20.0.201)

#### 📄File: `docker-compose.yml`

```bash
services:
  mariadb:
    image: bitnami/mariadb-galera:latest
    container_name: mariadb
    restart: always
    environment:
      - MARIADB_ROOT_PASSWORD=PasswordKamu
      - MARIADB_DATABASE=wordpress
      - MARIADB_GALERA_CLUSTER_NAME=wp_cluster
      - MARIADB_GALERA_CLUSTER_ADDRESS=gcomm://172.20.0.201,172.20.0.202
      - MARIADB_GALERA_NODE_NAME=drc1
      - MARIADB_GALERA_NODE_ADDRESS=172.20.0.201
      - MARIADB_GALERA_CLUSTER_BOOTSTRAP=yes
    volumes:
      - ./db:/bitnami/mariadb
    network_mode: host
 
  wordpress:
    image: masdika/wordpress:latest
    container_name: wp
    restart: always
    environment:
      - WORDPRESS_DB_HOST=172.20.0.202
      - WORDPRESS_DB_NAME=wordpress
      - WORDPRESS_DB_USER=root
      - WORDPRESS_DB_PASSWORD=PasswordKamu
    volumes:
      - ./wordpress:/bitnami/wordpress
    network_mode: host
```

### 3. Konfigurasi DRC-1 (172.20.0.202)

#### 📄File: `docker-compose.yml`

```bash
services:
  mariadb:
    image: bitnami/mariadb-galera:latest
    container_name: mariadb
    restart: always
    environment:
      - MARIADB_ROOT_PASSWORD=PasswordKamu
      - MARIADB_DATABASE=wordpress
      - MARIADB_GALERA_CLUSTER_NAME=wp_cluster
      - MARIADB_GALERA_CLUSTER_ADDRESS=gcomm://172.20.0.201,172.20.0.202
      - MARIADB_GALERA_NODE_NAME=drc2
      - MARIADB_GALERA_NODE_ADDRESS=103.168.146.71
      - MARIADB_GALERA_CLUSTER_BOOTSTRAP=no
    volumes:
      - ./db:/bitnami/mariadb
    network_mode: host
 
  wordpress:
    image: masdika/wordpress:latest
    container_name: wp
    restart: always
    environment:
      - WORDPRESS_DB_HOST=172.20.0.202
      - WORDPRESS_DB_NAME=wordpress
      - WORDPRESS_DB_USER=root
      - WORDPRESS_DB_PASSWORD=PasswordKamu
    volumes:
      - ./wordpress:/bitnami/wordpress
    network_mode: host
```

### 4. Konfigurasi Load Balancer CADDY + HAProxy (172.20.0.203)

#### 📄File: `Caddyfile`

```bash
syslab.my.id, www.syslab.my.id {
    reverse_proxy 172.20.0.201:80 172.20.0.202:80 {
        lb_policy random
        health_interval 10s
        health_timeout 5s
        health_body    "<title>WordPress</title>"
    }
}
```

#### 📄File: `haproxy.cfg`

```bash
global
    log stdout format raw local0
 
defaults
    log     global
    mode    tcp
    option  tcplog
    timeout connect 5s
    timeout client  50s
    timeout server  50s
 
frontend mysql_front
    bind *:3306
    default_backend mysql_back
 
backend mysql_back
    mode tcp
    option tcp-check
    balance roundrobin
    server drc1 172.20.0.201:3306 check
    server drc2 172.20.0.202:3306 check backup
```

#### 🐋File: `docker-compose.yml`

```bash
services:
  caddy:
    image: caddy:latest
    container_name: caddy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./caddy_data:/data
      - ./caddy_config:/config
 
  haproxy:
    image: haproxy:latest
    container_name: haproxy
    restart: always
    ports:
      - "3306:3306"
    volumes:
      - ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg
```

### 5. Jalankan Semua Layanan🚀

```bash
# DRC-1 dan DRC-2
cd ~/wordpress-drc
sudo docker compose up -d
 
# Caddy Server
cd ~/caddy-docker
sudo docker compose up -d
```

## ✅Verifikasi Cluster

### 1. Masuk ke salah satu node DB:

```bash
docker exec -it mariadb mysql -uroot -p
SHOW STATUS LIKE 'wsrep_cluster_size';
```

![image 1](G:\Markdown\Linux\src\Disaster Recovery Cluster (DRC) WordPress dengan MariaDB Galera dan Load Balancer Caddy\image 1.png)

Output `2` artinya dua node terkoneksi dengan baik.

### 2. Akses WordPress:

Kunjungi `https://www.syslab.my.id` dan pastikan WordPress bisa diakses.🌐

![image 2](G:\Markdown\Linux\src\Disaster Recovery Cluster (DRC) WordPress dengan MariaDB Galera dan Load Balancer Caddy\image 2.png)

## 📌 Catatan Tambahan

- Gunakan `network_mode: host` untuk akses langsung ke port antar node.
- Jika salah satu node down, setelah up otomatis akan bergabung kembali jika volume tidak corrupt.🔁
- Pastikan `MARIADB_GALERA_CLUSTER_BOOTSTRAP=yes` hanya di satu node saja (biasanya DRC-1).
- HAProxy akan mem-forward semua koneksi MySQL melalui IP CADDY-WEB-SERVER (3306), lalu diarahkan ke node aktif.
- Untuk WordPress, `WORDPRESS_DB_HOST` bisa diarahkan ke IP Caddy (103.168.146.72) agar koneksi selalu lewat load balancer.

## ➕ Menambahkan Server Baru ke Cluster

 Jika Anda ingin menambahkan node DRC baru (misalnya DRC-3):

### 1. Pastikan volume bersih dan IP statis tersedia**

### 2. Gunakan image dan struktur direktori yang sama seperti node lainnya

### 3.Modifikasi environment pada `docker-compose.yml` seperti berikut:

```bash
- MARIADB_GALERA_NODE_NAME=drc3
- MARIADB_GALERA_NODE_ADDRESS=172.20.0.201
- MARIADB_GALERA_CLUSTER_ADDRESS=gcomm://172.20.0.201,172.20.0.202,172.20.0.203
- MARIADB_GALERA_CLUSTER_BOOTSTRAP=no
```

### 4. Jalankan dengan docker compose up -d, node akan join otomatis jika konfigurasi benar dan tidak ada kesalahan pada volume/data. 🧠

Dengan setup ini, WordPress Anda akan selalu aktif meskipun salah satu server down. Solusi DRC ini cukup sederhana dan efisien, cocok untuk production skala kecil-menengah dengan budget minim. 🚀✨
