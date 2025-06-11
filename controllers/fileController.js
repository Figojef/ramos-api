import asyncHandler from "../middleware/asyncHandler.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier"


export const fileUpload = asyncHandler(async (req, res) => {
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

})