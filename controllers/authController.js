import User from "../models/userModel.js";
import jwt from "jsonwebtoken"
import asyncHandler from "../middleware/asyncHandler.js";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import streamifier from 'streamifier';

const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SECRET, 
    {
        // expiresIn : '6d',
        expiresIn : '500d',
    }        
    )
}

const createSendResToken = (user, statusCode, res) => {
    const token = signToken(user._id)
    const isDev = process.env.NODE_ENV === 'development' ? false : true

    const cookieOption = {
        expire : new Date(
            Date.now() + 6 * 24 * 60 * 60 * 1000 
        ),
        httpOnly : true,
        security : isDev
    }

    res.cookie('jwt', token, cookieOption)
 
    user.password = undefined
    
    res.status(statusCode).json({
        data : user,
        jwt: token // Kembalikan JWT di dalam respons JSON
    })
}

export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, nomor_telepon, password } = req.body;

    // Validasi input wajib
    if (!name || !email || !nomor_telepon || !password) {
        res.status(400);
        throw new Error("Nama, email, nomor telepon, dan password tidak boleh kosong.");
    }

    // Validasi format email
    if (!validator.isEmail(email)) {
        res.status(400);
        throw new Error("Email tidak valid. Contoh: abc@gmail.com");
    }

    // Validasi panjang password
    if (password.length < 6) {
        res.status(400);
        throw new Error("Password minimal 6 karakter.");
    }

    // Validasi unik email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        res.status(400);
        throw new Error("Email sudah pernah didaftarkan.");
    }

    // Validasi unik nomor telepon
    const existingPhone = await User.findOne({ nomor_telepon });
    if (existingPhone) {
        res.status(400);
        throw new Error("Nomor telepon sudah pernah didaftarkan.");
    }

    // Validasi unik nama
    const existingName = await User.findOne({ name });
    if (existingName) {
        res.status(400);
        throw new Error("Nama sudah digunakan.");
    }

    // Tentukan role: admin jika user pertama
    const isOwner = (await User.countDocuments()) === 0;
    const role = isOwner ? "admin" : "pelanggan";

    // Buat user baru
    const createUser = await User.create({
        name,
        email,
        nomor_telepon,
        password,
        role,
    });

    // Kirim token dan response
    createSendResToken(createUser, 201, res);
});

// Update Profile
export const updateProfile = asyncHandler(async (req, res) => {
    const { user_id, name, email, nomor_telepon, url } = req.body;

    // Validasi ID user
    if (!user_id) {
        return res.status(400).json({ message: "ID user harus disertakan" });
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(400).json({ message: "ID user tidak valid" });
    }

    const user = await User.findById(user_id);
    if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // Validasi email
    if (email && !validator.isEmail(email)) {
        return res.status(400).json({ message: "Email tidak valid. Contoh: abc@gmail.com" });
    }

    // Validasi nomor telepon
    if (nomor_telepon) {
        const existingPhone = await User.findOne({ nomor_telepon });
        if (existingPhone && existingPhone._id.toString() !== user_id) {
            return res.status(400).json({ message: "Nomor telepon sudah digunakan oleh user lain." });
        }
        user.nomor_telepon = nomor_telepon;
    }

    // Validasi dan update nama
    if (name) {
        const existingName = await User.findOne({ name });
        if (existingName && existingName._id.toString() !== user_id) {
            return res.status(400).json({ message: "Nama sudah digunakan oleh user lain." });
        }
        user.name = name;
    }

    if (email) {
        user.email = email;
    }

    // Validasi dan update foto jika ada
    if (url) {
        const imageRegex = /\.(jpg|jpeg|png)$/i;
        if (!imageRegex.test(url)) {
            return res.status(400).json({
                message: 'File harus berupa gambar dengan ekstensi .jpg, .jpeg, atau .png'
            });
        }
        user.foto = url;
    }

    const updatedUser = await user.save();

    res.status(200).json({
        message: "Profil berhasil diperbarui",
        data: {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            nomor_telepon: updatedUser.nomor_telepon,
            foto: updatedUser.foto || null,
        },
    });
});

export const loginUser = asyncHandler(async(req, res) => {

    // const token = req.cookies.jwt

    // if(token){
    //     res.status(400)
    //     throw new Error("Anda belum logout")
    // }

    if(!req.body.email || !req.body.password){
        res.status(400)
        throw new Error('Email atau password tidak boleh kosong')
    }

    const userData = await User.findOne({
        email : req.body.email
    })

    if(userData && (await userData.comparePassword(req.body.password))){
        createSendResToken(userData, 200, res)
    }else{
        res.status(400)
        throw new Error('Email atau password salah')
    }

})


// const ahandler = fn => (req, res, next) => {
//     Promise.resolve(fn(req,res,next)).catch(next())
// }


export const getCurrentUser = asyncHandler(async (req, res) => {
    // Tambahkan await untuk menunggu hasil query
    const user = await User.findById(req.user._id).select('-password')
    
    if (user) {
        // Menggunakan toObject untuk menghindari masalah sirkular
        res.status(200).json({
            user: user.toObject()  // Pastikan ini adalah objek biasa, bukan MongoDB document
        })
    } else {
        res.status(404)
        throw new Error('User not found :(')
    }
})

// export const getCurrentUser = asyncHandler(async(req, res) => {
//     const user = User.findById(req.user._id).select('-password')

//     if(user){
//         res.status(200).json({
//             user
//         })
//     }else{
//         res.status(404)
//         throw new Error('user not found :(')
//     }
// })


export const logoutUser = async(req, res) => {
    res.cookie('jwt', "", {
        httpOnly : true,
        expires : new Date(Date.now())
    })

    res.status(200).json({
        message : "Logout berhasil"
    })
}