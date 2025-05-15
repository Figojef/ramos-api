import express from "express"
import { protectedMiddleware} from "../middleware/authMiddleware.js"

import { 
    createRating,
    GetMabarAndRatingsByUser
 } from "../controllers/RatingController.js";


 const router = express.Router();


router.post("/", protectedMiddleware, createRating);

router.get('/user/:userId/mabar-ratings', GetMabarAndRatingsByUser);

export default router;