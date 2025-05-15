import mongoose from "mongoose";
import asyncHandler from "../middleware/asyncHandler.js"
import Jadwal from "../models/jadwalModel.js";
import Mabar from "../models/mabarModel.js";
import Pemesanan from "../models/pemesananModel.js";
import Lapangan from "../models/lapanganModel.js";
import User from "../models/userModel.js";
import dayjs from "dayjs";
import "dayjs/locale/id.js";
dayjs.locale("id");


// Controller untuk mengambil jadwal yang belum lewat dari pemesanan user yang login
export const SelectJadwalMabar = asyncHandler(async (req, res) => {
    // 1. Ambil pemesanan berdasarkan user_id yang ada di req.body (asumsi user_id ada di req.body)
    const pemesanan = await Pemesanan.find({ 
        user_id: req.body.user_id, 
        status_pemesanan: { $in: ["Berhasil"] }
    })
    .populate({
        path: "jadwal_dipesan",
        model: "Jadwal",
        populate: {
            path: "lapangan",
            model: "Lapangan",
        },
    });

    // 2. Ambil semua data jadwal yang sudah dipesan
    const jadwalDipesan = pemesanan.reduce((acc, pemesanan) => {
        return acc.concat(pemesanan.jadwal_dipesan);
    }, []);

    // 3. Filter jadwal yang waktunya belum lewat
    const filteredJadwal = jadwalDipesan.filter((jadwal) => {
        const jadwalTanggal = jadwal.tanggal; // Format: "YYYY-MM-DD"
        const jadwalJam = parseInt(jadwal.jam, 10); // Format: "9", "10", "14", etc.
    
        // Membuat objek Date untuk jadwal (menggunakan tanggal dan jam)
        const jadwalDateTime = new Date(`${jadwalTanggal}T${jadwalJam.toString().padStart(2, '0')}:00:00`);
        // Menggunakan .padStart untuk memastikan jam dua digit (misal: '9' menjadi '09') dan menambahkan 'Z' untuk UTC
            
        const now = new Date();
    
        // console.log(`Jadwal: ${jadwalDateTime} | Waktu Sekarang: ${now}`);
    
        // Membandingkan apakah jadwal lebih besar dari waktu sekarang
        return jadwalDateTime > now;
    });
    
    

    // 4. Ambil semua jadwal yang sudah terdaftar di Mabar
    const mabar = await Mabar.find({ 
        jadwal: { $in: filteredJadwal.map(jadwal => jadwal._id) }
    });

    // 5. Filter jadwal yang belum terdaftar di Mabar
    const jadwalBelumTerdaftar = filteredJadwal.filter((jadwal) => {
        // Cek jika jadwal belum ada di Mabar
        return !mabar.some((mabarItem) => mabarItem.jadwal.includes(jadwal._id));
    });

    // 6. Kembalikan data jadwal yang telah difilter dan lapangan yang terpopulasi
    res.status(200).json({
        success: true,
        data: jadwalBelumTerdaftar,
    });
});


export const CreateMabar = asyncHandler(async (req, res) => {
    const {
        nama_mabar,
        biaya,
        range_umur,
        level,
        kategori,
        slot_peserta,
        deskripsi,
        user_pembuat_mabar,
        jadwal,
    } = req.body;


    // res.status(201).json({
    //     yourData : req.body
    // })
    // Validasi jika data yang diperlukan tidak ada
    if (!nama_mabar || !biaya || !range_umur || !level || !kategori || !slot_peserta || !deskripsi || !user_pembuat_mabar || !jadwal) {
        res.status(400);
        throw new Error("Semua field harus diisi");
    }

    // Membuat Mabar baru
    const mabar = new Mabar({
        nama_mabar,
        biaya,
        range_umur,
        level,
        kategori,
        slot_peserta,
        deskripsi,
        user_pembuat_mabar,
        jadwal,
    });

    // Simpan data Mabar ke dalam database
    const createdMabar = await mabar.save();

    // Kembalikan respons berhasil dengan data Mabar yang baru dibuat
    res.status(201).json({
        success: true,
        data: createdMabar,
    });

});


