import asyncHandler from "../middleware/asyncHandler.js";
import JadwalRutinHarian from "../models/jadwalRutinHarianModel.js";
import mongoose from "mongoose";
import Lapangan from "../models/lapanganModel.js";
import Jadwal from "../models/jadwalModel.js";


// GET Semua Jadwal Rutin Harian
export const GetJadwalRutinHarian = asyncHandler(async (req, res) => {
    const jadwalRutinHarian = await JadwalRutinHarian.find();

    // Urutkan berdasarkan nilai numerik dari string jam
    jadwalRutinHarian.sort((a, b) => parseInt(a.jam) - parseInt(b.jam));

    res.status(200).json({ success: true, data: jadwalRutinHarian });
});



// CREATE Jadwal Rutin Harian
export const CreateJadwalRutinHarian = asyncHandler(async (req, res) => {
    const { jam, harga } = req.body;

    // Validasi agar jam adalah angka bulat (integer) dan tidak memiliki nilai desimal
    if (!Number.isInteger(Number(jam)) || jam <= 0 || jam % 1 !== 0) {
        return res.status(400).json({ success: false, message: "Jam harus berupa angka bulat (integer) dan lebih besar dari 0." });
    }

    // Validasi jika jam atau harga tidak diisi
    if (!jam || !harga) {
        return res.status(400).json({ success: false, message: "Jam dan harga wajib diisi." });
    }

    // Cek apakah jam sudah ada dalam jadwal rutin harian
    const existing = await JadwalRutinHarian.findOne({ jam });
    if (existing) {
        return res.status(400).json({ success: false, message: "Jam ini sudah terdaftar di jadwal rutin harian." });
    }

    // Membuat jadwal baru
    const created = await JadwalRutinHarian.create({ jam, harga });

    // Mengirim respons sukses
    res.status(201).json({
        success: true,
        message: "Jadwal rutin harian berhasil ditambahkan.",
        data: created,
    });
});


// UPDATE Jadwal Rutin Harian
export const UpdateJadwalRutinHarian = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { jam, harga } = req.body;

    // Validasi jam dan harga wajib diisi
    if (jam === undefined || harga === undefined) {
        return res.status(400).json({ success: false, message: "Jam dan harga wajib diisi." });
    }

    // Validasi agar jam adalah angka bulat (integer) dan lebih besar dari 0
    if (!Number.isInteger(Number(jam)) || jam <= 0 || jam % 1 !== 0) {
        return res.status(400).json({ success: false, message: "Jam harus berupa angka bulat (integer) dan lebih besar dari 0." });
    }

    const jadwal = await JadwalRutinHarian.findById(id);
    if (!jadwal) {
        return res.status(404).json({ success: false, message: "Jadwal tidak ditemukan." });
    }

    // Jika jam diubah, cek apakah sudah digunakan oleh entri lain
    if (jam !== jadwal.jam) {
        const jamConflict = await JadwalRutinHarian.findOne({ jam });
        if (jamConflict && jamConflict._id.toString() !== id) {
            return res.status(400).json({ success: false, message: "Jam sudah digunakan." });
        }
    }

    // Update data
    jadwal.jam = jam;
    jadwal.harga = harga;

    const updated = await jadwal.save();

    res.status(200).json({
        success: true,
        message: "Jadwal rutin harian berhasil diperbarui.",
        data: updated,
    });
});


// DELETE Jadwal Rutin Harian
export const DeleteJadwalRutinHarian = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "ID tidak valid." });
    }

    const jadwal = await JadwalRutinHarian.findById(id);
    if (!jadwal) {
        return res.status(404).json({ success: false, message: "Jadwal tidak ditemukan." });
    }

    // Gunakan deleteOne karena remove sudah deprecated
    await jadwal.deleteOne();

    res.status(200).json({
        success: true,
        message: "Jadwal rutin harian berhasil dihapus.",
    });
});


export const CreateDefaultJadwalRutinHarian = asyncHandler(async (req, res) => {
    const jadwalJam = [
        { jam: "8", harga: 25000 },
        { jam: "9", harga: 25000 },
        { jam: "10", harga: 25000 },
        { jam: "11", harga: 25000 },
        { jam: "12", harga: 25000 },
        { jam: "13", harga: 25000 },
        { jam: "14", harga: 25000 },
        { jam: "15", harga: 25000 },
        { jam: "16", harga: 25000 },
        { jam: "17", harga: 25000 },
        { jam: "18", harga: 35000 },
        { jam: "19", harga: 35000 },
        { jam: "20", harga: 35000 },
        { jam: "21", harga: 35000 },
        { jam: "22", harga: 35000 },
        { jam: "23", harga: 35000 },
    ];

    // Cek apakah data sudah ada di koleksi
    const existing = await JadwalRutinHarian.find();
    if (existing.length > 0) {
        return res.status(200).json({
            success: false,
            message: "Jadwal rutin harian sudah diinisialisasi sebelumnya.",
            data: existing,
        });
    }

    // Jika belum ada, insert default jadwal
    const inserted = await JadwalRutinHarian.insertMany(jadwalJam);

    res.status(201).json({
        success: true,
        message: "Jadwal rutin harian default berhasil dibuat.",
        data: inserted,
    });
});


export const TerapkanJadwalRutinHarian = asyncHandler(async (req, res) => {
    const { lapangan_id, tanggal } = req.body;

    // ✅ Validasi input wajib
    if (!lapangan_id || !tanggal) {
        return res.status(400).json({ success: false, message: 'Lapangan dan tanggal wajib diisi.' });
    }

    // ✅ Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(lapangan_id)) {
        return res.status(400).json({ success: false, message: 'ID Lapangan tidak valid.' });
    }

    // ✅ Periksa apakah lapangan tersedia
    const lapangan = await Lapangan.findById(lapangan_id);
    if (!lapangan) {
        return res.status(404).json({ success: false, message: 'Lapangan tidak ditemukan.' });
    }

    // ✅ Ambil semua jadwal rutin harian
    const jadwalRutin = await JadwalRutinHarian.find();
    if (jadwalRutin.length === 0) {
        return res.status(400).json({ success: false, message: 'Tidak ada data jadwal rutin harian untuk diterapkan.' });
    }

    // ✅ Ambil jadwal yang sudah ada untuk lapangan & tanggal ini
    const existingJadwal = await Jadwal.find({ lapangan: lapangan_id, tanggal });
    const existingJamSet = new Set(existingJadwal.map(j => j.jam));

    // ✅ Filter jam yang belum ada
    const jadwalBaru = jadwalRutin
        .filter(j => !existingJamSet.has(j.jam))
        .map(j => ({
            lapangan: lapangan_id,
               tanggal,
            jam: j.jam,
            harga: j.harga,
            status_booking: 'Tersedia'
        }));

    if (jadwalBaru.length === 0) {
        return res.status(200).json({ success: false, message: 'Semua jam sudah ada, tidak ada jadwal baru yang ditambahkan.' });
    }

    // ✅ Simpan jadwal baru
    await Jadwal.insertMany(jadwalBaru);

    res.status(201).json({
        success: true,
        message: `${jadwalBaru.length} jadwal berhasil diterapkan ke tanggal ${tanggal} pada lapangan yang dipilih.`,
        data: jadwalBaru
    });
});