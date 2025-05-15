import asyncHandler from "../middleware/asyncHandler.js";
import Pemesanan from "../models/pemesananModel.js";
import Jadwal from "../models/jadwalModel.js";
import User from "../models/userModel.js";
import Transaksi from "../models/transaksiModel.js";


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
        // Ambil transaksi berdasarkan ID pemesanan
        const transaksi = await Transaksi.findOne({ pemesanan_id: pemesanan._id });

        if (!transaksi || !transaksi.deadline_pembayaran) {
            continue; // skip jika tidak ada transaksi atau deadline
        }

        const deadline = new Date(transaksi.deadline_pembayaran);

        // Cek apakah sekarang masih sebelum deadline
        if (now < deadline) {
            hasilPemesanan.push({
                pemesanan,
                transaksi
            });
        }
    }

    res.status(200).json({
        success: true,
        jumlah: hasilPemesanan.length,
        data: hasilPemesanan
    });
});






