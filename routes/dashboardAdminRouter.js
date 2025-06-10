import express from "express"
import { adminMiddleware, protectedMiddleware } from "../middleware/authMiddleware.js"
import { CatatanTransaksi, getAllPelanggan, index } from "../controllers/DashboardAdminController.js"

const router = express.Router()

router.get('/', protectedMiddleware, adminMiddleware, index)

router.get('/catatan-transaksi/:user_id', protectedMiddleware, adminMiddleware, CatatanTransaksi)

router.get('/get-all-pelanggan', protectedMiddleware, adminMiddleware, getAllPelanggan)

export default router