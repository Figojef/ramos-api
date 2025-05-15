import mongoose from "mongoose";

const {Schema} = mongoose

const singleProduct = Schema({
    name : {type : String, required : true},
    quantity : {type : Number, require : true},
    price : {type : Number, required : true},
    product : {
        type : mongoose.Schema.ObjectId,
        ref : 'Product',
        required : true
    }
})

const orderSchema = new Schema({
    total : {
        type : Number,
        required : [true, "Total harga harus diisi"]
    },
    itemDetail : [singleProduct],
    user : {
        type : mongoose.Schema.ObjectId,
        ref : 'User',
        required : true
    },
    status : {
        type : String,
        enum : ["pending", "failed", "success"],
        default : "pending"
    },
    firstName : {
        type : String,
        required : [true, "Nama depan harus diisi"]
    },
    lastName : {
        type : String,
        required : [true, "Nama belakang harus diisi"]
    },
    email : {
        type : String,
        required : [true, "Email harus diisi"]
    },
    phone : {
        type : String,
        required : "Nomor HP harus diisi"
    }
})

const Order = mongoose.model("Order", orderSchema)

export default Order