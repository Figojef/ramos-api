import Pemesanan from "../models/pemesananModel.js";
import Transaksi from "../models/transaksiModel.js";
import Lapangan from "../models/lapanganModel.js";
import User from "../models/userModel.js"; // pastikan ada model User
import asyncHandler from "../middleware/asyncHandler.js";

export const index = asyncHandler(async (req, res) => {
  // Total Lapangan
  const totalLapangan = await Lapangan.countDocuments();

  // Total Pelanggan
  const totalPelanggan = await User.countDocuments({ role: "pelanggan" });

  // Total Semua Pemesanan
  const totalPemesanan = await Pemesanan.countDocuments();

  // Total Pemesanan Berhasil
  const totalPemesananBerhasil = await Pemesanan.countDocuments({ status_pemesanan: "Berhasil" });

  // Total Pendapatan per Bulan
  const transaksi = await Transaksi.find({ status_pembayaran: "berhasil" })
    .populate({
      path: "pemesanan_id",
      match: { status_pemesanan: "Berhasil" },
      select: "total_harga"
    });

  const pendapatanPerBulan = {};

  transaksi.forEach((trx) => {
    if (!trx.pemesanan_id || !trx.tanggal) return;

    const bulan = trx.tanggal.substring(0, 7); // Format YYYY-MM

    if (!pendapatanPerBulan[bulan]) {
      pendapatanPerBulan[bulan] = 0;
    }

    pendapatanPerBulan[bulan] += trx.pemesanan_id.total_harga;
  });

  res.json({
    totalLapangan,
    totalPelanggan,
    totalPemesanan,
    totalPemesananBerhasil,
    pendapatanPerBulan
  });
});

// contoh konsumsi API end point => GET : http://localhost:3000/api/v1/dashboardAdmin/catatan-transaksi/681f79e4311adc427ad1f138
export const CatatanTransaksi = asyncHandler(async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ message: "Parameter user_id wajib dikirim." });
  }

  const transaksiList = await Transaksi.find({ status_pembayaran: "berhasil" }) // hanya transaksi berhasil
    .populate({
      path: "pemesanan_id",
      match: { user_id: user_id }, // filter by user ID
      populate: {
        path: "jadwal_dipesan",
        populate: {
          path: "lapangan",
          select: "name"
        }
      }
    })
    .sort({ tanggal: -1 });

  const hasil = transaksiList
    .filter(t => t.pemesanan_id) // pastikan hanya ambil transaksi milik user
    .map(t => ({
      transaksi_id: t._id,
      tanggal_transaksi: t.tanggal,
      metode_pembayaran: t.metode_pembayaran,
      status_pembayaran: t.status_pembayaran,
      bukti_pembayaran: t.bukti_pembayaran,
      total_harga: t.pemesanan_id.total_harga,
      status_pemesanan: t.pemesanan_id.status_pemesanan,
      jadwal: t.pemesanan_id.jadwal_dipesan.map(j => ({
        tanggal: j.tanggal,
        jam: j.jam,
        jam_formatted: `${j.jam.toString().padStart(2, "0")}:00 WIB`,  // Fixed here
        lapangan: j.lapangan?.name || "Tidak ditemukan",
        harga : j.harga
      }))
    }));

  res.json(hasil);
});

// end point => GET : http://localhost:3000/api/v1/dashboardAdmin/get-all-pelanggan
export const getAllPelanggan = asyncHandler(async (req, res) => {
  const pelanggan = await User.find({ role: "pelanggan" }).select("-password"); // Exclude password
  res.json(pelanggan);
});
