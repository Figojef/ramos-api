import express from "express"
import { protectedMiddleware, adminMiddleware } from "../middleware/authMiddleware.js"
import { fileUpload } from "../controllers/fileController.js"
import { CreateDefaultJadwalRutinHarian, CreateJadwalRutinHarian, DeleteJadwalRutinHarian, GetJadwalRutinHarian, TerapkanJadwalRutinHarian, UpdateJadwalRutinHarian } from "../controllers/JadwalRutinHarianController.js"


const router = express.Router()

router.get('/', protectedMiddleware, adminMiddleware, GetJadwalRutinHarian)

router.post('/default', protectedMiddleware, adminMiddleware, CreateDefaultJadwalRutinHarian)

router.post('/', protectedMiddleware, adminMiddleware, CreateJadwalRutinHarian)

router.post('/terapkan-jadwal-rutin-harian', protectedMiddleware, adminMiddleware, TerapkanJadwalRutinHarian)


router.patch('/:id', protectedMiddleware, adminMiddleware, UpdateJadwalRutinHarian)

router.delete('/:id', protectedMiddleware, adminMiddleware, DeleteJadwalRutinHarian)

export default router