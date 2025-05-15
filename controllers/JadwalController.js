import { query } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import Product from "../models/productModel.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier"
import Lapangan from "../models/lapanganModel.js";
import Jadwal from "../models/jadwalModel.js";

import mongoose from 'mongoose';
import Pemesanan from "../models/pemesananModel.js";
import Transaksi from "../models/transaksiModel.js";


export const AllJadwal = asyncHandler(async (req, res) => {
    // Fetch all jadwals from the database, populating the 'lapangan' field
    const jadwals = await Jadwal.find()
      .populate("lapangan", "name")  // Populate the lapangan field with only the name of the lapangan
      .sort({ tanggal: 1 });  // Optionally, sort by tanggal (ascending)
  
    // If no jadwals are found, return a 404 response
    if (!jadwals || jadwals.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No jadwals found",
      });
    }
  
    // Respond with the retrieved jadwals data
    res.status(200).json({
      success: true,
      data: jadwals,
    });
  });


  // export const JadwalRutinHarian = asyncHandler(async (req, res) => {
  //     res.send("Daily sch")
  // }); 
  export const JadwalRutinHarian = asyncHandler(async (req, res) => {
    const { lapangan, tanggal } = req.body;

    // Validasi lapangan id dan tanggal
    if (!lapangan || !tanggal) {
        return res.status(400).json({ message: "Lapangan dan Tanggal harus diisi." });
    }

    // Validasi apakah lapangan ada di database
    const lapanganExists = await Lapangan.findById(lapangan);
    if (!lapanganExists) {
        return res.status(404).json({ message: "Lapangan tidak ditemukan." });
    }

    // Jam yang sudah ditentukan dan harga, format jam diubah menjadi string
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

    // Periksa apakah jadwal sudah ada untuk tanggal dan lapangan tertentu
    const existingJadwal = await Jadwal.find({ lapangan, tanggal });
    
    // Filter jam yang sudah ada, agar tidak duplikat
    const existingJam = existingJadwal.map(jadwal => jadwal.jam);
    
    const jadwalToInsert = jadwalJam.filter(jam => !existingJam.includes(jam.jam));

    if (jadwalToInsert.length === 0) {
        return res.status(200).json({ message: "Tidak ada jadwal baru yang perlu ditambahkan. Semua jadwal sudah ada." });
    }

    // Tambahkan jadwal baru
    const newJadwal = await Jadwal.insertMany(
        jadwalToInsert.map(jam => ({
            lapangan,
            tanggal,
            jam: jam.jam,
            harga: jam.harga,
            status: "Tersedia",
        }))
    );

    return res.status(201).json({
        message: "Jadwal harian berhasil ditambahkan",
        data: newJadwal,
    });
});
  

  // Fungsi untuk menangani request asinkron
  export const CreateJadwal = asyncHandler(async (req, res) => {
    const { lapangan, jam, tanggal, harga, status } = req.body;
  
    // Validasi jika lapangan, jam, tanggal, dan harga sudah ada
    if (!lapangan || !jam || !tanggal || !harga) {
      res.status(400).json({ message: "Semua field harus diisi" });
      return;
    }
  
    // Mengecek apakah jadwal dengan kombinasi lapangan, tanggal, dan jam sudah ada
    const existingJadwal = await Jadwal.findOne({
      lapangan,
      tanggal,
      jam,
    });
  
    if (existingJadwal) {
      return res.status(400).json({
        message: `Jadwal dengan jam ${jam} pada lapangan ${lapangan} dan tanggal ${tanggal} sudah ada.`,
      });
    }
  
    // Membuat objek Jadwal baru
    const newJadwal = new Jadwal({
      lapangan,
      jam,
      tanggal,
      harga,
      status: status || "Tersedia", // Status default "Tersedia" jika tidak diisi
    });
  
    // Menyimpan jadwal baru ke database
    const savedJadwal = await newJadwal.save();
  
    // Mengirimkan response jika berhasil
    res.status(201).json({
      message: "Jadwal berhasil dibuat",
      data: savedJadwal,
    });
  });
  


  // export const CreateJadwal = asyncHandler(async (req, res) => {

  //   const { lapangan, jam, tanggal, harga, status } = req.body;

  //   // Validate if lapangan is provided
  //   if (!lapangan || !jam || !tanggal || !harga) {
  //     res.status(400).json({ message: "All fields are required" });
  //     return;
  //   }
  
  //   // Create the new Jadwal document
  //   const newJadwal = new Jadwal({
  //     lapangan,
  //     jam,
  //     tanggal,
  //     harga,
  //     status: status || "Trersedia", // Default status to "Tersedia" if not provided
  //   });
  
  //   // Save the new Jadwal to the database
  //   const savedJadwal = await newJadwal.save();
  
  //   // Respond with the created Jadwal
  //   res.status(201).json({
  //     message: "Jadwal created successfully",
  //     data: savedJadwal,
  //   });
  //   // const { lapangan, jam, tanggal, harga, status } = req.body;
  
  //   // // Validate if lapangan is provided
  //   // if (!lapangan || !jam || !tanggal || !harga) {
  //   //   res.status(400).json({ message: "All fields are required" });
  //   //   return;
  //   // }
  
  //   // // Create the new Jadwal document
  //   // const newJadwal = new Jadwal({
  //   //   lapangan,
  //   //   jam,
  //   //   tanggal,
  //   //   harga,
  //   //   status: status || "Tersedia", // Default status to "Tersedia" if not provided
  //   // });
  
  //   // // Save the new Jadwal to the database
  //   // const savedJadwal = await newJadwal.save();
  
  //   // // Respond with the created Jadwal
  //   // res.status(201).json({
  //   //   message: "Jadwal created successfully",
  //   //   data: savedJadwal,
  //   // });
  //   // res.status(201).json({
  //   //   youtData : req.body
  //   // })
  // });

  // CreateJadwal function with validation
