import asyncHandler from "../middleware/asyncHandler.js";
import Pemesanan from "../models/pemesananModel.js";
import Jadwal from "../models/jadwalModel.js";
import User from "../models/userModel.js";
import Transaksi from "../models/transaksiModel.js";
import mongoose from "mongoose";


// 1. Membuat Pemesanan Baru
// export const createPemesanan = asyncHandler(async (req, res) => {
//     const { user_id, jadwal_dipesan, total_harga, metode_pembayaran } = req.body;

//     // res.json({
//     //     info : req.body
//     // })
//     // Cek apakah user ada
//     const user = await User.findById(user_id);
//     if (!user) {
//         return res.status(404).json({ message: "User tidak ditemukan" });
//     }

//     // Cek apakah jadwal yang dipilih ada dan tersedia
//     const jadwalList = await Jadwal.find({ _id: { $in: jadwal_dipesan } });
//     if (jadwalList.length !== jadwal_dipesan.length) {
//         return res.status(400).json({ message: "Salah satu jadwal tidak valid" });
//     }

//     // Cek apakah jadwal yang dipilih tersedia
//     const unavailableJadwal = jadwalList.filter(jadwal => jadwal.status === "Tidak Tersedia");
//     if (unavailableJadwal.length > 0) {
//         return res.status(400).json({ message: "Salah satu jadwal tidak tersedia" });
//     }

//     // Buat pemesanan baru
//     const newPemesanan = await Pemesanan.create({
//         user_id,
//         jadwal_dipesan,
//         total_harga,
//         status_pemesanan: "Sedang Dipesan"
//     });

//     // Update status jadwal yang dipesan menjadi 'Tidak Tersedia'
//     await Jadwal.updateMany(
//         { _id: { $in: jadwal_dipesan } },
//         { $set: { status: "Tidak Tersedia" } }
//     );

//     // Format tanggal menjadi "YYYY-MM-DD"
//     const currentDate = new Date();
//     const formattedDate = currentDate.toISOString().split('T')[0];  // "2024-03-24"

//     const deadline = new Date(); 
//     deadline.setHours(deadline.getHours() + 6); // batas waktu 6 jam


//     // Buat transaksi baru
//     const newTransaksi = await Transaksi.create({
//         pemesanan_id: newPemesanan._id,
//         metode_pembayaran,
//         status_pembayaran: "menunggu",  // Status pembayaran default adalah "menunggu"
//         tanggal: formattedDate,  // Menggunakan tanggal yang sudah diformat
//         deadline_pembayaran: deadline
//     });