export const JoinMabar = asyncHandler(async (req, res) => {

    // Ambil mabarId dan userId dari body request
    const { mabarId, userId } = req.body;

    // 1. Cari mabar berdasarkan mabarId
    const mabar = await Mabar.findById(mabarId);
    
    // 2. Cek apakah Mabar ditemukan
// 2. Cek apakah Mabar ditemukan
if (!mabar) {
    return res.status(404).json({
        success: false,
        message: "Mabar tidak ditemukan",
    });
}

if (mabar.user_pembuat_mabar.toString() === userId) {
    return res.status(400).json({
        success: false,
        message: "Anda adalah pembuat Mabar dan tidak perlu bergabung.",
    });
}

    const jumlahJoined = mabar.user_yang_join.length + 1;

    // 2b. Cek apakah Mabar ditemukan
    if (jumlahJoined >= mabar.slot_peserta) {
        return res.status(404).json({
            success: false,
            message: "Slot sudah melebihi batas, anda tidak dapat bergabung",
        });
    }

    // 3. Cek apakah pengguna sudah bergabung
    if (mabar.user_yang_join.includes(userId)) {
        return res.status(400).json({
            success: false,
            message: "Anda sudah bergabung di Mabar ini",
        });
    }

    // 4. Tambahkan userId ke dalam array user_yang_join
    mabar.user_yang_join.push(userId);

    // 5. Simpan perubahan ke database
    await mabar.save();

    // 6. Kembalikan response jika berhasil
    res.status(200).json({
        success: true,
        message: "Anda berhasil bergabung dengan Mabar ini",
        data: mabar,
    });
});

// Controller untuk mengambil semua mabar yang jadwal pertama belum lewat
export const getAllMabar = asyncHandler(async (req, res) => {
    const mabarList = await Mabar.find()
        .populate({
            path: "jadwal",
            model: "Jadwal",
            options: {
                sort: { tanggal: 1, jam: 1 },
            },
            populate: {
                path: "lapangan",
                model: "Lapangan",
            },
        })
        .populate("user_pembuat_mabar")
        .populate("user_yang_join");

    const currentDate = new Date();
    const validMabars = [];

    for (let data of mabarList) {
        // Cek berapa orang yang join (termasuk pembuat)
        let totalJoined = (Array.isArray(data.user_yang_join) ? data.user_yang_join.length : 0) + 1;

        // Urutkan jadwal berdasarkan tanggal dan jam
        if (Array.isArray(data.jadwal) && data.jadwal.length > 0) {
            data.jadwal.sort((a, b) => {
                const dateA = new Date(`${a.tanggal}T${String(a.jam).padStart(2, '0')}:00`);
                const dateB = new Date(`${b.tanggal}T${String(b.jam).padStart(2, '0')}:00`);
                return dateA - dateB;
            });

            const firstSchedule = data.jadwal[0];
            const scheduleDateTime = new Date(`${firstSchedule.tanggal}T${String(firstSchedule.jam).padStart(2, '0')}:00`);

            // Kalau jadwal pertama masih di masa depan → valid
            if (scheduleDateTime > currentDate) {
                validMabars.push({
                    _id: data._id,
                    nama_mabar: data.nama_mabar,
                    biaya: data.biaya,
                    range_umur: data.range_umur,
                    level: data.level,
                    kategori: data.kategori,
                    slot_peserta: data.slot_peserta,
                    deskripsi: data.deskripsi,
                    jadwal: data.jadwal,
                    status: data.status,
                    user_pembuat_mabar: data.user_pembuat_mabar,
                    user_yang_join: data.user_yang_join,
                    tanggal_dibuat: data.tanggal_dibuat,
                    __v: data.__v,
                    totalJoined: totalJoined
                });
            }
        }
    }

    res.status(200).json({
        success: true,
        data: validMabars,
    });
});

