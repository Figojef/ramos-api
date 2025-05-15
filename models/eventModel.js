import mongoose from "mongoose";

const { Schema } = mongoose;

const eventSchema = new Schema({

    judul : {
        type: String,
        required : true,
    },

    gambar : {
        type: String,
        default: null
    },

    deskripsi : {
        type: String,
        required : true,
    },

    tanggal_mulai : {
        type: String,
        required : true
    },

    tanggal_selesai : {
        type: String,
        required : true
    }

})


const Event = mongoose.model("event", eventSchema)

export default Event