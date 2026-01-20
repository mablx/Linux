# 🌐 Cara Install WordPress Menggunakan Docker Compose dengan FrankenPHP dan Caddy

Jika kamu ingin menginstal WordPress dengan cara modern dan efisien menggunakan Docker, kombinasi **FrankenPHP** dan **Caddy** adalah pilihan yang sangat powerful. Kombinasi ini menawarkan kecepatan tinggi serta kemudahan konfigurasi SSL otomatis. Artikel ini akan memandu kamu langkah demi langkah.

## 📁 Struktur Folder WordPress Docker

Sebelum mulai, pastikan struktur folder kamu seperti berikut:

```
mablx-project/
├── docker-compose.yml          # Konfigurasi utama FrankenPHP + Caddy
├── Dockerfile                  # Build image WordPress + FrankenPHP
├── Caddyfile                   # Konfigurasi web server Caddy
└── wordpress/                  # File WordPress dari image resmi
```

---

## 📥 Langkah 1: Download File WordPress ke Volume Host

Langkah pertama adalah mengunduh file WordPress dari image resmi dan menyimpannya di direktori `./wordpress`.

### 📄 File `docker-compose.download.yml`

```yaml
services:
  wordpress:
    image: wordpress:latest
    container_name: wordpress-downloader
    volumes:
      - ./wordpress:/var/www/html
```

### 🚀 Jalankan Perintah

```bash
docker compose -f docker-compose.download.yml up
```

Tunggu hingga file WordPress muncul di folder `./wordpress`.

---

## 🧹 Langkah 2: Bersihkan Image dan Container

Setelah file berhasil diunduh, jalankan perintah berikut:

```bash
docker compose -f docker-compose.download.yml down -v
docker rmi wordpress:latest
```

Ini akan menghapus container sementara dan image `wordpress:latest` agar tidak konflik dengan build FrankenPHP selanjutnya.

---

## ⚙️ Langkah 3: Konfigurasi Docker Compose WordPress dengan FrankenPHP + Caddy

### 📄 File `docker-compose.yml`

```yaml
services:
  php:
    container_name: wordpress-frankenphp-php
    build: .
    image: example.com:latest
    restart: always
    ports:
      - "80:80"
      - "443:443/udp"
    volumes:
      - caddy_data:/data
      - caddy_config:/config
    environment:
      SERVER_NAME: example.com www.example.com
    depends_on:
      - db

  db:
    container_name: wordpress-frankenphp-db
    image: mysql:latest
    restart: always
    environment:
      MYSQL_DATABASE: wordpress_db
      MYSQL_USER: dummyuser
      MYSQL_PASSWORD: dummypass123
      MYSQL_ROOT_PASSWORD: dummypass123
    volumes:
      - db_data:/var/lib/mysql

volumes:
  caddy_data:
  caddy_config:
  db_data:
```

### 📄 File `Dockerfile`

```dockerfile
FROM dunglas/frankenphp
ENV SERVER_NAME="example.com www.example.com"

RUN docker-php-ext-install mysqli && docker-php-ext-enable mysqli

RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

RUN echo "upload_max_filesize = 512M" >> "$PHP_INI_DIR/php.ini" && \
    echo "post_max_size = 512M" >> "$PHP_INI_DIR/php.ini" && \
    echo "memory_limit = 512M" >> "$PHP_INI_DIR/php.ini" && \
    echo "max_execution_time = 320" >> "$PHP_INI_DIR/php.ini" && \
    echo "max_input_time = 300" >> "$PHP_INI_DIR/php.ini"

COPY ./wordpress /app/public
COPY ./Caddyfile /etc/caddy/Caddyfile
```

### 📄 File `Caddyfile`

```caddy
example.com {
    redir https://www.example.com{uri} permanent
}

www.example.com {
    root * /app/public
    php_fastcgi localhost:9000
    encode gzip
    file_server
}
```

Untuk deploy via **localhost**, kamu bisa isi `Caddyfile` seperti ini:

```caddy
http://192.168.1.10 {
    root * /app/public
    php_fastcgi localhost:9000
    encode gzip
    file_server
}
```

---

## 🛠️ Langkah 4: Sesuaikan File `wp-config.php`

Masuk ke direktori `./wordpress` dan salin file konfigurasi:

```bash
cp wp-config-sample.php wp-config.php
```

Lalu ubah baris-baris berikut di `wp-config.php`:

```php
define( 'DB_NAME', 'wordpress_db' );
define( 'DB_USER', 'dummyuser' );
define( 'DB_PASSWORD', 'dummypass123' );
// Penting: Host diarahkan ke nama service container database
define( 'DB_HOST', 'wordpress-frankenphp-db' );
```

Pastikan `DB_HOST` sesuai dengan nama service `db` di `docker-compose.yml`, yaitu `wordpress-frankenphp-db`.

---

## 🚀 Langkah 5: Jalankan WordPress dengan Docker Compose

Setelah semua file siap, jalankan perintah berikut:

```bash
docker compose up --build -d
```

WordPress sekarang berjalan di `http://example.com` dan secara otomatis akan menggunakan HTTPS jika domain kamu telah mengarah ke IP server.

---

## 🗑️ Opsional: Hapus Container & Image

Untuk menghentikan dan membersihkan:

```bash
docker compose down -v
docker rmi example.com:latest
```

---

## ✅ Keunggulan Menggunakan FrankenPHP + Caddy

- ✅ **SSL otomatis** dengan Let's Encrypt  
- ✅ **Konfigurasi sederhana** tanpa file `.htaccess`  
- ✅ **Kinerja tinggi** dengan PHP built-in server  
- ✅ **Pengelolaan modern** menggunakan Docker Compose terbaru  

---

## 🎉 Kesimpulan

Dengan mengikuti panduan ini, kamu telah berhasil:

- 📥 Mengunduh file WordPress tanpa database  
- 🧹 Menghapus image default `wordpress:latest`  
- ⚡ Membuat environment WordPress yang lebih modern dan cepat menggunakan **FrankenPHP** dan **Caddy**  

Setup ini cocok untuk pengembangan, staging, maupun deployment produksi (dengan tambahan keamanan & backup).

---



