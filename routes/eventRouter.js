import express from "express"
import { protectedMiddleware, adminMiddleware } from "../middleware/authMiddleware.js"
import { upload } from "../utils/uploadFileHandler.js"
import { 
    createEvent,
    getAllEvents
 } from "../controllers/EventController.js";


 const router = express.Router();


router.post('/', upload.single('gambar'), createEvent);

router.get('/', getAllEvents);

export default router;