import { query } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import Product from "../models/productModel.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier"
import Lapangan from "../models/lapanganModel.js";

export const CreateLapangan = asyncHandler(async(req,res) => {
    // res.send("Create Lapangan")
    const newLapangan = await Lapangan.create(req.body)

    res.status(201).json({
        message : "Berhasil tambah lapangan",
        data : newLapangan
    })
})


export const AllLapangan = asyncHandler(async(req,res) => {
    // res.send("All Lapangan")
    // const data = await Product.find()

    const queryObj = {...req.query}

    const excludeField = ["page", "limit", "name"]

    excludeField.forEach(element => delete queryObj[element])

    // // console.log(queryObj)

    let query

    if(req.query.name){
        query =  Lapangan.find({
            name : {$regex : req.query.name, $options : 'i'}
        })
    }else{
        query = Lapangan.find(queryObj)
    }
    
    // let query = Lapangan.find(queryObj)

    // // Pagination
    const page = req.query.page * 1 || 1
    const limitData = req.query.limit || 30
    const skipData = (page - 1) * limitData

    query = query.skip(skipData).limit(limitData)

    const countLapangan = await Lapangan.countDocuments()

    if(req.query.page){
        if(skipData >= countLapangan){
            res.status(404)
            throw new Error("This page doesnt exist")
        }
    }

    const data = await query

    return res.status(200).json({
        message : "Berhasil tampil semua lapangan",
        data,
        count : countLapangan
    })

})

export const detailLapangan = asyncHandler(async (req, res) => {
    const paramId = req.params.id
    const dataLapangan = await Lapangan.findById(paramId)

    if(!dataLapangan){
        res.status(404)
        throw new Error("Id tidak ditemukan")
    }

    res.status(200).json({
        message : "Detail lapangan berhasil ditampilkan",
        data : dataLapangan 
    })
})


export const updateLapangan = asyncHandler(async (req, res) => {
    // res.send("Update Lapangan")
    const paramId = req.params.id
    const updateLapangan = await Lapangan.findByIdAndUpdate(paramId,
        req.body,
        {
            runValidator : false,
            new : true
        }
    )
    
    return res.status(201).json({
        message : "Update Lapangan berhasil",
        data : updateLapangan
    })
})


export const deleteProduct = asyncHandler(async(req,res) => {
    // res.send("Delete Product")
    const paramId = req.params.id
    const deleteProduct = await Product.findByIdAndDelete(paramId)

    return res.status(200).json({
        message : "Berhasil hapus produk"
    })
})


export const fileUpload = asyncHandler(async(req, res) => {

    const stream = cloudinary.uploader.upload_stream({
        folder : 'uploads',
        allowed_formats : ['jpg', 'png'],
    },
    function(err, result){
        if(err){
            console.log(err)
            return res.status(500).json({
                message : "gagal upload gambar",
                error : err
            })
        }

        res.json({
            message : "Gambar berhasil diupload",
            url : result.secure_url
        })

    }
    )

    streamifier.createReadStream(req.file.buffer).pipe(stream)

    // res.send('File upload product')
    // const file = req.file
    // if(!file){
    //     res.status(400)
    //     throw new Error("Tidak ada file yang diinput")
    // }

    // const imageFileName = file.filename
    // const pathImageFile = `uploads/${imageFileName}`

    // res.status(200).json({
    //     message : "Image berhasil diupload",
    //     image : pathImageFile
    // })

})