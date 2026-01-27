Masalah ini **100% karena DNS / jaringan**, bukan karena `apt`-nya.
Ubuntu 24.04 (noble) **tidak bisa resolve domain** `archive.ubuntu.com` & `security.ubuntu.com`.

Ikuti langkah di bawah **urut dari atas**, biasanya selesai di langkah 2–3.

------

## ✅ 1. Pastikan network aktif

```bash
ip a
ip route
```

Harus ada:

- IP address (bukan `DOWN`)
- default route, contoh:

```
default via 192.168.1.1 dev eth0
```

Jika **tidak ada default route**, network belum jalan → cek VM / NIC / bridge.

------

## ✅ 2. Cek DNS (ini penyebab paling sering)

```bash
resolvectl status
```

Kalau DNS **kosong / 127.0.0.53 tapi tidak resolve**, lanjut fix manual.

Tes:

```bash
ping -c 3 8.8.8.8
ping -c 3 google.com
```

- ✅ ping IP berhasil, domain gagal → **DNS rusak**
- ❌ ping IP gagal → **network mati**

------

## ✅ 3. Fix DNS cepat (REKOMENDASI)

Ubuntu 24.04 pakai **systemd-resolved**.

### 🔹 Set DNS Google + Cloudflare

```bash
sudo resolvectl dns eth0 8.8.8.8 1.1.1.1
sudo resolvectl domain eth0 ~.
```

> Jika interface bukan `eth0`, cek dengan:

```bash
ip link
```

Lalu restart resolver:

```bash
sudo systemctl restart systemd-resolved
```

Cek lagi:

```bash
resolvectl status
```

------

## ✅ 4. Jika masih gagal → override resolv.conf (paksa)

```bash
sudo rm -f /etc/resolv.conf
sudo tee /etc/resolv.conf <<EOF
nameserver 8.8.8.8
nameserver 1.1.1.1
EOF
```

Kunci supaya tidak diubah otomatis:

```bash
sudo chattr +i /etc/resolv.conf
```

⚠️ Gunakan ini jika server / VM bermasalah DHCP.

------

## ✅ 5. Bersihkan cache apt

```bash
sudo rm -rf /var/lib/apt/lists/*
sudo apt clean
```

------

## ✅ 6. Jalankan kembali

```bash
sudo apt update
sudo apt upgrade -y
```

------

## ✅ 7. Jika di server / VM / Cloud (penting)

Kalau ini:

- Proxmox
- VMware
- OpenStack
- VPS

Cek:

- DNS dari **provider**
- `/etc/netplan/*.yaml`

Contoh netplan yang benar:

```yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: true
      nameservers:
        addresses:
          - 8.8.8.8
          - 1.1.1.1
```

Apply:

```bash
sudo netplan apply
```

------

## 🧠 Kesimpulan

Pesan:

```
Temporary failure resolving
```

= **DNS error**

99% kasus Ubuntu 24.04 → **systemd-resolved / DHCP DNS rusak**

------