// export const CreateJadwal = asyncHandler(async (req, res) => {
//   const { lapangan, jam, tanggal, harga, status } = req.body;

//   // Check if the schedule already exists for the same lapangan, jam, and tanggal
//   const existingJadwal = await Jadwal.findOne({ lapangan, jam, tanggal });

//   if (existingJadwal) {
//     return res.status(400).json({
//       message: "Jadwal sudah ada untuk lapangan ini pada jam dan tanggal tersebut.",
//     });
//   }

//   // Create the new jadwal
//   const newJadwal = new Jadwal({
//     lapangan,
//     jam,
//     tanggal,
//     harga,
//     status: status || "Tersedia", // Default to "Tersedia" if not provided
//   });

//   await newJadwal.save();

//   // Respond with the newly created jadwal
//   res.status(201).json({
//     message: "Jadwal berhasil dibuat",
//     jadwal: newJadwal,
//   });
// });
  // export const CreateJadwal = asyncHandler(async (req, res) => {
  //   // Mendapatkan data dari body request
  //   const { lapangan, jam, tanggal, harga, status } = req.body;
  
  //   // Validasi data yang diterima
  //   if (!lapangan || !jam || !tanggal || !harga) {
  //     return res.status(400).json({
  //       success: false,
  //       message: "Harap isi semua data yang dibutuhkan: lapangan, jam, tanggal, harga",
  //     });
  //   }
  
  //   // Cek apakah lapangan yang diberikan ada di database
  //   const foundLapangan = await Lapangan.findById(lapangan);
  //   if (!foundLapangan) {
  //     return res.status(404).json({
  //       success: false,
  //       message: "Lapangan tidak ditemukan",
  //     });
  //   }
  
  //   // Cek apakah jam yang dipilih sudah ada untuk lapangan dan tanggal yang sama
  //   const existingJadwal = await Jadwal.findOne({ lapangan, jam, tanggal });
  //   if (existingJadwal) {
  //     return res.status(400).json({
  //       success: false,
  //       message: "Waktu yang dipilih sudah terisi untuk lapangan dan tanggal ini",
  //     });
  //   }
  
  //   // Membuat jadwal baru
  //   const jadwal = await Jadwal.create({
  //     lapangan,
  //     jam,
  //     tanggal,
  //     harga,
  //     status: status || "Tersedia",  // Status default "Tersedia" jika tidak diisi
  //   });
  
  //   // Mengirimkan response dengan jadwal yang baru dibuat
  //   res.status(201).json({
  //     success: true,
  //     data: jadwal,
  //   });
  // });