export const getUpcomingMabar = asyncHandler(async (req, res) => {
    const mabarList = await Mabar.find()
        .populate({
            path: "jadwal",
            model: "Jadwal",
            options: { sort: { tanggal: 1, jam: 1 } },
            populate: { path: "lapangan", model: "Lapangan" },
        })
        .populate("user_pembuat_mabar")
        .populate("user_yang_join");

    const currentDate = new Date();
    const validMabars = [];

    for (let data of mabarList) {
        if (Array.isArray(data.jadwal) && data.jadwal.length > 0) {
            data.jadwal.sort((a, b) => new Date(`${a.tanggal}T${a.jam}:00`) - new Date(`${b.tanggal}T${b.jam}:00`));

            const first = data.jadwal[0];
            const mulai = new Date(`${first.tanggal}T${String(first.jam).padStart(2, '0')}:00`);

            if (currentDate < mulai) {
                const last = data.jadwal[data.jadwal.length - 1];
                const jamSelesai = String(parseInt(last.jam) + 1).padStart(2, '0') + ':00';
                const totalJoined = (data.user_yang_join?.length ?? 0) + 1;

                validMabars.push({ ...data._doc, jamSelesai, totalJoined });
            }
        }
    }

    res.status(200).json({ success: true, data: validMabars });
});


export const HistoryMabar = asyncHandler(async (req, res) => {
  const { user_id } = req.params;

  // Ambil semua mabar yang dibuat oleh user tersebut atau diikuti olehnya
  const mabars = await Mabar.find({
    $or: [
      { user_pembuat_mabar: user_id },
      { user_yang_join: user_id },
    ],
  })
    .populate({
      path: "jadwal",
      populate: {
        path: "lapangan",
        model: "Lapangan",
      },
    })
    .populate("user_pembuat_mabar", "name") // hanya ambil nama user
    .lean();

  const hasil = [];

  for (const mabar of mabars) {
    if (!mabar.jadwal || mabar.jadwal.length === 0) continue;

    // Menghitung jumlah peserta yang bergabung (termasuk pembuat mabar)
    const totalJoined = (mabar.user_yang_join?.length ?? 0) + 1; // +1 untuk pembuat mabar

    // Ambil array jadwal langsung tanpa perhitungan waktu
    const lapanganUnik = [
      ...new Map(
        mabar.jadwal.map((j) => [j.lapangan._id.toString(), { nama: j.lapangan.name }])
      ).values(),
    ];

    hasil.push({
      id_mabar: mabar._id,
      user_pembuat_mabar: {
        id_user: mabar.user_pembuat_mabar._id,
        name: mabar.user_pembuat_mabar.name,
      },
      totalJoined, // Hitung jumlah total peserta yang bergabung
      kategori: mabar.kategori,
      slot_peserta: mabar.slot_peserta,
      jadwal: mabar.jadwal, 
      biaya: mabar.biaya,
      nama_mabar: mabar.nama_mabar,
      maksimal: mabar.slot_peserta,
    });
  }

  res.status(200).json({
    success: true,
    count: hasil.length,
    data: hasil,
  });
});



export const CekJoin = asyncHandler(async (req, res) => {
    // res.send("okokokok")
    const { mabar_id, user_id } = req.body; // Destructure mabar_id and user_id from req.body

    // Find the Mabar by the mabar_id
    const mabar = await Mabar.findById(mabar_id);
  
    if (!mabar) {
      // If no Mabar is found, return an error message
      return res.status(404).json({ success: false, message: "Mabar not found" });
    }
  
    // Check if the user_id exists in the user_yang_join array of the Mabar
    const userIsJoined = mabar.user_yang_join.includes(user_id);
  
    // Return the result (true if user is in the array, otherwise false)
    res.status(200).json({ success: true, isJoined: userIsJoined });

})


    export const KeluarMabar = asyncHandler(async (req, res) => {
            // res.send("Keluar dari Mabar")

        const { userId, mabarId } = req.body;
    
        // Cari Mabar berdasarkan mabarId
        const mabar = await Mabar.findById(mabarId);
    
        // Cek apakah mabar ditemukan
        if (!mabar) {
            return res.status(404).json({ message: "Mabar tidak ditemukan" });
        }
    
        // Cek apakah user sudah bergabung dalam mabar
        if (!mabar.user_yang_join.includes(userId)) {
            return res.status(400).json({ message: "User tidak tergabung dalam mabar ini" });
        }
    
        // Hapus user dari user_yang_join
        mabar.user_yang_join = mabar.user_yang_join.filter(user => user.toString() !== userId);
    
        // Simpan perubahan
        await mabar.save();
    
        return res.status(200).json({ message: "User berhasil keluar dari mabar" });
    });


