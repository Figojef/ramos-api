import mongoose from 'mongoose';
import bycrypt from "bcryptjs"
import validator from "validator"


const { Schema } = mongoose;

const userSchema = new Schema({
    name : {
        type : String,
        required : [true, "Nama harus diisi"],
        unique : [true, 'Username sudah digunakan']
    },
    email : {
        type : String,
        required : [true, "Email harus diisi"],
        unique : [true, "Email sudah pernah didaftarkan"],
        validate : {
            validator : validator.isEmail,
            message : "Inputan harus berformat Email. Ex : abc@gmail.com"
        }
    },
    nomor_telepon : {
        type : String,
        required : [true, "Nomor WA harus diisi"],
        unique : [true, "Nomor sudah pernah didaftarkan"]
    },
    password : {
        type : String,
        required : [true, "Password harus diisi"],
        minLength : [6, "Password minimal 6 karakter"],
    },
    role : {
        type : String,
        enum : ["admin", "pelanggan"],
        default : "pelanggan"
    },
    foto : {
        type : String,
        default : null
    }
});


// Before the file is saved, run the callback. This function is one of the midleware of mongoose
// NB : Dont use arrow function
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();

    const salt = await bycrypt.genSalt(10);
    this.password = await bycrypt.hash(this.password, salt);
    next();
});


userSchema.methods.comparePassword = async function(reqBody){
    return await bycrypt.compare(reqBody, this.password)
}

const User = mongoose.model("User", userSchema)

export default User