//   export const JadwalByDateAndLapangan = asyncHandler(async (req, res) => {
//     const { tanggal, lapangan } = req.query;

//     if (!tanggal || !lapangan) {
//         return res.status(400).json({ message: "Tanggal dan Lapangan harus diisi" });
//     }

//     if (!mongoose.Types.ObjectId.isValid(lapangan)) {
//         return res.status(400).json({ message: "Lapangan ID tidak valid" });
//     }

//     try {
//         const jadwal = await Jadwal.find({ tanggal, lapangan })
//             .populate("lapangan");

//         if (!jadwal.length) {
//             return res.status(404).json({ message: "Jadwal tidak ditemukan" });
//         }

//         // Convert 'jam' to integer and sort manually
//         const sortedJadwal = jadwal
//             .map(item => ({
//                 ...item.toObject(), // Convert Mongoose document to a plain object
//                 jamAsInt: parseInt(item.jam.replace(":", "")) // Convert 'jam' to integer (remove ':' if present)
//             }))
//             .sort((a, b) => a.jamAsInt - b.jamAsInt); // Sort by 'jamAsInt'

//         // Remove the 'jamAsInt' field from the response
//         const result = sortedJadwal.map(item => {
//             const { jamAsInt, ...rest } = item;
//             return rest;
//         });

//         res.status(200).json(result);
//     } catch (error) {
//         res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
//     }
// });
export const JadwalByDateAndLapangan = asyncHandler(async (req, res) => {
  const { tanggal, lapangan } = req.query; 

  if (!tanggal || !lapangan) {
    return res.status(400).json({ message: "Tanggal dan Lapangan harus diisi" });
  }

  if (!mongoose.Types.ObjectId.isValid(lapangan)) {
    return res.status(400).json({ message: "Lapangan ID tidak valid" });
  }

  try {
    const jadwalList = await Jadwal.find({ tanggal, lapangan }).populate('lapangan');

    if (!jadwalList.length) {
      return res.status(404).json({ message: "Jadwal tidak ditemukan" });
    }

    const now = new Date();

    const result = await Promise.all(jadwalList.map(async (jadwal) => {
      let status = "Tersedia"; // Default status
      
      const pemesanan = await Pemesanan.findOne({ jadwal_dipesan: jadwal._id }).sort({ _id: -1 });

      if (pemesanan) {
        const transaksi = await Transaksi.findOne({ pemesanan_id: pemesanan._id });

        const statusPemesanan = pemesanan.status_pemesanan;
        const statusPembayaran = transaksi?.status_pembayaran || "menunggu";
        const deadline = transaksi ? new Date(transaksi.deadline_pembayaran) : now;

        if (
          statusPemesanan === "Dibatalkan" ||
          (statusPemesanan === "Sedang Dipesan" && statusPembayaran === "menunggu" && deadline < now)
        ) {
          status = "Tersedia";
        } else {
          status = "Tidak Tersedia";
        }
      }

      return {
        _id: jadwal._id,
        jam: jadwal.jam,
        harga: jadwal.harga,
        tanggal: jadwal.tanggal,
        lapangan: jadwal.lapangan.name, // hanya kirim nama lapangan, tidak seluruh objek
        status,
      };
    }));

    const sortedResult = result
      .map(item => ({
        ...item,
        jamAsInt: parseInt(item.jam.replace(':', '')),
      }))
      .sort((a, b) => a.jamAsInt - b.jamAsInt)
      .map(({ jamAsInt, ...rest }) => rest);

    res.status(200).json(sortedResult);

  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
  }
});

