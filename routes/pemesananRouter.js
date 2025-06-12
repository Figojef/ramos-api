import express from "express";
import { 
    createPemesanan, 
    getAllPemesanan, 
    getPemesananById, 
    updatePemesananStatus, 
    deletePemesanan,
    getPemesananByUserId,
    pesananBelumLewatDeadline,
    riwayatPemesanan,
    batalkanPemesanan,
    getPemesananUntukKonfirmasi,
    konfirmasiPemesanan,
    tolakPemesanan
    
} from "../controllers/PemesananController.js";
import { protectedMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Membuat pemesanan baru
router.post("/", protectedMiddleware, createPemesanan);

// Mendapatkan semua pemesanan
router.get("/", getAllPemesanan);

// Mendapatkan detail pemesanan berdasarkan ID yang belum lewat
router.get("/user/pesananBelumLewatDeadline", protectedMiddleware, pesananBelumLewatDeadline);

router.patch('/batalkan/:pemesananId', protectedMiddleware,batalkanPemesanan);

// Mendapatkan detail pemesanan berdasarkan ID
// router.get("/user/:user_id", protectedMiddleware, getPemesananByUserId);

router.get("/user/riwayatPemesanan", protectedMiddleware, riwayatPemesanan);



// Mendapatkan detail pemesanan berdasarkan ID
router.get("/:id", protectedMiddleware, getPemesananById);

// Mengupdate status pemesanan
router.put("/:id", protectedMiddleware, updatePemesananStatus);

// Menghapus pemesanan
router.delete("/:id", protectedMiddleware, adminMiddleware, deletePemesanan);

router.get("/admin/kelola/pemesanan/index", protectedMiddleware, adminMiddleware, getPemesananUntukKonfirmasi)

router.patch("/admin/kelola/pemesanan/konfirmasi-pemesanan/:id", protectedMiddleware, adminMiddleware, konfirmasiPemesanan)

router.patch('/admin/kelola/pemesanan/tolak-pemesanan/:id', protectedMiddleware, adminMiddleware, tolakPemesanan)

export default router;