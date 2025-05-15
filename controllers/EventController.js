import asyncHandler from "../middleware/asyncHandler.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import Event from "../models/eventModel.js";

export const createEvent = asyncHandler(async (req, res) => {
    try {
        // Pastikan gambar dikirim
        if (!req.file) {
            return res.status(400).json({
                message: "Gambar tidak ditemukan dalam request"
            });
        }

        // Upload gambar ke Cloudinary
        const stream = cloudinary.uploader.upload_stream({
            folder: 'uploads', // Folder di Cloudinary
            allowed_formats: ['jpg', 'png'],
        }, async (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: "Gagal upload gambar",
                    error: err
                });
            }

            // Ambil data dari body dan gambar URL dari Cloudinary
            const { judul, deskripsi, tanggal_mulai, tanggal_selesai } = req.body;
            const gambar = result.secure_url; // Ambil URL gambar

            // Simpan event baru ke database
            const newEvent = new Event({
                judul,
                deskripsi,
                tanggal_mulai,
                tanggal_selesai,
                gambar // Simpan URL gambar
            });

            // Simpan ke database
            const savedEvent = await newEvent.save();

            return res.status(201).json({
                message: "Event berhasil dibuat",
                event: savedEvent
            });
        });

        // Pipe gambar ke Cloudinary
        streamifier.createReadStream(req.file.buffer).pipe(stream);

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Terjadi kesalahan server",
            error: err.message
        });
    }
});




export const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find(); // Ambil semua event
        res.status(200).json(events);
    } catch (error) {
        console.error('Gagal mengambil data event:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data event' });
    }
};
