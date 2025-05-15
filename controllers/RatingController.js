import Rating from "../models/ratingModel.js";
import Mabar from "../models/mabarModel.js";
import Jadwal from "../models/jadwalModel.js";
import mongoose from "mongoose";
import asyncHandler from "../middleware/asyncHandler.js";


export const createRating = async (req, res) => {
  try {
    const { untuk_user, mabar_id, rating, komentar } = req.body;
    const dari_user = req.user.id;

    if (!untuk_user || !mabar_id || !rating) {
      return res.status(400).json({ message: "Data tidak lengkap." });
    }

    if (dari_user === untuk_user) {
      return res.status(400).json({ message: "Anda tidak bisa memberi rating untuk diri sendiri." });
    }

    const mabar = await Mabar.findById(mabar_id);
    if (!mabar) {
      return res.status(404).json({ message: "Mabar tidak ditemukan." });
    }

    const isDariJoin = mabar.user_yang_join.includes(dari_user);
    const isUntukJoin = mabar.user_yang_join.includes(untuk_user);
    const isDariPembuat = mabar.user_pembuat_mabar.toString() === dari_user;
    const isUntukPembuat = mabar.user_pembuat_mabar.toString() === untuk_user;

    const isDariTerlibat = isDariJoin || isDariPembuat;
    const isUntukTerlibat = isUntukJoin || isUntukPembuat;

    if (!isDariTerlibat || !isUntukTerlibat) {
      return res.status(403).json({
        message: "Rating hanya boleh diberikan antar peserta atau pembuat mabar.",
      });
    }

    const existing = await Rating.findOne({
      dari_user,
      untuk_user,
      mabar: mabar_id,
    });

    if (existing) {
      return res.status(400).json({
        message: "Anda sudah memberi rating untuk user ini dalam mabar ini.",
      });
    }

    const newRating = await Rating.create({
      dari_user,
      untuk_user,
      mabar: mabar_id,
      rating,
      komentar,
    });

    res.status(201).json({
      message: "Rating berhasil dikirim.",
      data: newRating,
    });

  } catch (error) {
    console.error("Gagal membuat rating:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};


export const GetMabarAndRatingsByUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: "ID User tidak valid" });
    }

    // Cari semua mabar yang user jadi pembuat atau join
    const mabars = await Mabar.find({
        $or: [
            { user_pembuat_mabar: userId },
            { user_yang_join: userId }
        ]
    }).populate('user_pembuat_mabar', 'name email')
      .populate('user_yang_join', 'name email');

    // Untuk setiap mabar, cari rating untuk userId (rating untuk user yang kita lihat)
    // Buat array promise agar bisa query paralel
    const result = await Promise.all(mabars.map(async (mabar) => {
        // Ambil tanggal dari jadwal[0].tanggal jika ada
        const tanggalMabar = mabar.jadwal && mabar.jadwal[0] ? mabar.jadwal[0].tanggal : null;

        // Cari rating user di mabar ini (rating untuk userId, pada mabar ini)
        const ratingDoc = await Rating.findOne({
            mabar: mabar._id,
            untuk_user: userId
        }).select('rating komentar');

        return {
            mabar: {
                id: mabar._id,
                nama_mabar: mabar.nama_mabar,
                tanggal: tanggalMabar,  // Menggunakan tanggal dari jadwal
                kapasitas: mabar.slot_peserta,
                kategori: mabar.kategori,
                level: mabar.level,
            },
            pembuat: mabar.user_pembuat_mabar,
            peserta: mabar.user_yang_join,
            rating: ratingDoc ? {
                nilai: ratingDoc.rating,
                komentar: ratingDoc.komentar || ''
            } : null
        };
    }));

    res.status(200).json({
        success: true,
        data: result
    });
});

