import express from "express"
import User from "../models/userModel.js"
import asyncHandler from "../middleware/asyncHandler.js"
import { getCurrentUser, loginUser, logoutUser, registerUser } from "../controllers/authController.js"
import { protectedMiddleware } from "../middleware/authMiddleware.js"


const router = express.Router()

// post /api/v1/auth/register
router.post('/register', registerUser)

// post /api/v1/auth/login
router.post('/login', loginUser)

// get /api/v1/auth/logout
router.get('/logout', protectedMiddleware, logoutUser)


// get /api/v1/auth/getUser
router.get('/getuser', protectedMiddleware, getCurrentUser)


export default router