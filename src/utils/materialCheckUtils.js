// ── materialCheckUtils.js ────────────────────────────────────────────────────
// Pure functions untuk kalkulasi ketersediaan material dengan efek cascading.

/**
 * Format angka ke format Indonesia (titik ribuan, koma desimal).
 * Contoh: 7265.02 → "7.265,02"
 * @param {number} val
 * @param {number} decimals
 * @returns {string}
 */
export function formatIDNumber(val, decimals = 2) {
  if (val === null || val === undefined || isNaN(val)) return '0,00';
  return val.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Hitung ulang seluruh daftar entries dengan logika cascading:
 *
 * - Proses entries sesuai urutan di array.
 * - Pertahankan state per kode bahan: { sisaStokTerakhir, sudahPernahMuncul }.
 * - Kemunculan pertama bahan → pakai stok & kedatangan dari sheet.
 * - Kemunculan berikutnya → pakai sisa stok dari entry sebelumnya, kedatangan = 0.
 *
 * @param {Array} entries        - Array of ProductionEntry (tanpa field `hasil`)
 * @param {Record<string,number>} stockMap
 * @param {Record<string,number>} incomingMap
 * @param {Record<string,object>} productFormulaMap
 * @returns {Array} entries dengan field `hasil` terisi
 */
export function computeAll(entries, stockMap, incomingMap, productFormulaMap) {
  // State per kode bahan: { sisaStokTerakhir, sudahPernahMuncul }
  const bahanState = {};

  return entries.map((entry) => {
    const formula = productFormulaMap[entry.kodeProduk];

    // Jika formula tidak ditemukan, kembalikan entry tanpa hasil
    if (!formula || !formula.bahan || formula.bahan.length === 0) {
      return { ...entry, hasil: [] };
    }

    const hasil = formula.bahan.map((bahan) => {
      const { kodeBahan, namaBahan, qtyPerKg, uom } = bahan;

      // Hitung kebutuhan bahan untuk entry ini
      const qtyBahanProduksi = entry.qtyPlanKg * qtyPerKg;

      let stokAwal;
      let qtyKedatangan;

      if (!bahanState[kodeBahan]) {
        // === Kemunculan PERTAMA bahan ini di seluruh daftar ===
        stokAwal       = stockMap[kodeBahan]   ?? 0;
        qtyKedatangan  = incomingMap[kodeBahan] ?? 0;
      } else {
        // === Kemunculan BERIKUTNYA (cascading) ===
        stokAwal       = bahanState[kodeBahan].sisaStokTerakhir;
        qtyKedatangan  = 0; // tidak boleh dihitung ulang
      }

      // Hitung sisa stok
      const sisaStok = stokAwal + qtyKedatangan - qtyBahanProduksi;

      // Status (toleransi kecil untuk floating point)
      const status = sisaStok >= -0.01 ? 'OK' : 'KURANG';

      // Update state bahan
      bahanState[kodeBahan] = {
        sisaStokTerakhir: sisaStok,
        sudahPernahMuncul: true,
      };

      // Tipe bahan: PM jika kode mengandung "PACK", selain itu RM
      const tipe = kodeBahan.includes('PACK') ? 'PM' : 'RM';

      return {
        kodeBahan,
        namaBahan,
        tipe,
        qtyBahanProduksi,
        qtyKedatangan,
        stokAwal,
        uom,
        sisaStok,
        status,
      };
    });

    return { ...entry, hasil };
  });
}

/**
 * Hitung ringkasan status sebuah entry (satu card produksi).
 * @param {Array} hasil - Array hasil bahan dari satu entry
 * @returns {{ allOk: boolean, kurangCount: number }}
 */
export function summarizeEntry(hasil) {
  if (!hasil || hasil.length === 0) return { allOk: true, kurangCount: 0 };
  const kurangCount = hasil.filter((b) => b.status === 'KURANG').length;
  return { allOk: kurangCount === 0, kurangCount };
}

/**
 * Hitung ringkasan global dari seluruh daftar entries.
 * @param {Array} entries - Entries dengan field `hasil`
 * @returns {{ totalProduk: number, totalBahanKurang: number }}
 */
export function summarizeAll(entries) {
  let totalBahanKurang = 0;
  for (const entry of entries) {
    if (entry.hasil) {
      totalBahanKurang += entry.hasil.filter((b) => b.status === 'KURANG').length;
    }
  }
  return {
    totalProduk: entries.length,
    totalBahanKurang,
  };
}
