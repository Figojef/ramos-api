import express from "express"
import { protectedMiddleware} from "../middleware/authMiddleware.js"

import { 
    createRating,
    GetMabarAndRatingsByUser,
    GetMabarDetailWithRating,
    ReferensiPenilaianMabar,
    ProfilRating
 } from "../controllers/RatingController.js";


 const router = express.Router();


router.post("/", protectedMiddleware, createRating);

// melihat rating mabar berdasarkan user


// melihat rating user berdasarkan mabar
router.get('/:mabarId/detail-with-rating', GetMabarDetailWithRating);

router.get('/penilaian/:user_target_id/:mabar_id', ReferensiPenilaianMabar);

router.get('/profil-rating/:user_target_id', ProfilRating);

export default router;