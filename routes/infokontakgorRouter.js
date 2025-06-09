import express from 'express';
import { getInfoKontakGor } from '../controllers/InfoKontakGorController.js';

const router = express.Router();

// Route to get all InfoKontakGor data
router.get('/', getInfoKontakGor);

export default router;
