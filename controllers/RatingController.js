import Rating from "../models/ratingModel.js";
import Mabar from "../models/mabarModel.js";
import Jadwal from "../models/jadwalModel.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";
import asyncHandler from "../middleware/asyncHandler.js";
import dayjs from "dayjs";
dayjs.locale("id");


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

    // Ambil data user
    const user = await User.findById(userId).select('name email nomor_telepon');
    if (!user) {
        return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    // Cari semua mabar yang user jadi pembuat atau join, dan populate jadwal
    const mabars = await Mabar.find({
        $or: [
            { user_pembuat_mabar: userId },
            { user_yang_join: userId }
        ]
    })
    .populate('user_pembuat_mabar', 'name email')
    .populate('user_yang_join', 'name email')
    .populate({
        path: 'jadwal',
        select: 'tanggal',
        options: { sort: { tanggal: 1 } } // Ambil tanggal terawal
    });

    const result = await Promise.all(mabars.map(async (mabar) => {
        const tanggalMabar = mabar.jadwal.length > 0 ? mabar.jadwal[0].tanggal : null;

        // Ambil semua rating yang ditujukan untuk userId dalam mabar ini
        const ratingDocs = await Rating.find({
            mabar: mabar._id,
            untuk_user: userId
        }).select('rating komentar dari_user');

        return {
            mabar: {
                id: mabar._id,
                nama_mabar: mabar.nama_mabar,
                range_umur: mabar.range_umur,
                tanggal: tanggalMabar,
                kapasitas: mabar.slot_peserta,
                kategori: mabar.kategori,
                level: mabar.level,
            },
            pembuat: mabar.user_pembuat_mabar,
            peserta: mabar.user_yang_join,
            ratings: ratingDocs.map(r => ({
                nilai: r.rating,
                komentar: r.komentar,
                dari_user: r.dari_user
            })),
                    user: {
            name: user.name,
            email: user.email,
            nomor_telepon: user.nomor_telepon
        }
        };
    }));

    res.status(200).json({
        success: true,

        data: result
    });
});


export const GetMabarDetailWithRating = asyncHandler(async (req, res) => {
    const { mabarId } = req.params;
    const { untuk_user } = req.query;

    // Validasi ID
    if (!mongoose.Types.ObjectId.isValid(mabarId) || !mongoose.Types.ObjectId.isValid(untuk_user)) {
        return res.status(400).json({ success: false, message: "ID tidak valid" });
    }

    // Ambil data mabar beserta jadwal dan user yang join
    const mabar = await Mabar.findById(mabarId)
        .populate('user_pembuat_mabar', 'name email')
        .populate('user_yang_join', 'name email')
        .populate({
            path: 'jadwal',
            select: 'tanggal lapangan jam',
            options: { sort: { tanggal: 1 } } // Ambil tanggal terawal kalau lebih dari 1
        });

    if (!mabar) {
        return res.status(404).json({ success: false, message: "Mabar tidak ditemukan" });
    }

    // Ambil semua rating untuk user tertentu dalam mabar ini
    const ratings = await Rating.find({
        mabar: mabarId,
        untuk_user: untuk_user
    })
    .select('rating komentar dari_user')
    .populate('dari_user', 'name'); // Ambil nama dari pemberi rating

    // Hitung total peserta (pembuat + yang join)
    const totalPeserta = 1 + mabar.user_yang_join.length; // 1 untuk pembuat mabar

    const response = {
        mabar: {
            id: mabar._id,
            nama_mabar: mabar.nama_mabar,
            range_umur: mabar.range_umur,
            kategori: mabar.kategori,
            level: mabar.level,
            total_peserta: totalPeserta,
        },
        jadwal: mabar.jadwal.map(j => ({
            tanggal: j.tanggal,
            lapangan: j.lapangan,
            jam: j.jam
        })),
        ratings: ratings.map(r => ({
            nilai: r.rating,
            komentar: r.komentar,
            dari_user: r.dari_user.name
        }))
    };

    res.status(200).json({
        success: true,
        data: response
    });
});

