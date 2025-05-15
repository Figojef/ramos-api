import mongoose from "mongoose";

const { Schema } = mongoose;

const transaksiSchema = new Schema({    
  pemesanan_id: {
    type: Schema.Types.ObjectId,
    ref: "Pemesanan",
    required: true
  },
  metode_pembayaran: {
    type: String,
    enum: ["transfer_bank", "bayar_langsung"],
    required: [true, "Metode pembayaran harus diisi"]
  },
  status_pembayaran: {
    type: String,
    enum: ["berhasil", "menunggu", "gagal"],
    required: [true, "Status pembayaran harus diisi"]
  },
  bukti_pembayaran: {
    type: String, // Simpan URL/filepath gambar bukti transfer
    default: null
  },
  tanggal: {
    type: String,
    default: null
  },
  deadline_pembayaran: {
    type: Date,
    required: true
  }
});

const Transaksi = mongoose.model("Transaksi", transaksiSchema);

export default Transaksi;