//     res.status(201).json({
//         message: "Pemesanan dan transaksi berhasil dibuat",
//         data: {
//             pemesanan: newPemesanan,
//             transaksi: newTransaksi
//         }
//     });
// });
export const createPemesanan = asyncHandler(async (req, res) => {
    const { user_id, jadwal_dipesan, total_harga, metode_pembayaran } = req.body;

    // 1. Validasi User
    const user = await User.findById(user_id);
    if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // 2. Validasi Jadwal
    const jadwalList = await Jadwal.find({ _id: { $in: jadwal_dipesan } });
    if (jadwalList.length !== jadwal_dipesan.length) {
        return res.status(400).json({ message: "Beberapa jadwal tidak valid" });
    }

    const now = new Date();

    // 3. Cek status setiap Jadwal
    for (const jadwal of jadwalList) {
        const pemesananTerkait = await Pemesanan.findOne({
            jadwal_dipesan: jadwal._id
        }).sort({ _id: -1 });

        if (pemesananTerkait) {
            const transaksiTerkait = await Transaksi.findOne({
                pemesanan_id: pemesananTerkait._id
            });

            const statusPemesanan = pemesananTerkait.status_pemesanan;
            const statusPembayaran = transaksiTerkait?.status_pembayaran || "menunggu";
            const deadline = transaksiTerkait?.deadline_pembayaran ? new Date(transaksiTerkait.deadline_pembayaran) : now;

            // 🔴 Kasus Tidak Valid
            if (
                (statusPemesanan === "Sedang Dipesan" && statusPembayaran === "menunggu" && deadline >= now) ||
                (statusPemesanan === "Sedang Dipesan" && statusPembayaran === "berhasil") ||
                (statusPemesanan === "Berhasil" && statusPembayaran === "berhasil")
            ) {
                return res.status(400).json({
                    message: `Jadwal jam ${jadwal.jam} tanggal ${jadwal.tanggal} sudah tidak tersedia`
                });
            }
        }

        // Selain itu (dibatalkan / expired), dianggap valid
    }

    // 4. Buat Pemesanan Baru
    const newPemesanan = await Pemesanan.create({
        user_id,
        jadwal_dipesan,
        total_harga,
        status_pemesanan: "Sedang Dipesan",
        is_expired: false
    });

    // 5. Update status_booking di semua Jadwal jadi "Pending Payment"
    await Jadwal.updateMany(
        { _id: { $in: jadwal_dipesan } },
        { $set: { status_booking: "Pending Payment" } }
    );

    // 6. Buat Transaksi
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split("T")[0];  

    // const deadlinePembayaran = new Date();
    // // deadlinePembayaran.setHours(deadlinePembayaran.getHours() + 2); // Misal 2 jam untuk pembayaran
    // deadlinePembayaran.setMinutes(deadlinePembayaran.getMinutes() + 1); // Tambah 1 menit
    const deadlinePembayaran = new Date();

    if (metode_pembayaran === "transfer_bank") {
        deadlinePembayaran.setMinutes(deadlinePembayaran.getMinutes() + 10); // 45 menit
    } else if (metode_pembayaran === "bayar_langsung") {
        deadlinePembayaran.setMinutes(deadlinePembayaran.getMinutes() + 60); // 60 menit
    } else {
        return res.status(400).json({ message: "Metode pembayaran tidak valid" });
    }

    
    const newTransaksi = await Transaksi.create({
        pemesanan_id: newPemesanan._id,
        metode_pembayaran,
        status_pembayaran: "menunggu",
        tanggal: formattedDate,
        deadline_pembayaran: deadlinePembayaran
    });

    // 7. Return response
    res.status(201).json({
        message: "Pemesanan dan transaksi berhasil dibuat",
        data: {
            pemesanan: newPemesanan,
            transaksi: newTransaksi
        }
    });
});

// 2. Mendapatkan Semua Pemesanan
export const getAllPemesanan = asyncHandler(async (req, res) => {
    const pemesanan = await Pemesanan.find().populate("user_id", "name").populate("jadwal_dipesan");
    res.status(200).json(pemesanan);
    // res.send("okeeeeee")
});



// 3. Mendapatkan Detail Pemesanan
export const getPemesananById = asyncHandler(async (req, res) => {
    const pemesanan = await Pemesanan.findById(req.params.id)
        .populate("user_id", "name")
        .populate("jadwal_dipesan");

    if (!pemesanan) {
        return res.status(404).json({ message: "Pemesanan tidak ditemukan" });
    }

    res.status(200).json(pemesanan);
});

// 4. Mengupdate Status Pemesanan
export const updatePemesananStatus = asyncHandler(async (req, res) => {
    const { status_pemesanan } = req.body;

    const pemesanan = await Pemesanan.findById(req.params.id);
    if (!pemesanan) {
        return res.status(404).json({ message: "Pemesanan tidak ditemukan" });
    }

    pemesanan.status_pemesanan = status_pemesanan || pemesanan.status_pemesanan;
    await pemesanan.save();

    res.status(200).json({ message: "Status pemesanan diperbarui", data: pemesanan });
});

