import jwt from "jsonwebtoken"
import User from "../models/userModel.js"
import asyncHandler from "./asyncHandler.js"

export const protectedMiddleware = asyncHandler(async (req, res, next) => {
    let token;

    // ✅ Ambil dari Authorization header (Bearer <token>)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }
    // ✅ Atau fallback ke cookies (buat support dua-duanya)
    else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (e) {
            res.status(401);
            throw new Error('Not Authorized, token fail');
        }
    } else {
        res.status(401);
        throw new Error('Not Authorized, no token');
    }
});

export const adminMiddleware = asyncHandler(
    async (req, res, next) => {
        if(req.user && req.user.role === 'admin'){
            next()
        }else{
            res.status(401)
            // throw new Error("Not Authorized as Owner")
            throw new Error("Anda tidak terautentikasi sebagai Owner")
        }
    }
)