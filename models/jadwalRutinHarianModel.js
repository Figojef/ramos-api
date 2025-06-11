import mongoose from "mongoose";

const { Schema } = mongoose;

const jadwalRutinHarianSchema = new Schema({
  jam: {
    type: String,
    required: true, // contoh data : 8, 9, 15, 20
  },
  harga: {
    type: Number,
    required: true,
  },
});

const JadwalRutinHarian = mongoose.model("JadwalRutinHarian", jadwalRutinHarianSchema);

export default JadwalRutinHarian;