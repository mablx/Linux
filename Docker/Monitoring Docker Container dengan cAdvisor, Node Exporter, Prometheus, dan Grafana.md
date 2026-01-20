### Monitoring Docker Container dengan cAdvisor, Node Exporter, Prometheus, dan Grafana

Docker adalah tools DevOps modern, monitoring container Docker menjadi sangat penting untuk menjaga performa, stabilitas, dan ketersediaan sistem. Artikel ini akan membahas cara melakukan monitoring Docker container menggunakan **cAdvisor**, **Node Exporter**, **Prometheus**, dan **Grafana**.

Artikel ini akan membantu kamu untuk membangun stack monitoring Docker container secara lengkap, mulai dari pengumpulan metrics hingga visualisasi data di Grafana.

------

### 🔌 Port yang Digunakan

Pastikan port berikut tersedia di server:

- 🟢 **Grafana**: `3000`
- 🔵 **cAdvisor**: `8080`
- 🟠 **Prometheus**: `9090`
- 🟣 **Node Exporter**: `9100`

------

### ⚙️ Aktifkan Docker Metrics

Docker perlu dikonfigurasi agar menyediakan metrics yang bisa dikumpulkan oleh Prometheus.

Edit file `/etc/docker/daemon.json`:

```json
{
  "metrics-addr": "0.0.0.0:9323",
  "experimental": true
}
```

Kemudian restart Docker:

```bash
sudo systemctl restart docker
```

------

### 📦 Instalasi Node Exporter

Node Exporter berguna untuk memonitor resource host Linux seperti CPU, disk, dan RAM.

#### 1. Unduh dan install

```bash
wget https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz
tar xvf node_exporter-1.7.0.linux-amd64.tar.gz
cd node_exporter-1.7.0.linux-amd64
```

#### 2. Buat service

```ini
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=default.target
```

#### 3. Aktifkan service

```bash
sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter
```

------

### 🧱 Instalasi Monitoring Stack dengan Docker Compose

#### 1. Unduh instalasi

```bash
git clone https://github.com/vegasbrianc/prometheus.git
cd prometheus
```

#### 2. Jalankan Docker Compose

```bash
docker compose up -d
```

------

### 📊 Akses Dashboard Grafana

Akses dashboard Grafana melalui browser:

- 🌐 `http://IP-SERVER:3000`
- 👤 **Username**: `admin`
- 🔑 **Password**: `admin`

Masuk ke menu dashboard dan tambahkan datasource **Prometheus**, lalu import dashboard sesuai kebutuhan.

📈 **CPU Usage**
📉 **Memory Usage**
📊 **Container Health**

------

### ⚠️ Troubleshooting Panel Kosong

Jika panel tidak menampilkan data:

- Periksa koneksi Prometheus ke cAdvisor
- Pastikan target Prometheus status **UP**
- Gunakan menu **Explore** di Grafana
- Cek konfigurasi `prometheus.yml`

------

### ✅ Kesimpulan

Dengan menggunakan **cAdvisor**, **Node Exporter**, **Prometheus**, dan **Grafana**, Anda dapat membangun sistem monitoring Docker yang kuat, real-time, dan mudah dikembangkan. Stack ini sangat cocok digunakan pada server production maupun lab environment.

------

