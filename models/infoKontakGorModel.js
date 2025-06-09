import mongoose from "mongoose";

const { Schema } = mongoose;

const infoKontakGorSchema = new Schema({
  nomor_whatsapp: {
    type: String,
    required: [true, "Nomor Whatsapp harus diisi"],
  },
  nomor_rekening: {
    type: Number,
    required: [true, "Nomor Rekening harus diisi"],
  },
  atas_nama: {
    type: String,
    required: [true, "Nama harus diisi"],
  },
  nama_bank: {
    type: String,
    required: [true, "Nama Bank harus diisi"],
  }
});

const InfoKontakGor = mongoose.model("InfoKontakGor", infoKontakGorSchema);

export default InfoKontakGor;