// 5. Menghapus Pemesanan
export const deletePemesanan = asyncHandler(async (req, res) => {
    const pemesanan = await Pemesanan.findById(req.params.id);
    if (!pemesanan) {
        return res.status(404).json({ message: "Pemesanan tidak ditemukan" });
    }

    await pemesanan.deleteOne();
    res.status(200).json({ message: "Pemesanan berhasil dihapus" });
}); 


// 6. Mendapatkan Pemesanan Berdasarkan user_id
export const getPemesananByUserId = asyncHandler(async (req, res) => {
    const { user_id } = req.params; // Mengambil user_id dari parameter URL
    
    // Step 1: Get pemesanan (bookings) based on user_id
    const pemesanan = await Pemesanan.find({ user_id })
        .populate("user_id", "name")
        .populate({
            path: "jadwal_dipesan",
            populate: {
                path: "lapangan", // Populate lapangan field inside Jadwal
                select: "name", // Only select the name field from Lapangan
            }
        });

    if (!pemesanan || pemesanan.length === 0) {
        return res.status(404).json({ message: "Pemesanan tidak ditemukan untuk user_id ini." });
    }

    // Step 2: Get related transaksi (transactions) based on pemesanan_id
    const transaksi = await Transaksi.find({
        pemesanan_id: { $in: pemesanan.map(p => p._id) } // Fetch transactions that match the pemesanan_id
    }).select("metode_pembayaran status_pembayaran tanggal pemesanan_id deadline_pembayaran");

    // Step 3: Combine pemesanan and transaksi data
    // Adding transaksi data to each pemesanan
    const pemesananWithTransaksi = pemesanan.map(p => {
        const relatedTransaksi = transaksi.filter(t => t.pemesanan_id.toString() === p._id.toString());
        return {
            ...p.toObject(), // Convert Mongoose document to plain object
            transaksi: relatedTransaksi
        };
    });

    res.status(200).json(pemesananWithTransaksi);
});

// Pesanan belun lewat
export const pesananBelumLewatDeadline = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Ambil semua pemesanan user beserta jadwal dan lapangan
  const pemesananList = await Pemesanan.find({ user_id: userId }).populate({
    path: "jadwal_dipesan",
    populate: {
      path: "lapangan",
      select: "name"
    }
  });

  const now = new Date();
  const hasilPemesanan = [];

  for (const pemesanan of pemesananList) {
    // Ambil transaksi berdasarkan ID pemesanan tanpa filter status dulu
    const transaksi = await Transaksi.findOne({
      pemesanan_id: pemesanan._id
    });

    if (!transaksi || !transaksi.deadline_pembayaran) {
      continue; // skip jika tidak ada transaksi atau deadline
    }

    const deadline = new Date(transaksi.deadline_pembayaran);

    // Tentukan status frontend berdasarkan status_pembayaran dan deadline
    let statusFrontend = "";

    if (transaksi.status_pembayaran === "menunggu") {
      if (now < deadline) {
        statusFrontend = "menunggu";
      } else {
        // Sudah lewat deadline, jangan masukkan ke hasil
        continue;
      }
    } else {
      // Kalau bukan status menunggu, skip
      continue;
    }

    hasilPemesanan.push({
      pemesanan,
      transaksi,
      status: statusFrontend
    });
  }

  res.status(200).json({
    success: true,
    jumlah: hasilPemesanan.length,
    data: hasilPemesanan
  });
});