export const JadwalByTanggal = async (req, res) => {
  try {
    const { tanggal } = req.params;

    const jadwalList = await Jadwal.find({ tanggal }).populate('lapangan', 'name');

    if (jadwalList.length === 0) {
      return res.status(404).json({ message: "Jadwal tidak ditemukan untuk tanggal tersebut" });
    }

    const now = new Date();

    const result = await Promise.all(jadwalList.map(async (jadwal) => {
      let status_booking = "Tersedia";

      const pemesanan = await Pemesanan.findOne({ jadwal_dipesan: jadwal._id }).sort({ _id: -1 });

      if (pemesanan) {
        const transaksi = await Transaksi.findOne({ pemesanan_id: pemesanan._id });

        const statusPemesanan = pemesanan.status_pemesanan;
        const statusPembayaran = transaksi?.status_pembayaran || "menunggu";
        const deadline = transaksi ? new Date(transaksi.deadline_pembayaran) : now;

        if (
          statusPemesanan === "Dibatalkan" ||
          (statusPemesanan === "Sedang Dipesan" && statusPembayaran === "menunggu" && deadline < now) ||
          (statusPemesanan === "Ditolak" && statusPembayaran === "gagal")
        ) {
          status_booking = "Tersedia";
        } else {
          status_booking = "Tidak Tersedia";
        }
      }

      return {
        ...jadwal.toObject(),
        status_booking,
      };
    }));

    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};



export const JadwalByLapangan = asyncHandler(async (req, res) => {
  const { lapanganId } = req.params;  // Assuming lapanganId is passed as a route param

  // Check if the Lapangan exists
  const lapangan = await Lapangan.findById(lapanganId);
  if (!lapangan) {
      return res.status(404).json({ message: "Lapangan not found" });
  }

    // Fetch jadwal by lapanganId
    const jadwalList = await Jadwal.find({ lapangan: lapanganId });

    // if (jadwalList.length === 0) {
    //     return res.status(404).json({ message: "No jadwal found for this lapangan" });
    // }
  
    // Respond with the list of jadwal for the specified lapangan
    res.status(200).json(jadwalList);


});

export const getJadwalBerhasil = async (req, res) => {
  try {
    const userId = req.query.user_id;

    if (!userId) {
      return res.status(400).json({ success: false, message: "user_id diperlukan di query." });
    }

    const hasil = await Pemesanan.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(userId),
          status_pemesanan: "Berhasil"
        }
      },
      {
        $lookup: {
          from: "transaksis",
          localField: "_id",
          foreignField: "pemesanan_id",
          as: "transaksi"
        }
      },
      {
        $unwind: "$transaksi"
      },
      {
        $match: {
          "transaksi.status_pembayaran": "berhasil"
        }
      },
      {
        $lookup: {
          from: "jadwals",
          localField: "jadwal_dipesan",
          foreignField: "_id",
          as: "detail_jadwal"
        }
      },
      {
        $project: {
          _id: 1,
          total_harga: 1,
          status_pemesanan: 1,
          "transaksi.metode_pembayaran": 1,
          "transaksi.status_pembayaran": 1,
          detail_jadwal: 1
        }
      }
    ]);

    res.status(200).json({ success: true, data: hasil });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan saat mengambil data." });
  }
};



export const DetailJadwal = asyncHandler(async(req,res) => {
  res.send("Detail Jadwal")
})

export const UpdateJadwal = asyncHandler(async(req,res) => {
  res.send("Update Jadwal")
})

export const DeleteJadwal = asyncHandler(async(req,res) => {
  res.send("Delete Jadwal")
})
