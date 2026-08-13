<div align="center">

# 🌡️ Drying Time Analysis Dashboard

**Dashboard interaktif untuk memvisualisasikan dan menganalisis waktu drying produk per batch**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Recharts-3-22B8CF?style=for-the-badge)](https://recharts.org/)
[![Google Sheets](https://img.shields.io/badge/Google_Sheets-API_v4-34A853?style=for-the-badge&logo=googlesheets&logoColor=white)](https://developers.google.com/sheets/api)

</div>

---

## 📌 Tentang Proyek

Dashboard ini dibuat untuk kebutuhan **monitoring dan analisis waktu proses drying** pada lini produksi. Data diambil langsung dari **Google Sheets** secara real-time, sehingga tidak memerlukan backend tambahan.

Dengan dashboard ini, tim produksi dapat:
- Memantau **tren waktu drying** per batch secara visual
- Mengidentifikasi **anomali batch** yang menyimpang dari rata-rata
- Membandingkan **performa antar produk dan varian**
- **Mengekspor** data terfilter ke Excel untuk keperluan rekonsiliasi

---

## 🛠️ Tech Stack

### Core
| | Teknologi | Versi |
|---|---|---|
| ⚛️ | React | 19 |
| ⚡ | Vite | 8 |
| 🎨 | Tailwind CSS | 4 |

### Data Source
| | |
|---|---|
| 🗄️ Data | Google Sheets (via API v4) |
| 🔑 Auth | Google API Key (public spreadsheet) |

---

## 🚀 Cara Install & Menjalankan

### Prasyarat

Pastikan sudah terinstall:
- [Node.js](https://nodejs.org/) versi **18 atau lebih baru**
- npm (sudah termasuk dalam Node.js)

### 1. Clone Repository

```bash
git clone https://github.com/username/drying-time-analysis-dashboard.git
cd drying-time-analysis-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment Variable

Buat file `.env` di root project dengan mengcopy dari `.env.example`:

```bash
cp .env.example .env
```

Kemudian isi nilai-nilainya di file `.env`:

```env
VITE_SPREADSHEET_ID=your_spreadsheet_id_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_SHEET_NAME=Sheet1
```

> **Cara mendapatkan nilai-nilai tersebut:**
> - `VITE_SPREADSHEET_ID` — ID ada di URL Google Sheets: `https://docs.google.com/spreadsheets/d/**[ID_ADA_DI_SINI]**/edit`
> - `VITE_GOOGLE_API_KEY` — Buat di [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create API Key, lalu aktifkan **Google Sheets API**
> - `VITE_SHEET_NAME` — Nama tab sheet (default: `Sheet1`)

> **Penting:** Pastikan Google Spreadsheet di-share sebagai **"Anyone with the link can view"** agar API Key dapat membaca data.

### 4. Jalankan Development Server

```bash
npm run dev
```

---

## 📊 Format Data Google Sheets

Sheet harus memiliki kolom-kolom berikut (baris pertama = header):

| Kolom | Keterangan | Contoh |
|---|---|---|
| `Date` | Tanggal batch | `02/01/2021` |
| `Batch No` | Nomor batch unik | `A21010200001` |
| `Product Name` | Nama produk | `Brown Sugar EF100` |
| `Planning (Kg)` | Berat planning dalam kg | `400` |
| `Sub Total Drying` | Total durasi drying (HH:MM) | `02:54` |
| `YEAR` | Tahun (opsional, bisa diturunkan dari Date) | `2021` |

---

## ⚙️ Scripts yang Tersedia

```bash
npm run dev       # Jalankan development server (localhost:5173)
npm run build     # Build untuk production
npm run preview   # Preview hasil build production
npm run lint      # Jalankan linter (oxlint)
```

