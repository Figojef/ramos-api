import express from "express"
import { AllOrder, CreateOrder, CurrentUserOrder, DetailOrder } from "../controllers/OrderController.js"
import { adminMiddleware, protectedMiddleware } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post('/', protectedMiddleware, CreateOrder)

router.get('/', protectedMiddleware, adminMiddleware,AllOrder)

router.get('/:id', protectedMiddleware,adminMiddleware,DetailOrder)

router.get('/current/user', protectedMiddleware, CurrentUserOrder)

export default router 