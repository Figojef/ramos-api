import express from "express";
import { protectedMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";
import { 
  AllJadwal, 
  CreateJadwal, 
  DetailJadwal, 
  UpdateJadwal, 
  DeleteJadwal, 
  JadwalByDateAndLapangan,
  JadwalByLapangan,
  JadwalRutinHarian,
  JadwalByTanggal,
  getJadwalBerhasil

} from "../controllers/JadwalController.js";

const router = express.Router();

// Route for getting all jadwal
router.get('/', AllJadwal);


router.get('/tanggal', JadwalByDateAndLapangan);

router.get('/lapangan/:lapanganId', JadwalByLapangan);

router.get('/tanggal/', JadwalByDateAndLapangan);

router.get('/lapangan/:lapanganId', JadwalByLapangan);

router.get('/tanggal/:tanggal', JadwalByTanggal);


router.get('/jadwal-berhasil', getJadwalBerhasil);


// Route for creating a jadwal
router.post('/', CreateJadwal);

router.post('/jadwal-harian', JadwalRutinHarian);


// Route for getting a specific jadwal by its ID
router.get('/:id', DetailJadwal);

// Route for updating a specific jadwal by its ID
router.put('/:id', UpdateJadwal);

// Route for deleting a specific jadwal by its ID
router.delete('/:id', DeleteJadwal);

export default router;