export const riwayatPemesanan = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const now = new Date();

    const pemesananList = await Pemesanan.find({ user_id: userId }).populate({
        path: "jadwal_dipesan",
        populate: {
            path: "lapangan",
            select: "name"
        }
    });

    const hasilRiwayat = [];

    for (const pemesanan of pemesananList) {
        const transaksi = await Transaksi.findOne({
            pemesanan_id: pemesanan._id
        });

        if (!transaksi) continue;

        // Tentukan status frontend
        let statusFrontend = "";

        if (transaksi.status_pembayaran === "berhasil") {
            statusFrontend = "berhasil";
        } else if (transaksi.status_pembayaran === "menunggu") {
            const deadline = new Date(transaksi.deadline_pembayaran);
            if (now > deadline) {
                statusFrontend = "terlambat";
            } else {
                // Skip transaksi yang belum lewat deadline (status menunggu diabaikan)
                continue;
            }
        } else if (transaksi.status_pembayaran === "gagal") {
            if (pemesanan.status_pemesanan === "Dibatalkan") {
                statusFrontend = "dibatalkan";
            } else {
                statusFrontend = "ditolak";
            }
        } else {
            statusFrontend = "tidak_diketahui"; // opsional, atau bisa skip
        }

        hasilRiwayat.push({
            pemesanan,
            transaksi,
            status: statusFrontend
        });
    }

    // Urutkan berdasarkan tanggal jadwal_dipesan
    hasilRiwayat.sort((a, b) => {
        const tanggalA = new Date(a.pemesanan.jadwal_dipesan[0].tanggal);
        const tanggalB = new Date(b.pemesanan.jadwal_dipesan[0].tanggal);
        return tanggalB - tanggalA; // terbaru ke terlama
    });

    res.status(200).json({
        success: true,
        jumlah: hasilRiwayat.length,
        data: hasilRiwayat
    });
});

export const batalkanPemesanan = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { pemesananId } = req.params;

    const pemesanan = await Pemesanan.findOne({
        _id: pemesananId,
        user_id: userId
    });

    if (!pemesanan) {
        return res.status(404).json({ success: false, message: "Pemesanan tidak ditemukan." });
    }

    const transaksi = await Transaksi.findOne({ pemesanan_id: pemesanan._id });

    if (!transaksi) {
        return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan." });
    }

    // Validasi status
    if (transaksi.status_pembayaran !== "menunggu") {
        return res.status(400).json({ success: false, message: "Pemesanan tidak dapat dibatalkan karena bukan status menunggu." });
    }

    const now = new Date();
    const deadline = new Date(transaksi.deadline_pembayaran);

    if (now > deadline) {
        return res.status(400).json({ success: false, message: "Pemesanan tidak dapat dibatalkan karena sudah melewati deadline." });
    }

    // Update status pemesanan dan transaksi
    pemesanan.status_pemesanan = "Dibatalkan";
    await pemesanan.save();

    transaksi.status_pembayaran = "gagal";
    await transaksi.save();

    res.status(200).json({
        success: true,
        message: "Pemesanan berhasil dibatalkan.",
        data: {
            pemesanan,
            transaksi
        }
    });
});



export const getPemesananUntukKonfirmasi = asyncHandler(async (req, res) => {
    try {
        const now = new Date();

        // Ambil semua pemesanan yang masih valid untuk dikonfirmasi
        const pemesananList = await Pemesanan.find({
            status_pemesanan: "Sedang Dipesan", // Masih dalam proses
            is_expired: false
        })
        .populate("user_id", "name email") // Hanya ambil nama & email user
        .populate({
            path: "jadwal_dipesan",
            populate: { path: "lapangan", select: "name" } // Include nama lapangan
        })
        .lean();

        const result = [];

        for (const pemesanan of pemesananList) {
            const transaksi = await Transaksi.findOne({
                pemesanan_id: pemesanan._id,
                status_pembayaran: "menunggu", // Belum dibayar
                deadline_pembayaran: { $gt: now } // Masih dalam batas waktu
            }).lean();

            // Jika tidak ada transaksi yang valid, skip
            if (!transaksi) continue;

            result.push({
                _id: pemesanan._id,
                user: {
                    name: pemesanan.user_id.name,
                    email: pemesanan.user_id.email,
                },
                total_harga: pemesanan.total_harga,
                status_pemesanan: pemesanan.status_pemesanan,
                status_pembayaran: transaksi.status_pembayaran,
                metode_pembayaran: transaksi.metode_pembayaran,
                deadline_pembayaran: transaksi.deadline_pembayaran,
                bukti_pembayaran : transaksi.bukti_pembayaran,
                jadwal: pemesanan.jadwal_dipesan.map(j => ({
                    jam: j.jam,
                    tanggal: j.tanggal,
                    lapangan: j.lapangan.name,
                    harga: j.harga
                }))
            });
        }

        res.status(200).json({ data: result });

    } catch (error) {
        res.status(500).json({
            message: "Terjadi kesalahan saat mengambil data pemesanan",
            error: error.message
        });
    }
});



