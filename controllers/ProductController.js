import { query } from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import Product from "../models/productModel.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier"

export const CreateProduct = asyncHandler(async(req,res) => {
    // res.send("Create Product")
    const newProduct = await Product.create(req.body)

    res.status(201).json({
        message : "Berhasil tambah produk",
        data : newProduct
    })
})

export const AllProduct = asyncHandler(async(req,res) => {
    // res.send("All Product")
    // const data = await Product.find()
    const queryObj = {...req.query}
    const excludeField = ["page", "limit", "name"]

    excludeField.forEach(element => delete queryObj[element])

    // // console.log(queryObj)

    let query

    if(req.query.name){
        query =  Product.find({
            name : {$regex : req.query.name, $options : 'i'}
        })
    }else{
        query = Product.find(queryObj)
    }
    
    // let query = Product.find(queryObj)

    // // Pagination
    const page = req.query.page * 1 || 1
    const limitData = req.query.limit || 30
    const skipData = (page - 1) * limitData

    query = query.skip(skipData).limit(limitData)

    const countProduct = await Product.countDocuments()

    if(req.query.page){
        if(skipData >= countProduct){
            res.status(404)
            throw new Error("This page doesnt exist")
        }
    }


    const data = await query



    return res.status(200).json({
        message : "Berhasil tampil semua produk",
        data,
        count : countProduct
    })

})

export const detailProduct = asyncHandler(async (req, res) => {
    const paramId = req.params.id
    const dataProduct = await Product.findById(paramId)

    if(!dataProduct){
        res.status(404)
        throw new Error("Id tidak ditemukan")
    }

    res.status(200).json({
        message : "Detail produk berhasil ditampilkan",
        data : dataProduct 
    })
})


export const updateProduct = asyncHandler(async (req, res) => {
    // res.send("Update Product")
    const paramId = req.params.id
    const updateProduct = await Product.findByIdAndUpdate(paramId,
        req.body,
        {
            runValidator : false,
            new : true
        }
    )

    return res.status(201).json({
        message : "Update product berhasil",
        data : updateProduct
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