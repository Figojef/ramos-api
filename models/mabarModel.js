import mongoose from "mongoose";

const { Schema } = mongoose;

const mabarSchema = new Schema({
  nama_mabar: {
    type: String,
    required: [true, "Nama mabar harus diisi"],
  },
  biaya: {
    type: Number,
    required: [true, "Biaya mabar harus diisi"],
  },
  range_umur: {
    type: String,
    required: [true, "Range umur harus diisi"],
  },
  level: {
    type: String,
    enum: ["Pemula", "Menengah", "Profesional"],
    required: [true, "Level harus diisi"],
  },
  kategori: {
    type: String,
    enum: ["Fun", "Competitive"],
    required: [true, "Kategori harus diisi"],
  },
  slot_peserta: {
    type: Number,
    required: [true, "Slot peserta harus diisi"],
  },
  deskripsi: {
    type: String,
    required: [true, "Deskripsi mabar harus diisi"],
  },
  jadwal: [
    {
      type: Schema.Types.ObjectId,
      ref: "Jadwal", // Relasi ke model Jadwal
    },
  ],
  status: {
    type: String,
    enum: ["Terjadwal", "Selesai", "Dibatalkan"],
    default: "Terjadwal",
  },
  tanggal_dibuat: {
    type: Date,
    default: Date.now,
  },
  user_pembuat_mabar: {
    type: Schema.Types.ObjectId,
    ref: "User", // Menyimpan ID user yang membuat mabar
    required: true,
  },
  user_yang_join: [
    {
      type: Schema.Types.ObjectId,
      ref: "User", // Menyimpan ID user yang bergabung dalam mabar
      default : []
    },
  ],
});

const Mabar = mongoose.model("Mabar", mabarSchema);

export default Mabar;
