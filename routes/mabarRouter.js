import express from "express"
import { protectedMiddleware, adminMiddleware } from "../middleware/authMiddleware.js"
import {    CekJoin, 
            CreateMabar, 
            getAllMabar, 
            GetMabarJoined, 
            GetMabarOwn, 
            HapusMabar, 
            JoinMabar, 
            KeluarMabar, 
            SelectJadwalMabar,
            getUpcomingMabar,
            HistoryMabar,
        GetPemainByMabarId,
    } 
        from "../controllers/MabarController.js"


const router = express.Router()

router.post('/', CreateMabar)

router.post('/join', JoinMabar)

router.post('/keluar', KeluarMabar)

router.delete('/hapus/:mabarId', HapusMabar)

router.get('/sebelum', getUpcomingMabar)

router.get('/Userbymabar/:mabarId', GetPemainByMabarId)

router.get('/', getAllMabar)



router.post('/cek-join', CekJoin)

router.get('/history/:user_id', protectedMiddleware, HistoryMabar);

router.post('/mabar-own', GetMabarOwn)

router.post('/mabar-joined', GetMabarJoined)


router.post('/select_jadwal', SelectJadwalMabar)

export default router