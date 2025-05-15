import express from "express";
import { 
    createPemesanan, 
    getAllPemesanan, 
    getPemesananById, 
    updatePemesananStatus, 
    deletePemesanan,
    getPemesananByUserId,
    pesananBelumLewatDeadline
    
} from "../controllers/PemesananController.js";
import { protectedMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Membuat pemesanan baru
router.post("/", protectedMiddleware, createPemesanan);

// Mendapatkan semua pemesanan
router.get("/", getAllPemesanan);

// Mendapatkan detail pemesanan berdasarkan ID yang belum lewat
router.get("/user/pesananBelumLewatDeadline", protectedMiddleware, pesananBelumLewatDeadline);

// Mendapatkan detail pemesanan berdasarkan ID
// router.get("/user/:user_id", protectedMiddleware, getPemesananByUserId);




// Mendapatkan detail pemesanan berdasarkan ID
router.get("/:id", protectedMiddleware, getPemesananById);

// Mengupdate status pemesanan
router.put("/:id", protectedMiddleware, updatePemesananStatus);

// Menghapus pemesanan
router.delete("/:id", protectedMiddleware, adminMiddleware, deletePemesanan);

export default router;