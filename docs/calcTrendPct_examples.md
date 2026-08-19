# Penjelasan `calcTrendPct` — Contoh Nyata per Kasus

## Fungsi Referensi

```js
function calcTrendPct(minuteArr, n = 5) {
  if (minuteArr.length < 2) return 0;                          // guard ① 
  const take = Math.min(n, Math.floor(minuteArr.length / 2)); // hitung N efektif
  if (take === 0) return 0;                                    // guard ②
  const first = minuteArr.slice(0, take).reduce((a, b) => a + b, 0) / take;
  const last  = minuteArr.slice(-take).reduce((a, b) => a + b, 0) / take;
  return ((last - first) / first) * 100;
}
```

> Semua contoh menggunakan satuan **menit** drying time nyata.  
> Misal `360` = 6 jam, `300` = 5 jam, `240` = 4 jam.

---

## Konversi Format Waktu (`HH:MM` ke Menit)

Sebelum dihitung oleh `calcTrendPct`, string durasi drying time berformat `"HH:MM"` (misal `"05:00"`) dikonversi ke total menit menggunakan fungsi `timeToMinutes`:

```js
function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}
```

### Rumus Konversi:
$$\text{Total Menit} = (\text{Jam} \times 60) + \text{Menit}$$

### Contoh Konversi Nyata:
| Format Sheet (`HH:MM`) | Jam | Menit | Perhitungan | Result (`minuteArr`) |
|:---:|:---:|:---:|:---:|:---:|
| **`"05:00"`** | 5 | 0 | $(5 \times 60) + 0$ | **`300`** menit |
| **`"06:12"`** | 6 | 12 | $(6 \times 60) + 12$ | **`372`** menit |
| **`"04:45"`** | 4 | 45 | $(4 \times 60) + 45$ | **`285`** menit |
| **`"02:30"`** | 2 | 30 | $(2 \times 60) + 30$ | **`150`** menit |

---

## Konversi Kembali (Menit ke `HH:MM`)

Setelah nilai rata-rata menit didapat, tampilan di UI diubah kembali ke format `"HH:MM"` menggunakan fungsi `minutesToTime`:

```js
function minutesToTime(totalMinutes) {
  if (isNaN(totalMinutes) || totalMinutes < 0) return '00:00';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
```

- Misal rata-rata `362.4` menit $\rightarrow$ $\lfloor 362.4 / 60 \rfloor = 6$ jam, sisa $\text{round}(2.4) = 2$ menit $\rightarrow$ **`"06:02"`**

---

## Aturan Menentukan `take` (N efektif)

```
take = Math.min(5,  floor(jumlah_batch / 2))
```

| Jumlah batch | `floor(n/2)` | `Math.min(5, …)` | **take** |
|:---:|:---:|:---:|:---:|
| ≥ 10 | ≥ 5 | 5 | **5** |
| 9 | 4 | 4 | **4** |
| 8 | 4 | 4 | **4** |
| 7 | 3 | 3 | **3** |
| 6 | 3 | 3 | **3** |
| 5 | 2 | 2 | **2** |
| 4 | 2 | 2 | **2** |
| 3 | 1 | 1 | **1** |
| 2 | 1 | 1 | **1** |
| 1 | 0 | — | **0 → return 0** |
| 0 | — | — | **length < 2 → return 0** |

---

## Case 1 — > 10 batch (contoh: 15 batch)

**Data:** `[360, 370, 355, 365, 362, 350, 345, 340, 330, 325, 320, 310, 305, 300, 295]`  
_(urutan kronologis: batch paling lama → paling baru)_

```
take = Math.min(5, floor(15/2)) = Math.min(5, 7) = 5
```

```
5 batch PERTAMA  → [360, 370, 355, 365, 362]
avg_first = (360+370+355+365+362) / 5 = 1812 / 5 = 362.4 menit

5 batch TERAKHIR → [320, 310, 305, 300, 295]
avg_last  = (320+310+305+300+295) / 5 = 1530 / 5 = 306.0 menit

pct = ((306.0 - 362.4) / 362.4) × 100
    = (-56.4 / 362.4) × 100
    = -15.56%
```

✅ **Hasil: `-15.56%`** → Hijau (drying time makin cepat — bagus!)

---

## Case 2 — Tepat 10 batch

**Data:** `[300, 310, 305, 320, 315, 290, 285, 280, 275, 270]`

```
take = Math.min(5, floor(10/2)) = Math.min(5, 5) = 5
```

