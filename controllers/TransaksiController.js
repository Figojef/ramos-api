// controllers/transaksiController.js
import asyncHandler from "../middleware/asyncHandler.js";
import Transaksi from "../models/transaksiModel.js";
import Pemesanan from "../models/pemesananModel.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from 'streamifier';

// Membuat transaksi baru
export const createTransaksi = asyncHandler(async (req, res) => {
    const { pemesanan_id, metode_pembayaran, status_pembayaran, tanggal } = req.body;

    // Cek apakah pemesanan ada
    const pemesanan = await Pemesanan.findById(pemesanan_id);
    if (!pemesanan) {
        return res.status(404).json({ message: "Pemesanan tidak ditemukan" });
    }

    const transaksi = await Transaksi.create({
        pemesanan_id,
        metode_pembayaran,
        status_pembayaran,
        tanggal
    });

    res.status(201).json({ message: "Transaksi berhasil dibuat", data: transaksi });
});

// Mendapatkan semua transaksi
export const getAllTransaksi = asyncHandler(async (req, res) => {
    const transaksi = await Transaksi.find().populate("pemesanan_id");
    res.json(transaksi);
    // res.send('ookokokokok')
});

// Mendapatkan transaksi berdasarkan ID
export const getTransaksiById = asyncHandler(async (req, res) => {
    const transaksi = await Transaksi.findById(req.params.id).populate("pemesanan_id");
    if (transaksi) {
        res.json(transaksi);
    } else {
        res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }
});

// Mengupdate status pembayaran
export const updateTransaksi = asyncHandler(async (req, res) => {
    // res.send("Berhasil dibayar")
    res.status(200).json({
        message : "Transaksi dengan ID : 16gf76fgwt82g20hca9fi berhasil dibayar"
    })
    // const transaksi = await Transaksi.findById(req.params.id);

    // if (transaksi) {
    //     transaksi.status_pembayaran = req.body.status_pembayaran || transaksi.status_pembayaran;
    //     const updatedTransaksi = await transaksi.save();
    //     res.json({ message: "Transaksi berhasil diperbarui", data: updatedTransaksi });
    // } else {
    //     res.status(404).json({ message: "Transaksi tidak ditemukan" });
    // } 
});

// Menghapus transaksi
export const deleteTransaksi = asyncHandler(async (req, res) => {
    const transaksi = await Transaksi.findById(req.params.id);

    if (transaksi) {
        await transaksi.deleteOne();
        res.json({ message: "Transaksi berhasil dihapus" });
    } else {
        res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }
    
});


export const fileUpload = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!req.file) {
        return res.status(400).json({ message: "Tidak ada file yang diupload" });
    }

    const stream = cloudinary.uploader.upload_stream(
        {
            folder: 'uploads',
            allowed_formats: ['jpg', 'png'],
        },
        async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Gagal upload gambar", error: err });
            }

            const imageUrl = result.secure_url;

            // Simpan ke database
            const transaksi = await Transaksi.findById(id);
            if (!transaksi) {
                return res.status(404).json({ message: "Transaksi tidak ditemukan" });
            }

            transaksi.bukti_pembayaran = imageUrl;
            await transaksi.save();

            res.status(200).json({
                message: "Bukti pembayaran berhasil diupload dan disimpan",
                url: imageUrl,
                data: transaksi
            });
        }
    );

    streamifier.createReadStream(req.file.buffer).pipe(stream);
});




export const updateBuktiPembayaran = asyncHandler(async (req, res) => {
    const { transactionId } = req.params;
    const { imageUrl } = req.body; // URL gambar yang diterima dari frontend

    if (!imageUrl) {
        return res.status(400).json({ message: "URL gambar tidak ditemukan" });
    }

    const transaksi = await Transaksi.findById(transactionId);
    if (!transaksi) {
        return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    // Menyimpan URL gambar ke dalam field 'bukti_pembayaran'
    transaksi.bukti_pembayaran = imageUrl;
    await transaksi.save();

    res.status(200).json({
        message: "Bukti pembayaran berhasil diperbarui",
        data: transaksi,
    });
    console.log("Image URL:", imageUrl);

});




  