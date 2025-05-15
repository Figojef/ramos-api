import mongoose from "mongoose";

const {Schema} = mongoose

const productSchema = new Schema({
    name : {
        type : String,
        required : [true, "Nama produk harus diisi"],
        unique : [true, "Nama produk sudah ada"]
    },
    price : {
        type : Number,
        required : [true, 'Harga produk harus diiisi']
    },
    description : {
        type : String,
        required : [true, 'Deskripsi produk harus diisi']
    },
    image : {
        type : String,
        default : null
    },
    category : {
        type : String,
        required : [true, "Category produk harus diisi"],
        enum : ['sepatu', 'kemeja', 'baju', 'celana']
    },
    stock : {
        type : String,
        default : null
    }
})

const Product = mongoose.model("Product", productSchema)

export default Product