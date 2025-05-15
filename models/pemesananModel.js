import mongoose from "mongoose";

const { Schema } = mongoose;

const pemesananSchema = new Schema({    
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  total_harga: {
    type: Number,
    required: [true, "Total harga harus diisi"]
  },
  jadwal_dipesan: [
    {
      type: Schema.Types.ObjectId,
      ref: "Jadwal"
    }  
  ],

  status_pemesanan: {
    type: String,
    enum: ["Sedang Dipesan", "Berhasil", "Dibatalkan", "Ditolak"],
    default: "Sedang Dipesan"
  },

  is_expired: {
    type: Boolean,
    default: false
  },

    alasan_penolakan : {
    type: String,
    default: null
  }

});

const Pemesanan = mongoose.model("Pemesanan", pemesananSchema);

export default Pemesanan;