export const HapusMabar = asyncHandler(async (req, res) => {
    // res.send("Hapus Mabar")
    const { mabarId } = req.params; // Mengambil ID Mabar dari parameter URL

    // Validasi format ID Mabar (pastikan formatnya valid)
    if (!mongoose.Types.ObjectId.isValid(mabarId)) {
      return res.status(400).json({ message: "ID Mabar tidak valid" });
    }
  
    // Mencari Mabar berdasarkan ID
    const mabar = await Mabar.findById(mabarId);
  
    // Jika Mabar tidak ditemukan
    if (!mabar) {
      return res.status(404).json({ message: "Mabar tidak ditemukan" });
    }
  
    // Validasi jika pengguna yang melakukan permintaan bukan pembuat Mabar
    // if (mabar.user_pembuat_mabar.toString() !== req.user.id) {
    //   return res.status(403).json({ message: "Anda tidak memiliki izin untuk menghapus Mabar ini" });
    // }
  
    // Hapus Mabar dari database
    await Mabar.findByIdAndDelete(mabarId);
  
    // Kirimkan respon sukses
    res.status(200).json({ message: "Mabar berhasil dihapus" });
})


export const GetMabarOwn = asyncHandler(async (req, res) => {
    // Ambil user_id dari body request
    const { user_id } = req.body;

    // Validasi apakah user_id ada di body request
    if (!user_id) {
        return res.status(400).json({ message: "User ID harus diisi" });
    }

    // Validasi apakah user_id adalah format ObjectId yang valid
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(400).json({ message: "Format User ID tidak valid" });
    }

    // Mengambil semua mabar dan mengurutkan jadwal berdasarkan tanggal dan jam
    const mabarList = await Mabar.find({user_pembuat_mabar : user_id})
        .populate({
            path: "jadwal", // Populate jadwal
            model: "Jadwal",
            options: {
                sort: { tanggal: 1, jam: 1 }, // Urutkan berdasarkan tanggal dan jam secara ascending
            },
        })
        .populate({
            path: "jadwal",
            model: "Jadwal",
            populate: {
                path: "lapangan",
                model: "Lapangan",
            },
        })
        .populate("user_pembuat_mabar")
        .populate("user_yang_join");

    // Menyaring mabar berdasarkan jadwal pertama yang belum lewat
    const currentDate = new Date();

    let validMabars = mabarList;

    validMabars = validMabars.map(data => {
        // Cek apakah data.user_yang_join ada dan berupa array, jika tidak, anggap sebagai array kosong
        let totalJoined = (Array.isArray(data.user_yang_join) ? data.user_yang_join.length : 0) + 1;

        // Urutkan jadwal berdasarkan tanggal dan jam
        if (Array.isArray(data.jadwal)) {
            data.jadwal.sort((a, b) => {
                const dateA = new Date(a.tanggal);
                const dateB = new Date(b.tanggal);

                // Jika tanggal sama, urutkan berdasarkan jam
                if (dateA.getTime() === dateB.getTime()) {
                    return a.jam - b.jam;
                }

                return dateA - dateB;
            });
        }

        // Ambil hanya data yang relevan (hapus metadata Mongoose seperti $__)
        const cleanedData = {
            _id: data._id,
            nama_mabar: data.nama_mabar,
            biaya: data.biaya,
            range_umur: data.range_umur,
            level: data.level,
            kategori: data.kategori,
            slot_peserta: data.slot_peserta,
            deskripsi: data.deskripsi,
            jadwal: data.jadwal,
            status: data.status,
            user_pembuat_mabar: data.user_pembuat_mabar,
            user_yang_join: data.user_yang_join,
            tanggal_dibuat: data.tanggal_dibuat,
            __v: data.__v, // Pastikan tetap mengambil versi jika diperlukan
            totalJoined: totalJoined // Menambahkan jumlah peserta yang bergabung
        };

        return cleanedData;
    });

    // Mengembalikan daftar mabar yang valid (yang jadwal pertama belum lewat)
    res.status(200).json({
        success: true,
        data: validMabars,
    });
});