```
5 batch PERTAMA  → [300, 310, 305, 320, 315]
avg_first = 1550 / 5 = 310.0 menit

5 batch TERAKHIR → [290, 285, 280, 275, 270]
avg_last  = 1400 / 5 = 280.0 menit

pct = ((280.0 - 310.0) / 310.0) × 100
    = (-30 / 310) × 100
    = -9.68%
```

✅ **Hasil: `-9.68%`** → Hijau

> **Catatan:** Dengan 10 batch, pembagian sempurna — 5 pertama vs 5 terakhir, tidak ada batch yang "dilewati" di tengah.

---

## Case 3 — < 10 batch (contoh: 7 batch)

**Data:** `[400, 390, 385, 380, 375, 370, 360]`

```
take = Math.min(5, floor(7/2)) = Math.min(5, 3) = 3
```

```
3 batch PERTAMA  → [400, 390, 385]
avg_first = 1175 / 3 = 391.67 menit

3 batch TERAKHIR → [375, 370, 360]
avg_last  = 1105 / 3 = 368.33 menit

pct = ((368.33 - 391.67) / 391.67) × 100
    = (-23.34 / 391.67) × 100
    = -5.96%
```

✅ **Hasil: `-5.96%`** → Hijau

> **Batch ke-4 `[380]` di tengah DIABAIKAN** — tidak masuk ke "pertama" maupun "terakhir".

---

## Case 4 — 5 batch

**Data:** `[350, 360, 355, 370, 380]`

```
take = Math.min(5, floor(5/2)) = Math.min(5, 2) = 2
```

```
2 batch PERTAMA  → [350, 360]
avg_first = 710 / 2 = 355.0 menit

2 batch TERAKHIR → [370, 380]
avg_last  = 750 / 2 = 375.0 menit

pct = ((375.0 - 355.0) / 355.0) × 100
    = (20 / 355) × 100
    = +5.63%
```

⚠️ **Hasil: `+5.63%`** → Merah (drying time makin lambat — buruk!)

> **Batch ke-3 `[355]` di tengah DIABAIKAN**.  
> N berubah dari 5 → 2, karena data tidak cukup untuk take=5.

---

## Case 5 — 3 batch

**Data:** `[280, 290, 300]`

```
take = Math.min(5, floor(3/2)) = Math.min(5, 1) = 1
```

```
1 batch PERTAMA  → [280]
avg_first = 280.0 menit

1 batch TERAKHIR → [300]
avg_last  = 300.0 menit

pct = ((300.0 - 280.0) / 280.0) × 100
    = (20 / 280) × 100
    = +7.14%
```

⚠️ **Hasil: `+7.14%`** → Merah

> Hanya 1 batch dibandingkan vs 1 batch. Batch tengah `[290]` diabaikan.  
> ⚡ **Perhatian:** Dengan hanya 3 batch, persentase ini kurang representatif.

---

## Case 6 — 2 batch

**Data:** `[360, 300]`

```
take = Math.min(5, floor(2/2)) = Math.min(5, 1) = 1
```

```
1 batch PERTAMA  → [360]
avg_first = 360.0 menit

1 batch TERAKHIR → [300]
avg_last  = 300.0 menit

pct = ((300.0 - 360.0) / 360.0) × 100
    = (-60 / 360) × 100
    = -16.67%
```

✅ **Hasil: `-16.67%`** → Hijau

> Sama seperti Case 5 — hanya 1 vs 1. Dengan **hanya 2 batch**, angka ini **tidak reliable** sebagai tren, tapi tetap dihitung.

---

## Case 7 — < 2 batch (0 atau 1 batch)

**Data:** `[360]` atau `[]`

```
minuteArr.length < 2  →  return 0 langsung  (guard ①)
```

⚪ **Hasil: `0.00%`** → Abu-abu (Stabil / tidak cukup data)

---

## Ringkasan Visual

```
Batch:  [ B1, B2, B3, ... , Bx, By, Bz ]
         \___ take ___/       \___ take ___/
            avg_first              avg_last

pct = ((avg_last - avg_first) / avg_first) × 100

Negatif → Makin cepat ✅   (good)
Positif → Makin lambat ⚠️  (bad)
-0.5% s/d +0.5% → Stabil ⚪
```

---

## Threshold Warna di UI

```js
const isGood = pct < -0.5;   // → hijau  (TrendingDown ↘)
const isBad  = pct >  0.5;   // → merah  (TrendingUp ↗)
// else                       // → abu-abu (Minus —)
```
