import express from "express"
import { protectedMiddleware, adminMiddleware } from "../middleware/authMiddleware.js"
import { CreateProduct, updateProduct, deleteProduct, AllProduct, fileUpload, detailProduct } from "../controllers/ProductController.js"
import { upload } from "../utils/uploadFileHandler.js"

const router = express.Router()

router.post('/', protectedMiddleware, adminMiddleware, CreateProduct)

// router.get('/', protectedMiddleware, AllProduct)

router.get('/', AllProduct)


// router.get('/:id', protectedMiddleware, detailProduct)
router.get('/:id', detailProduct)


router.put('/:id', protectedMiddleware, adminMiddleware,updateProduct)

router.delete('/:id', protectedMiddleware, adminMiddleware,deleteProduct)

router.post('/file-upload', protectedMiddleware, adminMiddleware, upload.single('image'), fileUpload)  



export default router