export const ReferensiPenilaianMabar = asyncHandler(async (req, res) => {
  const { user_target_id, mabar_id } = req.params;

  // Validasi ID MongoDB
  if (!mongoose.Types.ObjectId.isValid(user_target_id) || !mongoose.Types.ObjectId.isValid(mabar_id)) {
    return res.status(400).json({ message: "ID tidak valid" });
  }

  // Ambil data user target
  const userTarget = await User.findById(user_target_id).select("name nomor_telepon email");

  if (!userTarget) {
    return res.status(404).json({ message: "User target tidak ditemukan" });
  }

  // Ambil semua rating yang mengarah ke user_target_id untuk mabar ini
  const ratingList = await Rating.find({
    untuk_user: user_target_id,
    mabar: mabar_id,
  }).populate("dari_user", "name");

  const hasilPenilaian = ratingList.map((item) => ({
    dari_userId: item.dari_user._id,
    dari_user: item.dari_user.name,
    rating: item.rating,
    komentar: item.komentar || "",
  }));

  return res.status(200).json({
    untuk_user: {
      nama: userTarget.name,
      nomor_telepon: userTarget.nomor_telepon,
      email: userTarget.email,
    },
    penilaian: hasilPenilaian,
  });

   
});

export const ProfilRating = asyncHandler(async (req, res) => {
  const { user_target_id } = req.params;
  const now = new Date();

  // Validasi ObjectId
  if (!mongoose.Types.ObjectId.isValid(user_target_id)) {
    return res.status(400).json({
      success: false,
      message: "ID user tidak valid.",
    });
  }

  // Ambil semua mabar yang dibuat oleh user atau diikuti olehnya
  const mabars = await Mabar.find({
    $or: [
      { user_pembuat_mabar: user_target_id },
      { user_yang_join: user_target_id },
    ],
  })
    .populate({
      path: "jadwal",
      populate: {
        path: "lapangan",
        model: "Lapangan",
      },
    })
    .populate("user_pembuat_mabar", "name")
    .lean();

  const penilaianHistoryMabar = [];
  let totalRating = 0;
  let jumlahMabar = 0;

  for (const mabar of mabars) {
    if (!mabar.jadwal || mabar.jadwal.length === 0) continue;

    const sortedJadwal = mabar.jadwal.sort((a, b) => {
      const dateA = new Date(`${a.tanggal}T${a.jam.padStart(2, "0")}:00:00`);
const dateB = new Date(`${b.tanggal}T${b.jam.padStart(2, "0")}:00:00`);
      return dateA - dateB;
    });

    const jadwalTerakhir = sortedJadwal[sortedJadwal.length - 1];
    const jamTerakhirPlus1 = parseInt(jadwalTerakhir.jam) + 1;
    const waktuAkhir = new Date(`${jadwalTerakhir.tanggal}T${String(jamTerakhirPlus1).padStart(2, "0")}:00:00`);

    if (waktuAkhir < now) {
     const ratings = await Rating.aggregate([
  {
    $match: {
      mabar: mabar._id,
    },
  },
        {
          $group: {
            _id: null,
            totalRating: { $sum: "$rating" },
            count: { $sum: 1 },
          },
        },
      ]);

      const ratingRataRata = ratings.length
        ? ratings[0].totalRating / ratings[0].count
        : 0;

      const tanggalJadwal = dayjs(jadwalTerakhir.tanggal).format("dddd, DD MMMM YYYY");
      const jamMulai = sortedJadwal[0].jam.padStart(2, "0") + ":00";
      const jamAkhir = String(jamTerakhirPlus1).padStart(2, "0") + ":00";
      const waktu = `${tanggalJadwal} * ${jamMulai} - ${jamAkhir}`;

      const lapanganUnik = [
        ...new Map(
          sortedJadwal.map((j) => [
            j.lapangan._id.toString(),
            { nama: j.lapangan.name },
          ])
        ).values(),
      ];

      penilaianHistoryMabar.push({
        mabar_id: mabar._id,
        nama_mabar: mabar.nama_mabar,
        jumlah_peserta: 1 + (mabar.user_yang_join?.length || 0),
        slot_peserta: mabar.slot_peserta,
        kategori: mabar.kategori,
        level: mabar.level,
        range_umur: mabar.range_umur,
        rating_rata_rata: ratingRataRata,
        tanggal_mulai: waktu,
      });

      totalRating += ratingRataRata;
      jumlahMabar++;
    }
  }

  const rataRataKeseluruhanRating =
    jumlahMabar > 0 ? totalRating / jumlahMabar : 0;

  // Ambil data user
  const user = await User.findById(user_target_id).select("name email nomor_telepon");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User tidak ditemukan.",
    });
  }

  res.status(200).json({
    success: true,
    data: {
      nama: user.name,
      email: user.email,
      nomor_telepon: user.nomor_telepon,
      penilaian_history_mabar: penilaianHistoryMabar,
      rata_rata_keseluruhan_rating: rataRataKeseluruhanRating,
    },
  });
});