export const GetPemainByMabarId = asyncHandler(async (req, res) => {
    const { mabarId } = req.params;

    // Validasi format ObjectId
    if (!mongoose.Types.ObjectId.isValid(mabarId)) {
        return res.status(400).json({ success: false, message: "ID Mabar tidak valid" });
    }

    // Cari mabar berdasarkan ID dan populate user pembuat serta user yang join
    const mabar = await Mabar.findById(mabarId)
        .populate("user_pembuat_mabar", "name nomor_telepon") // Bisa ditambah field user lain sesuai kebutuhan
        .populate("user_yang_join", "name nomor_telepon");

    if (!mabar) {
        return res.status(404).json({ success: false, message: "Mabar tidak ditemukan" });
    }

    // Kumpulkan data user pembuat dan user yang join
    const pemain = {
        pembuat: mabar.user_pembuat_mabar,
        peserta: mabar.user_yang_join,
        kapasitas: mabar.slot_peserta 
    };

    res.status(200).json({
        success: true,
        data: pemain
    });
});





export const GetMabarJoined = asyncHandler(async (req, res) => {
        // Ambil user_id dari body request
        const { user_id } = req.body;

        // Validasi apakah user_id ada di body request
        if (!user_id) {
            return res.status(400).json({ message: "User ID harus diisi" });
        }
    
        // Validasi apakah user_id adalah format ObjectId yang valid
        if (!mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(400).json({ message: "Format User ID tidak valid" });
        }
    
        // Mengambil semua mabar dan mengurutkan jadwal berdasarkan tanggal dan jam
        const mabarList = await Mabar.find({ user_yang_join: user_id })
            .populate({
                path: "jadwal", // Populate jadwal
                model: "Jadwal",
                options: {
                    sort: { tanggal: 1, jam: 1 }, // Urutkan berdasarkan tanggal dan jam secara ascending
                },
            })
            .populate({
                path: "jadwal",
                model: "Jadwal",
                populate: {
                    path: "lapangan",
                    model: "Lapangan",
                },
            })
            .populate("user_pembuat_mabar")
            .populate("user_yang_join");
    
        // Menyaring mabar berdasarkan jadwal pertama yang belum lewat
        const currentDate = new Date();
    
        let validMabars = mabarList;
    
        validMabars = validMabars.map(data => {
            // Cek apakah data.user_yang_join ada dan berupa array, jika tidak, anggap sebagai array kosong
            let totalJoined = (Array.isArray(data.user_yang_join) ? data.user_yang_join.length : 0) + 1;
    
            // Urutkan jadwal berdasarkan tanggal dan jam
            if (Array.isArray(data.jadwal)) {
                data.jadwal.sort((a, b) => {
                    const dateA = new Date(a.tanggal);
                    const dateB = new Date(b.tanggal);
    
                    // Jika tanggal sama, urutkan berdasarkan jam
                    if (dateA.getTime() === dateB.getTime()) {
                        return a.jam - b.jam;
                    }
    
                    return dateA - dateB;
                });
            }
    
            // Ambil hanya data yang relevan (hapus metadata Mongoose seperti $__)
            const cleanedData = {
                _id: data._id,
                nama_mabar: data.nama_mabar,
                biaya: data.biaya,
                range_umur: data.range_umur,
                level: data.level,
                kategori: data.kategori,
                slot_peserta: data.slot_peserta,
                deskripsi: data.deskripsi,
                jadwal: data.jadwal,
                status: data.status,
                user_pembuat_mabar: data.user_pembuat_mabar,
                user_yang_join: data.user_yang_join,
                tanggal_dibuat: data.tanggal_dibuat,
                __v: data.__v, // Pastikan tetap mengambil versi jika diperlukan
                totalJoined: totalJoined // Menambahkan jumlah peserta yang bergabung
            };
    
            return cleanedData;
        });
    
        // Mengembalikan daftar mabar yang valid (yang jadwal pertama belum lewat)
        res.status(200).json({
            success: true,
            data: validMabars,
        });
});