export const konfirmasiPemesanan = asyncHandler(async (req, res) => {
    const { id } = req.params; // Ambil ID pemesanan dari URL
  
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID pemesanan tidak valid" });
    }
  
    // Cari pemesanan dan transaksi terkait
    const pemesanan = await Pemesanan.findById(id).populate("jadwal_dipesan");
    if (!pemesanan) {
      return res.status(404).json({ message: "Pemesanan tidak ditemukan" });
    }
  
    const transaksi = await Transaksi.findOne({ pemesanan_id: id });
    if (!transaksi) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }
  
    // Validasi kondisi
    const now = new Date();
    if (
      pemesanan.status_pemesanan !== "Sedang Dipesan" ||
      transaksi.status_pembayaran !== "menunggu" ||
      new Date(transaksi.deadline_pembayaran) < now
    ) {
      return res.status(400).json({
        message:
          "Pemesanan tidak dapat dikonfirmasi. Pastikan status pesanan dan pembayaran benar, serta deadline belum lewat.",
      });
    }
  
    // Update status pemesanan dan pembayaran
    pemesanan.status_pemesanan = "Berhasil";
    transaksi.status_pembayaran = "berhasil";
  
    await pemesanan.save();
    await transaksi.save();
  
    // Update setiap jadwal menjadi Booked
    await Jadwal.updateMany(
      { _id: { $in: pemesanan.jadwal_dipesan } },
      { $set: { status_booking: "Booked" } }
    );
  
    return res.status(200).json({
      message: "Pemesanan berhasil dikonfirmasi.",
      data: {
        pemesanan_id: pemesanan._id,
        status_pemesanan: pemesanan.status_pemesanan,
        status_pembayaran: transaksi.status_pembayaran,
      },
    });
  });


export const tolakPemesanan = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { alasan_penolakan } = req.body; // Ambil alasan dari body

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID pemesanan tidak valid" });
    }

    const pemesanan = await Pemesanan.findById(id).populate("jadwal_dipesan");
    if (!pemesanan) return res.status(404).json({ message: "Pemesanan tidak ditemukan" });

    const transaksi = await Transaksi.findOne({ pemesanan_id: id });
    if (!transaksi) return res.status(404).json({ message: "Transaksi tidak ditemukan" });

    const now = new Date();
    if (
        pemesanan.status_pemesanan !== "Sedang Dipesan" ||
        transaksi.status_pembayaran !== "menunggu" ||
        new Date(transaksi.deadline_pembayaran) < now
    ) {
        return res.status(400).json({
            message: "Pemesanan tidak dapat ditolak, karena pemesanan sudah kadaluarsa atau lewat deadline.",
        });
    }

    pemesanan.status_pemesanan = "Ditolak";
    pemesanan.alasan_penolakan = alasan_penolakan; // simpan alasan

    transaksi.status_pembayaran = "gagal";
    transaksi.alasan_penolakan = alasan_penolakan; // simpan juga di transaksi

    await pemesanan.save();
    await transaksi.save();

    await Jadwal.updateMany(
        { _id: { $in: pemesanan.jadwal_dipesan } },
        { $set: { status_booking: "Tersedia" } }
    );

    return res.status(200).json({
        message: "Pemesanan berhasil ditolak.",
        data: {
            pemesanan_id: pemesanan._id,
            alasan_penolakan: alasan_penolakan
        },
    });
});
