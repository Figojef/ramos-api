// app.js
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import ExpressMongoSanitize from "express-mongo-sanitize";
import cors from "cors";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { v2 as cloudinary } from "cloudinary";

// Routes
import authRouter from './routes/authRouter.js';
import productRouter from './routes/productRouter.js';
import lapanganRouter from './routes/lapanganRouter.js';
import orderRouter from './routes/orderRouter.js';
import jadwalRouter from './routes/jadwalRouter.js';
import pemesananRouter from './routes/pemesananRouter.js';
import transaksiRouter from './routes/transaksiRouter.js';
import mabarRouter from './routes/mabarRouter.js';
import eventRouter from './routes/eventRouter.js';
import ratingRouter from './routes/ratingRouter.js';

dotenv.config();

const app = express();

// CORS
const corsOptions = {
  origin: ['http://127.0.0.1:8000', 'http://localhost:8000', 'https://ramos.d4trpl-itdel.id'],
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware
app.use(helmet());
app.use(ExpressMongoSanitize());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('./public'));

// Cloudinary config
cloudinary.config({ 
  cloud_name: "de9cyaoqo", 
  api_key: 193388313656343, 
  api_secret: "qYF6EPlE381NVDneflc7AxHOtmk"
});

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/product', productRouter);
app.use('/api/v1/lapangan', lapanganRouter);
app.use('/api/v1/order', orderRouter);
app.use('/api/v1/jadwal', jadwalRouter);
app.use('/api/v1/pemesanan', pemesananRouter);
app.use('/api/v1/transaksi', transaksiRouter);
app.use('/api/v1/event', eventRouter);
app.use('/api/v1/mabar', mabarRouter);
app.use('/api/v1/rating', ratingRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
